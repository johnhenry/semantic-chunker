import splitter, { segment } from "./utility/splitter.mjs";
import { nullEmbed } from "./utility/null-embed.mjs";

/**
 * @typedef {import("../types/types").Chunker} Chunker
 * @typedef {import("../types/types").EmbedFunction} EmbedFunction
 * @typedef {import("../types/types").SplitMode} SplitMode
 */

/**
 * Creates a chunker that yields one embedded chunk per text segment
 * (sentence, paragraph, or markdown block).
 *
 * @param {Object} [options]
 * @param {EmbedFunction} [options.embed=nullEmbed]
 * @param {number} [options.split=0] - Maximum segment length in characters; longer segments are hard-split (0 disables).
 * @param {SplitMode} [options.splitMode="sentence"] - How to segment the text.
 * @returns {Chunker}
 */
export const createSentenceChunker = ({
  embed = nullEmbed,
  split = 0,
  splitMode = "sentence",
} = {}) => {
  return async function* (/** @type {string} */ text) {
    const segments = segment(text, splitMode);
    if (split) {
      for (const item of segments) {
        for await (const chunk of splitter(item, split)) {
          yield [chunk, await embed(chunk)];
        }
      }
    } else {
      for (const item of segments) {
        yield [item, await embed(item)];
      }
    }
  };
};

export default createSentenceChunker;
