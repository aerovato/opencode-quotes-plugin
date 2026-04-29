import fs from "node:fs/promises";
import path from "node:path";
import { QUOTES, type Quote } from "./quotes";

export type QuoteSource = "builtin" | "custom" | "both";

export function parseQuoteInput(input: string): Quote | null {
  const trimmed = input.trim();
  const match = trimmed.match(/^"(.+?)"\s*-\s*(.+)$/);
  if (!match) return null;
  const quote = match[1]!.trim();
  const author = match[2]!.trim();
  if (!quote || !author) return null;
  return { quote, author };
}

export async function saveCustomQuote(configDir: string, quote: Quote): Promise<boolean> {
  try {
    const filePath = path.join(configDir, "quotes.json");
    let existing: Quote[] = [];
    try {
      const raw = await fs.readFile(filePath, "utf-8");
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        existing = parsed.filter(
          (item): item is Quote =>
            typeof item === "object"
            && item !== null
            && typeof (item as Quote).quote === "string"
            && typeof (item as Quote).author === "string",
        );
      }
    } catch {
      // File doesn't exist or is invalid; start fresh
    }
    existing.push(quote);
    await fs.writeFile(filePath, JSON.stringify(existing, null, 2) + "\n", "utf-8");
    return true;
  } catch {
    return false;
  }
}

export async function removeCustomQuote(configDir: string, target: Quote): Promise<boolean> {
  try {
    const filePath = path.join(configDir, "quotes.json");
    const raw = await fs.readFile(filePath, "utf-8");
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return false;
    const existing = parsed.filter(
      (item): item is Quote =>
        typeof item === "object"
        && item !== null
        && typeof (item as Quote).quote === "string"
        && typeof (item as Quote).author === "string",
    );
    const filtered = existing.filter(q => q.quote !== target.quote || q.author !== target.author);
    if (filtered.length === existing.length) return false;
    await fs.writeFile(filePath, JSON.stringify(filtered, null, 2) + "\n", "utf-8");
    return true;
  } catch {
    return false;
  }
}

export function deduplicateQuotes(quotes: Quote[]): Quote[] {
  const seen = new Map<string, Quote>();
  for (const q of quotes) {
    const key = `${q.quote} - ${q.author}`;
    if (!seen.has(key)) {
      seen.set(key, q);
    }
  }
  return [...seen.values()];
}

export async function loadCustomQuotes(configDir: string): Promise<Quote[]> {
  try {
    const filePath = path.join(configDir, "quotes.json");
    const raw = await fs.readFile(filePath, "utf-8");
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const valid: Quote[] = [];
    for (const item of parsed) {
      if (
        typeof item === "object"
        && item !== null
        && typeof (item as Quote).quote === "string"
        && typeof (item as Quote).author === "string"
      ) {
        valid.push({ quote: (item as Quote).quote, author: (item as Quote).author });
      }
    }
    return valid;
  } catch {
    return [];
  }
}

export function getQuotesForSource(
  source: QuoteSource,
  customQuotes: Quote[],
): Quote[] {
  if (source === "custom") {
    return customQuotes;
  }
  if (source === "both") {
    return deduplicateQuotes([...QUOTES, ...customQuotes]);
  }
  return QUOTES;
}

export function wordWrap(text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  if (words.length === 0) {
    return [];
  }
  const totalLen = text.length;
  const targetCharsPerLine = Math.ceil(
    totalLen / Math.ceil(totalLen / maxWidth),
  );
  const lines: string[] = [];
  let wordIndex = 0;
  let accumulatedWidth = 0;

  while (wordIndex < words.length) {
    let capacity = Math.min(
      targetCharsPerLine + accumulatedWidth + (wordIndex === 0 ? 4 : 0),
      maxWidth,
    );
    let line = words[wordIndex]!;
    wordIndex++;
    while (wordIndex < words.length) {
      const test = line + " " + words[wordIndex]!;
      if (test.length <= capacity) {
        line = test;
        wordIndex++;
      } else {
        break;
      }
    }
    lines.push(line);
    accumulatedWidth = capacity - line.length;
  }

  return lines;
}
