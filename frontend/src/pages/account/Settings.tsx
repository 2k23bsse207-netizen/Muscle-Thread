import { useNavigate } from "react-router-dom";
import { useMe } from "../../hooks/useQueries";
import { useAuthStore } from "../../stores/authStore";

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

export default function Settings() {
  const { data, isLoading, isError, error, refetch } = useMe();
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const signOut = () => {
    logout();
    navigate("/");
  };

  if (isLoading) {
    return (
      <section
        aria-label="Loading settings"
        className="max-w-2xl border border-[#171914]/10 bg-white p-6 md:p-7"
      >
        <div className="animate-pulse space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-4 bg-[#EFEBE2]" />
          ))}
        </div>
      </section>
    );
  }

  if (isError || !data) {
    return (
      <section className="max-w-2xl border border-[#171914]/10 bg-white p-6 md:p-7">
        <p className="text-sm text-red-600">
          {error instanceof Error ? error.message : "Could not load your settings."}
        </p>
        <button
          onClick={() => void refetch()}
          className="mt-4 bg-[#171914] px-5 py-3 text-[10px] font-black uppercase tracking-widest text-white transition-colors hover:bg-black"
        >
          Try again
        </button>
      </section>
    );
  }

  const user = data.user;

  return (
    <section className="max-w-2xl">
      <div className="border border-[#171914]/10 bg-white p-6 md:p-7">
        <h2 className="font-display text-2xl font-black italic uppercase tracking-tight">
          Account settings
        </h2>

        <div className="mt-4">
          <Row label="Sign-in email" value={user.email} />
          <Row label="Account type" value={user.role === "ADMIN" ? "Administrator" : "Standard user"} />
          <Row label="Two-factor authentication" value="Disabled" />
        </div>
      </div>

      <div className="mt-6 border border-[#171914]/10 bg-white p-6 md:p-7">
        <h2 className="font-display text-2xl font-black italic uppercase tracking-tight">
          Session
        </h2>
        <p className="mt-2 text-sm text-[#171914]/60">
          Signing out ends your session on this device.
        </p>
        <button
          onClick={signOut}
          className="mt-4 bg-[#171914] px-5 py-3 text-[10px] font-black uppercase tracking-widest text-white transition-colors hover:bg-black"
        >
          Log out
        </button>
      </div>
    </section>
  );
}
