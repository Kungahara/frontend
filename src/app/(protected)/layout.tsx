import Link from "next/link";

import { Brand } from "@/components/brand";
import { LogoutButton } from "@/components/logout-button";

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
        <LogoutButton />
        <p className="sidebar-note">Your protected workspace</p>
      </aside>
      <main className="workspace">{children}</main>
    </div>
  );
}
