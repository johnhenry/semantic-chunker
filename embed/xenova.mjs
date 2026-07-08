/**
 * Embedding adapter backed by a local transformer model via
 * `@xenova/transformers` (optional peer dependency).
 *
 * Uses the `Supabase/gte-small` feature-extraction model with mean pooling
 * and normalization, producing a fixed-size vector regardless of text
 * length. Set the `HF_ACCESS_TOKEN` environment variable if the model
 * requires authentication; the first run downloads the model.
 *
 * @module embed/xenova
 */
import { pipeline, env } from "@xenova/transformers";
const MODEL_NAME = "Supabase/gte-small";
/** @type {any} */ (env).HF_ACCESS_TOKEN = process.env.HF_ACCESS_TOKEN;
const instance = await pipeline("feature-extraction", MODEL_NAME);

/**
 * Embeds text into a fixed-size vector.
 *
 * @param {string} text
 * @returns {Promise<number[]>}
 */
export const embed = async (text) => {
  const { data } = await instance(text, { pooling: "mean", normalize: true });
  return Array.from(data);
};
export default embed;
