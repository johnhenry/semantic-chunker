import type { Chunker } from "../types/types";
import { nullEmbed } from "./utility/null-embed";
export const createDefaultChunker = ({
  embed = nullEmbed,
}: {
  embed?: any;
} = {}): Chunker => {
  return async function* (text: string) {
    yield [text, embed(text)];
  };
};
export default createDefaultChunker;
