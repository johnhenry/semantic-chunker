import type { EmbedFunction } from "./types.js";

export interface XenovaOptions {
  /** Model id to load. Defaults to `"Supabase/gte-small"`. */
  model?: string;
  /**
   * An already-imported `pipeline` function, or the whole imported module,
   * from `@huggingface/transformers` or `@xenova/transformers`. Required --
   * this module never imports a transformers package itself.
   */
  transformers: any;
  /**
   * Optional Hugging Face access token, applied via
   * `transformers.env.HF_ACCESS_TOKEN` when `transformers` is the whole
   * imported module.
   */
  accessToken?: string;
}

/**
 * Factory: build an embed function backed by a local transformer model.
 * Does no work until the returned function is invoked.
 */
export function xenova(options: XenovaOptions): EmbedFunction;

/**
 * Node-only convenience: lazily imports `@xenova/transformers` and the
 * default model on first call. Not for use in a browser build -- use
 * `xenova` there and supply your own `transformers`.
 */
export const embed: EmbedFunction;
export default embed;
