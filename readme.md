# Semantic Chunker

Semantic Chunker is a versatile library for dividing text into semantically meaningful chunks. It employs a BYOE (Bring Your Own Embedder) approach, allowing users to provide their own embedding function that maps text to a vector space.

## Table of Contents

- [Semantic Chunker](#semantic-chunker)
  - [Table of Contents](#table-of-contents)
  - [Installation](#installation)
  - [Features](#features)
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
    - [Example: Local Example](#example-local-example)
    - [Example: External API Call](#example-external-api-call)
  - [Demo](#demo)
  - [Contributing](#contributing)
  - [Changelog](#changelog)
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

- `options.embed`: Function that takes a string and returns a vector (required)
- `options.zScoreThreshold`: Number that determines the threshold for creating new chunks (default: 1)
- `options.split`: Force a splt after this many characters (optional)

### `sentence(options)`

Creates a sentence chunker.

- `options.embed`: Function that takes a string and returns a vector (required)
- `options.split`: Force a splt after this many characters (optional)

### `full(options)`

Creates a full chunker.

- `options.embed`: Function that takes a string and returns a vector (required)
- `options.split`: Force a splt after this many characters (optional)

## Embedding Functions

For better or for worse, you'll need to supply your own embedding function with the following signature:

```typescript
type Embed = (text: string) => Promise<number[]>;
```

We provide two examples that should cover most use cases:

### Example: Local Example

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

## Demo

Run a demo with the following command:

```bash
node --run demo
```

Results in [`./docs/demo-results.md`](./docs/demo-results.md).

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Changelog

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
