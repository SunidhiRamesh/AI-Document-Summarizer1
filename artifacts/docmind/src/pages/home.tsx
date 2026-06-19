import { useState, useEffect } from "react";
import { Layout } from "@/components/layout";
import { UploadZone } from "@/components/upload-zone";
import { SummaryView } from "@/components/summary-view";
import { useGetSummary } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles } from "lucide-react";

export default function Home() {
  const [activeSummaryId, setActiveSummaryId] = useState<number | null>(null);

  // Poll for summary status if we have an active ID
  const { data: summary } = useGetSummary(activeSummaryId!, {
    query: {
      enabled: activeSummaryId !== null,
      refetchInterval: (query) => {
        const status = query.state?.data?.status;
        if (status === "processing") return 2000;
        return false;
      },
    },
  });

  return (
    <Layout>
      <div className="container max-w-4xl mx-auto px-4 py-12 md:py-20 flex-1 flex flex-col">
        {!activeSummaryId ? (
          <div className="flex-1 flex flex-col items-center justify-center animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="text-center space-y-4 mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                <Sparkles className="w-4 h-4" />
                DocMind AI Summarizer
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
                Cut through the noise.
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                Upload your dense reports, papers, and documents. Get instant clarity, key takeaways, and action items in seconds.
              </p>
            </div>

            <UploadZone onUploadComplete={setActiveSummaryId} />
          </div>
        ) : (
          <div className="w-full animate-in fade-in duration-500">
            <Button
              variant="ghost"
              className="mb-8 -ml-4 text-muted-foreground hover:text-foreground"
              onClick={() => setActiveSummaryId(null)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Summarize another document
            </Button>

            {summary && <SummaryView summary={summary} />}
          </div>
        )}
      </div>
    </Layout>
  );
}
