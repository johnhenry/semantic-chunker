import { Ollama } from "ollama";

const ollama = new Ollama({
  host: "http://localhost:11434",
});
export const embed = async (text) => {
  const { embedding } = await ollama.embeddings({
    model: "nomic-embed-text:latest",
    prompt: text,
  });
  return embedding;
};

export default embed;
