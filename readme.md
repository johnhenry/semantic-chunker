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
  - [Contributing](#contributing)
  - [License](#license)

## Installation

To install Semantic Chunker, use npm:

```bash
npm install semantic-chunker
```

## Features

- Flexible chunking based on semantic meaning
- Support for custom embedding functions
- Multiple chunking strategies: semantic, and sentence-based, full
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
- `options.split`: Function to split text into initial segments (optional)

### `sentence(options)`

Creates a sentence chunker.

- `options.embed`: Function that takes a string and returns a vector (required)
- `options.split`: Function to split text into sentences (optional)

### `full(options)`

Creates a full chunker.

- `options.embed`: Function that takes a string and returns a vector (required)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
