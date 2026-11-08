import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";

/** Full-screen holding state while the refresh-cookie session is restored. */
export function SessionLoading() {
  return (
    <div
      role="status"
      aria-label="Restoring your session"
      className="flex min-h-screen items-center justify-center bg-[#F7F4EE] text-[#171914]"
    >
      <div className="flex flex-col items-center gap-3">
        <span className="font-display text-2xl font-black italic tracking-tighter">
          MOVE
        </span>
        <span className="h-1.5 w-1.5 animate-ping rounded-full bg-[#C8F31D]" />
      </div>
    </div>
  );
}

/** Requires a signed-in user; remembers where they were headed for after login. */
export default function ProtectedRoute() {
  const status = useAuthStore((s) => s.status);
  const location = useLocation();

  if (status === "loading") return <SessionLoading />;

  if (status !== "authenticated") {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
