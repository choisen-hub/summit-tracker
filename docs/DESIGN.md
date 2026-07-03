# Summit Tracker — 설계 문서

> 국가정상 간 만남(정상회담·다자회의·전화통화 등)을 DB화하여 **시각화 · 빈도분석 · 어젠다/공동성명 정리**를 제공하는 서비스
>
> - **스코프**: 글로벌 전체 (전 세계 정상 간 회담)
> - **데이터 전략**: 하이브리드 (공개 데이터셋으로 과거 시드 → 뉴스+LLM으로 최신 자동 갱신)
> - **문서 버전**: v0.1 · 2026-07-03

---

## 1. 목표와 범위

### 1.1 한 줄 정의
전 세계 국가정상 간의 외교적 접촉을 구조화된 데이터로 축적하고, 관계망·빈도·어젠다·합의문을 탐색할 수 있는 **외교 인텔리전스 대시보드**.

### 1.2 핵심 질문 (서비스가 답해야 하는 것)
- 특정 두 국가/정상은 **언제, 몇 번, 어디서** 만났는가?
- 어떤 국가가 어떤 국가와 **가장 활발히** 교류하는가? (관계 네트워크)
- 시기별로 **어떤 어젠다**가 부상/소멸했는가? (예: 기후 → 반도체 → 안보)
- 특정 회담에서 나온 **공동성명의 핵심 합의사항**은 무엇인가?
- 새 정권 출범 후 **외교 패턴 변화**는?

### 1.3 명시적 비목표 (v1에서 안 하는 것)
- 장관급·실무급 회담 (정상급만). *단, 스키마는 확장 가능하게 설계*
- 회담 내용의 실시간 팩트체크/진위판정
- 예측 모델링 (향후 확장 여지로만 남김)

---

## 2. 데이터 전략 (하이브리드)

두 개의 트랙을 병행한다.

### 트랙 A — 과거 시드 (Historical Seed, 1회성 대량 임포트)
목적: 서비스 출시 시점에 이미 수십 년치 데이터가 채워진 상태.

| 소스 | 커버리지 | 형태 | 신뢰도 |
|---|---|---|---|
| **Wikidata** (SPARQL) | 정상회담·국빈방문 이벤트, 정상 인물/재임기간 | 구조화 (RDF) | 높음 |
| **Wikipedia** ("List of international trips made by...") | 각국 정상 순방 목록 | 반구조화 (테이블) | 중상 |
| **UN Digital Library / 외교부 아카이브** | 공동성명 원문 | 문서 | 매우 높음 |
| **학술 데이터셋** (Diplometrics, COW Diplomatic Exchange) | 국가 간 외교 교류 지표 | CSV | 높음 (단 최신성↓) |

> 접근: Wikidata를 **정상·국가·재임기간의 신뢰 앵커**로 삼고, Wikipedia 순방 목록에서 개별 회담 이벤트를 추출, 공동성명은 별도 문서 소스에서 연결.

### 트랙 B — 최신 자동 갱신 (Live Pipeline, 상시)
목적: 새로 발생하는 회담을 자동 포착.

```
뉴스/외교부 브리핑 수집  →  LLM 이벤트 추출  →  정규화·중복제거  →  검증 큐  →  DB 적재
   (news-platform 재활용)      (구조화 스키마)      (엔티티 링킹)     (신뢰도 태깅)
```

- **수집**: 기존 `news-platform` RSS/수집 파이프라인 재활용 (외교부, 로이터, AP, 신화, 각국 정부 브리핑).
- **추출**: LLM으로 기사 → `{회담일, 참가정상[], 장소, 유형, 어젠다[], 성명여부}` JSON 구조화.
- **엔티티 링킹**: 추출된 인물/국가명을 트랙 A의 `leaders`/`countries` 앵커에 매칭 (별칭 테이블 활용).
- **중복제거**: 같은 회담이 여러 기사에서 나오므로 `(날짜 ±1일, 참가자 집합, 장소)` 기준 클러스터링.

### 2.1 신뢰도 모델 (중요)
자동 추출은 오류가 나므로 모든 레코드에 출처와 신뢰도를 부여한다.

- `source_type`: `wikidata` | `official` | `news_llm` | `manual`
- `confidence`: 0.0–1.0 (LLM 자기평가 + 소스 가중)
- `verification_status`: `unverified` | `auto_verified` | `human_verified`
- 프론트에서 필터 가능 ("검증된 것만 보기"). 다중 출처가 교차확인하면 신뢰도 상향.

---

## 3. 데이터 모델 (Supabase / PostgreSQL)

핵심은 **회담 ↔ 정상의 N:N** (다자회의 표현) 과 **회담 ↔ 어젠다/성명의 1:N**.

