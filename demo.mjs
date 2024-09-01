import { readFile } from "fs/promises";
import { embed as embedXenova } from "./embed/xenova.mjs";
import { embed as embedOllama } from "./embed/ollama.mjs";
import { semantic, sentence, full } from "./index.mjs";
const DOC_PIGS = await readFile("./docs/three-little-pigs.txt", "utf8");
const DOC_LBJ = await readFile("./docs/lyndon-b-johnson.txt", "utf8");
const DOC_INTERWOVEN = await readFile("./docs/interwoven.txt", "utf8");
const { log } = console;
const documents = [DOC_PIGS, DOC_LBJ, DOC_INTERWOVEN];
const embeds = [embedXenova, embedOllama];
const zScoreThresholds = [0.5, 1, 1.5, 2];
let index = 0;
console.log("# Chunking Demo");
for (const document of documents) {
  const documentName =
    document === DOC_PIGS
      ? "Three Little Pigs"
      : document === DOC_LBJ
      ? "Lyndon B. Johnson"
      : "Interwoven";
  let chunker = full();
  log(`## Document ${index++} : ${documentName}`);
  log("");
  for await (const [text] of chunker(document)) {
    log(text);
    log("---");
  }
  chunker = sentence();
  log(`### Sentences`);
  log("");
  for await (const [text] of chunker(document)) {
    log(` 1. ${text}`);
  }
  log("");
  log(`### Semantic Chunks`);
  for (const embed of embeds) {
    const embeddingName =
      embed === embedXenova
        ? "Xenova Transformers + Supabase/gte-small"
        : "Ollama + nomic";
    log(`#### Embedding Method: ${embeddingName}`);
    for (const zScoreThreshold of zScoreThresholds) {
      const chunker = semantic({ embed, zScoreThreshold });
      log(` - Z-Score Threshold: ${zScoreThreshold}`);
      log("");
      for await (const [text] of chunker(document)) {
        log("```");
        log(text);
        log("```");
      }
      log("");
    }
  }
}
