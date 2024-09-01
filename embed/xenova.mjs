/**
 * This module exports a function named `embed` that takes a `text` parameter and returns an array of embedded features.
 * The function uses the `pipeline` function from the `@xenova/transformers` package to perform feature extraction on the given `text`.
 * It sets the `HF_ACCESS_TOKEN` environment variable to the value of the `HF_ACCESS_TOKEN` environment variable from the process.
 * The `pipeline` function is called with the arguments "feature-extraction" and "Supabase/gte-small".
 * The result of the `pipeline` function is an instance that can be used to extract features from text.
 * The `embed` function then calls the `instance` with the given `text` and returns an array of features.
 */
import { pipeline, env } from "@xenova/transformers";
const MODEL_NAME = "Supabase/gte-small";
env.HF_ACCESS_TOKEN = process.env.HF_ACCESS_TOKEN;
const instance = await pipeline("feature-extraction", MODEL_NAME);
export const embed = async (text) => {
  const { data } = await instance(text);
  return Array.from(data);
};
export default embed;
