import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useMe } from "../../hooks/useQueries";
import { useAuthStore } from "../../stores/authStore";
import { SessionLoading } from "./ProtectedRoute";

/** Admin-only area: requires a signed-in user whose role is ADMIN. */
export default function AdminRoute() {
  const status = useAuthStore((s) => s.status);
  const me = useMe();
  const location = useLocation();

  if (status === "loading") return <SessionLoading />;

  if (status !== "authenticated") {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Signed in, but /me hasn't answered yet. That is NOT an unauthenticated
  // session — hold on the loading screen instead of bouncing the admin.
  if (me.isPending) return <SessionLoading />;

  // Role comes from the server via useMe(); anything but ADMIN (including a
  // failed /me) is denied — send them back to the store.
  if (me.data?.user.role !== "ADMIN") return <Navigate to="/" replace />;

  return <Outlet />;
}
