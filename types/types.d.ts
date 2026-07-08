export type Embedding = number[];
export type EmbeddedChunk = [string, Embedding];
export type EmbedFunction<Input = string> = (
  input: Input
) => Embedding | Promise<Embedding>;
export type Corpus = EmbeddedChunk[];
export type Chunker<Input = string, Output = EmbeddedChunk> = (
  input: Input,
  ...rest: any[]
) => AsyncGenerator<Output>;

export type Dropoff = {
  index: number;
  dropoff: number;
  /** Text of the segment at `index`; required by the "Agentic" method. */
  text?: string;
};

export type DropoffMethod =
  | "SD"
  | "IQ"
  | "MAD"
  | "PercentChange"
  | "MA"
  | "LM"
  | "CUSUM"
  | "ChangePoint"
  | "Hampel"
  | "ModifiedZScore"
  | "Agentic";

export type MethodOptions = {
  /** Used by "SD". */
  zScoreThreshold?: number;
  /** Used by "IQ". */
  iqrMultiplier?: number;
  /** Used by "MAD". */
  madMultiplier?: number;
  /** Used by "PercentChange". */
  percentThreshold?: number;
  /** Used by "MA", "Hampel", and "Agentic". */
  windowSize?: number;
  /** Used by "MA". */
  deviationThreshold?: number;
  /** Used by "LM". */
  sensitivity?: number;
  /** Used by "CUSUM", "ModifiedZScore", and "Agentic". */
  threshold?: number;
  /** Used by "Hampel". */
  nSigma?: number;
  /** Used by "Agentic": transformers.js model ID. */
  model?: string;
};

export type SplitMode = "sentence" | "paragraph" | "markdown";

export interface FullOptions {
  embed?: EmbedFunction;
  /** Maximum segment length in characters; longer text is hard-split (0 disables). */
  split?: number;
}

export interface SentenceOptions extends FullOptions {
  /** How to segment the text: "sentence" (default), "paragraph", or "markdown". */
  splitMode?: SplitMode;
}

export interface SemanticOptions extends SentenceOptions {
  /** Convenience threshold for the default "SD" method. Default 2. */
  zScoreThreshold?: number;
  /** Boundary detection method. Default "SD". */
  method?: DropoffMethod;
  /** Options for the chosen detection method. */
  methodOptions?: MethodOptions;
  /** Number of trailing segments from the previous chunk to prepend to the next. Default 0. */
  overlap?: number;
  /** Maximum chunk length in characters (0 disables). */
  maxChunkSize?: number;
  /** Minimum chunk length in characters (0 disables). */
  minChunkSize?: number;
}

export function full(options?: FullOptions): Chunker;
export function sentence(options?: SentenceOptions): Chunker;
export function semantic(options?: SemanticOptions): Chunker;

/** The raw dropoff-detection functions, keyed by their export names. */
export const dropoffMethods: Record<
  string,
  (dropoffs: Dropoff[], ...args: any[]) => number[] | Promise<number[]>
>;

export default semantic;
