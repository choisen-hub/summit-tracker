// Phase 3 (Track B): daily batch. Pull new articles from the news-platform
// collector, extract structured meeting events with an LLM (JSON schema),
// link entities, de-duplicate, and enqueue for verification.
//
// Runs once per day (Supabase Cron). Records land as source_type='news_llm',
// verification_status='unverified' until cross-confirmed or human-approved.
//
// TODO(Phase 3): collector fetch → LLM extract → entity-linking → dedup → upsert.
import "./load-env";

async function main() {
  console.log("extract-news: not yet implemented (Phase 3). See docs/DESIGN.md §2 Track B.");
}

main();
