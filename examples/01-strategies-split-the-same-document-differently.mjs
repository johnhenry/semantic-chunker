// The three strategies — full, sentence, semantic — applied to the same
// two-topic document. full yields one chunk, sentence yields six, and
// semantic finds exactly the topic boundary between pigs and rockets.
//
// Uses a deterministic keyword embedder (no models, no network): each text
// maps to an orthogonal basis vector by topic, so similarity is 1 within a
// topic and 0 across topics.
import assert from "node:assert";
import { full, sentence, semantic } from "../index.mjs";

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

const fullChunks = await collect(full({ embed }));
const sentenceChunks = await collect(sentence({ embed }));
const semanticChunks = await collect(semantic({ embed, zScoreThreshold: 1 }));

console.log("full ->", fullChunks.length, "chunk");
console.log("sentence ->", sentenceChunks.length, "chunks");
console.log("semantic ->", semanticChunks.length, "chunks:");
for (const text of semanticChunks) console.log("  |", text);

assert.strictEqual(fullChunks.length, 1);
assert.strictEqual(sentenceChunks.length, 6);
assert.deepStrictEqual(semanticChunks, [
  "Pigs like mud. Pigs eat corn. Pigs sleep at noon.",
  "Rockets fly to space. Rockets burn fuel. Rockets land on ships.",
]);
