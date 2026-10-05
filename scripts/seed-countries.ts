// Phase 0 seed: upsert the country reference set.
// Usage: npm run seed:countries   (requires .env with service-role key)
import "./load-env";
import { createAdminClient } from "../src/lib/supabase-admin";
import { COUNTRIES } from "../src/data/countries";

async function main() {
  const supabase = createAdminClient();
  const { error, count } = await supabase
    .from("countries")
    .upsert(COUNTRIES, { onConflict: "id", count: "exact" });

  if (error) {
    console.error("❌ seed failed:", error.message);
    process.exit(1);
  }
  console.log(`✅ seeded ${count ?? COUNTRIES.length} countries (${COUNTRIES.filter((c) => c.is_g20).length} G20).`);
}

main();
