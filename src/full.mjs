import { nullEmbed } from "./utility/null-embed.mjs";

/**
 * @typedef {import("../types/types").Chunker} Chunker
 */

/**
 * @param {Object} options
 * @param {function} [options.embed=nullEmbed]
 * @returns {Chunker}
 */
export const createDefaultChunker = ({ embed = nullEmbed } = {}) => {
  return async function* (text) {
    yield [text, embed(text)];
  };
};

export default createDefaultChunker;
