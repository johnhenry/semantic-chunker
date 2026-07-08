import dotProduct from "./dot-product.mjs";
import norm from "./norm.mjs";

/**
 * Computes the cosine similarity between two vectors.
 * Returns 0 when either vector has zero magnitude (including empty vectors).
 *
 * @param {number[]} vectorA
 * @param {number[]} vectorB
 * @returns {number}
 */
const cosineSimilarity = (vectorA, vectorB) => {
  const denominator = norm(vectorA) * norm(vectorB);
  return denominator === 0 ? 0 : dotProduct(vectorA, vectorB) / denominator;
};

export default cosineSimilarity;
