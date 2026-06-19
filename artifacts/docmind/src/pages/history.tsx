import { useState } from "react";
import { Link } from "wouter";
import { Layout } from "@/components/layout";
import { useListSummaries, useGetSummaryStats, useDeleteSummary, getListSummariesQueryKey, getGetSummaryStatsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, FileText, Trash2, FileType2, AlignLeft, Calendar, Loader2, ArrowRight } from "lucide-react";
import { formatBytes, formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function History() {
  const [search, setSearch] = useState("");
  const [fileType, setFileType] = useState<string>("all");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: stats } = useGetSummaryStats();
  const { data: summaries, isLoading } = useListSummaries({
    search: search || undefined,
    fileType: fileType !== "all" ? fileType : undefined,
  });

  const deleteSummary = useDeleteSummary({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListSummariesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetSummaryStatsQueryKey() });
        toast({ title: "Summary deleted successfully" });
      },
      onError: () => {
        toast({ title: "Failed to delete summary", variant: "destructive" });
      }
    }
  });

  return (
    <Layout>
      <div className="container max-w-5xl mx-auto px-4 py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Document History</h1>
          <p className="text-muted-foreground">All your processed documents and insights in one place.</p>
        </div>

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <p className="text-sm font-medium text-muted-foreground mb-1">Total Documents</p>
                <p className="text-3xl font-bold">{stats.totalDocuments}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <p className="text-sm font-medium text-muted-foreground mb-1">Words Processed</p>
                <p className="text-3xl font-bold">{stats.totalWordsProcessed.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <p className="text-sm font-medium text-muted-foreground mb-1">PDF Files</p>
                <p className="text-3xl font-bold">{stats.pdfCount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <p className="text-sm font-medium text-muted-foreground mb-1">DOCX Files</p>
                <p className="text-3xl font-bold">{stats.docxCount}</p>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by file name..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={fileType} onValueChange={setFileType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="File Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="pdf">PDF</SelectItem>
              <SelectItem value="docx">DOCX</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : summaries && summaries.length > 0 ? (
          <div className="grid gap-4">
            {summaries.map((summary) => (
              <Card key={summary.id} className="hover:border-primary/50 transition-colors group">
                <CardContent className="p-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <Link href={`/summary/${summary.id}`} className="font-semibold text-lg hover:underline truncate">
                        {summary.fileName}
                      </Link>
                      {summary.status === "processing" && (
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">Processing</Badge>
                      )}
                      {summary.status === "failed" && (
                        <Badge variant="destructive">Failed</Badge>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1 uppercase font-mono text-xs">
                        <FileType2 className="w-3 h-3" /> {summary.fileType}
                      </span>
                      <span className="flex items-center gap-1">
                        <AlignLeft className="w-3 h-3" /> {summary.wordCount?.toLocaleString() || 0} words
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3" /> {formatBytes(summary.fileSize)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {formatDate(summary.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto mt-4 sm:mt-0">
                    <Link href={`/summary/${summary.id}`} className="flex-1 sm:flex-none">
                      <Button variant="secondary" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        View Details
                      </Button>
                    </Link>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive shrink-0">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Summary</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this summary? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => deleteSummary.mutate({ id: summary.id })}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-muted/30 rounded-xl border border-dashed">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No documents found</h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              {search || fileType !== "all" 
                ? "Try adjusting your search filters to find what you're looking for."
                : "You haven't uploaded any documents yet. Upload your first document to get started."}
            </p>
            {!(search || fileType !== "all") && (
              <Link href="/">
                <Button>
                  Upload Document <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
