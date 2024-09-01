# Semantic Chunker

Semantic chunker is a library for chunking text into semantically meaningful chunks.

It uses a BYOE (Bring Your Own Embedder) approach, where the user provides an embedding function that maps text to a vector space.

## Usage

```javascript
import semantic from "semantic-chunker";
const embed = //... embed function
const document = // ... text
const chunker = await semantic({ embed, split, zScoreThreshold });
for(const [text, embedding] of chunker(document)){
    console.log({text, embedding});
}
```

## Other included chunkers

### Full Chunker

```javascript
import { full } from "semantic-chunker";
const chunker = await full({ embed });
```

### Sentence Chunker

```javascript
import { sentence } from "semantic-chunker";
const chunker = await sentence({ embed, split });
```
