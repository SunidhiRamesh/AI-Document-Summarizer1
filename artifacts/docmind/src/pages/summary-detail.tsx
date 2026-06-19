import { useParams, Link } from "wouter";
import { Layout } from "@/components/layout";
import { SummaryView } from "@/components/summary-view";
import { useGetSummary } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function SummaryDetail() {
  const { id } = useParams();
  const summaryId = id ? parseInt(id, 10) : null;

  const { data: summary, isLoading, isError } = useGetSummary(summaryId!, {
    query: {
      enabled: summaryId !== null && !isNaN(summaryId),
      refetchInterval: (query) => {
        const status = query.state?.data?.status;
        if (status === "processing") return 2000;
        return false;
      },
    },
  });

  return (
    <Layout>
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <Link href="/history">
          <Button variant="ghost" className="mb-6 -ml-4 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to History
          </Button>
        </Link>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : isError || !summary ? (
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold mb-2">Summary not found</h2>
            <p className="text-muted-foreground mb-6">This document may have been deleted or doesn't exist.</p>
            <Link href="/history">
              <Button>Return to History</Button>
            </Link>
          </div>
        ) : (
          <SummaryView summary={summary} />
        )}
      </div>
    </Layout>
  );
}
