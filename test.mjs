import { test } from 'node:test';
import assert from 'node:assert';
import { readFile } from 'fs/promises';
import { embed as embedXenova } from './embed/xenova.mjs';
import { embed as embedOllama } from './embed/ollama.mjs';
import { semantic, sentence } from './index.mjs';

// Helper function to read test documents
async function readTestDocument(filename) {
  return await readFile(`./docs/${filename}`, 'utf8');
}

test('Semantic chunker with Xenova embedding', async (t) => {
  const document = await readTestDocument('three-little-pigs.txt');
  const chunker = semantic({ embed: embedXenova, zScoreThreshold: 1 });
  
  for await (const [text, embedding] of chunker(document)) {
    assert(text.length > 0, 'Chunk text should not be empty');
    assert(Array.isArray(embedding), 'Embedding should be an array');
    assert(embedding.length > 0, 'Embedding should not be empty');
  }
});

test('Semantic chunker with Ollama embedding', async (t) => {
  const document = await readTestDocument('lyndon-b-johnson.txt');
  const chunker = semantic({ embed: embedOllama, zScoreThreshold: 1.5 });
  
  for await (const [text, embedding] of chunker(document)) {
    assert(text.length > 0, 'Chunk text should not be empty');
    assert(Array.isArray(embedding), 'Embedding should be an array');
    assert(embedding.length > 0, 'Embedding should not be empty');
  }
});

test('Sentence chunker with Xenova embedding', async (t) => {
  const document = await readTestDocument('interwoven.txt');
  const chunker = sentence({ embed: embedXenova });
  
  for await (const [text, embedding] of chunker(document)) {
    assert(text.length > 0, 'Chunk text should not be empty');
    assert(Array.isArray(embedding), 'Embedding should be an array');
    assert(embedding.length > 0, 'Embedding should not be empty');
    assert(text.endsWith('.') || text.endsWith('!') || text.endsWith('?'), 'Sentence should end with punctuation');
  }
});

test('Semantic chunker with different zScoreThresholds', async (t) => {
  const document = await readTestDocument('three-little-pigs.txt');
  
  for (const zScoreThreshold of [0.5, 1, 1.5, 2]) {
    const chunker = semantic({ embed: embedXenova, zScoreThreshold });
    let chunkCount = 0;
    
    for await (const [text, embedding] of chunker(document)) {
      chunkCount++;
    }
    
    assert(chunkCount > 0, `Chunker should produce at least one chunk with zScoreThreshold ${zScoreThreshold}`);
  }
});

test('Chunkers with different documents', async (t) => {
  const documents = [
    await readTestDocument('three-little-pigs.txt'),
    await readTestDocument('lyndon-b-johnson.txt'),
    await readTestDocument('interwoven.txt')
  ];
  
  for (const document of documents) {
    const semanticChunker = semantic({ embed: embedXenova, zScoreThreshold: 1 });
    const sentenceChunker = sentence({ embed: embedXenova });
    
    for await (const [text, embedding] of semanticChunker(document)) {
      assert(text.length > 0, 'Semantic chunk text should not be empty');
    }
    
    for await (const [text, embedding] of sentenceChunker(document)) {
      assert(text.length > 0, 'Sentence chunk text should not be empty');
    }
  }
});