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

const findSignificantDropoffs = (dropoffs, method = "SD", options = {}) => {
  switch (method) {
    case "SD":
      return findSignificantDropoffsSD(dropoffs, options.zScoreThreshold);
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
    default:
      throw new Error(`Unknown method: ${method}`);
  }
};
export default findSignificantDropoffs;
