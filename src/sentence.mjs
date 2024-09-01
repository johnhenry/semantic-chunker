import compromise from "compromise";
import splitter from "./utility/splitter.mjs";
import { nullEmbed } from "./utility/null-embed.mjs";

/**
 * @typedef {import("../types/types").Chunker} Chunker
 * @typedef {import("../types/types").EmbedFunction} EmbedFunction
 */

/**
 * @param {Object} options
 * @param {EmbedFunction} [options.embed]
 * @param {number} [options.split=0]
 * @returns {Chunker}
 */
export const createSentenceChunker = ({
  embed = nullEmbed,
  split = 0,
} = {}) => {
  return async function* (text) {
    const doc = compromise(text);
    const sentences = doc.sentences().out("array");
    if (split) {
      for (const sentence of sentences) {
        for await (const chunk of splitter(sentence, split)) {
          yield [chunk, await embed(chunk)];
        }
      }
    } else {
      for (const sentence of sentences) {
        yield [sentence, await embed(sentence)];
      }
    }
  };
};

export default createSentenceChunker;
