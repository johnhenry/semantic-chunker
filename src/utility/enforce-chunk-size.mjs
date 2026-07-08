/**
 * @typedef {import("../../types/types").Corpus} Corpus
 * @typedef {import("../../types/types").Dropoff} Dropoff
 */

/**
 * Expands a sorted boundary list into [start, end) segment pairs.
 *
 * @param {number[]} boundaries
 * @param {number} length
 * @returns {Array<[number, number]>}
 */
const segmentsFrom = (boundaries, length) => {
  const segments = /** @type {Array<[number, number]>} */ ([]);
  let start = 0;
  for (const end of [...boundaries, length]) {
    segments.push([start, end]);
    start = end;
  }
  return segments;
};

/**
 * Adjusts chunk boundaries so chunks respect character-size limits.
 *
 * Oversized chunks (joined text longer than maxChunkSize) are split at their
 * highest-dropoff interior point until no further split is possible; chunks
 * of a single segment are never split. Undersized chunks (shorter than
 * minChunkSize) are merged into the neighbor across the more-similar
 * (lower-dropoff) boundary. minChunkSize is applied after maxChunkSize, so
 * when the two conflict, minChunkSize wins.
 *
 * @param {Corpus} corpus - The embedded segments being chunked.
 * @param {number[]} boundaries - Sorted segment indices where chunks begin.
 * @param {Dropoff[]} dropoffs - Similarity dropoffs for interior points.
 * @param {Object} [options]
 * @param {number} [options.maxChunkSize=0] - Maximum chunk length in characters (0 disables).
 * @param {number} [options.minChunkSize=0] - Minimum chunk length in characters (0 disables).
 * @returns {number[]} The adjusted, sorted boundary list.
 */
const enforceChunkSize = (
  corpus,
  boundaries,
  dropoffs,
  { maxChunkSize = 0, minChunkSize = 0 } = {}
) => {
  const dropoffAt = new Map(dropoffs.map((d) => [d.index, d.dropoff]));
  const textLength = (
    /** @type {number} */ start,
    /** @type {number} */ end
  ) =>
    corpus
      .slice(start, end)
      .map((c) => c[0])
      .join(" ").length;
  let bounds = [...boundaries].sort((a, b) => a - b);

  if (maxChunkSize > 0) {
    let changed = true;
    while (changed) {
      changed = false;
      for (const [start, end] of segmentsFrom(bounds, corpus.length)) {
        if (end - start > 1 && textLength(start, end) > maxChunkSize) {
          let best = start + 1;
          let bestValue = -Infinity;
          for (let i = start + 1; i < end; i++) {
            const value = dropoffAt.get(i) ?? 0;
            if (value > bestValue) {
              bestValue = value;
              best = i;
            }
          }
          bounds = [...bounds, best].sort((a, b) => a - b);
          changed = true;
          break;
        }
      }
    }
  }

  if (minChunkSize > 0) {
    let changed = true;
    while (changed && bounds.length > 0) {
      changed = false;
      for (const [start, end] of segmentsFrom(bounds, corpus.length)) {
        if (textLength(start, end) < minChunkSize) {
          const leftDropoff =
            start > 0 ? dropoffAt.get(start) ?? 0 : Infinity;
          const rightDropoff =
            end < corpus.length ? dropoffAt.get(end) ?? 0 : Infinity;
          const remove = leftDropoff <= rightDropoff ? start : end;
          bounds = bounds.filter((b) => b !== remove);
          changed = true;
          break;
        }
      }
    }
  }

  return bounds;
};

export default enforceChunkSize;
