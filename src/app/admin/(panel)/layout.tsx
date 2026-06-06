import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession, type Role } from "@/lib/auth/session";
import { signOut } from "../actions";

type Tab = { href: string; label: string; roles: Role[] };

const TABS: Tab[] = [
  { href: "/admin", label: "Orders", roles: ["owner", "manager", "staff"] },
  { href: "/admin/menu", label: "Menu", roles: ["owner", "manager"] },
  { href: "/admin/settings", label: "Settings", roles: ["owner", "manager"] },
  { href: "/admin/promos", label: "Promos", roles: ["owner", "manager"] },
  { href: "/admin/reservations", label: "Reservations", roles: ["owner", "manager"] },
  { href: "/admin/catering", label: "Catering", roles: ["owner", "manager"] },
  { href: "/admin/staff", label: "Staff", roles: ["owner"] },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  // Proxy already gates this, but enforce again (defense-in-depth per Next 16 proxy docs).
  if (!session) redirect("/admin/login");

  const tabs = TABS.filter((t) => t.roles.includes(session.role));

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#14100D" }}>
      <header
        className="flex items-center justify-between px-6 py-4 border-b"
        style={{ borderColor: "rgba(201,162,75,0.18)" }}
      >
        <nav className="flex gap-1 flex-wrap">
          {tabs.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className="px-4 py-2 rounded-full text-sm font-semibold transition"
              style={{ color: "#F3E9D6" }}
            >
              {t.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link
            href="/admin?new=1"
            className="px-4 py-2 rounded-full text-sm font-semibold"
            style={{ backgroundColor: "#C9A24B", color: "#14100D" }}
          >
            + New Order
          </Link>
          <span className="text-xs uppercase tracking-widest" style={{ color: "#8A8276" }}>
            {session.role}
          </span>
          <form action={signOut}>
            <button
              type="submit"
              className="px-4 py-2 rounded-full text-sm font-semibold"
              style={{ border: "1px solid rgba(201,162,75,0.3)", color: "#C9A24B" }}
            >
              Sign out
            </button>
          </form>
        </div>
      </header>
      <main className="px-6 py-8">{children}</main>
    </div>
  );
}
