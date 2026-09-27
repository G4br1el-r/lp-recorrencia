export type TextPart = {
  text: string;
  highlighted: boolean;
  start: number;
};

export function splitHighlight(text: string, highlight?: string): TextPart[] {
  if (!highlight) {
    return [{ text, highlighted: false, start: 0 }];
  }
  const parts: TextPart[] = [];
  let start = 0;
  text.split(highlight).forEach((chunk, index) => {
    if (index > 0) {
      parts.push({ text: highlight, highlighted: true, start });
      start += highlight.length;
    }
    if (chunk.length > 0) {
      parts.push({ text: chunk, highlighted: false, start });
    }
    start += chunk.length;
  });
  return parts;
}
