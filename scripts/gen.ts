import { copyPrAssets, generateIndexModule } from "./lib/gen-index.ts";

const { prIndex, changed } = await generateIndexModule();
const assets = await copyPrAssets();

console.log(`Index module ${changed ? "updated" : "unchanged"}: ${prIndex.prs.length} PRs`);
console.log(`PR assets: ${assets.total} total, ${assets.written} written, ${assets.removed} removed`);
