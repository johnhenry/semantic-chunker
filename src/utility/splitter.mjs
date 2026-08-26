import compromise from "compromise";

/**
 * @typedef {import("../../types/types").SplitMode} SplitMode
 */

/**
 * `String.prototype.slice` operates on UTF-16 code units, not code points.
 * A split boundary that lands between a high surrogate (0xD800-0xDBFF) and
 * its low surrogate would cut an astral-plane character (e.g. an emoji) in
 * half, leaving each side with a lone, unpaired surrogate — invalid
 * Unicode once encoded (e.g. to UTF-8). Nudge the boundary forward by one
 * code unit so it always falls after a complete pair instead.
 *
 * @param {string} text
 * @param {number} end - Candidate split boundary (code-unit index).
 * @returns {number} `end`, or `end + 1` if that would split a surrogate pair.
 */
const safeSplitBoundary = (text, end) =>
  end > 0 &&
  end < text.length &&
  text.charCodeAt(end - 1) >= 0xd800 &&
  text.charCodeAt(end - 1) <= 0xdbff
    ? end + 1
    : end;

/**
 * Splits text into fixed-size character slices. Never splits a UTF-16
 * surrogate pair (see `safeSplitBoundary`); slices adjacent to an
 * astral-plane character may therefore be one code unit longer or shorter
 * than `split`.
 *
 * @param {string} text
 * @param {number} [split=2**8] - Maximum slice length in characters.
 * @returns {Generator<string, void, unknown>}
 */
export const splitter = function* (text, split = 2 ** 8) {
  let start = 0;
  let end = safeSplitBoundary(text, Math.min(split, text.length));
  while (start < text.length) {
    yield text.slice(start, end);
    start = end;
    end = safeSplitBoundary(text, Math.min(end + split, text.length));
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
  /** @type {string[]} */
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
