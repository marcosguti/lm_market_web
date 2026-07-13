function collapseInlineWhitespace(line: string): string {
  return line.trim().replace(/\s+/g, ' ');
}

export function normalizeVoucherText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((line) => collapseInlineWhitespace(line))
    .join('\n')
    .trim();
}
