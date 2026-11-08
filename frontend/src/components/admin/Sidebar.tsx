import { useState, useEffect } from "react";
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Command,
  LayoutDashboard,
  Percent,
  ShieldCheck,
  Shirt,
  SlidersHorizontal,
  Store,
  Truck,
  Users,
  Warehouse,
  X,
  type LucideIcon,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { LIME } from "../theme";

const nav: {
  label: string;
  icon: LucideIcon;
  to?: string;
  section: string;
  badge?: string;
}[] = [
  { label: "Dashboard", icon: LayoutDashboard, to: "/admin", section: "Overview" },
  { label: "Products", icon: Shirt, to: "/admin/products", section: "Manage", badge: "6" },
  { label: "Inventory", icon: Warehouse, section: "Manage" },
  { label: "Orders", icon: Truck, section: "Manage", badge: "5" },
  { label: "Discounts & Promos", icon: Percent, to: "/admin/discounts", section: "Manage" },
  { label: "Customers", icon: Users, section: "Manage" },
  { label: "Settings", icon: SlidersHorizontal, to: "/admin/settings", section: "System" },
];

const sections = ["Overview", "Manage", "System"];

type SidebarProps = {
  active?: string;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
};

export default function Sidebar({
  active,
  mobileOpen = false,
  onMobileClose,
}: SidebarProps) {
  const [expanded, setExpanded] = useState(true);
  const location = useLocation();

  // Determine active item from prop or pathname
  const currentActive =
    active ||
    (location.pathname === "/admin"
      ? "Dashboard"
      : location.pathname.startsWith("/admin/products")
        ? "Products"
        : location.pathname.startsWith("/admin/discounts")
          ? "Discounts & Promos"
          : location.pathname.startsWith("/admin/settings")
            ? "Settings"
            : "Dashboard");

  // Close mobile drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && onMobileClose) {
        onMobileClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onMobileClose]);

  // Lock body scroll on mobile when drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const toggleSidebar = () => setExpanded((prev) => !prev);

  const sidebarContent = (isMobile: boolean) => (
    <div
      className={`flex h-full flex-col overflow-hidden bg-[#151813] text-white shadow-[0_20px_50px_rgba(0,0,0,0.4)] ${
        isMobile
          ? "w-[280px] rounded-r-3xl border-r border-white/10"
          : `rounded-[28px] border border-white/[0.08] transition-all duration-300 ease-in-out ${
              expanded ? "w-[260px]" : "w-[72px]"
            }`
      }`}
    >
      {/* Brand Header */}
      <div
        className={`flex shrink-0 items-center border-b border-white/[0.08] px-4 py-4.5 ${
          !isMobile && !expanded ? "justify-center" : "justify-between"
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border shadow-inner transition-transform hover:scale-105"
            style={{
              borderColor: `${LIME}45`,
              background: `radial-gradient(circle at top left, ${LIME}25, ${LIME}08)`,
            }}
          >
            <Command className="h-5 w-5" style={{ color: LIME }} />
          </div>

          {(isMobile || expanded) && (
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-display text-base font-black tracking-wider text-white">
                  MOVE OPS
                </span>
                <span
                  className="rounded-full px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-black"
                  style={{ background: LIME }}
                >
                  v2.4
                </span>
              </div>
              <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
                Gymwear Console
              </span>
            </div>
          )}
        </div>

        {isMobile ? (
          <button
            onClick={onMobileClose}
            aria-label="Close navigation"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/50 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        ) : (
          expanded && (
            <button
              onClick={toggleSidebar}
              aria-label="Collapse sidebar"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-white/40 transition hover:bg-white/10 hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 scrollbar-none">
        {sections.map((section) => {
          const items = nav.filter((item) => item.section === section);

          return (
            <div key={section} className="mb-5 last:mb-2">
              {(isMobile || expanded) && (
                <p className="mb-2 px-3 text-[9px] font-bold uppercase tracking-[0.22em] text-white/30">
                  {section}
                </p>
              )}

              <div className="flex flex-col gap-1">
                {items.map(({ label, icon: Icon, to, badge }) => {
                  const isActive = label === currentActive;

                  const itemClass = `
                    group relative flex h-10.5 items-center rounded-xl text-left
                    transition-all duration-200
                    ${isMobile || expanded ? "gap-3 px-3" : "justify-center px-0"}
                    ${
                      isActive
                        ? "border border-white/[0.12] bg-white/[0.12] text-white font-semibold shadow-sm"
                        : "border border-transparent text-white/55 hover:bg-white/[0.06] hover:text-white"
                    }
                  `;

                  const content = (
                    <>
                      <Icon
                        className="h-[18px] w-[18px] shrink-0 transition-transform duration-200 group-hover:scale-110"
                        style={{
                          color: isActive ? LIME : undefined,
                        }}
                      />

                      {(isMobile || expanded) && (
                        <>
                          <span className="flex-1 truncate text-[12px]">
                            {label}
                          </span>

                          {badge && (
                            <span
                              className={`rounded-md px-1.5 py-0.5 text-[9px] font-black tracking-wide ${
                                isActive
                                  ? "bg-[#C8F31D] text-black"
                                  : "bg-white/10 text-white/60"
                              }`}
                            >
                              {badge}
                            </span>
                          )}

                          {isActive && !badge && (
                            <span
                              className="h-1.5 w-1.5 rounded-full shadow-[0_0_8px_#C8F31D]"
                              style={{ background: LIME }}
                            />
                          )}
                        </>
                      )}

                      {!isMobile && !expanded && (
                        <div className="pointer-events-none absolute left-[68px] z-50 whitespace-nowrap rounded-lg border border-white/10 bg-[#1D211A] px-3 py-1.5 text-[11px] font-medium text-white opacity-0 shadow-2xl transition-opacity group-hover:opacity-100">
                          {label}
                        </div>
                      )}
                    </>
                  );

                  return to ? (
                    <Link
                      key={label}
                      to={to}
                      onClick={() => isMobile && onMobileClose?.()}
                      aria-current={isActive ? "page" : undefined}
                      className={itemClass}
                    >
                      {content}
                    </Link>
                  ) : (
                    <button
                      key={label}
                      type="button"
                      aria-current={isActive ? "page" : undefined}
                      className={`${itemClass} w-full`}
                    >
                      {content}
                    </button>
                  );
                })}
              </div>

              {(isMobile || expanded) && section !== "System" && (
                <div className="my-3 mx-2 h-px bg-white/[0.06]" />
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer Info & Store Link */}
      <div className="shrink-0 border-t border-white/[0.08] p-3">
        {isMobile || expanded ? (
          <div className="flex flex-col gap-2.5">
            <a
              href="/"
              className="group flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.04] p-2.5 transition hover:border-white/20 hover:bg-white/[0.08]"
            >
              <div className="flex items-center gap-2.5">
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/5"
                  style={{ color: LIME }}
                >
                  <Store className="h-3.5 w-3.5" />
                </span>
                <div>
                  <p className="text-[11px] font-bold text-white">
                    Live Storefront
                  </p>
                  <p className="text-[9px] text-white/40">
                    gymwear.store
                  </p>
                </div>
              </div>

              <ArrowUpRight className="h-3.5 w-3.5 text-white/40 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white" />
            </a>

            <div className="flex items-center justify-between px-1.5 py-1">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span
                    className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
                    style={{ background: LIME }}
                  />
                  <span
                    className="relative inline-flex h-2 w-2 rounded-full"
                    style={{ background: LIME }}
                  />
                </span>
                <span className="text-[9px] font-medium tracking-wide text-white/50">
                  Operational
                </span>
              </div>
              <ShieldCheck className="h-3.5 w-3.5 text-white/30" />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-1">
            <a
              href="/"
              title="Storefront"
              className="flex h-9 w-9 items-center justify-center rounded-xl text-white/50 transition hover:bg-white/[0.08] hover:text-white"
            >
              <Store className="h-4 w-4" />
            </a>

            <button
              onClick={toggleSidebar}
              title="Expand sidebar"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-white/30 transition hover:bg-white/10 hover:text-white"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Floating Docked Bar with Auto Margin) */}
      <aside
        className={`fixed left-4 top-1/2 z-40 hidden -translate-y-1/2 transition-all duration-300 ease-in-out lg:block ${
          expanded ? "w-[260px]" : "w-[72px]"
        }`}
        style={{ height: "min(720px, calc(100vh - 40px))" }}
      >
        {sidebarContent(false)}
      </aside>

      {/* Mobile Slide-over Drawer Backdrop */}
      {mobileOpen && (
        <div
          onClick={onMobileClose}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden"
          aria-hidden="true"
        />
      )}

      {/* Mobile Slide-over Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 flex h-full transition-transform duration-300 ease-in-out lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent(true)}
      </div>
    </>
  );
}
