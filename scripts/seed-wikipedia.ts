// Phase 1 (Track A): parse "List of international trips made by <leader>"
// Wikipedia tables into meetings + meeting_participants.
// Resolve mentioned leaders/countries through src/lib/entity-linking, and set
// meetings.dedup_key via src/lib/dedup before upserting.
//
// TODO(Phase 1): fetch article HTML → parse trip tables → build meeting rows.
import "./load-env";

async function main() {
  console.log("seed-wikipedia: not yet implemented (Phase 1). See docs/DESIGN.md §7.");
}

main();
