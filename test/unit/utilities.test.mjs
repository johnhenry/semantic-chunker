import { test } from "node:test";
import assert from "node:assert";
import cosineSimilarity from "../../src/utility/cosine-similarity.mjs";
import dotProduct from "../../src/utility/dot-product.mjs";
import norm from "../../src/utility/norm.mjs";
import splitter, { segment } from "../../src/utility/splitter.mjs";

test("dotProduct multiplies and sums pairwise", () => {
  assert.strictEqual(dotProduct([1, 2, 3], [4, 5, 6]), 32);
});

test("dotProduct treats missing entries as zero", () => {
  assert.strictEqual(dotProduct([1, 2, 3], [4]), 4);
});

test("norm returns the Euclidean magnitude", () => {
  assert.strictEqual(norm([3, 4]), 5);
  assert.strictEqual(norm([]), 0);
});

test("cosineSimilarity of identical vectors is 1", () => {
  assert.ok(Math.abs(cosineSimilarity([1, 2, 3], [1, 2, 3]) - 1) < 1e-12);
});

test("cosineSimilarity of orthogonal vectors is 0", () => {
  assert.strictEqual(cosineSimilarity([1, 0], [0, 1]), 0);
});

test("cosineSimilarity guards zero and empty vectors", () => {
  assert.strictEqual(cosineSimilarity([0, 0], [1, 2]), 0);
  assert.strictEqual(cosineSimilarity([], []), 0);
});

test("splitter yields fixed-size slices covering the whole text", () => {
  const slices = [...splitter("abcdefghij", 4)];
  assert.deepStrictEqual(slices, ["abcd", "efgh", "ij"]);
  assert.strictEqual(slices.join(""), "abcdefghij");
});

test("segment splits sentences by default", () => {
  const segments = segment("One sentence here. Another one there.");
  assert.strictEqual(segments.length, 2);
});

test("segment paragraph mode splits on blank lines", () => {
  const segments = segment("First para.\n\nSecond para.\n\n\nThird.", "paragraph");
  assert.deepStrictEqual(segments, ["First para.", "Second para.", "Third."]);
});

test("segment markdown mode separates headings and keeps code fences intact", () => {
  const doc = "# Title\n\nSome text.\n\n```js\ncode();\n\nmore();\n```\n\nAfter.";
  const segments = segment(doc, "markdown");
  assert.deepStrictEqual(segments, [
    "# Title",
    "Some text.",
    "```js\ncode();\n\nmore();\n```",
    "After.",
  ]);
});

test("segment throws on unknown mode", () => {
  assert.throws(() => segment("text", "bogus"), /Unknown split mode/);
});
