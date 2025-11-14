"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, Ticket, Shield, Contact } from "lucide-react";
import { cn } from "@/lib/utils";

const moderatorNavItems = [
  { href: "/moderator/dashboard", label: "Dashboard", icon: Home },
  { href: "/moderator/users", label: "User Management", icon: Users },
  { href: "/moderator/payees", label: "Payee Management", icon: Contact },
  { href: "/moderator/vouchers", label: "Voucher Overview", icon: Ticket },
];

export function ModeratorSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 flex-shrink-0 border-r bg-card hidden md:block">
      <div className="flex h-full min-h-screen flex-col gap-2">
        <div className="flex h-16 items-center border-b px-6">
          <Link href="/moderator/dashboard" className="flex items-center gap-2 font-semibold">
            <Shield className="h-6 w-6" />
            <span>Moderator Panel</span>
          </Link>
        </div>
        <div className="flex-1 overflow-auto py-2">
          <nav className="grid items-start px-4 text-sm font-medium">
            {moderatorNavItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                  pathname === href && "bg-muted text-primary"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </aside>
  );
}