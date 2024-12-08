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

/**
 * @param {Dropoff[]} dropoffs
 * @param {descriptions} Find statistically significant dropoffs in a list of dropoffs based on Median Absolute Deviation (MAD)
 * @param {number} [madMultiplier=3]
 * @returns {number[]}
 */
const findSignificantDropoffsMAD = (dropoffs, madMultiplier = 3) => {
  const median = sortedDropoffs[Math.floor(sortedDropoffs.length / 2)];
  const mad = sortedDropoffs
    .map((d) => Math.abs(d.dropoff - median))
    .sort((a, b) => a - b)[Math.floor(sortedDropoffs.length / 2)];
  const lowerBound = median - madMultiplier * mad;
  const upperBound = median + madMultiplier * mad;

  const offs = dropoffs
    .filter((d) => d.dropoff < lowerBound || d.dropoff > upperBound)
    .map((d) => d.index)
    .sort((a, b) => a - b);

  return offs;
};

/**
 * @param {Dropoff[]} dropoffs
 * @param {descriptions} Find statistically significant dropoffs in a list of dropoffs based on percentage change
 * @param {number} [percentThreshold=20]
 * @returns {number[]}
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
 * @param {Dropoff[]} dropoffs
 * @param {descriptions} Find significant dropoffs using moving average comparison
 * @param {number} [windowSize=3]
 * @param {number} [deviationThreshold=1.5]
 * @returns {number[]}
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
 * @param {Dropoff[]} dropoffs
 * @param {descriptions} Find significant local minima in dropoff values
 * @param {number} [sensitivity=0.2]
 * @returns {number[]}
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
 * @param {Dropoff[]} dropoffs
 * @param {descriptions} Find significant dropoffs using the CUSUM method
 * @param {number} [threshold=5]
 * @returns {number[]}
 */
const findSignificantDropoffsCUSUM = (dropoffs, threshold = 5) => {
  let cusum = 0;
  const mean =
    dropoffs.reduce((sum, d) => sum + d.dropoff, 0) / dropoffs.length;
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
 * @param {Dropoff[]} dropoffs
 * @param {descriptions} Detect change points where statistical properties change
 * @returns {number[]}
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
 * @param {Dropoff[]} dropoffs
 * @param {descriptions} Find significant dropoffs using the Hampel filter
 * @param {number} [windowSize=7]
 * @param {number} [nSigma=3]
 * @returns {number[]}
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
 * @param {Dropoff[]} dropoffs
 * @param {descriptions} Find significant dropoffs using the Modified Z-Score method
 * @param {number} [threshold=3.5]
 * @returns {number[]}
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
