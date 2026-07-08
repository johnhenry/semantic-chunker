/**
 * @typedef {import("../../types/types").Dropoff} Dropoff
 */

/**
 * Finds statistically significant dropoffs in a list of dropoffs based on z-scores.
 *
 * This method calculates the mean and standard deviation of the dropoff values.
 * It then computes the z-score for each dropoff, which represents how many standard deviations
 * an element is from the mean. Dropoffs with a z-score greater than the specified threshold
 * are considered statistically significant outliers.
 *
 * @param {Dropoff[]} dropoffs - An array of dropoff objects containing dropoff values and their indices.
 * @param {number} [zScoreThreshold=2] - The z-score threshold to identify significant dropoffs. Default is 2.
 * @returns {number[]} - An array of indices where significant dropoffs occur.
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
 * Finds statistically significant dropoffs based on the Interquartile Range (IQR).
 *
 * This method sorts the dropoff values and computes the first (Q1) and third (Q3) quartiles.
 * It calculates the IQR as the difference between Q3 and Q1. Dropoffs falling below
 * the lower bound (Q1 - iqrMultiplier * IQR) or above the upper bound (Q3 + iqrMultiplier * IQR)
 * are considered outliers.
 *
 * @param {Dropoff[]} dropoffs - An array of dropoff objects containing dropoff values and their indices.
 * @param {number} [iqrMultiplier=1.5] - The multiplier for the IQR to define the outlier bounds. Default is 1.5.
 * @returns {number[]} - An array of indices where significant dropoffs occur.
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

/**
 * Finds statistically significant dropoffs using the Median Absolute Deviation (MAD).
 *
 * This method calculates the median of the dropoff values and then computes the MAD,
 * which is the median of the absolute deviations from the median. It defines lower and upper bounds
 * based on the MAD and identifies dropoffs that fall outside these bounds as significant.
 *
 * @param {Dropoff[]} dropoffs - An array of dropoff objects containing dropoff values and their indices.
 * @param {number} [madMultiplier=3] - The multiplier for the MAD to define the outlier bounds. Default is 3.
 * @returns {number[]} - An array of indices where significant dropoffs occur.
 */
const findSignificantDropoffsMAD = (dropoffs, madMultiplier = 3) => {
  const sortedValues = dropoffs.map((d) => d.dropoff).sort((a, b) => a - b);
  const median = sortedValues[Math.floor(sortedValues.length / 2)];
  const mad = sortedValues
    .map((v) => Math.abs(v - median))
    .sort((a, b) => a - b)[Math.floor(sortedValues.length / 2)];
  const lowerBound = median - madMultiplier * mad;
  const upperBound = median + madMultiplier * mad;

  const offs = dropoffs
    .filter((d) => d.dropoff < lowerBound || d.dropoff > upperBound)
    .map((d) => d.index)
    .sort((a, b) => a - b);

  return offs;
};

/**
 * Finds significant dropoffs based on percentage change between consecutive dropoffs.
 *
 * This method calculates the percentage change from each dropoff to the previous one.
 * If the percentage decrease exceeds the specified threshold, the dropoff is considered significant.
 * This is useful for detecting sharp declines in sequential data.
 *
 * @param {Dropoff[]} dropoffs - An array of dropoff objects containing dropoff values and their indices.
 * @param {number} [percentThreshold=20] - The percentage threshold to identify significant dropoffs. Default is 20%.
 * @returns {number[]} - An array of indices where significant dropoffs occur.
 */
const findSignificantDropoffsPercentChange = (
  dropoffs,
  percentThreshold = 20
) => {
  const offs = dropoffs
    .filter(
      (d, i, arr) =>
        i > 0 &&
        ((arr[i - 1].dropoff - d.dropoff) / arr[i - 1].dropoff) * 100 >
          percentThreshold
    )
    .map((d) => d.index)
    .sort((a, b) => a - b);

  return offs;
};

