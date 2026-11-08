import { NavLink, Outlet } from "react-router-dom";

const TABS = [
  { to: "/profile", label: "Profile" },
  { to: "/orders", label: "My Orders" },
  { to: "/addresses", label: "My Addresses" },
  { to: "/settings", label: "Account Settings" },
];

export default function AccountLayout() {
  return (
    <main className="bg-[#F7F4EE] px-6 pb-20 pt-28 text-[#171914]">
      <div className="mx-auto max-w-[1280px]">
        <nav className="text-[10px] font-bold uppercase tracking-widest text-[#171914]/50">
          Home / <span className="text-[#171914]">Account</span>
        </nav>

        <h1 className="mt-5 font-display text-4xl font-black uppercase italic leading-[0.9] tracking-tight md:text-5xl">
          My account
        </h1>

        <nav
          aria-label="Account sections"
          className="mt-6 flex flex-wrap gap-2 border-b border-[#171914]/10 pb-4"
        >
          {TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                `px-4 py-2 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                  isActive
                    ? "bg-[#171914] text-white"
                    : "text-[#171914]/60 hover:bg-[#EFEBE2] hover:text-[#171914]"
                }`
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-8">
          <Outlet />
        </div>
      </div>
    </main>
  );
}
