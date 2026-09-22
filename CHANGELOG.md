# Changelog

## [Unreleased]

<!-- Deliberately not relabeled to a dated `## <version>` heading in this
     retrofit: the family CHANGELOG standard ties a dated entry to a version
     bump in the same PR (adopt-library, templates/CHANGELOG.md rule 1), and
     bumping `package.json`'s `version` is a release decision, not a
     documentation-formatting one -- out of scope for this PR. Everything
     below is already merged to `main`; only the version bump that would
     retitle this section as a dated release is outstanding. -->

### Fixed

- **Single-segment chunks that still exceeded `maxChunkSize` after
  segment-boundary splitting were returned as-is.** `enforceChunkSize` can
  only split at existing segment boundaries, so a chunk that was already one
  oversized segment had nowhere left to split. `createChunker` now falls
  back to hard character-level splitting (`splitter.mjs`) for any chunk
  still over `maxChunkSize`, automatically whenever the option is set.
  Fixed in 53282fd (#7), closes #4.
- **The hard character split could cut a UTF-16 surrogate pair in half**,
  producing invalid Unicode in the output. Split boundaries now shift
  forward by one code unit when they would land between a high and low
  surrogate. Fixed in 53282fd (#7), closes #5.
- **`"MAD"` and `"Hampel"` had no guard against `mad === 0`**, unlike
  `"ModifiedZScore"`, which already guarded it. A window with an exact-zero
  median absolute deviation flagged any nonzero deviation — including float
  noise — as significant. Both now apply the same `|| 1` guard
  `"ModifiedZScore"` already used. Fixed in 53282fd (#7), closes #6.

### Added

- `examples/` directory with four numbered, self-asserting examples
  (strategies compared, dropoff-method comparison, size limits & overlap,
  env-gated xenova run) plus `example:NN` / `examples` npm scripts and a CI
  smoke step for the offline ones. Fixed in 9042c30 (#3).
- `CHANGELOG.md` (history previously lived inline in the readme). Fixed in
  9042c30 (#3).
- Readme link to the documentation site section at
  [opensource.johnhenry.me/semantic-chunker](https://opensource.johnhenry.me/semantic-chunker/).
  Fixed in 9042c30 (#3).

### Tests

- Regression tests added for all three fixes above, across
  `test/unit/{chunkers,dropoffs,utilities}.test.mjs`; the pre-existing
  MAD/Hampel spike tests and `examples/02`'s assertions (which assumed the
  unguarded, buggy zero-bound behavior) were updated to match the fix.

## 0.0.0 -- npm scope migration (2026-08-25)

Renamed from the unscoped `semantic-chunker` (last release 0.0.4, now
deprecated) to `@johnhenry/semantic-chunker` on import into the @johnhenry
family. Same library, same API — the version line restarts at 0.0.0: a new
address and era, not a maturity signal.

---

## History as unscoped `semantic-chunker`

### [0.0.4]

- Fixed: `package.json` `exports` map lacked a `types` condition, so
  TypeScript consumers using `moduleResolution: "NodeNext"` (or `"Node16"`)
  couldn't find the shipped type declarations
  ([#1](https://github.com/johnhenry/semantic-chunker/issues/1))

### [0.0.3]

- Fixed: `MAD` detection method crashed with a `ReferenceError`; the full
  chunker yielded an unresolved Promise as the embedding; cosine similarity
  returned `NaN` for zero/empty vectors
- Added: `method`/`methodOptions` options exposing eleven boundary detection
  methods (including the new `Agentic` method)
- Added: `overlap`, `maxChunkSize`, `minChunkSize` chunk-shaping options
- Added: `splitMode` option (`sentence`, `paragraph`, `markdown`)
- Added: embed adapters as subpath exports (`embed/xenova`, `embed/ollama`)
  backed by optional peer dependencies
- Added: offline unit test suite, gated integration tests, CI, and
  TypeScript checking
- Changed: accurate type definitions; `engines.node` >= 20.6.0; slimmer npm
  package

### [0.0.2]

- Demo fixed minor issues with demo and docs

### [0.0.1]

- Demo is more robust and outputs markdown
- Fix documentation for `options.split`
- Add options.split to full chunker

### [0.0.0]

- Initial release: semantic, sentence, and full chunkers; readme with usage
  examples and API documentation; basic test suite
