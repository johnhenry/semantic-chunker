import { readFile } from "fs/promises";
import { embed as embedXenova } from "./embed/xenova.mjs";
import { embed as embedOllama } from "./embed/ollama.mjs";
import { semantic, sentence } from "./index.mjs";
const DOC_PIGS = await readFile("./docs/three-little-pigs.txt", "utf8");
const DOC_LBJ = await readFile("./docs/lyndon-b-johnson.txt", "utf8");
const DOC_INTERWOVEN = await readFile("./docs/interwoven.txt", "utf8");

for (const embed of [embedXenova, embedOllama]) {
  for (const zScoreThreshold of [0.5, 1, 1.5, 2]) {
    const chunker = semantic({ embed, zScoreThreshold: 1 });
    for (const document of [DOC_PIGS, DOC_LBJ, DOC_INTERWOVEN]) {
      for await (const [text, embedding] of chunker(document)) {
        console.log(text);
        console.log("-".repeat(64));
      }
    }
  }
  let chunker = sentence({ embed });
  for (const document of [DOC_PIGS, DOC_LBJ, DOC_INTERWOVEN]) {
    for await (const [text, embedding] of chunker(document)) {
      console.log(text);
      console.log("-".repeat(64));
    }
  }
  chunker = sentence({ embed });
  for (const document of [DOC_PIGS, DOC_LBJ, DOC_INTERWOVEN]) {
    for await (const [text, embedding] of chunker(document)) {
      console.log(text);
      console.log("-".repeat(64));
    }
  }
}
