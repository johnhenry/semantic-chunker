# Changelog

## [Unreleased]

### Added

- `examples/` directory with four numbered, self-asserting examples
  (strategies compared, dropoff-method comparison, size limits & overlap,
  env-gated xenova run) plus `example:NN` / `examples` npm scripts and a CI
  smoke step for the offline ones
- `CHANGELOG.md` (history previously lived inline in the readme)
- Readme link to the documentation site section at
  [opensource.johnhenry.me/semantic-chunker](https://opensource.johnhenry.me/semantic-chunker/)

## [0.0.0] - 2026-08-25

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
