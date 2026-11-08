import { useMe } from "../../hooks/useQueries";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-[#171914]/10 py-4 last:border-0">
      <span className="text-[10px] font-bold uppercase tracking-widest text-[#171914]/50">
        {label}
      </span>
      <span className="text-sm font-bold">{value}</span>
    </div>
  );
}

function RowSkeleton() {
  return (
    <div className="animate-pulse space-y-4 py-4">
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center justify-between">
          <span className="h-3 w-24 bg-[#EFEBE2]" />
          <span className="h-3 w-32 bg-[#EFEBE2]" />
        </div>
      ))}
    </div>
  );
}

export default function Profile() {
  // Server data via TanStack Query; the auth store only supplies `status`
  // (the query is gated on it inside useMe).
  const { data, isLoading, isError, error, refetch } = useMe();

  return (
    <section className="max-w-2xl border border-[#171914]/10 bg-white p-6 md:p-7">
      <h2 className="font-display text-2xl font-black italic uppercase tracking-tight">
        Personal information
      </h2>

      {isLoading ? (
        <div className="mt-4">
          <RowSkeleton />
        </div>
      ) : isError ? (
        <div className="mt-4">
          <p className="text-sm text-red-600">
            {error instanceof Error ? error.message : "Could not load your profile."}
          </p>
          <button
            onClick={() => void refetch()}
            className="mt-4 bg-[#171914] px-5 py-3 text-[10px] font-black uppercase tracking-widest text-white transition-colors hover:bg-black"
          >
            Try again
          </button>
        </div>
      ) : data ? (
        <div className="mt-4">
          <Row label="Full name" value={data.user.name} />
          <Row label="Email address" value={data.user.email} />
          <Row
            label="Email verified"
            value={data.user.emailVerified ? "Yes" : "Not yet"}
          />
          <Row
            label="Role"
            value={data.user.role === "ADMIN" ? "Administrator" : "Member"}
          />
          <Row
            label="Member since"
            value={new Date(data.user.createdAt).toLocaleDateString()}
          />
        </div>
      ) : null}
    </section>
  );
}
