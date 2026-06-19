import path from "path";
import { logger } from "./logger";

export interface ParsedDocument {
  text: string;
  wordCount: number;
}

export async function parseDocument(
  buffer: Buffer,
  fileName: string
): Promise<ParsedDocument> {
  const ext = path.extname(fileName).toLowerCase();

  if (ext === ".pdf") {
    return parsePdf(buffer);
  } else if (ext === ".docx") {
    return parseDocx(buffer);
  } else {
    throw new Error(`Unsupported file type: ${ext}. Only PDF and DOCX are supported.`);
  }
}

async function parsePdf(buffer: Buffer): Promise<ParsedDocument> {
  const pdfParse = await import("pdf-parse/lib/pdf-parse.js");
  const data = await pdfParse.default(buffer);
  const text = data.text.trim();
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  logger.info({ wordCount, pages: data.numpages }, "PDF parsed successfully");
  return { text, wordCount };
}

async function parseDocx(buffer: Buffer): Promise<ParsedDocument> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer });
  const text = result.value.trim();
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  logger.info({ wordCount }, "DOCX parsed successfully");
  return { text, wordCount };
}
