import { nullEmbed } from "./utility/null-embed.mjs";
import splitter from "./utility/splitter.mjs";

/**
 * @typedef {import("../types/types").Chunker} Chunker
 * @typedef {import("../types/types").EmbedFunction} EmbedFunction
 */

/**
 * Creates a chunker that embeds the whole text as a single chunk, or as
 * fixed-size slices when `split` is set.
 *
 * @param {Object} [options]
 * @param {EmbedFunction} [options.embed=nullEmbed]
 * @param {number} [options.split=0] - Maximum slice length in characters (0 disables slicing).
 * @param {"char" | "word"} [options.hardSplit="char"] - "word" breaks slices at whitespace.
 * @returns {Chunker}
 */
export const createDefaultChunker = ({ embed = nullEmbed, split = 0, hardSplit = "char" } = {}) => {
  return async function* (/** @type {string} */ text) {
    if (split) {
      for await (const chunk of splitter(text, split, hardSplit)) {
        yield [chunk, await embed(chunk)];
      }
    } else {
      yield [text, await embed(text)];
    }
  };
};

export default createDefaultChunker;
