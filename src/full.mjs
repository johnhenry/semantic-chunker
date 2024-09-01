import { nullEmbed } from "./utility/null-embed.mjs";
import splitter from "./utility/splitter.mjs";

/**
 * @typedef {import("../types/types").Chunker} Chunker
 */

/**
 * @param {Object} options
 * @param {function} [options.embed=nullEmbed]
 * @returns {Chunker}
 */
export const createDefaultChunker = ({ embed = nullEmbed, split = 0 } = {}) => {
  return async function* (text) {
    if (split) {
      for await (const chunk of splitter(text, split)) {
        yield [chunk, await embed(chunk)];
      }
    } else {
      yield [text, embed(text)];
    }
  };
};

export default createDefaultChunker;
