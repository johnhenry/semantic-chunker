import createSentenceChunker from "./sentence.mjs";
import cosineSimilarity from "./utility/cosine-similarity.mjs";
import findSignificantDropoffs from "./utility/find-significant-dropoffs.mjs";

/**
 * @typedef {import("../types/types").Chunker} Chunker
 * @typedef {import("../types/types").Corpus} Corpus
 * @typedef {import("../types/types").EmbeddedChunk} EmbeddedChunk
 * @typedef {import("../types/types").EmbedFunction} EmbedFunction
 */

/**
 * @param {Corpus} corpus
 * @param {EmbedFunction} embed
 * @param {number} [zScoreThreshold=2]
 * @returns {AsyncGenerator<EmbeddedChunk>}
 */
const createChunker = async function* (corpus, embed, zScoreThreshold = 2) {
  // Step 1: Analyze the entire corpus to find dropoffs in similarity
  let similarityDropoffs = [];
  for (let i = 1; i < corpus.length; i++) {
    const similarity = cosineSimilarity(corpus[i - 1][1], corpus[i][1]);
    similarityDropoffs.push({ index: i, dropoff: 1 - similarity });
  }

  // Step 2: Determine chunk boundaries based on statistically significant dropoffs
  const chunkBoundaries = await findSignificantDropoffs(
    similarityDropoffs,
    zScoreThreshold
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
 * @param {Object} options
 * @param {EmbedFunction} [options.embed]
 * @param {number} [options.split=0]
 * @param {number} [options.zScoreThreshold=2]
 * @returns {Chunker}
 */
export const createSemanticChunker = ({
  embed,
  split = 0,
  zScoreThreshold = 2,
} = {}) => {
  const sentenceChunker = createSentenceChunker({ embed, split });
  return async function* (text) {
    const newCorpus = [];
    // First Pass: Chunk into sentences
    for await (const chunk of sentenceChunker(text)) {
      newCorpus.push(chunk);
    }
    // Second Pass: Chunk into semantically similar groups
    for await (const chunk of await createChunker(
      newCorpus,
      embed,
      zScoreThreshold
    )) {
      yield chunk;
    }
  };
};

export default createSemanticChunker;
