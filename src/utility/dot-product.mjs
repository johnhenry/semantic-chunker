/**
 * @param {number[]} vector
 * @param {number[]} vectorB
 * @returns {number}
 */
const dotProduct = (vector, vectorB) =>
  vector.reduce((sum, value, index) => sum + value * (vectorB[index] ?? 0), 0);

export default dotProduct;