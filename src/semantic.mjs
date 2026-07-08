import createSentenceChunker from "./sentence.mjs";
import cosineSimilarity from "./utility/cosine-similarity.mjs";
import findSignificantDropoffs from "./utility/dropoff-chooser.mjs";
import { nullEmbed } from "./utility/null-embed.mjs";

/**
 * @typedef {import("../types/types").Chunker} Chunker
 * @typedef {import("../types/types").Corpus} Corpus
 * @typedef {import("../types/types").Dropoff} Dropoff
 * @typedef {import("../types/types").EmbeddedChunk} EmbeddedChunk
 * @typedef {import("../types/types").EmbedFunction} EmbedFunction
 * @typedef {import("../types/types").DropoffMethod} DropoffMethod
 * @typedef {import("../types/types").MethodOptions} MethodOptions
 */

/**
 * Groups an embedded corpus into semantically similar chunks by detecting
 * significant dropoffs in cosine similarity between adjacent segments.
 *
 * @param {Corpus} corpus
 * @param {EmbedFunction} embed
 * @param {Object} [options]
 * @param {DropoffMethod} [options.method="SD"]
 * @param {MethodOptions} [options.methodOptions={}]
 * @returns {AsyncGenerator<EmbeddedChunk>}
 */
const createChunker = async function* (
  corpus,
  embed,
  { method = "SD", methodOptions = {} } = {}
) {
  // Step 1: Analyze the entire corpus to find dropoffs in similarity
  /** @type {Dropoff[]} */
  const similarityDropoffs = [];
  for (let i = 1; i < corpus.length; i++) {
    const similarity = cosineSimilarity(corpus[i - 1][1], corpus[i][1]);
    similarityDropoffs.push({
      index: i,
      dropoff: 1 - similarity,
      text: corpus[i][0],
    });
  }

  // Step 2: Determine chunk boundaries based on statistically significant dropoffs
  const chunkBoundaries = await findSignificantDropoffs(
    similarityDropoffs,
    method,
    methodOptions
  );

  // Step 3: Yield semantically similar chunks
  let startIndex = 0;
  for (const endIndex of [...chunkBoundaries, corpus.length]) {
    const chunk = corpus.slice(startIndex, endIndex);
    const chunkText = chunk.map((item) => item[0]).join(" ");
    const chunkEmbedding = await embed(chunkText);
    yield [chunkText, chunkEmbedding];
    startIndex = endIndex;
  }
};

/**
 * Creates a semantic chunker: text is split into sentences, embedded, and
 * regrouped wherever the embedding similarity between neighbors drops
 * significantly (according to the chosen detection method).
 *
 * @param {Object} [options]
 * @param {EmbedFunction} [options.embed=nullEmbed]
 * @param {number} [options.split=0] - Maximum sentence length in characters; longer sentences are hard-split.
 * @param {number} [options.zScoreThreshold=2] - Convenience threshold for the default "SD" method.
 * @param {DropoffMethod} [options.method="SD"] - Boundary detection method.
 * @param {MethodOptions} [options.methodOptions={}] - Options for the chosen method.
 * @returns {Chunker}
 */
export const createSemanticChunker = ({
  embed = nullEmbed,
  split = 0,
  zScoreThreshold = 2,
  method = "SD",
  methodOptions = {},
} = {}) => {
  const resolvedOptions =
    method === "SD" ? { zScoreThreshold, ...methodOptions } : methodOptions;
  const sentenceChunker = createSentenceChunker({ embed, split });
  return async function* (text) {
    const newCorpus = [];
    // First Pass: Chunk into sentences
    for await (const chunk of sentenceChunker(text)) {
      newCorpus.push(chunk);
    }
    // Second Pass: Chunk into semantically similar groups
    for await (const chunk of createChunker(newCorpus, embed, {
      method,
      methodOptions: resolvedOptions,
    })) {
      yield chunk;
    }
  };
};

export default createSemanticChunker;
