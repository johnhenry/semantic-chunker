# Agent playbook

`@johnhenry/semantic-chunker` -- divides text into semantically meaningful
chunks using a BYOE (bring-your-own-embedder) approach: segment, embed,
detect boundaries. Single package, Node >= 26, `node --test`, ships source
(no build step; `types/*.d.ts` are hand-written, not generated). Two of its
adapters (`embed/xenova`, `embed/ollama`) and the `"Agentic"` detection
method depend on optional peer dependencies loaded lazily, so most of the
library must keep working with none of them installed.

`CLAUDE.md` in this directory is a symlink to this file.

## The verification loop (before every push)

1. `npm test` -- `node --test test/unit/*.test.mjs`. Offline: no network, no
   model downloads.
2. `npm run typecheck` -- `tsc` over the JSDoc + `types/*.d.ts`.
3. `npm run examples` -- runs every numbered example; `04-xenova-...` only
   runs its real-model assertions when `RUN_XENOVA_EXAMPLE=1` is set (it
   downloads a model on first run), and is skipped otherwise, not failed.
4. `npm run test:integration` -- requires a Hugging Face access token
   (`HF_ACCESS_TOKEN` in `.env.local`) and a local Ollama server with
   `nomic-embed-text` pulled. Not part of the default loop; run it before a
   release that touches either adapter.
5. A genuinely fresh clone:
   `git clone . /tmp/semantic-chunker-verifyN && cd $_ && npm ci && npm test`.
   Catches missing `files` entries and undeclared deps.
6. Commit, push, close the issue with a comment naming the commit SHA.

CI (`.github/workflows/ci.yml`) runs install, `npm test`, typecheck, and the
offline examples as a smoke step; match that order locally.

## Repo-specific gotchas

- **`@xenova/transformers` (v2) and `@huggingface/transformers` (v3) share
  onnxruntime bindings that conflict in one process.** Once v3 has run
  inference, subsequent v2 inference hangs forever. Never combine the
  `"Agentic"` detection method (v3) with the bundled `embed/xenova` adapter
  (v2) in the same process, including in examples and tests -- use a non-onnx
  embedder (or `@huggingface/transformers`-backed one) alongside `"Agentic"`.
- **Detection methods are a `switch`, not a registry.** Adding one means a
  new function in `src/utility/find-significant-dropoffs.mjs`, one new
  `case` in `src/utility/dropoff-chooser.mjs`, and a `DropoffMethod` union
  entry in `types/types.d.ts` -- see the README's "Adding a new detection
  method" section before assuming there's a plugin file to drop into.
- **`maxChunkSize` enforcement is two-stage.** `enforceChunkSize` only splits
  at existing segment boundaries; a single oversized segment used to pass
  through unsplit (#4). `createChunker` now hard-splits via `splitter.mjs`
  whenever `maxChunkSize` is set, and that splitter shifts split points off
  UTF-16 surrogate-pair boundaries (#5) -- don't reintroduce a raw
  `slice(0, n)` character split without that guard.
- **MAD-family methods need a `mad === 0` guard.** `"MAD"` and `"Hampel"`
  divide by the median absolute deviation; an exact-zero MAD (common on
  short or repetitive input) previously flagged any nonzero deviation,
  including float noise, as significant (#6). `"ModifiedZScore"` already had
  the `|| 1` guard others were missing -- copy it, don't reinvent it, for any
  new MAD-based method.

## Definition of done

A change is done when all of the following hold, not just when tests pass:
- A regression test exists for any bug fixed (see `test/unit/{chunkers,dropoffs,utilities}.test.mjs`
  for the shape).
- Anything the feature does **not** do is stated in the README, not only in
  an issue comment.
- `CHANGELOG.md` has an entry citing the commit/PR.
- If a detection method's behavior changes, `examples/02-dropoff-methods-disagree-about-boundaries.mjs`'s
  assertions are re-checked -- they assume specific (previously buggy, now
  fixed) threshold behavior for at least one method.

## Non-goals

Bundling more embedding adapters beyond `xenova`/`ollama` in the core
package is deliberately out of scope -- BYOE means the library takes any
function matching the `Embed` type; adapters exist only to save the two most
common cases from writing that function themselves.

## Releases

Bump `version` in `package.json` in a PR, add the `CHANGELOG.md` entry, merge,
then `gh release create v<version>` -- the release event triggers
`.github/workflows/publish.yml`, which is idempotent (skips if the version is
already on npm).
