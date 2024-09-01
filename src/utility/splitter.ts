export const splitter = function* (text: string, split: number = 2 ** 8) {
  let start = 0;
  let end = split;
  while (start < text.length) {
    yield text.slice(start, end);
    start = end;
    end = Math.min(end + split, text.length);
  }
};
export default splitter;
