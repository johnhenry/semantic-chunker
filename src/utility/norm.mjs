/**
 * @param {number[]} vector
 * @returns {number}
 */
const norm = (vector) => {
  return Math.sqrt(vector.reduce((sum, value) => sum + value ** 2, 0));
};

export default norm;