import type { Chunker, EmbedFunction } from "../types/types";
import compromise from "compromise";
import splitter from "./utility/splitter";
// Iterator that chunks senteneces into a stream of strings with maximum length

export const createSentenceChunker = ({
  embed,
  split = 0,
}: {
  embed?: EmbedFunction;
  split?: number;
} = {}): Chunker => {
  return async function* (text: string) {
    const doc = compromise(text);
    const sentences = doc.sentences().out("array");
    if (split) {
      for (const sentence of sentences) {
        for await (const chunk of splitter(sentence, split)) {
          yield [chunk, await embed!(chunk)];
        }
      }
    } else {
      for (const sentence of sentences) {
        yield sentence;
      }
    }
  };
};

export default createSentenceChunker;
