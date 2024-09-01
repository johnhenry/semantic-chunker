/**
 * Embeds the given text using the Ollama library.
 * @param {string} text - The text to be embedded.
 * @returns {Promise<Array<number>>} - A promise that resolves to an array of numbers representing the embedding.
 */
import { Ollama } from "ollama";
const MODEL_NAME = "nomic-embed-text:latest";
const ollama = new Ollama({
  host: "http://localhost:11434",
});
export const embed = async (prompt) => {
  const { embedding } = await ollama.embeddings({
    model: MODEL_NAME,
    prompt,
  });
  return embedding;
};

export default embed;
