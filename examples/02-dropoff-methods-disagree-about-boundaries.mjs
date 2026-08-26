// All ten statistical detection methods run against the same dropoff
// series — one clear dissimilarity spike at index 5 amid flat values.
// Most methods agree on the spike; PercentChange flags the point AFTER
// the drop, MA flags the recovery, and CUSUM's default threshold (5) is
// too large for dropoff data bounded by 2, so it needs tuning to fire.
import assert from "node:assert";
import findSignificantDropoffs from "../src/utility/dropoff-chooser.mjs";

// Dropoffs as the semantic chunker builds them: 1-based indices,
// dropoff = 1 - cosine similarity of adjacent segments.
const SPIKE = [0.1, 0.1, 0.1, 0.1, 0.9, 0.1, 0.1, 0.1].map((dropoff, i) => ({
  index: i + 1,
  dropoff,
}));

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

console.log("dropoffs:", SPIKE.map((d) => d.dropoff).join(" "));
for (const [method, options] of cases) {
  const boundaries = await findSignificantDropoffs(SPIKE, method, options);
  console.log(`${method.padEnd(15)} -> [${boundaries.join(", ")}]`);
}

// The spike itself sits at index 5.
assert.deepStrictEqual(await findSignificantDropoffs(SPIKE, "SD", { zScoreThreshold: 2 }), [5]);
assert.deepStrictEqual(await findSignificantDropoffs(SPIKE, "MAD", { madMultiplier: 3 }), [5]);
// PercentChange marks the fall after the spike, one index later.
assert.deepStrictEqual(
  await findSignificantDropoffs(SPIKE, "PercentChange", { percentThreshold: 20 }),
  [6]
);
// CUSUM at its default threshold of 5 finds nothing in bounded dropoff data.
assert.deepStrictEqual(await findSignificantDropoffs(SPIKE, "CUSUM"), []);