/**
 * Finds significant dropoffs using moving average comparison.
 *
 * This method computes a moving average over a specified window size.
 * It compares each dropoff to the moving average at that point.
 * Dropoffs that are less than the moving average by more than the specified deviation threshold
 * are considered significant.
 *
 * @param {Dropoff[]} dropoffs - An array of dropoff objects containing dropoff values and their indices.
 * @param {number} [windowSize=3] - The number of elements to include in the moving average window. Default is 3.
 * @param {number} [deviationThreshold=1.5] - The factor by which the dropoff must deviate from the moving average. Default is 1.5.
 * @returns {number[]} - An array of indices where significant dropoffs occur.
 */
const findSignificantDropoffsMA = (
  dropoffs,
  windowSize = 3,
  deviationThreshold = 1.5
) => {
  const movingAvg = dropoffs.map((d, i, arr) => {
    const start = Math.max(0, i - windowSize + 1);
    const window = arr.slice(start, i + 1);
    return window.reduce((sum, d) => sum + d.dropoff, 0) / window.length;
  });

  const offs = dropoffs
    .filter((d, i) => d.dropoff < movingAvg[i] * (1 - deviationThreshold))
    .map((d) => d.index)
    .sort((a, b) => a - b);

  return offs;
};

/**
 * Finds significant local minima in dropoff values.
 *
 * This method identifies points that are local minima, considering the specified sensitivity.
 * It checks if a dropoff is less than its immediate neighbors by a certain percentage.
 * Dropoffs that meet these criteria are considered significant local minima.
 *
 * @param {Dropoff[]} dropoffs - An array of dropoff objects containing dropoff values and their indices.
 * @param {number} [sensitivity=0.2] - The sensitivity factor for detecting local minima. Default is 0.2.
 * @returns {number[]} - An array of indices where significant dropoffs occur.
 */
const findSignificantDropoffsLM = (dropoffs, sensitivity = 0.2) => {
  const offs = dropoffs
    .filter((d, i, arr) => {
      if (i === 0 || i === arr.length - 1) return false;
      const prev = arr[i - 1].dropoff;
      const curr = d.dropoff;
      const next = arr[i + 1].dropoff;
      return curr < prev * (1 - sensitivity) && curr < next;
    })
    .map((d) => d.index)
    .sort((a, b) => a - b);

  return offs;
};

/**
 * Finds significant dropoffs using the Cumulative Sum (CUSUM) method.
 *
 * This method calculates the cumulative sum of deviations from the mean.
 * When the cumulative sum exceeds the specified threshold, a change is detected,
 * and the cumulative sum is reset. This technique is effective for monitoring shifts in the mean level.
 *
 * @param {Dropoff[]} dropoffs - An array of dropoff objects containing dropoff values and their indices.
 * @param {number} [threshold=5] - The threshold for the cumulative sum to detect a change. Default is 5.
 * @returns {number[]} - An array of indices where significant dropoffs occur.
 */
const findSignificantDropoffsCUSUM = (dropoffs, threshold = 5) => {
  let cusum = 0;
  const mean =
    dropoffs.reduce((sum, d) => sum + d.dropoff, 0) / dropoffs.length;
  /** @type {number[]} */
  const offs = [];

  dropoffs.forEach((d, i) => {
    cusum += d.dropoff - mean;
    if (Math.abs(cusum) > threshold) {
      offs.push(d.index);
      cusum = 0; // Reset after detection
    }
  });

  return offs.sort((a, b) => a - b);
};

/**
 * Detects change points where statistical properties of the data change.
 *
 * This method iterates through the dropoffs and at each point divides the data into two segments.
 * It calculates the mean of each segment and computes the score as the absolute difference between the means.
 * The point with the maximum score is considered the change point.
 *
 * @param {Dropoff[]} dropoffs - An array of dropoff objects containing dropoff values and their indices.
 * @returns {number[]} - An array containing the index where the change point occurs.
 */
