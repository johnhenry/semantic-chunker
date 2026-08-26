// ENV-DEPENDENT: chunks "The Three Little Pigs" with the bundled xenova
// adapter (a real local transformer model). Importing the adapter loads —
// and on first run downloads — the Supabase/gte-small model, so this
// example is gated behind an environment variable and skips by default;
// it is excluded from the CI smoke loop.
//
//   RUN_XENOVA_EXAMPLE=1 node examples/04-xenova-embeds-a-real-story-locally.mjs
import assert from "node:assert";
import { readFile } from "node:fs/promises";

if (!process.env.RUN_XENOVA_EXAMPLE) {
  console.error(
    "skipped: set RUN_XENOVA_EXAMPLE=1 to run (downloads a model on first use)"
  );
  process.exit(0);
}

const { semantic } = await import("../index.mjs");
const { embed } = await import("../embed/xenova.mjs");

const document = await readFile(
  new URL("../docs/three-little-pigs.txt", import.meta.url),
  "utf8"
);

const chunker = semantic({ embed, zScoreThreshold: 1 });

let count = 0;
for await (const [text, embedding] of chunker(document)) {
  count++;
  console.log(`--- chunk ${count} (${text.length} chars, ${embedding.length}d)`);
  console.log(text.slice(0, 120) + (text.length > 120 ? "…" : ""));
  assert.ok(Array.isArray(embedding) && embedding.length > 0);
}
assert.ok(count > 0, "should produce at least one chunk");
console.log(`${count} chunks total`);
