# Semantic Chunker

Semantic Chunker is a versatile library for dividing text into semantically meaningful chunks. It employs a BYOE (Bring Your Own Embedder) approach, allowing users to provide their own embedding function that maps text to a vector space.

## Table of Contents

- [Semantic Chunker](#semantic-chunker)
  - [Table of Contents](#table-of-contents)
  - [Installation](#installation)
  - [Features](#features)
  - [Understanding Semantic Chunking](#understanding-semantic-chunking)
  - [Getting Started](#getting-started)
  - [Usage](#usage)
    - [Semantic Chunker](#semantic-chunker-1)
    - [Other Chunkers](#other-chunkers)
      - [Sentence Chunker](#sentence-chunker)
      - [Full Chunker](#full-chunker)
  - [API](#api)
    - [`semantic(options)`](#semanticoptions)
    - [`sentence(options)`](#sentenceoptions)
    - [`full(options)`](#fulloptions)
  - [Embedding Functions](#embedding-functions)
    - [Example: Local Embedding](#example-local-embedding)
    - [Example: External API Call](#example-external-api-call)
  - [How-to Guides](#how-to-guides)
    - [How to Use a Custom Embedding Function](#how-to-use-a-custom-embedding-function)
    - [How to Adjust Chunk Size](#how-to-adjust-chunk-size)
  - [Demo](#demo)
  - [Contributing](#contributing)
  - [Changelog](#changelog)
    - [\[0.0.3\]](#003)
    - [\[0.0.2\]](#002)
    - [\[0.0.1\]](#001)
    - [\[0.0.0\]](#000)
      - [Added](#added)
  - [License](#license)

## Installation

To install Semantic Chunker, use npm:

```bash
npm install semantic-chunker
```

## Features

- Flexible chunking based on semantic meaning
- Support for custom embedding functions
- Multiple chunking strategies: semantic, sentence-based, and full
- Adjustable parameters for fine-tuning chunk sizes and thresholds

## Understanding Semantic Chunking

Semantic chunking is a technique used to divide text into meaningful segments based on their semantic content. Unlike simple methods that split text based on character or word count, semantic chunking aims to keep related ideas together and separate distinct concepts.

The importance of semantic chunking in natural language processing and text analysis includes:

1. Preserving context within chunks
2. Identifying natural boundaries between ideas
3. Facilitating more accurate analysis of document structure
4. Improving the performance of downstream NLP tasks

Semantic Chunker uses a two-step process:

1. **Embedding**: Each piece of text is converted into a vector representation (embedding) that captures its semantic meaning using the provided embedding function.
2. **Chunking**: The chunker analyzes the similarity between adjacent text segments using their embeddings. When there's a significant drop in similarity (determined by the `zScoreThreshold`), it marks a chunk boundary.

## Getting Started

Here's a quick tutorial to get you started with Semantic Chunker:

1. Install Semantic Chunker:

```bash
npm install semantic-chunker
```

2. Create a simple script (e.g., `semantic_chunker_demo.mjs`):

```javascript
import semantic from "semantic-chunker";

// Simple embedding function (for demonstration purposes)
function simpleEmbed(text) {
  return Promise.resolve(Array.from({ length: 10 }, () => Math.random()));
}

const text = `Semantic Chunker is a powerful tool for text analysis. 
It breaks down text into meaningful segments. 
This helps in understanding the structure and content of documents.`;

const chunker = semantic({ embed: simpleEmbed, zScoreThreshold: 1 });

async function chunkText() {
  for await (const [chunk, embedding] of chunker(text)) {
    console.log("Chunk:", chunk);
    console.log("Embedding:", embedding);
    console.log("---");
  }
}

chunkText();
```

3. Run the script:

```bash
node semantic_chunker_demo.mjs
```

You should see output showing the chunks of text along with their embeddings.

## Usage

### Semantic Chunker

The main chunker that divides text based on semantic meaning:

```javascript
import semantic from "semantic-chunker";

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
import { sentence } from "semantic-chunker";

const embed = // ... your embedding function
const chunker = sentence({ embed });

// Usage same as semantic chunker
```

#### Full Chunker

Returns the entire document as a single chunk:

```javascript
import { full } from "semantic-chunker";

const embed = // ... your embedding function
const chunker = full({ embed });

// Usage same as semantic chunker
```

## API

### `semantic(options)`

Creates a semantic chunker.

- Parameters:
  - `options` (Object):
    - `embed` (Function): Takes a string and returns a Promise resolving to a vector. Required.
    - `zScoreThreshold` (Number): Determines the threshold for creating new chunks. Default: 2.
    - `split` (Number): Force a split after this many characters. Optional.
- Returns: (AsyncGenerator): Yields `[chunk, embedding]` pairs.

### `sentence(options)`

Creates a sentence chunker.

- Parameters:
  - `options` (Object):
    - `embed` (Function): Takes a string and returns a Promise resolving to a vector. Required.
    - `split` (Number): Force a split after this many characters. Optional.
- Returns: (AsyncGenerator): Yields `[chunk, embedding]` pairs.

### `full(options)`

Creates a full chunker that returns the entire document as a single chunk.

- Parameters:
  - `options` (Object):
    - `embed` (Function): Takes a string and returns a Promise resolving to a vector. Required.
    - `split` (Number): Force a split after this many characters. Optional.
- Returns: (AsyncGenerator): Yields a single `[chunk, embedding]` pair.

## Embedding Functions

For better or for worse, you'll need to supply your own embedding function with the following signature:

```typescript
type Embed = (text: string) => Promise<number[]>;
```

The flexibility of bringing your own embedder (BYOE) allows you to:

1. Use domain-specific embedding models that may perform better for your particular use case.
2. Leverage the latest embedding techniques without requiring updates to the Semantic Chunker library itself.
3. Control the trade-off between embedding quality and computational resources.

We provide two examples that should cover most use cases:

### Example: Local Embedding

In `/embed/xenova.mjs` we provide an example where we create an embedding function using a local transformer model.

For this example to work, in addition to the [`@xenova/transformers` npm package](https://www.npmjs.com/package/@xenova/transformers),
you will need to obtain a [read-access token from Hugging Face](https://huggingface.co/settings/tokens) and set it to the `HF_ACCESS_TOKEN` environment variable.

```bash
export HF_ACCESS_TOKEN=<your_access_token>
```

Upon first run, it will take a while to download the model [`Supabase/gte-small` model](https://huggingface.co/Supabase/gte-small), but subsequent runs will be much faster.

### Example: External API Call

In `/embed/ollama.mjs` there is an example where we create an embedding function using an external API call.

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
import semantic from "semantic-chunker";

const chunker = semantic({ embed: customEmbed });

// Use the chunker as before
for await (const [chunk, embedding] of chunker(yourText)) {
  // Process your chunks
}
```

### How to Adjust Chunk Size

You can adjust the chunk size by modifying the `zScoreThreshold`:

1. For smaller chunks (more granular):

```javascript
const chunker = semantic({ embed: yourEmbedFunction, zScoreThreshold: 0.5 });
```

2. For larger chunks:

```javascript
const chunker = semantic({ embed: yourEmbedFunction, zScoreThreshold: 2.5 });
```

Experiment with different values to find the optimal threshold for your specific use case.

## Demo

Run a demo with the following command:

```bash
node --run demo
```

Results in [`./docs/demo-results.md`](./docs/demo-results.md).

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Changelog

### [0.0.3]

- Improve documentation and examples

### [0.0.2]

- Demo fixed minor issues with demo and docs

### [0.0.1]

- Demo is more robust and outputs markdown
- Fix documentation for `options.split`
- Add options.split to ful chunker

### [0.0.0]

#### Added

- Initial release of the semantic-chunker package
- Semantic chunker for semantic text division
- Sentence chunker for sentence-level text division
- Full chunker for processing entire documents
- README with usage examples and API documentation
- Basic test suite

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
