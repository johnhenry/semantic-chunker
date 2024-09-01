import { readFile } from "fs/promises";
import { embed } from "./embed/xenova.mjs";
// import { embed } from "./embed/ollama.mjs";
import semantic from "./index.mjs";
const document = await readFile("./docs/interwoven.txt", "utf8");

let chunker = semantic({ embed, zScoreThreshold: 1 });
for await (const [text, embedding] of chunker(document)) {
  console.log(text);
  console.log("-".repeat(64));
}
