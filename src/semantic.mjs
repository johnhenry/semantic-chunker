import createSentenceChunker from "./sentence.mjs";
import cosineSimilarity from "./utility/cosine-similarity.mjs";
import findSignificantDropoffs from "./utility/dropoff-chooser.mjs";
import enforceChunkSize from "./utility/enforce-chunk-size.mjs";
import { splitter } from "./utility/splitter.mjs";
import { nullEmbed } from "./utility/null-embed.mjs";

/**
 * @typedef {import("../types/types").Chunker} Chunker
 * @typedef {import("../types/types").Corpus} Corpus
 * @typedef {import("../types/types").Dropoff} Dropoff
 * @typedef {import("../types/types").EmbeddedChunk} EmbeddedChunk
 * @typedef {import("../types/types").EmbedFunction} EmbedFunction
 * @typedef {import("../types/types").DropoffMethod} DropoffMethod
 * @typedef {import("../types/types").MethodOptions} MethodOptions
 * @typedef {import("../types/types").SplitMode} SplitMode
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
 * @param {number} [options.overlap=0] - Number of trailing segments from the previous chunk to prepend to the next.
 * @param {number} [options.maxChunkSize=0] - Maximum chunk length in characters (0 disables).
 * @param {number} [options.minChunkSize=0] - Minimum chunk length in characters (0 disables).
 * @returns {AsyncGenerator<EmbeddedChunk>}
 */
const createChunker = async function* (
  corpus,
  embed,
  {
    method = "SD",
    methodOptions = {},
    overlap = 0,
    maxChunkSize = 0,
    minChunkSize = 0,
  } = {}
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
  let chunkBoundaries = await findSignificantDropoffs(
    similarityDropoffs,
    method,
    methodOptions
  );
  if (maxChunkSize > 0 || minChunkSize > 0) {
    chunkBoundaries = enforceChunkSize(
      corpus,
      chunkBoundaries,
      similarityDropoffs,
      { maxChunkSize, minChunkSize }
    );
  }

  // Step 3: Yield semantically similar chunks
  let startIndex = 0;
  for (const endIndex of [...chunkBoundaries, corpus.length]) {
    const from = startIndex === 0 ? 0 : Math.max(0, startIndex - overlap);
    const chunk = corpus.slice(from, endIndex);
    const chunkText = chunk.map((item) => item[0]).join(" ");
    if (maxChunkSize > 0 && chunkText.length > maxChunkSize) {
      // enforceChunkSize can only split at segment boundaries, so a chunk
      // made of a single (or otherwise unsplittable) segment can still
      // exceed maxChunkSize after Step 2. Fall back to hard character-level
      // splitting here so the limit is never silently exceeded — this is
      // automatic whenever maxChunkSize is set, not a separate opt-in.
      for (const slice of splitter(chunkText, maxChunkSize)) {
        const sliceEmbedding = await embed(slice);
        yield [slice, sliceEmbedding];
      }
    } else {
      const chunkEmbedding = await embed(chunkText);
      yield [chunkText, chunkEmbedding];
    }
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
 * @param {number} [options.split=0] - Maximum segment length in characters; longer segments are hard-split.
 * @param {SplitMode} [options.splitMode="sentence"] - How to segment the text before embedding.
 * @param {number} [options.zScoreThreshold=2] - Convenience threshold for the default "SD" method.
 * @param {DropoffMethod} [options.method="SD"] - Boundary detection method.
 * @param {MethodOptions} [options.methodOptions={}] - Options for the chosen method.
 * @param {number} [options.overlap=0] - Number of trailing segments from the previous chunk to prepend to the next.
 * @param {number} [options.maxChunkSize=0] - Maximum chunk length in characters (0 disables).
 * @param {number} [options.minChunkSize=0] - Minimum chunk length in characters (0 disables).
 * @returns {Chunker}
 */
export const createSemanticChunker = ({
  embed = nullEmbed,
  split = 0,
  splitMode = "sentence",
  zScoreThreshold = 2,
  method = "SD",
  methodOptions = {},
  overlap = 0,
  maxChunkSize = 0,
  minChunkSize = 0,
} = {}) => {
  const resolvedOptions =
    method === "SD" ? { zScoreThreshold, ...methodOptions } : methodOptions;
  const sentenceChunker = createSentenceChunker({ embed, split, splitMode });
  return async function* (/** @type {string} */ text) {
    const newCorpus = [];
    // First Pass: Chunk into sentences
    for await (const chunk of sentenceChunker(text)) {
      newCorpus.push(chunk);
    }
    // Second Pass: Chunk into semantically similar groups
    for await (const chunk of createChunker(newCorpus, embed, {
      method,
      methodOptions: resolvedOptions,
      overlap,
      maxChunkSize,
      minChunkSize,
    })) {
      yield chunk;
    }
  };
};

export default createSemanticChunker;
