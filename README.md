# Semantic Chunker

> Previously published as `semantic-chunker` (last release 0.0.4, now deprecated).
> Renamed to `@johnhenry/semantic-chunker` and restarted at 0.0.0 on import into
> the @johnhenry family — a new address and era, not a maturity signal.

[![npm version](https://img.shields.io/npm/v/%40johnhenry%2Fsemantic-chunker.svg)](https://www.npmjs.com/package/@johnhenry/semantic-chunker)
[![CI](https://github.com/johnhenry/semantic-chunker/actions/workflows/ci.yml/badge.svg)](https://github.com/johnhenry/semantic-chunker/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/%40johnhenry%2Fsemantic-chunker.svg)](LICENSE)

Semantic Chunker is a versatile library for dividing text into semantically meaningful chunks. It employs a BYOE (Bring Your Own Embedder) approach, allowing users to provide their own embedding function that maps text to a vector space.

Full documentation: [opensource.johnhenry.me/semantic-chunker](https://opensource.johnhenry.me/semantic-chunker/)

## Contents

- [Installation](#installation)
- [Features](#features)
- [Understanding Semantic Chunking](#understanding-semantic-chunking)
- [Getting Started](#getting-started)
- [Usage](#usage)
  - [Semantic Chunker](#semantic-chunker-1)
  - [Other Chunkers](#other-chunkers)
- [API](#api)
  - [`semantic(options)`](#semanticoptions)
  - [`sentence(options)`](#sentenceoptions)
  - [`full(options)`](#fulloptions)
  - [Boundary Detection Methods](#boundary-detection-methods)
- [Embedding Functions](#embedding-functions)
  - [Bundled Adapters](#bundled-adapters)
  - [Example: Local Embedding](#example-local-embedding)
  - [Example: External API Call](#example-external-api-call)
- [How-to Guides](#how-to-guides)
- [Adding a new detection method](#adding-a-new-detection-method)
- [Examples](#examples)
- [Demo](#demo)
- [Testing](#testing)
- [Contributing](#contributing)
- [Changelog](#changelog)
- [License](#license)

## Installation

To install Semantic Chunker, use npm:

```bash
npm install @johnhenry/semantic-chunker
```

> [!IMPORTANT]
> Semantic Chunker requires **Node.js >= 26.0.0**.

## Features

- Flexible chunking based on semantic meaning
- Support for custom embedding functions (BYOE)
- Multiple chunking strategies: semantic, sentence-based, and full
- Eleven boundary detection methods, from z-scores to change-point analysis
- Sentence, paragraph, or markdown-aware segmentation
- Chunk overlap and minimum/maximum chunk-size enforcement

## Understanding Semantic Chunking

Semantic chunking is a technique used to divide text into meaningful segments based on their semantic content. Unlike simple methods that split text based on character or word count, semantic chunking aims to keep related ideas together and separate distinct concepts.

The importance of semantic chunking in natural language processing and text analysis includes:

1. Preserving context within chunks
2. Identifying natural boundaries between ideas
3. Facilitating more accurate analysis of document structure
4. Improving the performance of downstream NLP tasks (retrieval, RAG, summarization)

Semantic Chunker uses a three-step process:

```mermaid
flowchart LR
    A[Text] --> B[Segment<br/>sentences / paragraphs / markdown]
    B --> C[Embed<br/>your embedding function]
    C --> D[Detect boundaries<br/>similarity dropoffs]
    D --> E[Chunks]
```

1. **Segmentation**: The text is split into base units — sentences by default, or paragraphs / markdown blocks via `splitMode`.
2. **Embedding**: Each segment is converted into a vector representation (embedding) that captures its semantic meaning using the provided embedding function.
3. **Boundary detection**: The chunker measures the cosine similarity between adjacent segments. Where similarity drops significantly — as judged by the configured [detection method](#boundary-detection-methods) — it marks a chunk boundary and regroups the segments into chunks.

## Getting Started

Here's a quick tutorial to get you started with Semantic Chunker:

1. Install Semantic Chunker:

```bash
npm install @johnhenry/semantic-chunker
```

2. Create a simple script (e.g., `semantic_chunker_demo.mjs`):

```javascript
import semantic from "@johnhenry/semantic-chunker";

// Simple embedding function (for demonstration purposes)
function simpleEmbed(text) {
  return Promise.resolve(Array.from({ length: 10 }, () => Math.random()));
}

const text = `Semantic Chunker is a powerful tool for text analysis. 
It breaks down text into meaningful segments. 
This helps in understanding the structure and content of documents.`;

const chunker = semantic({ embed: simpleEmbed, zScoreThreshold: 1 });

for await (const [chunk, embedding] of chunker(text)) {
  console.log("Chunk:", chunk);
  console.log("Embedding:", embedding);
  console.log("---");
}
```

3. Run the script:

```bash
node semantic_chunker_demo.mjs
```

You should see output showing the chunks of text along with their embeddings.

> [!TIP]
> A random embedder produces random chunk boundaries — it's only useful for seeing the API shape. Plug in a real embedding model (see [Embedding Functions](#embedding-functions)) for meaningful results.

## Usage

### Semantic Chunker

The main chunker that divides text based on semantic meaning:

```javascript
import semantic from "@johnhenry/semantic-chunker";

const embed = // ... your embedding function
const document = // ... your input text

const chunker = semantic({ embed, zScoreThreshold: 1 });

for await (const [text, embedding] of chunker(document)) {
  console.log({ text, embedding });
}
```

### Other Chunkers

#### Sentence Chunker

Divides the text into sentence-level chunks:

```javascript
import { sentence } from "@johnhenry/semantic-chunker";

const embed = // ... your embedding function
const chunker = sentence({ embed });

// Usage same as semantic chunker
```

#### Full Chunker

Returns the entire document as a single chunk:

```javascript
import { full } from "@johnhenry/semantic-chunker";

const embed = // ... your embedding function
const chunker = full({ embed });

// Usage same as semantic chunker
```

## API

### `semantic(options)`

Creates a semantic chunker.

- Parameters:
  - `options` (Object):
    - `embed` (Function): Takes a string and returns a vector (or a Promise of one). Required for meaningful results.
    - `method` (String): [Boundary detection method](#boundary-detection-methods). Default: `"SD"`.
    - `methodOptions` (Object): Options for the chosen detection method.
    - `zScoreThreshold` (Number): Convenience threshold for the default `"SD"` method. Default: `2`.
    - `split` (Number): Force a split after this many characters. Optional.
    - `splitMode` (String): `"sentence"` (default), `"paragraph"`, or `"markdown"`.
    - `overlap` (Number): Number of trailing segments from the previous chunk to prepend to the next. Default: `0`.
    - `maxChunkSize` (Number): Maximum chunk length in characters; oversized chunks are split at their weakest interior point. `0` (default) disables.
    - `minChunkSize` (Number): Minimum chunk length in characters; undersized chunks are merged into their most-similar neighbor. `0` (default) disables.
- Returns: (AsyncGenerator): Yields `[chunk, embedding]` pairs.

### `sentence(options)`

Creates a sentence chunker.

- Parameters:
  - `options` (Object):
    - `embed` (Function): Takes a string and returns a vector (or a Promise of one).
    - `split` (Number): Force a split after this many characters. Optional.
    - `splitMode` (String): `"sentence"` (default), `"paragraph"`, or `"markdown"`.
- Returns: (AsyncGenerator): Yields `[chunk, embedding]` pairs.

### `full(options)`

Creates a full chunker that returns the entire document as a single chunk.

- Parameters:
  - `options` (Object):
    - `embed` (Function): Takes a string and returns a vector (or a Promise of one).
    - `split` (Number): Force a split after this many characters. Optional.
- Returns: (AsyncGenerator): Yields a single `[chunk, embedding]` pair (or several when `split` is set).

### Boundary Detection Methods

Pass `method` (and optionally `methodOptions`) to `semantic()` to choose how significant similarity dropoffs are identified:

```javascript
const chunker = semantic({
  embed,
  method: "MAD",
  methodOptions: { madMultiplier: 3 },
});
```

| Method             | Strategy                                             | `methodOptions`                                    |
| ------------------ | ---------------------------------------------------- | -------------------------------------------------- |
| `"SD"` (default)   | Z-score against mean/standard deviation              | `zScoreThreshold` (2)                               |
| `"IQ"`             | Interquartile-range outliers                         | `iqrMultiplier` (1.5)                               |
| `"MAD"`            | Median absolute deviation outliers                   | `madMultiplier` (3)                                 |
| `"PercentChange"`  | Percentage drop versus the previous dropoff          | `percentThreshold` (20)                             |
| `"MA"`             | Deviation below a moving average                     | `windowSize` (3), `deviationThreshold` (1.5)        |
| `"LM"`             | Local minima detection                               | `sensitivity` (0.2)                                 |
| `"CUSUM"`          | Cumulative sum of deviations from the mean           | `threshold` (5)                                     |
| `"ChangePoint"`    | Single change point maximizing mean difference       | —                                                   |
| `"Hampel"`         | Hampel filter (windowed median + MAD)                | `windowSize` (7), `nSigma` (3)                      |
| `"ModifiedZScore"` | Modified z-score (median/MAD based)                  | `threshold` (3.5)                                   |
| `"Agentic"`        | Re-embeds segment text with a transformers.js model  | `model`, `threshold` (0.5), `windowSize` (2)        |

> [!NOTE]
> The `"Agentic"` method requires the optional peer dependency [`@huggingface/transformers`](https://www.npmjs.com/package/@huggingface/transformers) (`npm install @huggingface/transformers`). It is loaded lazily, so the rest of the library works without it.

> [!WARNING]
> Do not combine the `"Agentic"` method with the `semantic-chunker/embed/xenova` adapter's Node-only `embed` convenience, or with `xenova({ transformers })` pointed at `@xenova/transformers`. The onnxruntime bindings shipped by `@xenova/transformers` (v2) and `@huggingface/transformers` (v3) conflict in the same process: once v3 has run inference, subsequent v2 inference hangs forever. When using `"Agentic"`, build your embedding function — and, if you also want the `xenova` adapter, call `xenova({ transformers })` — on `@huggingface/transformers` too (or use a non-onnx embedder such as Ollama).

The raw detection functions are also exported for direct use:

```javascript
import { dropoffMethods } from "@johnhenry/semantic-chunker";

const boundaries = dropoffMethods.findSignificantDropoffsIQ(dropoffs, 1.5);
```

## Embedding Functions

For better or for worse, you'll need to supply your own embedding function with the following signature:

```typescript
type Embed = (text: string) => number[] | Promise<number[]>;
```

The flexibility of bringing your own embedder (BYOE) allows you to:

1. Use domain-specific embedding models that may perform better for your particular use case.
2. Leverage the latest embedding techniques without requiring updates to the Semantic Chunker library itself.
3. Control the trade-off between embedding quality and computational resources.

### Bundled Adapters

Two ready-made adapters ship with the package as subpath imports. Each requires its optional peer dependency:

```javascript
import { embed } from "@johnhenry/semantic-chunker/embed/xenova"; // Node only, needs @xenova/transformers
import { embed } from "@johnhenry/semantic-chunker/embed/ollama"; // needs ollama
```

### Example: Local Embedding

`semantic-chunker/embed/xenova` creates an embedding function using a local transformer model, via a `pipeline` function you supply. It does no work at import time — no network access, no top-level await, no `process` access — so the module itself loads fine in Node, a bundler, or a browser; only the embed function it returns touches the network, and only on first use.

```javascript
import { xenova } from "@johnhenry/semantic-chunker/embed/xenova";
import { pipeline } from "@huggingface/transformers"; // or @xenova/transformers

const embed = xenova({ model: "Supabase/gte-small", transformers: pipeline });
```

`transformers` also accepts the whole imported module (`import * as transformers from "@huggingface/transformers"`) instead of just `pipeline` — pass that form if you also want to set an `accessToken`, applied via the module's `env.HF_ACCESS_TOKEN`:

```javascript
import * as transformers from "@huggingface/transformers";

const embed = xenova({
  model: "Supabase/gte-small",
  transformers,
  accessToken: process.env.HF_ACCESS_TOKEN,
});
```

> [!NOTE]
> In a browser build, import `@huggingface/transformers` (or `@xenova/transformers`) however your bundler/CDN setup expects — a bare specifier, a URL, an import map — and pass its `pipeline` to `xenova()`. This adapter never imports a transformers package itself, so it never assumes Node-style `node_modules` resolution.

For **Node**, a zero-configuration convenience is still available — same call shape as before the adapter became a factory:

```javascript
import { embed } from "@johnhenry/semantic-chunker/embed/xenova";
```

It lazily imports [`@xenova/transformers`](https://www.npmjs.com/package/@xenova/transformers) and the [`Supabase/gte-small` model](https://huggingface.co/Supabase/gte-small) the first time `embed()` is called (not at import time), reading `HF_ACCESS_TOKEN` from the environment if you need a Hugging Face access token:

```bash
export HF_ACCESS_TOKEN=<your_access_token>
```

Upon first call, it will take a while to download the model, but subsequent calls will be much faster.

### Example: External API Call

`semantic-chunker/embed/ollama` creates an embedding function using an external API call.

For this example to work, in addition to the [`ollama` npm package](https://www.npmjs.com/package/ollama),
you will need to install and run [ollama](https://ollama.com/)
and pull the latest [`nomic-embed-text` model](https://ollama.com/library/nomic-embed-text).

## How-to Guides

### How to Use a Custom Embedding Function

1. Create your embedding function:

```javascript
async function customEmbed(text) {
  // Your embedding logic here
  // This example uses a hypothetical API
  const response = await fetch("https://your-embedding-api.com/embed", {
    method: "POST",
    body: JSON.stringify({ text }),
    headers: { "Content-Type": "application/json" },
  });
  return response.json();
}
```

2. Use your custom embedding function with Semantic Chunker:

```javascript
import semantic from "@johnhenry/semantic-chunker";

const chunker = semantic({ embed: customEmbed });

// Use the chunker as before
for await (const [chunk, embedding] of chunker(yourText)) {
  // Process your chunks
}
```

### How to Adjust Chunk Size

Tune the boundary threshold for the default `"SD"` method with `zScoreThreshold`:

1. For smaller chunks (more granular):

```javascript
const chunker = semantic({ embed: yourEmbedFunction, zScoreThreshold: 0.5 });
```

2. For larger chunks:

```javascript
const chunker = semantic({ embed: yourEmbedFunction, zScoreThreshold: 2.5 });
```

Or enforce hard limits and add context overlap:

```javascript
const chunker = semantic({
  embed: yourEmbedFunction,
  maxChunkSize: 2000, // split chunks longer than 2000 characters
  minChunkSize: 200, // merge chunks shorter than 200 characters
  overlap: 1, // repeat the last segment of each chunk in the next one
});
```

Experiment with different values to find the optimal configuration for your specific use case.

### How to Choose a Detection Method

- Start with the default `"SD"`; it works well when dropoffs are roughly normally distributed.
- If a few extreme outliers skew the results, try the robust `"MAD"` or `"ModifiedZScore"`.
- For long documents with gradual topic drift, try `"MA"` (moving average) or `"CUSUM"`.
- To find one dominant topic shift, use `"ChangePoint"`.
- `"Agentic"` re-embeds segment text with a local transformers.js model and is the most expensive option.

### How to Chunk Markdown

Use `splitMode: "markdown"` so headings and fenced code blocks are respected (code blocks are never split in half):

```javascript
const chunker = semantic({
  embed: yourEmbedFunction,
  splitMode: "markdown",
});
```

Use `splitMode: "paragraph"` for plain text organized into paragraphs separated by blank lines.

## Adding a new detection method

The eleven existing methods (`"SD"` through `"Agentic"`, see
[Boundary Detection Methods](#boundary-detection-methods)) are the best real
worked example already in this package's own history — each one landed the
same way, most recently in the `0.0.3` unscoped release (see
`CHANGELOG.md`'s "History as unscoped `semantic-chunker`" section).

There is no smaller alternative to reach for first: `src/utility/dropoff-chooser.mjs`'s
`findSignificantDropoffs()` is already just a `switch` over the method name,
so adding a new one is exactly one more `case`, reusing the same `dropoffs`
array every other case already receives. The one question that decides
whether a new case is warranted at all: does the new method need real
per-call state or an external model, or is it a pure function over the
existing `dropoffs` array? If the latter, it's a new case; if it needs a
model (as `"Agentic"` does), it still needs only one case, but that case
lazy-imports its implementation instead of calling a plain function (see
below).

1. **`src/utility/find-significant-dropoffs.mjs`** — export a new
   `findSignificantDropoffsXxx(dropoffs, ...methodOptions)` function that
   returns the same shape every other method returns: an array of `dropoffs[].index`
   values, sorted ascending. Copy-paste `findSignificantDropoffsIQ`'s shape —
   compute a per-call statistic over `dropoffs`, filter, map to `.index`, sort.
2. **`src/utility/dropoff-chooser.mjs`** — add one `case "Xxx":` to the
   `switch` in `findSignificantDropoffs()`, calling the new function with
   whatever `options.*` fields it needs. This is the only dispatch point;
   there is no separate registry to update.
3. **`types/types.d.ts`** — add `"Xxx"` to the `DropoffMethod` union, and
   document any new `MethodOptions` fields the method reads.
4. **The one part that isn't boilerplate: deciding what the method
   actually measures.** Every existing method answers the same question —
   "is this dropoff big enough, relative to the others, to be a chunk
   boundary?" — with a different statistic (z-score, IQR, moving average,
   cumulative sum, ...). That choice, not the plumbing above, is what makes
   a new method worth adding instead of tuning an existing one's options.

**A method that needs an external model, not just arithmetic: `"Agentic"`.**
Unlike the other ten, `findSignificantDropoffsAgentic` lives in its own file
(`src/utility/find-significant-dropoffs.agentic.mjs`) and is lazy-imported
inside the `"Agentic"` case, because it depends on the optional peer
dependency `@huggingface/transformers` — the rest of the library must keep
working when that package isn't installed. A new model-backed method follows
this shape, not the plain-function one, whenever it has an optional peer
dependency to isolate.

**Tests.** `test/unit/dropoffs.test.mjs` runs every method against fixed,
hand-computed `dropoffs` arrays — no embedding model, no network. A new
method's test asserts the exact boundary indices it produces for at least
one case designed to distinguish it from the existing ten (otherwise the
test can't tell a real implementation from a copy-paste of `"SD"`).

Run `npm run example:02` to see the new method compared against every other
one on the same real dropoff series.

Adding a new **embedding adapter** (`embed/xenova.mjs`, `embed/ollama.mjs`)
is a different, smaller shape: one file under `embed/`, exporting a function
matching the `Embed` type (`(text) => number[] | Promise<number[]>`), added
as a new `exports` subpath and `files` entry in `package.json`, with its peer
dependency added to `peerDependencies`/`peerDependenciesMeta` as optional —
there is no switch statement to extend, since adapters are imported directly
by subpath rather than dispatched by name.

## Examples

The [`examples/`](./examples/) directory contains numbered, self-asserting
examples: the three strategies compared on the same document, the ten
statistical detection methods compared on the same dropoff series,
chunk-size limits and overlap, and an env-gated run against the real xenova
embedding adapter.

```bash
npm run example:01   # run one
npm run examples     # run them all (the xenova example skips unless RUN_XENOVA_EXAMPLE=1)
```

## Demo

Run a demo with the following command:

```bash
npm run demo
```

Results in [`./docs/demo-results.md`](./docs/demo-results.md).

## Testing

```bash
npm test              # offline unit tests (no network, no models)
npm run test:integration  # requires HF access + a local Ollama server
npm run typecheck     # TypeScript checks over JSDoc + type definitions
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Changelog

See [CHANGELOG.md](./CHANGELOG.md), which includes the history of the
package's previous life as the unscoped `semantic-chunker`.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
