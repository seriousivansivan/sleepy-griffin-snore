"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, Settings, Building, Ticket, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const adminNavItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: Home },
  { href: "/admin/users", label: "User Management", icon: Users },
  { href: "/admin/companies", label: "Company Management", icon: Building },
  { href: "/admin/vouchers", label: "Voucher Overview", icon: Ticket },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 flex-shrink-0 border-r bg-gray-50/50 hidden md:block">
      <div className="flex h-full min-h-screen flex-col gap-2">
        {/* New: Back to User Dashboard Link */}
        <div className="flex h-12 items-center border-b px-6 bg-gray-100/50">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </Link>
        </div>
        
        {/* Admin Panel Title */}
        <div className="flex h-16 items-center border-b px-6">
          <Link href="/admin/dashboard" className="flex items-center gap-2 font-semibold">
            <Settings className="h-6 w-6" />
            <span>Admin Panel</span>
          </Link>
        </div>
        
        {/* Navigation Items */}
        <div className="flex-1 overflow-auto py-2">
          <nav className="grid items-start px-4 text-sm font-medium">
            {adminNavItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900",
                  pathname.startsWith(href) && "bg-gray-200 text-gray-900"
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