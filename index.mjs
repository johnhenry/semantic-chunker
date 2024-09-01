import compromise from 'compromise';

const nullEmbed = (..._) => [];

const createDefaultChunker = ({ embed = nullEmbed, } = {}) => {
    return async function* (text) {
        yield [text, embed(text)];
    };
};

const splitter = function* (text, split = 2 ** 8) {
    let start = 0;
    let end = split;
    while (start < text.length) {
        yield text.slice(start, end);
        start = end;
        end = Math.min(end + split, text.length);
    }
};

// Iterator that chunks senteneces into a stream of strings with maximum length
const createSentenceChunker = ({ embed, split = 0, } = {}) => {
    return async function* (text) {
        const doc = compromise(text);
        const sentences = doc.sentences().out("array");
        if (split) {
            for (const sentence of sentences) {
                for await (const chunk of splitter(sentence, split)) {
                    yield [chunk, await embed(chunk)];
                }
            }
        }
        else {
            for (const sentence of sentences) {
                yield [sentence, await embed(sentence)];
            }
        }
    };
};

const dotProduct = (vector, vectorB) => vector.reduce((sum, value, index) => sum + value * (vectorB[index] ?? 0), 0);

const norm = (vector) => {
    return Math.sqrt(vector.reduce((sum, value) => sum + value ** 2, 0));
};

const cosineSimilarity = (vectorA, vectorB) => dotProduct(vectorA, vectorB) / (norm(vectorA) * norm(vectorB));

const findSignificantDropoffs = (dropoffs, zScoreThreshold = 2) => {
    const mean = dropoffs.reduce((sum, d) => sum + d.dropoff, 0) / dropoffs.length;
    const stdDev = Math.sqrt(dropoffs.reduce((sum, d) => sum + Math.pow(d.dropoff - mean, 2), 0) /
        dropoffs.length);
    const offs = dropoffs
        .filter((d) => (d.dropoff - mean) / stdDev > zScoreThreshold)
        .map((d) => d.index)
        .sort((a, b) => a - b);
    return offs;
};

const createChunker = async function* (corpus, embed, zScoreThreshold = 2) {
    // Step 1: Analyze the entire corpus to find dropoffs in similarity
    let similarityDropoffs = [];
    for (let i = 1; i < corpus.length; i++) {
        const similarity = cosineSimilarity(corpus[i - 1][1], corpus[i][1]);
        similarityDropoffs.push({ index: i, dropoff: 1 - similarity });
    }
    // Step 2: Determine chunk boundaries based on statistically significant dropoffs
    const chunkBoundaries = await findSignificantDropoffs(similarityDropoffs, zScoreThreshold);
    // Step 3: Yield semantically similar chunks
    let startIndex = 0;
    for (const endIndex of [...chunkBoundaries, corpus.length]) {
        const chunk = corpus.slice(startIndex, endIndex);
        const chunkText = chunk.map((item) => item[0]).join(" ");
        const chunkEmbedding = await embed(chunkText);
        yield [chunkText, chunkEmbedding];
        startIndex = endIndex;
    }
};
const createSemanticChunker = ({ embed, split = 0, zScoreThreshold = 2, } = {}) => {
    const sentenceChunker = createSentenceChunker({ embed, split });
    return async function* (text) {
        const newCorpus = [];
        // First Pass: Chunk into sentences
        for await (const chunk of sentenceChunker(text)) {
            newCorpus.push(chunk);
        }
        // Second Pass: Chunk into semantically similar groups
        for await (const chunk of await createChunker(newCorpus, embed, zScoreThreshold)) {
            yield chunk;
        }
    };
};

export { createSemanticChunker as default, createDefaultChunker as full, createSemanticChunker as semantic, createSentenceChunker as sentence };
//# sourceMappingURL=index.mjs.map
