# Summit Tracker

전 세계 국가정상 간의 만남(정상회담·다자회의·전화통화 등)을 DB화하여
**시각화 · 빈도분석 · 어젠다/공동성명 정리**를 제공하는 외교 인텔리전스 대시보드.

- 설계 문서: [`docs/DESIGN.md`](docs/DESIGN.md) · [시각 도시에(HTML)](docs/design.html)
- 스코프: 글로벌 전체 · 데이터: 하이브리드(공개셋 시드 + 뉴스·LLM 갱신) · 백필: G20 우선 · 추출: 일 1회

## 스택
Next.js 15 (App Router · TS) · Tailwind v3 · Supabase (Postgres) · Claude(추출) · Vercel

> Node 18 환경이라 Tailwind는 v3, Next는 15로 고정했습니다. Node 20+로 올리면 v4/Next 16 가능.

## 구조
```
src/app/            # Next.js 라우트 (현재 Phase 0 상태 페이지)
src/lib/            # supabase 클라이언트, dedup, entity-linking
src/data/           # countries 시드 (G20 우선)
supabase/migrations # 0001_init.sql (8 테이블) · 0002_views.sql (3 뷰)
scripts/            # seed-countries(P0) · seed-wikidata/wikipedia(P1) · extract-news(P3)
```

## 셋업 (Phase 0 → 실데이터)
```bash
npm install
cp .env.example .env.local          # Supabase 신규 프로젝트 키 입력

# 스키마를 호스티드 프로젝트에 반영
npx supabase login
npx supabase link --project-ref <YOUR_REF>
npm run db:push

# 국가 시드
npm run seed:countries

npm run dev                          # http://localhost:3000
```

## 로드맵
Phase 0 기반 ✅ → 1 과거시드(G20) → 2 시각화 MVP(데모) → 3 라이브 파이프라인 → 4 어젠다/성명 → 5 마감.
자세한 단계는 `docs/DESIGN.md §7`.
