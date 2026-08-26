import { test } from "node:test";
import assert from "node:assert";
import { semantic, sentence, full } from "../../index.mjs";
import mockEmbed, { PIG_ROCKET_DOC } from "../helpers/mock-embed.mjs";

const collect = async (chunker, text) => {
  const chunks = [];
  for await (const chunk of chunker(text)) {
    chunks.push(chunk);
  }
  return chunks;
};

test("full yields the whole text as one chunk with a resolved embedding", async () => {
  const chunks = await collect(full({ embed: mockEmbed }), "Pigs like mud.");
  assert.strictEqual(chunks.length, 1);
  const [text, embedding] = chunks[0];
  assert.strictEqual(text, "Pigs like mud.");
  // Regression: the non-split path used to yield an unresolved Promise.
  assert.ok(Array.isArray(embedding), "embedding should be a resolved array");
  assert.deepStrictEqual(embedding, [1, 0, 0]);
});

test("full with split yields fixed-size embedded slices", async () => {
  const chunks = await collect(full({ embed: mockEmbed, split: 5 }), "abcdefghij");
  assert.strictEqual(chunks.length, 2);
  assert.strictEqual(chunks.map(([t]) => t).join(""), "abcdefghij");
  for (const [, embedding] of chunks) {
    assert.ok(Array.isArray(embedding));
  }
});

test("sentence yields one embedded chunk per sentence", async () => {
  const chunks = await collect(sentence({ embed: mockEmbed }), PIG_ROCKET_DOC);
  assert.strictEqual(chunks.length, 6);
  for (const [text, embedding] of chunks) {
    assert.ok(text.length > 0);
    assert.ok(/[.!?]$/.test(text.trim()), `should end with punctuation: ${text}`);
    assert.ok(Array.isArray(embedding));
  }
});

test("sentence supports paragraph split mode", async () => {
  const chunks = await collect(
    sentence({ embed: mockEmbed, splitMode: "paragraph" }),
    "First paragraph.\n\nSecond paragraph."
  );
  assert.deepStrictEqual(
    chunks.map(([t]) => t),
    ["First paragraph.", "Second paragraph."]
  );
});

test("semantic splits the corpus at the topic boundary", async () => {
  const chunks = await collect(
    semantic({ embed: mockEmbed, zScoreThreshold: 1 }),
    PIG_ROCKET_DOC
  );
  assert.deepStrictEqual(
    chunks.map(([t]) => t),
    [
      "Pigs like mud. Pigs eat corn. Pigs sleep at noon.",
      "Rockets fly to space. Rockets burn fuel. Rockets land on ships.",
    ]
  );
});

test("semantic works with every statistical detection method", async () => {
  const methods = [
    "SD",
    "IQ",
    "MAD",
    "PercentChange",
    "MA",
    "LM",
    "CUSUM",
    "ChangePoint",
    "Hampel",
    "ModifiedZScore",
  ];
  for (const method of methods) {
    const chunks = await collect(
      semantic({ embed: mockEmbed, method }),
      PIG_ROCKET_DOC
    );
    assert.ok(chunks.length > 0, `${method} should produce chunks`);
    assert.strictEqual(
      chunks.map(([t]) => t).join(" "),
      PIG_ROCKET_DOC,
      `${method} chunks should reconstruct the document`
    );
  }
});

test("semantic rejects unknown methods", async () => {
  await assert.rejects(
    () => collect(semantic({ embed: mockEmbed, method: "Bogus" }), "A. B."),
    /Unknown method: Bogus/
  );
});

test("overlap prepends trailing segments of the previous chunk", async () => {
  const chunks = await collect(
    semantic({ embed: mockEmbed, zScoreThreshold: 1, overlap: 1 }),
    PIG_ROCKET_DOC
  );
  assert.strictEqual(chunks.length, 2);
  assert.ok(
    chunks[1][0].startsWith("Pigs sleep at noon. Rockets fly to space."),
    `second chunk should start with the overlapped sentence: ${chunks[1][0]}`
  );
});

test("maxChunkSize splits oversized chunks at the weakest interior point", async () => {
  const chunks = await collect(
    // zScoreThreshold 99 disables natural boundaries; size limit forces splits
    semantic({ embed: mockEmbed, zScoreThreshold: 99, maxChunkSize: 60 }),
    PIG_ROCKET_DOC
  );
  assert.ok(chunks.length > 1, "oversized chunk should be split");
  for (const [text] of chunks) {
    assert.ok(text.length <= 60, `chunk too long: ${text}`);
  }
});

test("maxChunkSize falls back to character-level splitting for a single run-on segment (regression: single-segment chunks were never split)", async () => {
  // No sentence-ending punctuation -> compromise treats this as one
  // sentence, so the corpus has exactly one segment. enforceChunkSize's
  // `end - start > 1` guard can never fire for a single-segment chunk, so
  // without a fallback this used to come back as one oversized chunk.
  const runOn = Array.from({ length: 500 }, (_, i) => `word${i}`).join(" ");
  assert.ok(runOn.length > 2000, "fixture should be long enough to matter");

  const chunks = await collect(
    semantic({ embed: mockEmbed, maxChunkSize: 50 }),
    runOn
  );

  assert.ok(chunks.length > 1, "the single long segment should be split");
  for (const [text] of chunks) {
    assert.ok(text.length <= 50, `chunk too long: ${text.length} chars`);
  }
  assert.strictEqual(
    chunks.map(([t]) => t).join(""),
    runOn,
    "reassembled chunks should reproduce the original text exactly"
  );
});

test("minChunkSize merges undersized chunks", async () => {
  const chunks = await collect(
    semantic({ embed: mockEmbed, zScoreThreshold: 1, minChunkSize: 1000 }),
    PIG_ROCKET_DOC
  );
  assert.strictEqual(chunks.length, 1);
  assert.strictEqual(chunks[0][0], PIG_ROCKET_DOC);
});

test("semantic markdown split mode respects block structure", async () => {
  const doc = "# Pigs\n\nPigs like mud.\n\n# Rockets\n\nRockets fly to space.";
  const chunks = await collect(
    semantic({ embed: mockEmbed, splitMode: "markdown", zScoreThreshold: 1 }),
    doc
  );
  assert.ok(chunks.length >= 1);
  assert.strictEqual(
    chunks.map(([t]) => t).join(" "),
    "# Pigs Pigs like mud. # Rockets Rockets fly to space."
  );
});
