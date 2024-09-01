import { pipeline, env } from "@xenova/transformers";
env.HF_ACCESS_TOKEN = process.env.HF_ACCESS_TOKEN;
const instance = await pipeline("feature-extraction", "Supabase/gte-small");
export const embed = async (text) => {
  const { data } = await instance(text);
  return Array.from(data);
};
export default embed;
