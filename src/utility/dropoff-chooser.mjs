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
} from "./find-significant-dropoffs.mjs";

/**
 * @typedef {import("../../types/types").Dropoff} Dropoff
 * @typedef {import("../../types/types").DropoffMethod} DropoffMethod
 * @typedef {import("../../types/types").MethodOptions} MethodOptions
 */

/**
 * Dispatches to a significant-dropoff detection method by name.
 *
 * The "Agentic" method is loaded lazily because it depends on the optional
 * peer dependency `@huggingface/transformers`.
 *
 * @param {Dropoff[]} dropoffs - An array of dropoff objects containing dropoff values and their indices.
 * @param {DropoffMethod} [method="SD"] - The detection method to use.
 * @param {MethodOptions} [options={}] - Method-specific options.
 * @returns {Promise<number[]>} - An array of indices where significant dropoffs occur.
 * @throws {Error} If the method name is unknown.
 */
const findSignificantDropoffs = async (dropoffs, method = "SD", options = {}) => {
  switch (method) {
    case "Agentic": {
      const { default: findSignificantDropoffsAgentic } = await import(
        "./find-significant-dropoffs.agentic.mjs"
      );
      return findSignificantDropoffsAgentic(dropoffs, options);
    }
    case "IQ":
      return findSignificantDropoffsIQ(dropoffs, options.iqrMultiplier);
    case "MAD":
      return findSignificantDropoffsMAD(dropoffs, options.madMultiplier);
    case "PercentChange":
      return findSignificantDropoffsPercentChange(
        dropoffs,
        options.percentThreshold
      );
    case "MA":
      return findSignificantDropoffsMA(
        dropoffs,
        options.windowSize,
        options.deviationThreshold
      );
    case "LM":
      return findSignificantDropoffsLM(dropoffs, options.sensitivity);
    case "CUSUM":
      return findSignificantDropoffsCUSUM(dropoffs, options.threshold);
    case "ChangePoint":
      return findSignificantDropoffsChangePoint(dropoffs);
    case "Hampel":
      return findSignificantDropoffsHampel(
        dropoffs,
        options.windowSize,
        options.nSigma
      );
    case "ModifiedZScore":
      return findSignificantDropoffsModifiedZScore(dropoffs, options.threshold);
    case "SD":
      return findSignificantDropoffsSD(dropoffs, options.zScoreThreshold);
    default:
      throw new Error(`Unknown method: ${method}`);
  }
};

export default findSignificantDropoffs;
