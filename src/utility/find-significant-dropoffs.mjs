/**
 * @typedef {import("../../types/types").Dropoff} Dropoff
 */

/**
 * @param {Dropoff[]} dropoffs
 * @param {descriptions} Find statistically significant dropoffs in a list of dropoffs based on z-scores
 * @param {number} [zScoreThreshold=2]
 * @returns {number[]}
 */
const findSignificantDropoffsSD = (dropoffs, zScoreThreshold = 2) => {
  const mean =
    dropoffs.reduce((sum, d) => sum + d.dropoff, 0) / dropoffs.length;
  const stdDev = Math.sqrt(
    dropoffs.reduce((sum, d) => sum + Math.pow(d.dropoff - mean, 2), 0) /
      dropoffs.length
  );
  const offs = dropoffs
    .filter((d) => (d.dropoff - mean) / stdDev > zScoreThreshold)
    .map((d) => d.index)
    .sort((a, b) => a - b);

  return offs;
};

/**
 * @param {Dropoff[]} dropoffs
 * @param {descriptions} Find statistically significant dropoffs in a list of dropoffs based on interquartile range (IQR)
 * @param {number} [iqrMultiplier=1.5]
 * @returns {number[]}
 */
const findSignificantDropoffsIQ = (dropoffs, iqrMultiplier = 1.5) => {
  const sortedDropoffs = dropoffs.map((d) => d.dropoff).sort((a, b) => a - b);
  const q1 = sortedDropoffs[Math.floor(sortedDropoffs.length / 4)];
  const q3 = sortedDropoffs[Math.floor((sortedDropoffs.length * 3) / 4)];
  const iqr = q3 - q1;
  const lowerBound = q1 - iqrMultiplier * iqr;
  const upperBound = q3 + iqrMultiplier * iqr;

  const offs = dropoffs
    .filter((d) => d.dropoff < lowerBound || d.dropoff > upperBound)
    .map((d) => d.index)
    .sort((a, b) => a - b);

  return offs;
};

export { findSignificantDropoffsSD, findSignificantDropoffsIQ };
export default findSignificantDropoffs;
