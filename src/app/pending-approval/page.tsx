export default function PendingApprovalPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-6">
      <div className="max-w-md w-full rounded-2xl border border-border bg-white p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand/10 text-brand">⏳</div>
        <h1 className="mt-4 text-xl font-bold text-navy">Your account is awaiting approval</h1>
        <p className="mt-2 text-sm text-text-secondary">An administrator must approve your access before you can use OpenPost.</p>
        <p className="mt-4 inline-flex rounded-full bg-brand/10 px-3 py-1 text-xs font-bold text-brand">Status: Pending approval</p>
        <p className="mt-6 text-xs text-text-tertiary">You will be notified once approved. Do not expose CMS content.</p>
      </div>
    </div>
  );
}