```sql
-- 국가
create table countries (
  id          text primary key,          -- ISO 3166-1 alpha-3 (예: KOR)
  name_ko     text not null,
  name_en     text not null,
  continent   text,
  lat         double precision,          -- 지도용 대표 좌표
  lng         double precision,
  flag_emoji  text
);

-- 정상 (인물)
create table leaders (
  id           uuid primary key default gen_random_uuid(),
  wikidata_id  text unique,              -- 신뢰 앵커
  name_ko      text not null,
  name_en      text not null,
  country_id   text references countries(id),
  role         text,                     -- 대통령/총리/주석 등
  term_start   date,
  term_end     date,                     -- null = 현직
  photo_url    text
);

-- 정상 별칭 (엔티티 링킹용: "시진핑" / "Xi Jinping" / "習近平")
create table leader_aliases (
  leader_id  uuid references leaders(id) on delete cascade,
  alias      text not null,
  lang       text,
  primary key (leader_id, alias)
);

-- 회담 (이벤트)
create table meetings (
  id            uuid primary key default gen_random_uuid(),
  date          date not null,
  end_date      date,                    -- 다일 회담
  location_city text,
  location_country_id text references countries(id),
  meeting_type  text not null,           -- summit_bilateral | multilateral | phone_call | video_call | state_visit
  context       text,                    -- 계기 (예: "G20 정상회의", "APEC")
  title_ko      text,
  title_en      text,
  summary       text,                    -- LLM 생성 요약
  source_type   text not null,
  confidence    real default 0.5,
  verification_status text default 'unverified',
  created_at    timestamptz default now()
);

-- 회담 참가자 (N:N — 양자/다자 통합 표현)
create table meeting_participants (
  meeting_id  uuid references meetings(id) on delete cascade,
  leader_id   uuid references leaders(id),
  country_id  text references countries(id),  -- 정상 불명확 시 국가만
  role        text,                            -- host | guest
  primary key (meeting_id, leader_id)
);

-- 어젠다 (회담별 주요 의제)
create table agendas (
  id          uuid primary key default gen_random_uuid(),
  meeting_id  uuid references meetings(id) on delete cascade,
  topic_ko    text not null,
  topic_en    text,
  category    text                        -- security | trade | climate | tech | culture ... (정규 태그)
);

-- 공동성명 / 합의문
create table statements (
  id              uuid primary key default gen_random_uuid(),
  meeting_id      uuid references meetings(id) on delete cascade,
  title_ko        text,
  title_en        text,
  summary         text,                   -- 핵심 요약
  key_points      jsonb,                  -- 핵심 조항 배열
  source_url      text,                   -- 원문 링크
  source_type     text
);

-- 출처 추적 (한 회담이 여러 기사에서 나올 수 있음)
create table sources (
  id          uuid primary key default gen_random_uuid(),
  meeting_id  uuid references meetings(id) on delete cascade,
  url         text,
  publisher   text,
  published_at timestamptz,
  raw_excerpt text
);
```

### 3.1 파생 뷰 (분석 가속용)
- `country_pair_stats` — 국가쌍별 회담 횟수/최근일 (네트워크 그래프 엣지)
- `agenda_trends` — (연도, category) 별 빈도 (트렌드 차트)
- `leader_activity` — 정상별 회담 수/상대국 다양성

---

## 4. 기능 & 화면

| 화면 | 내용 | 주요 라이브러리 |
|---|---|---|
| **① 관계 네트워크** | 국가(또는 정상) 노드, 회담빈도=엣지 두께. 클릭 시 필터링 | `react-force-graph` / D3 |
| **② 세계 지도** | 회담 개최지 마커 + 국가 간 교류 arc. 연도 슬라이더 | `react-simple-maps` / deck.gl |
| **③ 빈도 분석** | 국가별·연도별 히트맵, 상대국 랭킹, 타임라인 | `visx` / `Recharts` |
| **④ 어젠다 트렌드** | 카테고리별 시기 추이(스트림그래프), 키워드 빈도 | `visx` |
| **⑤ 회담 상세** | 참가자·어젠다·공동성명 카드, 출처 링크, 신뢰도 배지 | — |
| **⑥ 검색/필터** | 국가·정상·기간·유형·어젠다 카테고리 교차 필터 | — |
| **⑦ 관리자 검증 큐** | 자동 추출 레코드 승인/수정 (human_verified 승격) | — |

> 시각화는 별도 세션에서 `dataviz` 스킬 가이드에 맞춰 색·접근성 일관되게 구현.

---

## 5. 기술 스택

