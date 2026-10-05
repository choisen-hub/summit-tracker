// Load env for scripts. Next.js reads .env.local automatically, but plain node
// scripts don't — so load .env.local first, then .env as fallback.
import { config } from "dotenv";

config({ path: ".env.local" });
config({ path: ".env" });
