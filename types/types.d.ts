export type Embedding = number[];
export type EmbeddedChunk = [string, Embedding];
export type Corpus = EmbeddedChunk[];
export type EmbedFunction<Input = string> = (
  input: Input
) => Promise<Embedding>;
export type Chunker<Input = string, Output = [string, Embedding]> = (
  input: Input,
  ...rest: any[]
) => AsyncGenerator<Output>;
export type Dropoff = {
  index: number;
  dropoff: number;
};
