import Link from "next/link";

import { Brand } from "@/components/brand";

const navigation = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/profile", label: "Profile" },
  { href: "/settings", label: "Settings" },
];

export default function ProtectedLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Brand />
        <nav aria-label="Workspace navigation">
          {navigation.map((item) => (
            <Link key={item.href} href={item.href}>{item.label}</Link>
          ))}
        </nav>
        <p className="sidebar-note">Protected workspace scaffold</p>
      </aside>
      <main className="workspace">{children}</main>
    </div>
  );
}
