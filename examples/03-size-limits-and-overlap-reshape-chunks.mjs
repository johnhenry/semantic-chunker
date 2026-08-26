// Chunk-size enforcement and overlap reshape statistically chosen
// boundaries: maxChunkSize splits oversized chunks at their weakest
// interior point, minChunkSize merges undersized chunks (and wins over
// maxChunkSize when they conflict), and overlap repeats each chunk's
// trailing segments at the start of the next chunk.
import assert from "node:assert";
import { semantic } from "../index.mjs";

const embed = async (text) => {
  const t = text.toLowerCase();
  const pig = t.includes("pig") ? 1 : 0;
  const rocket = t.includes("rocket") ? 1 : 0;
  return [pig, rocket, pig === 0 && rocket === 0 ? 1 : 0];
};

const DOC =
  "Pigs like mud. Pigs eat corn. Pigs sleep at noon. " +
  "Rockets fly to space. Rockets burn fuel. Rockets land on ships.";

const collect = async (chunker) => {
  const chunks = [];
  for await (const [text] of chunker(DOC)) chunks.push(text);
  return chunks;
};

// maxChunkSize: threshold 99 suppresses all natural boundaries, so only
// the size limit forces splits — at the highest-dropoff interior points.
const capped = await collect(
  semantic({ embed, zScoreThreshold: 99, maxChunkSize: 60 })
);
console.log("maxChunkSize: 60 ->");
for (const text of capped) console.log(`  (${String(text.length).padStart(2)}) ${text}`);
assert.ok(capped.length > 1, "size cap should force splits");

// minChunkSize: a floor larger than the document merges everything back
// into a single chunk, even across a real topic boundary.
const merged = await collect(
  semantic({ embed, zScoreThreshold: 1, minChunkSize: 1000 })
);
console.log("minChunkSize: 1000 ->", merged.length, "chunk");
assert.deepStrictEqual(merged, [DOC]);

// overlap: 1 repeats the last segment of each chunk in the next one, so
// the rockets chunk opens with the final pigs sentence for context.
const overlapped = await collect(
  semantic({ embed, zScoreThreshold: 1, overlap: 1 })
);
console.log("overlap: 1 ->");
for (const text of overlapped) console.log("  |", text);
assert.strictEqual(overlapped.length, 2);
assert.ok(overlapped[1].startsWith("Pigs sleep at noon. Rockets fly to space."));
