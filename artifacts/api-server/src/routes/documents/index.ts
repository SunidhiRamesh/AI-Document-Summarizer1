import { Router, type IRouter } from "express";
import multer from "multer";
import { db, summariesTable } from "@workspace/db";
import { eq, desc, like, and, or, sql, isNotNull, sum, count } from "drizzle-orm";
import {
  GetSummaryParams,
  GetSummaryResponse,
  ListSummariesQueryParams,
  ListSummariesResponse,
  GetSummaryStatsResponse,
  DeleteSummaryParams,
} from "@workspace/api-zod";
import { parseDocument } from "../../lib/document-parser";
import { summarizeDocument } from "../../lib/gemini";
import { logger } from "../../lib/logger";

const router: IRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [".pdf", ".docx"];
    const ext = "." + file.originalname.split(".").pop()?.toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF and DOCX files are supported"));
    }
  },
});

router.post("/documents/upload", upload.single("file"), async (req, res): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ error: "No file uploaded. Please provide a PDF or DOCX file." });
    return;
  }

  const { originalname, size, buffer } = req.file;
  const ext = originalname.split(".").pop()?.toLowerCase() ?? "";
  const fileType = ext === "pdf" ? "pdf" : "docx";

  const [record] = await db
    .insert(summariesTable)
    .values({
      fileName: originalname,
      fileType,
      fileSize: size,
      status: "processing",
    })
    .returning();

  req.log.info({ id: record.id, fileName: originalname }, "Document record created, beginning processing");

  res.status(201).json({
    ...record,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  });

  setImmediate(async () => {
    try {
      const parsed = await parseDocument(buffer, originalname);

      if (parsed.wordCount < 10) {
        await db
          .update(summariesTable)
          .set({ status: "failed", errorMessage: "Document appears to be empty or contains no readable text." })
          .where(eq(summariesTable.id, record.id));
        return;
      }

      const result = await summarizeDocument(parsed.text, originalname);

      await db
        .update(summariesTable)
        .set({
          status: "completed",
          summary: result.summary,
          keyPoints: JSON.stringify(result.keyPoints),
          actionItems: JSON.stringify(result.actionItems),
          wordCount: parsed.wordCount,
        })
        .where(eq(summariesTable.id, record.id));

      logger.info({ id: record.id }, "Document summarization completed");
    } catch (err) {
      logger.error({ err, id: record.id }, "Document processing failed");
      await db
        .update(summariesTable)
        .set({
          status: "failed",
          errorMessage: err instanceof Error ? err.message : "An unexpected error occurred during processing.",
        })
        .where(eq(summariesTable.id, record.id));
    }
  });
});

router.get("/summaries", async (req, res): Promise<void> => {
  const parsed = ListSummariesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { search, fileType } = parsed.data;

  const conditions = [];
  if (search) {
    conditions.push(
      or(
        like(summariesTable.fileName, `%${search}%`),
        like(summariesTable.summary, `%${search}%`)
      )
    );
  }
  if (fileType) {
    conditions.push(eq(summariesTable.fileType, fileType));
  }

  const rows = await db
    .select()
    .from(summariesTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(summariesTable.createdAt));

  res.json(
    ListSummariesResponse.parse(
      rows.map((r) => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      }))
    )
  );
});

router.get("/summaries/stats", async (_req, res): Promise<void> => {
  const [totals] = await db
    .select({
      totalDocuments: count(),
      completedDocuments: sql<number>`COUNT(*) FILTER (WHERE status = 'completed')`,
      failedDocuments: sql<number>`COUNT(*) FILTER (WHERE status = 'failed')`,
      totalWordsProcessed: sql<number>`COALESCE(SUM(word_count) FILTER (WHERE status = 'completed'), 0)`,
      pdfCount: sql<number>`COUNT(*) FILTER (WHERE file_type = 'pdf')`,
      docxCount: sql<number>`COUNT(*) FILTER (WHERE file_type = 'docx')`,
    })
    .from(summariesTable);

  res.json(
    GetSummaryStatsResponse.parse({
      totalDocuments: Number(totals.totalDocuments),
      completedDocuments: Number(totals.completedDocuments),
      failedDocuments: Number(totals.failedDocuments),
      totalWordsProcessed: Number(totals.totalWordsProcessed),
      pdfCount: Number(totals.pdfCount),
      docxCount: Number(totals.docxCount),
    })
  );
});

router.get("/summaries/:id", async (req, res): Promise<void> => {
  const params = GetSummaryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [row] = await db
    .select()
    .from(summariesTable)
    .where(eq(summariesTable.id, params.data.id));

  if (!row) {
    res.status(404).json({ error: "Summary not found" });
    return;
  }

  res.json(
    GetSummaryResponse.parse({
      ...row,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    })
  );
});

router.delete("/summaries/:id", async (req, res): Promise<void> => {
  const params = DeleteSummaryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [row] = await db
    .delete(summariesTable)
    .where(eq(summariesTable.id, params.data.id))
    .returning();

  if (!row) {
    res.status(404).json({ error: "Summary not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
