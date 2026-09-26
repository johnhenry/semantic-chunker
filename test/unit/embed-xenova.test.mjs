import { test } from "node:test";
import assert from "node:assert";
import { semantic } from "../../index.mjs";
import { PIG_ROCKET_DOC } from "../helpers/mock-embed.mjs";

// Regression tests for #11: embed/xenova.mjs used to import
// `@xenova/transformers` by bare specifier, read `process.env` at module
// scope, and top-level-await a hardcoded model -- all at *import* time.
// That made the module unusable in a browser build (no `process`, no
// Node-style bare-specifier resolution) and blocked merely importing it on
// a network download. It's now a factory (`xenova({ model, transformers })`)
// that does no work until its returned embed function is invoked, plus a
// Node-only `embed` convenience that keeps the old "just import and go"
// ergonomics by lazily importing `@xenova/transformers` on first call.

// A fake feature-extraction pipeline: deterministic, offline, mirrors
// test/helpers/mock-embed.mjs's topic-vector scheme so it plugs straight
// into the chunker like a real embedder would.
const fakeFeatureVector = (text) => {
  const t = text.toLowerCase();
  const pig = t.includes("pig") ? 1 : 0;
  const rocket = t.includes("rocket") ? 1 : 0;
  const other = pig === 0 && rocket === 0 ? 1 : 0;
  return [pig, rocket, other];
};

const makeFakePipelineFn = (calls) => async (task, model) => {
  calls.push({ task, model });
  return async (text, options) => ({ data: fakeFeatureVector(text) });
};

test("embed/xenova.mjs loads with no `process` global and does no work at import time", async () => {
  const hadProcess = Object.prototype.hasOwnProperty.call(globalThis, "process");
  const originalProcess = globalThis.process;
  const originalFetch = globalThis.fetch;
  let networkCalled = false;
  globalThis.fetch = (...args) => {
    networkCalled = true;
    return originalFetch
      ? originalFetch(...args)
      : Promise.reject(new Error("no fetch available in this test"));
  };

  // Simulate a browser: no `process` global at all.
  // eslint-disable-next-line no-undef
  delete globalThis.process;

  try {
    // Must not throw, even though `process` is undefined and nothing has
    // been imported to satisfy @xenova/transformers.
    const mod = await import("../../embed/xenova.mjs");

    assert.strictEqual(typeof mod.xenova, "function", "xenova factory should be exported");
    assert.strictEqual(typeof mod.embed, "function", "embed convenience should still be exported");
    assert.strictEqual(mod.default, mod.embed, "default export should match the named `embed`");
    assert.strictEqual(
      networkCalled,
      false,
      "importing the module must not trigger any network activity"
    );
  } finally {
    if (hadProcess) globalThis.process = originalProcess;
    else delete globalThis.process;
    globalThis.fetch = originalFetch;
  }
});

test("xenova({ transformers }) does no work until the returned embedder is invoked", async () => {
  const { xenova } = await import("../../embed/xenova.mjs");
  const calls = [];
  const embed = xenova({ model: "fake/model", transformers: makeFakePipelineFn(calls) });

  assert.strictEqual(typeof embed, "function");
  assert.strictEqual(calls.length, 0, "the pipeline loader must not run until embed() is called");

  const vector = await embed("Pigs like mud.");
  assert.deepStrictEqual(vector, [1, 0, 0]);
  assert.strictEqual(calls.length, 1);
  assert.deepStrictEqual(calls[0], { task: "feature-extraction", model: "fake/model" });

  // The pipeline is created once and reused across calls.
  await embed("Rockets fly to space.");
  assert.strictEqual(calls.length, 1, "the pipeline should be cached, not recreated per call");
});

test("xenova({ transformers }) accepts the whole imported module and applies accessToken via env", async () => {
  const { xenova } = await import("../../embed/xenova.mjs");
  const calls = [];
  const env = {};
  const fakeModule = { pipeline: makeFakePipelineFn(calls), env };

  const embed = xenova({ transformers: fakeModule, accessToken: "test-token" });
  assert.strictEqual(env.HF_ACCESS_TOKEN, undefined, "no work before the embedder is invoked");

  await embed("hello");
  assert.strictEqual(env.HF_ACCESS_TOKEN, "test-token");
  assert.strictEqual(calls.length, 1);
});

test("xenova() throws a clear error when `transformers` is missing or malformed", async () => {
  const { xenova } = await import("../../embed/xenova.mjs");
  assert.throws(() => xenova(), TypeError);
  assert.throws(() => xenova({ transformers: {} }), TypeError);
  assert.throws(() => xenova({ transformers: { pipeline: "not a function" } }), TypeError);
});

test("xenova({ transformers }) embedder works end-to-end with the semantic chunker", async () => {
  const { xenova } = await import("../../embed/xenova.mjs");
  const embed = xenova({ transformers: makeFakePipelineFn([]) });
  const chunker = semantic({ embed, zScoreThreshold: 1 });

  let count = 0;
  for await (const [text, embedding] of chunker(PIG_ROCKET_DOC)) {
    count++;
    assert.ok(text.length > 0);
    assert.ok(Array.isArray(embedding));
    assert.ok(embedding.length > 0);
  }
  assert.ok(count > 0, "should produce at least one chunk");
});
