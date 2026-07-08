import { test } from "node:test";
import assert from "node:assert";
import { readFile } from "node:fs/promises";
import { semantic, sentence } from "../../index.mjs";

// These tests exercise the real embedding adapters. They require network
// access (first-run model download) and, for Ollama, a local server with the
// nomic-embed-text model pulled. Each suite skips cleanly when its
// dependency is unavailable.

const readTestDocument = (filename) =>
  readFile(new URL(`../../docs/${filename}`, import.meta.url), "utf8");

const loadXenova = async () => {
  try {
    const { embed } = await import("../../embed/xenova.mjs");
    return embed;
  } catch {
    return null;
  }
};

const ollamaAvailable = async () => {
  try {
    const response = await fetch("http://localhost:11434", {
      signal: AbortSignal.timeout(2000),
    });
    return response.ok;
  } catch {
    return false;
  }
};

test("Semantic chunker with Xenova embedding", async (t) => {
  const embed = await loadXenova();
  if (!embed) return t.skip("@xenova/transformers unavailable (offline or not installed)");
  const document = await readTestDocument("three-little-pigs.txt");
  const chunker = semantic({ embed, zScoreThreshold: 1 });

  let count = 0;
  for await (const [text, embedding] of chunker(document)) {
    count++;
    assert.ok(text.length > 0, "Chunk text should not be empty");
    assert.ok(Array.isArray(embedding), "Embedding should be an array");
    assert.ok(embedding.length > 0, "Embedding should not be empty");
  }
  assert.ok(count > 0, "Should produce at least one chunk");
});

test("Sentence chunker with Xenova embedding", async (t) => {
  const embed = await loadXenova();
  if (!embed) return t.skip("@xenova/transformers unavailable (offline or not installed)");
  const document = await readTestDocument("interwoven.txt");
  const chunker = sentence({ embed });

  for await (const [text, embedding] of chunker(document)) {
    assert.ok(text.length > 0, "Chunk text should not be empty");
    assert.ok(Array.isArray(embedding), "Embedding should be an array");
    assert.ok(embedding.length > 0, "Embedding should not be empty");
    assert.ok(
      /[.!?]["')\]]*$/.test(text.trim()),
      `Sentence should end with punctuation: ${text}`
    );
  }
});

test("Semantic chunker with different zScoreThresholds (Xenova)", async (t) => {
  const embed = await loadXenova();
  if (!embed) return t.skip("@xenova/transformers unavailable (offline or not installed)");
  const document = await readTestDocument("three-little-pigs.txt");

  for (const zScoreThreshold of [0.5, 1, 1.5, 2]) {
    const chunker = semantic({ embed, zScoreThreshold });
    let chunkCount = 0;
    for await (const chunk of chunker(document)) {
      chunkCount++;
    }
    assert.ok(
      chunkCount > 0,
      `Should produce at least one chunk with zScoreThreshold ${zScoreThreshold}`
    );
  }
});

test("Semantic chunker with Ollama embedding", async (t) => {
  if (!(await ollamaAvailable())) return t.skip("Ollama server not running on localhost:11434");
  const { embed } = await import("../../embed/ollama.mjs");
  const document = await readTestDocument("lyndon-b-johnson.txt");
  const chunker = semantic({ embed, zScoreThreshold: 1.5 });

  let count = 0;
  for await (const [text, embedding] of chunker(document)) {
    count++;
    assert.ok(text.length > 0, "Chunk text should not be empty");
    assert.ok(Array.isArray(embedding), "Embedding should be an array");
    assert.ok(embedding.length > 0, "Embedding should not be empty");
  }
  assert.ok(count > 0, "Should produce at least one chunk");
});

// NOTE: This test runs LAST and uses an @huggingface/transformers-based
// embedder rather than the Xenova adapter. The onnxruntime bindings shipped
// by @xenova/transformers (v2) and @huggingface/transformers (v3) conflict:
// once v3 has run inference in a process, subsequent v2 inference hangs
// forever. Do not mix the Xenova embedder with the Agentic method.
test('Semantic chunker with the "Agentic" method', async (t) => {
  let embed;
  try {
    const { pipeline } = await import("@huggingface/transformers");
    const extractor = await pipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2"
    );
    embed = async (text) => {
      const tensor = await extractor(text, { pooling: "mean", normalize: true });
      return Array.from(tensor.data);
    };
  } catch {
    return t.skip("@huggingface/transformers unavailable (offline or not installed)");
  }
  const document = await readTestDocument("three-little-pigs.txt");
  const chunker = semantic({ embed, method: "Agentic" });

  let count = 0;
  for await (const [text] of chunker(document)) {
    count++;
    assert.ok(text.length > 0, "Chunk text should not be empty");
  }
  assert.ok(count > 0, "Agentic method should produce at least one chunk");
});
