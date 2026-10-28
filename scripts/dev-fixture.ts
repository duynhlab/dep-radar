import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { buildIndex, stableStringify } from "../src/domain/snapshot.ts";
import { IndexSchema, PrRecordSchema, type PrRecord } from "../src/domain/types.ts";

/**
 * Overlay the hand-written records in tests/fixtures/prs/ onto data/ so the
 * detail page can be seen with a full review before any real review exists.
 * Local only: run `pnpm sync` afterwards to restore the real snapshot; never
 * commit the result.
 */

const FIXTURES = path.join(process.cwd(), "tests", "fixtures", "prs");
const DATA = path.join(process.cwd(), "data");
const PRS = path.join(DATA, "prs");

const index = IndexSchema.parse(JSON.parse(readFileSync(path.join(DATA, "index.json"), "utf8")));
const records = new Map<number, PrRecord>(
  readdirSync(PRS)
    .filter((f) => f.endsWith(".json"))
    .map((f) => {
      const record = PrRecordSchema.parse(JSON.parse(readFileSync(path.join(PRS, f), "utf8")));
      return [record.number, record];
    }),
);

let applied = 0;
for (const file of readdirSync(FIXTURES).filter((f) => f.endsWith(".json"))) {
  const record = PrRecordSchema.parse(JSON.parse(readFileSync(path.join(FIXTURES, file), "utf8")));
  records.set(record.number, record);
  writeFileSync(path.join(PRS, `${record.number}.json`), stableStringify(record));
  applied++;
}

const next = buildIndex([...records.values()], index.repo, new Date().toISOString());
writeFileSync(path.join(DATA, "index.json"), stableStringify(next));
console.log(`Applied ${applied} fixture record(s); data/ is now a preview, run pnpm sync to restore`);
