import compromise from "compromise";

/**
 * @typedef {import("../../types/types").SplitMode} SplitMode
 */

/**
 * Splits text into fixed-size character slices.
 *
 * @param {string} text
 * @param {number} [split=2**8] - Maximum slice length in characters.
 * @returns {Generator<string, void, unknown>}
 */
export const splitter = function* (text, split = 2 ** 8) {
  let start = 0;
  let end = split;
  while (start < text.length) {
    yield text.slice(start, end);
    start = end;
    end = Math.min(end + split, text.length);
  }
};

/**
 * Splits markdown into blocks: headings start a new block, fenced code
 * blocks are kept intact, and blank lines separate paragraphs.
 *
 * @param {string} text
 * @returns {string[]}
 */
const segmentMarkdown = (text) => {
  const segments = [];
  /** @type {string[]} */
  let current = [];
  let inFence = false;
  const flush = () => {
    const joined = current.join("\n").trim();
    if (joined) segments.push(joined);
    current = [];
  };
  for (const line of text.split(/\r?\n/)) {
    const isFence = /^(```|~~~)/.test(line.trim());
    if (isFence) {
      if (inFence) {
        current.push(line);
        inFence = false;
        flush();
      } else {
        flush();
        current.push(line);
        inFence = true;
      }
      continue;
    }
    if (inFence) {
      current.push(line);
      continue;
    }
    if (/^#{1,6}\s/.test(line)) {
      flush();
      current.push(line);
      continue;
    }
    if (/^\s*$/.test(line)) {
      flush();
      continue;
    }
    current.push(line);
  }
  flush();
  return segments;
};

/**
 * Segments text into base units for chunking.
 *
 * @param {string} text
 * @param {SplitMode} [mode="sentence"] - "sentence" (via compromise),
 *   "paragraph" (blank-line separated), or "markdown" (heading/fence aware).
 * @returns {string[]}
 * @throws {Error} If the mode is unknown.
 */
export const segment = (text, mode = "sentence") => {
  switch (mode) {
    case "sentence":
      return compromise(text).sentences().out("array");
    case "paragraph":
      return text
        .split(/\r?\n\s*\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean);
    case "markdown":
      return segmentMarkdown(text);
    default:
      throw new Error(`Unknown split mode: ${mode}`);
  }
};

export default splitter;
