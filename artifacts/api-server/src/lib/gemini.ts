import { GoogleGenAI } from "@google/genai";
import { logger } from "./logger";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is required");
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface SummaryResult {
  summary: string;
  keyPoints: string[];
  actionItems: string[];
}

export async function summarizeDocument(text: string, fileName: string): Promise<SummaryResult> {
  const prompt = `You are an expert document analyst. Analyze the following document and provide a structured summary.

Document: ${fileName}

Content:
${text.slice(0, 50000)}

Respond with ONLY valid JSON in exactly this format (no markdown, no code blocks):
{
  "summary": "A comprehensive 2-4 paragraph summary of the document's main content, purpose, and conclusions",
  "keyPoints": [
    "Key point 1",
    "Key point 2",
    "Key point 3",
    "Key point 4",
    "Key point 5"
  ],
  "actionItems": [
    "Action item or recommendation 1",
    "Action item or recommendation 2",
    "Action item or recommendation 3"
  ]
}

Requirements:
- summary: 2-4 paragraphs capturing the essence and main conclusions
- keyPoints: 4-8 most important facts, findings, or concepts from the document
- actionItems: 2-6 concrete next steps, recommendations, or tasks implied by the document (if none are present, suggest logical follow-up actions)`;

  logger.info({ fileName }, "Sending document to Gemini for summarization");

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: { maxOutputTokens: 8192 },
  });

  const rawText = response.text ?? "";

  const cleaned = rawText
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  const parsed = JSON.parse(cleaned) as SummaryResult;

  if (!parsed.summary || !Array.isArray(parsed.keyPoints) || !Array.isArray(parsed.actionItems)) {
    throw new Error("Invalid response format from Gemini");
  }

  return parsed;
}
