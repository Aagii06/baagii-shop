"use client";

import PageHeader from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/lib/auth/AuthProvider";
import { ChevronRight, LayoutGrid, LogOut, NotebookPen, SlidersHorizontal, type LucideIcon } from "lucide-react";
import Link from "next/link";

const MENU: { href: string; label: string; description: string; icon: LucideIcon }[] = [
  {
    href: "/categories",
    label: "Категори",
    description: "Категори нэмэх, засах",
    icon: LayoutGrid,
  },
  {
    href: "/attrs",
    label: "Үзүүлэлт",
    description: "Өнгө, хэмжээ зэрэг үзүүлэлт, утгууд",
    icon: SlidersHorizontal,
  },
  {
    href: "/delivery-notes",
    label: "Хүргэлтийн тэмдэглэл",
    description: "Захиалгад сонгох хүргэлтийн заавар",
    icon: NotebookPen,
  },
];

export default function ProfilePage() {
  const { user, logout } = useAuth();

  const displayName =
    [user?.lastName, user?.firstName].filter(Boolean).join(" ") || user?.name || "Хэрэглэгч";

  return (
    <>
      <PageHeader title="Профайл" />

      <div className="space-y-3 pt-4">
        <Card className="flex items-center gap-4 p-4">
          <span className="grid size-14 shrink-0 place-items-center rounded-full bg-secondary text-xl font-bold text-secondary-foreground">
            {displayName.charAt(0).toUpperCase()}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[17px] font-bold">{displayName}</span>
            {user?.userName && (
              <span className="mt-0.5 block truncate font-mono text-sm text-muted-foreground">
                {user.userName}
              </span>
            )}
          </span>
        </Card>

        <Card className="overflow-hidden">
          <ul className="divide-y divide-border">
            {MENU.map(({ href, label, description, icon: Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted/60"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted text-foreground/80">
                    <Icon className="size-5" />
                  </span>
                  <span className="min-w-0 grow">
                    <span className="block truncate text-[15px] font-bold">{label}</span>
                    <span className="block truncate text-sm text-muted-foreground">{description}</span>
                  </span>
                  <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        </Card>

        <Button variant="danger" size="lg" className="w-full" onClick={logout}>
          <LogOut />
          Гарах
        </Button>
      </div>
    </>
  );
}
