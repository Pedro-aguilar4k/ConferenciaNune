"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { PackageCheck } from "lucide-react"
import { NAV_ITEMS, GROUP_LABELS, type NavItem } from "@/lib/navigation"
import { roleHasPermission } from "@/lib/permissions"
import { cn } from "@/lib/utils"

export function AppSidebar({ role, onNavigate }: { role: string; onNavigate?: () => void }) {
  const pathname = usePathname()
  const allowed = NAV_ITEMS.filter((item) => roleHasPermission(role, item.permission))

  const groups = allowed.reduce<Record<string, NavItem[]>>((acc, item) => {
    ;(acc[item.group] ??= []).push(item)
    return acc
  }, {})

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center gap-3 px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-brand text-accent-brand-foreground">
          <PackageCheck className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold">Conferência</p>
          <p className="text-xs text-sidebar-foreground/60">Gestão de NF-e</p>
        </div>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        {(Object.keys(groups) as NavItem["group"][]).map((group) => (
          <div key={group}>
            <p className="px-3 pb-2 text-xs font-medium uppercase tracking-wider text-sidebar-foreground/40">
              {GROUP_LABELS[group]}
            </p>
            <ul className="space-y-1">
              {groups[group].map((item) => {
                const active = pathname === item.href
                const Icon = item.icon
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        active
                          ? "bg-accent-brand text-accent-brand-foreground"
                          : "text-sidebar-foreground/75 hover:bg-white/10 hover:text-sidebar-foreground",
                      )}
                      aria-current={active ? "page" : undefined}
                    >
                      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                      {item.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>
    </div>
  )
}
