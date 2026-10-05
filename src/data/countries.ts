// Country seed — G20 priority set (see docs/DESIGN.md §7 Phase 1).
// is_g20 marks backfill priority. Global expansion appends rows here later.
// lat/lng are representative (capital) coordinates for the map view.

export type CountrySeed = {
  id: string; // ISO 3166-1 alpha-3
  name_ko: string;
  name_en: string;
  continent: string;
  is_g20: boolean;
  lat: number;
  lng: number;
  flag_emoji: string;
};

export const COUNTRIES: CountrySeed[] = [
  // --- G20 members (19 country members) ---
  { id: "ARG", name_ko: "아르헨티나", name_en: "Argentina", continent: "South America", is_g20: true, lat: -34.61, lng: -58.38, flag_emoji: "🇦🇷" },
  { id: "AUS", name_ko: "오스트레일리아", name_en: "Australia", continent: "Oceania", is_g20: true, lat: -35.28, lng: 149.13, flag_emoji: "🇦🇺" },
  { id: "BRA", name_ko: "브라질", name_en: "Brazil", continent: "South America", is_g20: true, lat: -15.79, lng: -47.88, flag_emoji: "🇧🇷" },
  { id: "CAN", name_ko: "캐나다", name_en: "Canada", continent: "North America", is_g20: true, lat: 45.42, lng: -75.70, flag_emoji: "🇨🇦" },
  { id: "CHN", name_ko: "중국", name_en: "China", continent: "Asia", is_g20: true, lat: 39.90, lng: 116.40, flag_emoji: "🇨🇳" },
  { id: "FRA", name_ko: "프랑스", name_en: "France", continent: "Europe", is_g20: true, lat: 48.85, lng: 2.35, flag_emoji: "🇫🇷" },
  { id: "DEU", name_ko: "독일", name_en: "Germany", continent: "Europe", is_g20: true, lat: 52.52, lng: 13.40, flag_emoji: "🇩🇪" },
  { id: "IND", name_ko: "인도", name_en: "India", continent: "Asia", is_g20: true, lat: 28.61, lng: 77.21, flag_emoji: "🇮🇳" },
  { id: "IDN", name_ko: "인도네시아", name_en: "Indonesia", continent: "Asia", is_g20: true, lat: -6.21, lng: 106.85, flag_emoji: "🇮🇩" },
  { id: "ITA", name_ko: "이탈리아", name_en: "Italy", continent: "Europe", is_g20: true, lat: 41.90, lng: 12.50, flag_emoji: "🇮🇹" },
  { id: "JPN", name_ko: "일본", name_en: "Japan", continent: "Asia", is_g20: true, lat: 35.68, lng: 139.69, flag_emoji: "🇯🇵" },
  { id: "MEX", name_ko: "멕시코", name_en: "Mexico", continent: "North America", is_g20: true, lat: 19.43, lng: -99.13, flag_emoji: "🇲🇽" },
  { id: "RUS", name_ko: "러시아", name_en: "Russia", continent: "Europe/Asia", is_g20: true, lat: 55.75, lng: 37.62, flag_emoji: "🇷🇺" },
  { id: "SAU", name_ko: "사우디아라비아", name_en: "Saudi Arabia", continent: "Asia", is_g20: true, lat: 24.71, lng: 46.68, flag_emoji: "🇸🇦" },
  { id: "ZAF", name_ko: "남아프리카공화국", name_en: "South Africa", continent: "Africa", is_g20: true, lat: -25.75, lng: 28.19, flag_emoji: "🇿🇦" },
  { id: "KOR", name_ko: "대한민국", name_en: "South Korea", continent: "Asia", is_g20: true, lat: 37.57, lng: 126.98, flag_emoji: "🇰🇷" },
  { id: "TUR", name_ko: "튀르키예", name_en: "Turkey", continent: "Asia/Europe", is_g20: true, lat: 39.93, lng: 32.87, flag_emoji: "🇹🇷" },
  { id: "GBR", name_ko: "영국", name_en: "United Kingdom", continent: "Europe", is_g20: true, lat: 51.51, lng: -0.13, flag_emoji: "🇬🇧" },
  { id: "USA", name_ko: "미국", name_en: "United States", continent: "North America", is_g20: true, lat: 38.90, lng: -77.04, flag_emoji: "🇺🇸" },

  // --- Non-G20 but diplomatically central (early expansion) ---
  { id: "PRK", name_ko: "북한", name_en: "North Korea", continent: "Asia", is_g20: false, lat: 39.02, lng: 125.75, flag_emoji: "🇰🇵" },
  { id: "UKR", name_ko: "우크라이나", name_en: "Ukraine", continent: "Europe", is_g20: false, lat: 50.45, lng: 30.52, flag_emoji: "🇺🇦" },

  // --- Major non-G20 countries (expand to ~50) ---
  // Middle East / West Asia
  { id: "IRN", name_ko: "이란", name_en: "Iran", continent: "Asia", is_g20: false, lat: 35.70, lng: 51.42, flag_emoji: "🇮🇷" },
  { id: "ISR", name_ko: "이스라엘", name_en: "Israel", continent: "Asia", is_g20: false, lat: 31.77, lng: 35.21, flag_emoji: "🇮🇱" },
  { id: "ARE", name_ko: "아랍에미리트", name_en: "United Arab Emirates", continent: "Asia", is_g20: false, lat: 24.45, lng: 54.38, flag_emoji: "🇦🇪" },
  { id: "QAT", name_ko: "카타르", name_en: "Qatar", continent: "Asia", is_g20: false, lat: 25.29, lng: 51.53, flag_emoji: "🇶🇦" },
  { id: "IRQ", name_ko: "이라크", name_en: "Iraq", continent: "Asia", is_g20: false, lat: 33.31, lng: 44.36, flag_emoji: "🇮🇶" },
  // South / Southeast / Central Asia
  { id: "VNM", name_ko: "베트남", name_en: "Vietnam", continent: "Asia", is_g20: false, lat: 21.03, lng: 105.83, flag_emoji: "🇻🇳" },
  { id: "THA", name_ko: "태국", name_en: "Thailand", continent: "Asia", is_g20: false, lat: 13.75, lng: 100.50, flag_emoji: "🇹🇭" },
  { id: "PHL", name_ko: "필리핀", name_en: "Philippines", continent: "Asia", is_g20: false, lat: 14.60, lng: 120.98, flag_emoji: "🇵🇭" },
  { id: "SGP", name_ko: "싱가포르", name_en: "Singapore", continent: "Asia", is_g20: false, lat: 1.35, lng: 103.82, flag_emoji: "🇸🇬" },
  { id: "MYS", name_ko: "말레이시아", name_en: "Malaysia", continent: "Asia", is_g20: false, lat: 3.14, lng: 101.69, flag_emoji: "🇲🇾" },
  { id: "PAK", name_ko: "파키스탄", name_en: "Pakistan", continent: "Asia", is_g20: false, lat: 33.69, lng: 73.06, flag_emoji: "🇵🇰" },
  { id: "BGD", name_ko: "방글라데시", name_en: "Bangladesh", continent: "Asia", is_g20: false, lat: 23.81, lng: 90.41, flag_emoji: "🇧🇩" },
  { id: "MMR", name_ko: "미얀마", name_en: "Myanmar", continent: "Asia", is_g20: false, lat: 19.75, lng: 96.10, flag_emoji: "🇲🇲" },
  { id: "KAZ", name_ko: "카자흐스탄", name_en: "Kazakhstan", continent: "Asia", is_g20: false, lat: 51.16, lng: 71.47, flag_emoji: "🇰🇿" },
  // Europe
  { id: "ESP", name_ko: "스페인", name_en: "Spain", continent: "Europe", is_g20: false, lat: 40.42, lng: -3.70, flag_emoji: "🇪🇸" },
  { id: "NLD", name_ko: "네덜란드", name_en: "Netherlands", continent: "Europe", is_g20: false, lat: 52.37, lng: 4.90, flag_emoji: "🇳🇱" },
  { id: "POL", name_ko: "폴란드", name_en: "Poland", continent: "Europe", is_g20: false, lat: 52.23, lng: 21.01, flag_emoji: "🇵🇱" },
  { id: "SWE", name_ko: "스웨덴", name_en: "Sweden", continent: "Europe", is_g20: false, lat: 59.33, lng: 18.07, flag_emoji: "🇸🇪" },
  { id: "CHE", name_ko: "스위스", name_en: "Switzerland", continent: "Europe", is_g20: false, lat: 46.95, lng: 7.45, flag_emoji: "🇨🇭" },
  { id: "NOR", name_ko: "노르웨이", name_en: "Norway", continent: "Europe", is_g20: false, lat: 59.91, lng: 10.75, flag_emoji: "🇳🇴" },
  { id: "BEL", name_ko: "벨기에", name_en: "Belgium", continent: "Europe", is_g20: false, lat: 50.85, lng: 4.35, flag_emoji: "🇧🇪" },
  { id: "GRC", name_ko: "그리스", name_en: "Greece", continent: "Europe", is_g20: false, lat: 37.98, lng: 23.73, flag_emoji: "🇬🇷" },
  { id: "HUN", name_ko: "헝가리", name_en: "Hungary", continent: "Europe", is_g20: false, lat: 47.50, lng: 19.04, flag_emoji: "🇭🇺" },
  { id: "SRB", name_ko: "세르비아", name_en: "Serbia", continent: "Europe", is_g20: false, lat: 44.79, lng: 20.45, flag_emoji: "🇷🇸" },
  // Africa
  { id: "EGY", name_ko: "이집트", name_en: "Egypt", continent: "Africa", is_g20: false, lat: 30.04, lng: 31.24, flag_emoji: "🇪🇬" },
  { id: "NGA", name_ko: "나이지리아", name_en: "Nigeria", continent: "Africa", is_g20: false, lat: 9.06, lng: 7.50, flag_emoji: "🇳🇬" },
  { id: "KEN", name_ko: "케냐", name_en: "Kenya", continent: "Africa", is_g20: false, lat: -1.29, lng: 36.82, flag_emoji: "🇰🇪" },
  { id: "ETH", name_ko: "에티오피아", name_en: "Ethiopia", continent: "Africa", is_g20: false, lat: 9.03, lng: 38.74, flag_emoji: "🇪🇹" },
  // Latin America
  { id: "CHL", name_ko: "칠레", name_en: "Chile", continent: "South America", is_g20: false, lat: -33.45, lng: -70.67, flag_emoji: "🇨🇱" },
  { id: "COL", name_ko: "콜롬비아", name_en: "Colombia", continent: "South America", is_g20: false, lat: 4.71, lng: -74.07, flag_emoji: "🇨🇴" },
];
