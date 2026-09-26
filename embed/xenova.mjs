/**
 * Embedding adapter for a local transformer feature-extraction pipeline,
 * usable in Node and in the browser.
 *
 * `xenova(options)` is a factory. It does no work at import time -- no
 * network access, no `process` access, no top-level await -- and none at
 * call time either beyond capturing options. Only the embed function it
 * *returns* touches the network or reads `process`, and only the first
 * time it's invoked (the loaded pipeline is then cached and reused).
 *
 * This module never imports a transformers package itself: bare specifiers
 * like `@xenova/transformers` or `@huggingface/transformers` resolve via
 * Node's `node_modules` algorithm, which bundlers and browsers don't
 * necessarily replicate. Instead, `xenova()` takes an already-imported
 * `pipeline` function (or the whole imported module) as a parameter, so
 * the caller -- who knows their own bundler/CDN setup -- supplies the
 * transformers library themselves.
 *
 * The named/default `embed` export is a Node-only convenience that
 * reproduces the original "just import and go" ergonomics: it lazily
 * `import()`s `@xenova/transformers` and the default `Supabase/gte-small`
 * model the first time it's called (matching this adapter's original,
 * unchanged dependency -- see the README warning about mixing this v2
 * onnxruntime with the v3 one used by `@huggingface/transformers`/the
 * `"Agentic"` method). Do not use `embed` in a browser build -- use
 * `xenova` there and supply your own `transformers`.
 *
 * @module embed/xenova
 */

const DEFAULT_MODEL = "Supabase/gte-small";

/**
 * @typedef {(task: any, model: any, ...rest: any[]) => Promise<any>} PipelineFn
 */

/**
 * Build an embed function backed by a local transformer model.
 *
 * @param {object} [options]
 * @param {string} [options.model] - Model id to load. Defaults to
 *   `"Supabase/gte-small"`.
 * @param {any} options.transformers -
 *   An already-imported `pipeline` function, e.g.
 *   `import { pipeline } from "@huggingface/transformers"`, or the whole
 *   imported module (`import * as transformers from
 *   "@huggingface/transformers"`), from `@huggingface/transformers` or
 *   `@xenova/transformers`.
 * @param {string} [options.accessToken] - Optional Hugging Face access
 *   token. Only applied when `transformers` is the whole module (so its
 *   `env` export is reachable) -- set via `transformers.env.HF_ACCESS_TOKEN`.
 * @returns {(text: string) => Promise<number[]>} An embed function matching
 *   the library's `EmbedFunction` signature.
 */
export const xenova = ({ model = DEFAULT_MODEL, transformers, accessToken } = /** @type {any} */ ({})) => {
  const pipelineFn =
    typeof transformers === "function" ? transformers : transformers?.pipeline;
  if (typeof pipelineFn !== "function") {
    throw new TypeError(
      'xenova({ transformers }) requires a `pipeline` function -- pass either ' +
        "the imported `pipeline` export itself, or the whole imported module, " +
        'from "@huggingface/transformers" or "@xenova/transformers".'
    );
  }

  /** @type {Promise<any>|undefined} */
  let instancePromise;
  const getInstance = () => {
    if (!instancePromise) {
      if (accessToken && transformers && typeof transformers === "object" && transformers.env) {
        transformers.env.HF_ACCESS_TOKEN = accessToken;
      }
      instancePromise = pipelineFn("feature-extraction", model);
    }
    return instancePromise;
  };

  return async (/** @type {string} */ text) => {
    const instance = await getInstance();
    const { data } = await instance(text, { pooling: "mean", normalize: true });
    return Array.from(data);
  };
};

/** @type {Promise<(text: string) => Promise<number[]>>|undefined} */
let nodeEmbedderPromise;

/**
 * Node-only convenience embedder: same call shape as the pre-factory
 * adapter, no setup required. Lazily imports `@xenova/transformers` and
 * the default `Supabase/gte-small` model on first call, reading
 * `process.env.HF_ACCESS_TOKEN` if present. Does nothing at import time.
 *
 * Not for use in a browser build -- import `xenova` and supply your own
 * already-imported `transformers` there instead.
 *
 * @param {string} text
 * @returns {Promise<number[]>}
 */
export const embed = async (text) => {
  if (!nodeEmbedderPromise) {
    nodeEmbedderPromise = (async () => {
      const transformers = await import("@xenova/transformers");
      const accessToken =
        typeof process !== "undefined" && process.env
          ? process.env.HF_ACCESS_TOKEN
          : undefined;
      return xenova({ transformers, accessToken });
    })();
  }
  const embedder = await nodeEmbedderPromise;
  return embedder(text);
};

export default embed;
