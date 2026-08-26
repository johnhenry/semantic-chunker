# Examples

Runnable, self-asserting examples. Each one prints what it demonstrates and
fails loudly (non-zero exit) if the library stops behaving as described.

Run one:

```sh
npm run example:01
```

Run them all:

```sh
npm run examples
```

| Example | Demonstrates |
| --- | --- |
| [`01-strategies-split-the-same-document-differently.mjs`](./01-strategies-split-the-same-document-differently.mjs) | `full` vs `sentence` vs `semantic` on the same two-topic document, with a deterministic keyword embedder |
| [`02-dropoff-methods-disagree-about-boundaries.mjs`](./02-dropoff-methods-disagree-about-boundaries.mjs) | All ten statistical detection methods on the same dropoff spike — where they agree, where `PercentChange` lands one index late, and why `CUSUM`'s default threshold finds nothing |
| [`03-size-limits-and-overlap-reshape-chunks.mjs`](./03-size-limits-and-overlap-reshape-chunks.mjs) | `maxChunkSize` forcing splits, `minChunkSize` merging across a real topic boundary, and `overlap` repeating trailing segments |
| [`04-xenova-embeds-a-real-story-locally.mjs`](./04-xenova-embeds-a-real-story-locally.mjs) | The bundled `embed/xenova` adapter on a real document. **Env-dependent**: downloads a model on first use, so it skips unless `RUN_XENOVA_EXAMPLE=1` is set |

Examples 01–03 are deterministic and offline (no models, no network) and run
in CI. Example 04 exercises a real embedding model and is gated behind
`RUN_XENOVA_EXAMPLE=1`.
