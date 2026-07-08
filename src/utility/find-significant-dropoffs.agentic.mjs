import cosineSimilarity from "./cosine-similarity.mjs";

/**
 * @typedef {import("../../types/types").Dropoff} Dropoff
 */

/**
 * Finds significant dropoffs by re-embedding the text of each segment with a
 * transformers.js feature-extraction model and flagging points where the
 * average cosine similarity across a sliding window falls below a threshold.
 *
 * Requires the optional peer dependency `@huggingface/transformers`, which is
 * imported lazily so the rest of the library works without it. Each dropoff
 * must carry the `text` of its segment (populated by the semantic chunker).
 *
 * @param {Dropoff[]} dropoffs - Dropoff objects with `index`, `dropoff`, and `text`.
 * @param {Object} [options] - Configuration options.
 * @param {string} [options.model="Xenova/all-MiniLM-L6-v2"] - Model ID to use for similarity scoring.
 * @param {number} [options.threshold=0.5] - Similarity threshold below which a dropoff is significant.
 * @param {number} [options.windowSize=2] - Size of the sliding window of adjacent segments (minimum 2).
 * @returns {Promise<number[]>} - Array of indices where significant semantic dropoffs occur.
 * @throws {Error} If any dropoff is missing `text`.
 */
const findSignificantDropoffsAgentic = async (
  dropoffs,
  { model = "Xenova/all-MiniLM-L6-v2", threshold = 0.5, windowSize = 2 } = {}
) => {
  const size = Math.max(2, windowSize);
  if (dropoffs.some((d) => typeof d.text !== "string")) {
    throw new Error(
      'The "Agentic" method requires each dropoff to include the segment text'
    );
  }

  const { pipeline } = await import("@huggingface/transformers");
  const featureExtractor = await pipeline("feature-extraction", model);

  // Embed each segment once; tensors are mean-pooled into plain vectors.
  const embeddings = [];
  for (const d of dropoffs) {
    const tensor = await featureExtractor(d.text, {
      pooling: "mean",
      normalize: true,
    });
    embeddings.push(Array.from(tensor.data));
  }

  const significantDropoffs = [];
  for (let i = 0; i <= dropoffs.length - size; i++) {
    let similarity = 0;
    for (let j = i; j < i + size - 1; j++) {
      similarity += cosineSimilarity(embeddings[j], embeddings[j + 1]);
    }
    similarity /= size - 1; // Average similarity across the window

    if (similarity < threshold) {
      significantDropoffs.push(dropoffs[i + Math.floor(size / 2)].index);
    }
  }

  return [...new Set(significantDropoffs)].sort((a, b) => a - b);
};

export { findSignificantDropoffsAgentic };
export default findSignificantDropoffsAgentic;
