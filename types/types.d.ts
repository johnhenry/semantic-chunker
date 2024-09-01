export type Embedding = number[];
export type EmbeddedChunk = [string, Embedding];
export type EmbedFunction<Input = string> = (
  input: Input
) => Promise<Embedding>;
export type Corpus = EmbeddedChunk[];
export type Chunker<Input = string, Output = [string, Embedding]> = (
  input: Input,
  ...rest: any[]
) => AsyncGenerator<Output>;
export type Dropoff = {
  index: number;
  dropoff: number;
};

declare module "semantic-chunker" {
  // Adjust the parameter and return types based on the actual implementation
  export function full({
    embed: EmbedFunction,
  }: {
    embed: EmbedFunction;
  }): Chunker;
  //
  export function sentence({
    embed: EmbedFunction,
    split: number,
  }: {
    embed: EmbedFunction;
    split: number;
  }): Chunker;
  //
  export function semantic({
    embed,
    split,
    zScoreThreshold,
  }: {
    embed: EmbedFunction;
    split: number;
    zScoreThreshold: number;
  }): Chunker;
  export default semantic;
}
