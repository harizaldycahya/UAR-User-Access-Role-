import RequestTable from "@/components/RequestTable";

export default function RequestsPage() {
  return (
    <main className="min-h-screen bg-background p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold text-foreground mb-2">
          My Request
        </h1>
        <p className="text-muted-foreground text-sm">
          View and track your submitted access and role change requests
        </p>
      </div>
      <div className="min-h-8"></div>
      <RequestTable />
    </main>
  );
}