const findSignificantDropoffsChangePoint = (dropoffs) => {
  const offs = [];
  const n = dropoffs.length;
  let maxScore = 0;
  let changePointIndex = -1;

  for (let i = 1; i < n - 1; i++) {
    const mean1 =
      dropoffs.slice(0, i).reduce((sum, d) => sum + d.dropoff, 0) / i;
    const mean2 =
      dropoffs.slice(i).reduce((sum, d) => sum + d.dropoff, 0) / (n - i);
    const score = Math.abs(mean1 - mean2);

    if (score > maxScore) {
      maxScore = score;
      changePointIndex = i;
    }
  }

  if (changePointIndex !== -1) {
    offs.push(dropoffs[changePointIndex].index);
  }

  return offs.sort((a, b) => a - b);
};

/**
 * Finds significant dropoffs using the Hampel filter.
 *
 * This method applies the Hampel filter to detect outliers in time series data.
 * It computes the median and MAD within a moving window centered around each data point.
 * Dropoffs that deviate from the median by more than a specified number of standard deviations (nSigma) are flagged.
 *
 * @param {Dropoff[]} dropoffs - An array of dropoff objects containing dropoff values and their indices.
 * @param {number} [windowSize=7] - The size of the moving window. Default is 7.
 * @param {number} [nSigma=3] - The number of standard deviations to use as the cutoff. Default is 3.
 * @returns {number[]} - An array of indices where significant dropoffs occur.
 */
const findSignificantDropoffsHampel = (
  dropoffs,
  windowSize = 7,
  nSigma = 3
) => {
  const k = 1.4826; // Scaling factor for Gaussian distribution
  const offs = [];

  for (let i = 0; i < dropoffs.length; i++) {
    const start = Math.max(0, i - Math.floor(windowSize / 2));
    const end = Math.min(dropoffs.length, i + Math.floor(windowSize / 2) + 1);
    const window = dropoffs.slice(start, end).map((d) => d.dropoff);
    const median = window.slice().sort((a, b) => a - b)[
      Math.floor(window.length / 2)
    ];
    const mad =
      k *
      window.map((v) => Math.abs(v - median)).sort((a, b) => a - b)[
        Math.floor(window.length / 2)
      ];

    if (Math.abs(dropoffs[i].dropoff - median) > nSigma * mad) {
      offs.push(dropoffs[i].index);
    }
  }

  return offs.sort((a, b) => a - b);
};

/**
 * Finds significant dropoffs using the Modified Z-Score method.
 *
 * This method calculates a modified z-score for each dropoff, which is less sensitive to outliers
 * than the traditional z-score. It uses the median and MAD to compute the scores.
 * Dropoffs with a modified z-score greater than the specified threshold are considered significant.
 *
 * @param {Dropoff[]} dropoffs - An array of dropoff objects containing dropoff values and their indices.
 * @param {number} [threshold=3.5] - The modified z-score threshold to identify significant dropoffs. Default is 3.5.
 * @returns {number[]} - An array of indices where significant dropoffs occur.
 */
const findSignificantDropoffsModifiedZScore = (dropoffs, threshold = 3.5) => {
  const dropoffValues = dropoffs.map((d) => d.dropoff);
  const median = dropoffValues.slice().sort((a, b) => a - b)[
    Math.floor(dropoffValues.length / 2)
  ];
  const mad =
    dropoffValues.map((v) => Math.abs(v - median)).sort((a, b) => a - b)[
      Math.floor(dropoffValues.length / 2)
    ] || 1; // Prevent division by zero

  const modifiedZScores = dropoffValues.map(
    (v) => (0.6745 * (v - median)) / mad
  );

  const offs = dropoffs
    .filter((d, i) => Math.abs(modifiedZScores[i]) > threshold)
    .map((d) => d.index)
    .sort((a, b) => a - b);

  return offs;
};

export {
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
};
export default findSignificantDropoffsSD;