- **프론트**: Next.js (App Router) + TypeScript + Tailwind + shadcn/ui
- **DB/백엔드**: Supabase (PostgreSQL + RLS + Edge Functions)
- **파이프라인**: 기존 `news-platform` 수집기 재활용 + Supabase Cron/Edge Function으로 주기 실행
- **LLM 추출**: Claude (구조화 출력, tool/JSON schema)
- **시드 임포트**: Node 스크립트 (Wikidata SPARQL + Wikipedia 파싱)
- **배포**: Vercel (프론트) + Supabase (데이터)

---

## 6. 디렉터리 구조 (예정)

```
summit-tracker/
├── docs/
│   └── DESIGN.md              # 이 문서
├── supabase/
│   ├── migrations/            # 스키마 SQL
│   └── functions/             # Edge Functions (수집/추출 트리거)
├── scripts/
│   ├── seed-wikidata.ts       # 트랙 A: SPARQL 임포트
│   ├── seed-wikipedia.ts      # 트랙 A: 순방목록 파싱
│   └── extract-news.ts        # 트랙 B: LLM 추출
├── lib/
│   ├── supabase.ts
│   ├── entity-linking.ts      # 별칭→leader 매칭
│   └── dedup.ts               # 회담 클러스터링
└── app/
    ├── (dashboard)/
    │   ├── network/           # ① 관계망
    │   ├── map/               # ② 지도
    │   ├── frequency/         # ③ 빈도
    │   ├── agendas/           # ④ 어젠다 트렌드
    │   └── meetings/[id]/     # ⑤ 상세
    └── admin/verify/          # ⑦ 검증 큐
```

---

## 7. 구축 로드맵 (단계별)

### Phase 0 — 기반 (0.5주)
- [ ] Supabase 프로젝트 생성 + 스키마 마이그레이션 적용
- [ ] Next.js 스캐폴딩 + Supabase 연결
- [ ] `countries` 시드 (ISO + 좌표 + 국기)

### Phase 1 — 과거 시드 (1주)
- [ ] Wikidata SPARQL로 `leaders` + 재임기간 임포트
- [ ] 별칭 테이블 구축 (다국어)
- [ ] Wikipedia 순방목록 파싱 → `meetings` + `meeting_participants` 초기 적재
- [ ] 중복제거 로직 검증

### Phase 2 — 핵심 시각화 MVP (1주)
- [ ] 관계 네트워크 그래프 (①)
- [ ] 빈도 분석 화면 (③)
- [ ] 회담 상세 (⑤)
- ▶ **여기서 실제 돌아가는 데모 확보**

### Phase 3 — 라이브 파이프라인 (1.5주)
- [ ] news-platform 수집기 연동
- [ ] LLM 추출 → 검증 큐 적재
- [ ] 엔티티 링킹 + 신뢰도 태깅
- [ ] 관리자 검증 UI (⑦)

### Phase 4 — 어젠다/성명 심화 (1주)
- [ ] 공동성명 수집·요약·핵심조항 추출
- [ ] 어젠다 카테고리 정규화 + 트렌드 차트 (④)
- [ ] 세계 지도 뷰 (②)

### Phase 5 — 다듬기
- [ ] 검색/필터 고도화, 성능(뷰/인덱스), 접근성, 배포

---

## 8. 핵심 리스크 & 대응

| 리스크 | 영향 | 대응 |
|---|---|---|
| **엔티티 링킹 오류** (동명이인, 표기 다양) | 잘못된 정상에 회담 귀속 | Wikidata ID 앵커 + 별칭 테이블 + 국가 제약 |
| **회담 중복** (다중 기사) | 빈도 과대집계 | (날짜±1, 참가자셋, 장소) 클러스터링 + 출처 병합 |
| **LLM 환각** | 없는 회담/어젠다 생성 | 신뢰도 태깅 + 다중출처 교차확인 + 인간 검증 큐 |
| **공개 데이터 최신성/커버리지** | 과거 누락 | 트랙 A는 시드일 뿐, 트랙 B가 상시 보강 |
| **글로벌 스코프의 양** | 수집 부담 | 정상급으로 한정 + 주요국 우선 백필 후 확장 |
| **다국어 표기** | 검색 실패 | name_ko/en + 별칭으로 다국어 인덱싱 |

---

## 9. 확정된 결정 (2026-07-03)
- **Supabase**: ✅ **신규 프로젝트로 분리** (news-platform과 별도)
- **백필 우선순위**: ✅ **G20 우선** → 이후 글로벌 전체로 확장
- **LLM 추출 주기**: ✅ **일 1회 배치** (Supabase Cron)

> **Phase 0부터 착수 준비 완료.**
