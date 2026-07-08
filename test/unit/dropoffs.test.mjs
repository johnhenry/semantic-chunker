import { test } from "node:test";
import assert from "node:assert";
import {
  findSignificantDropoffsSD,
  findSignificantDropoffsIQ,
  findSignificantDropoffsMAD,
  findSignificantDropoffsPercentChange,
  findSignificantDropoffsMA,
  findSignificantDropoffsLM,
  findSignificantDropoffsCUSUM,
  findSignificantDropoffsChangePoint,
  findSignificantDropoffsHampel,
  findSignificantDropoffsModifiedZScore,
} from "../../src/utility/find-significant-dropoffs.mjs";
import findSignificantDropoffs from "../../src/utility/dropoff-chooser.mjs";

/** Builds dropoff objects with 1-based indices, matching the chunker. */
const toDropoffs = (values) =>
  values.map((dropoff, i) => ({ index: i + 1, dropoff }));

// One clear spike at index 5 amid flat values.
const SPIKE = toDropoffs([0.1, 0.1, 0.1, 0.1, 0.9, 0.1, 0.1, 0.1]);

test("SD flags the spike beyond the z-score threshold", () => {
  assert.deepStrictEqual(findSignificantDropoffsSD(SPIKE, 2), [5]);
});

test("SD returns nothing when values are uniform", () => {
  assert.deepStrictEqual(
    findSignificantDropoffsSD(toDropoffs([0.2, 0.2, 0.2]), 2),
    []
  );
});

test("IQ flags values outside the interquartile bounds", () => {
  assert.deepStrictEqual(findSignificantDropoffsIQ(SPIKE, 1.5), [5]);
});

test("MAD flags the spike (regression: used to throw ReferenceError)", () => {
  assert.deepStrictEqual(findSignificantDropoffsMAD(SPIKE, 3), [5]);
});

test("PercentChange flags the drop after the spike", () => {
  assert.deepStrictEqual(
    findSignificantDropoffsPercentChange(SPIKE, 20),
    [6]
  );
});

test("MA flags values far below the moving average", () => {
  // The spike stays inside the 3-wide window for two steps, so both
  // following values sit far below their moving average.
  assert.deepStrictEqual(findSignificantDropoffsMA(SPIKE, 3, 0.5), [6, 7]);
});

test("LM flags a local minimum", () => {
  const valley = toDropoffs([0.5, 0.1, 0.5]);
  assert.deepStrictEqual(findSignificantDropoffsLM(valley, 0.2), [2]);
});

test("CUSUM detects a shift with a low threshold", () => {
  const offs = findSignificantDropoffsCUSUM(SPIKE, 0.35);
  assert.ok(Array.isArray(offs) && offs.length > 0);
});

test("ChangePoint finds the boundary of a step change", () => {
  const step = toDropoffs([0.1, 0.1, 0.1, 0.1, 0.9, 0.9, 0.9, 0.9]);
  assert.deepStrictEqual(findSignificantDropoffsChangePoint(step), [5]);
});

test("Hampel flags the spike within its window", () => {
  assert.deepStrictEqual(findSignificantDropoffsHampel(SPIKE, 7, 3), [5]);
});

test("ModifiedZScore flags the spike at a low threshold", () => {
  assert.deepStrictEqual(
    findSignificantDropoffsModifiedZScore(SPIKE, 0.3),
    [5]
  );
});

test("chooser dispatches every statistical method", async () => {
  const cases = [
    ["SD", { zScoreThreshold: 2 }],
    ["IQ", { iqrMultiplier: 1.5 }],
    ["MAD", { madMultiplier: 3 }],
    ["PercentChange", { percentThreshold: 20 }],
    ["MA", { windowSize: 3, deviationThreshold: 0.5 }],
    ["LM", { sensitivity: 0.2 }],
    ["CUSUM", { threshold: 0.35 }],
    ["ChangePoint", {}],
    ["Hampel", { windowSize: 7, nSigma: 3 }],
    ["ModifiedZScore", { threshold: 0.3 }],
  ];
  for (const [method, options] of cases) {
    const offs = await findSignificantDropoffs(SPIKE, method, options);
    assert.ok(Array.isArray(offs), `${method} should return an array`);
  }
});

test("chooser defaults to SD", async () => {
  assert.deepStrictEqual(await findSignificantDropoffs(SPIKE), [5]);
});

test("chooser rejects unknown methods", async () => {
  await assert.rejects(
    () => findSignificantDropoffs(SPIKE, "Bogus"),
    /Unknown method: Bogus/
  );
});
