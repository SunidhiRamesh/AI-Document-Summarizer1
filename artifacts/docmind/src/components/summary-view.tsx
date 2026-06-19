import { Summary } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";
import { FileText, CheckCircle2, ListTodo, AlertCircle, FileType2, AlignLeft, Calendar } from "lucide-react";
import { formatBytes, formatDate, parseJsonArray } from "@/lib/utils";

interface SummaryViewProps {
  summary: Summary;
}

export function SummaryView({ summary }: SummaryViewProps) {
  const keyPoints = parseJsonArray(summary.keyPoints);
  const actionItems = parseJsonArray(summary.actionItems);

  if (summary.status === "failed") {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto p-3 bg-destructive/10 rounded-full w-fit mb-4">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <CardTitle className="text-destructive">Processing Failed</CardTitle>
          <CardDescription>
            {summary.errorMessage || "An unknown error occurred while processing the document."}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (summary.status === "processing") {
    return (
      <Card className="animate-pulse">
        <CardHeader className="space-y-4">
          <div className="h-6 w-1/3 bg-muted rounded"></div>
          <div className="flex gap-2">
            <div className="h-5 w-16 bg-muted rounded"></div>
            <div className="h-5 w-24 bg-muted rounded"></div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-4 w-full bg-muted rounded"></div>
          <div className="h-4 w-[90%] bg-muted rounded"></div>
          <div className="h-4 w-[95%] bg-muted rounded"></div>
          <div className="h-4 w-2/3 bg-muted rounded"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-2 flex items-center gap-2">
            {summary.fileName}
          </h2>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <Badge variant="secondary" className="uppercase font-mono text-xs">
              <FileType2 className="w-3 h-3 mr-1" />
              {summary.fileType}
            </Badge>
            <span className="flex items-center gap-1">
              <AlignLeft className="w-3 h-3" />
              {summary.wordCount ? `${summary.wordCount.toLocaleString()} words` : 'Unknown length'}
            </span>
            <span className="flex items-center gap-1">
              <FileText className="w-3 h-3" />
              {formatBytes(summary.fileSize)}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(summary.createdAt)}
            </span>
          </div>
        </div>
      </div>

      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="summary" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Executive Summary</span>
            <span className="sm:hidden">Summary</span>
          </TabsTrigger>
          <TabsTrigger value="keypoints" className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Key Points</span>
          </TabsTrigger>
          <TabsTrigger value="actionitems" className="flex items-center gap-2">
            <ListTodo className="w-4 h-4" />
            <span>Action Items</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="mt-0 outline-none">
          <Card>
            <CardContent className="pt-6 prose dark:prose-invert max-w-none">
              {summary.summary ? (
                <p className="text-lg leading-relaxed text-foreground/90">
                  {summary.summary}
                </p>
              ) : (
                <p className="text-muted-foreground italic">No summary available.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="keypoints" className="mt-0 outline-none">
          <Card>
            <CardContent className="pt-6">
              {keyPoints.length > 0 ? (
                <ul className="space-y-4">
                  {keyPoints.map((point, i) => (
                    <li key={i} className="flex gap-4 items-start">
                      <div className="shrink-0 mt-1">
                        <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">
                          {i + 1}
                        </div>
                      </div>
                      <p className="text-foreground/90 leading-relaxed">{point}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground italic text-center py-8">No key points extracted.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actionitems" className="mt-0 outline-none">
          <Card>
            <CardContent className="pt-6">
              {actionItems.length > 0 ? (
                <ul className="space-y-4">
                  {actionItems.map((item, i) => (
                    <li key={i} className="flex gap-4 items-start">
                      <div className="shrink-0 mt-1">
                        <div className="w-5 h-5 rounded bg-accent text-accent-foreground flex items-center justify-center border border-border">
                          <ListTodo className="w-3 h-3" />
                        </div>
                      </div>
                      <p className="text-foreground/90 leading-relaxed font-medium">{item}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground italic text-center py-8">No action items identified.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
