import { readFile } from "node:fs";
import { pipeline } from "@xenova/transformers";
import semantic from "./src/index";

const instance = await pipeline("feature-extraction", "Supabase/gte-small");
const embed = async (text) => {
  const { data } = await instance(text);
  return Array.from(data);
};
const document = await readFile("three-little-pigs.txt", "utf8");
const chunker = semantic({ embed });
for await (const [text, embedding] of chunker(document)) {
  console.log({ text });
}
