import { Suspense } from "react";
import ApprovalTable from "@/components/ApprovalTable";
import ApprovalTableSkeleton from "@/components/RequestTableSkeleton";

export default function ApprovalsPage() {
  return (
    <main className="min-h-screen bg-background p-6">
      <h1 className="text-3xl font-semibold text-foreground mb-2">
        My Approvals
      </h1>
      <p className="text-muted-foreground text-sm">
        Review and manage access and role change requests awaiting your approval
      </p>
      <div className="min-h-8"></div>
      <Suspense fallback={<ApprovalTableSkeleton />}>
        <ApprovalTable />
      </Suspense>
    </main>
  );
}
