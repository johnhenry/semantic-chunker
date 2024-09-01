import type {
  Chunker,
  Corpus,
  EmbeddedChunk,
  EmbedFunction,
} from "../types/types";
import createSentenceChunker from "./sentence";
import cosineSimilarity from "./utility/cosine-similarity";
import findSignificantDropoffs from "./utility/find-significant-dropoffs";

const createChunker = async function* (
  corpus: Corpus,
  embed: EmbedFunction,
  zScoreThreshold = 2
): AsyncGenerator<EmbeddedChunk> {
  // Step 1: Analyze the entire corpus to find dropoffs in similarity
  let similarityDropoffs: { index: number; dropoff: number }[] = [];
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
export const createSemanticChunker = ({
  embed,
  split = 0,
  zScoreThreshold = 2,
}: {
  embed?: EmbedFunction;
  split?: number;
  zScoreThreshold?: number;
} = {}): Chunker => {
  const sentenceChunker = createSentenceChunker({ embed, split });
  return async function* (text: string) {
    const newCorpus: Corpus = [];
    // First Pass: Chunk into sentences
    for await (const chunk of sentenceChunker(text)) {
      newCorpus.push(chunk);
    }
    // Second Pass: Chunk into semantically similar groups
    for await (const chunk of await createChunker(
      newCorpus,
      embed!,
      zScoreThreshold
    )) {
      yield chunk;
    }
  };
};
export default createSemanticChunker;
