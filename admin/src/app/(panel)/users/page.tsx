"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import AttrListSkeleton from "@/components/attrs/AttrListSkeleton";
import ChipTabs from "@/components/common/ChipTabs";
import { useConfirm } from "@/components/common/Confirm";
import { EmptyState, ErrorState } from "@/components/common/States";
import { useToast } from "@/components/common/Toast";
import DetailHeader from "@/components/layout/DetailHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { deleteUser, extendPhoneVerify, getUsers, type User, type UserRole } from "@/lib/api/users";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useApi } from "@/lib/useApi";
import { formatDate, formatPhone } from "@/lib/utils";
import { Pencil, Plus, Trash2, Unlock, Users } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

function UserRow({ user, onChanged }: { user: User; onChanged: () => void }) {
  const { t } = useLanguage();
  const { run } = useToast();
  const confirm = useConfirm();
  const name = user.name || formatPhone(user.phone);

  const [deleting, setDeleting] = useState(false);
  async function onDelete() {
    const ok = await confirm({
      title: t("us.deleteTitle"),
      description: t("us.deleteDesc", { name }),
      confirmLabel: t("common.delete"),
      tone: "danger",
    });
    if (!ok) return;
    setDeleting(true);
    try {
      if (await run(() => deleteUser(user.id), t("us.deleted"))) onChanged();
    } finally {
      setDeleting(false);
    }
  }

  const [extending, setExtending] = useState(false);
  async function onExtend() {
    setExtending(true);
    try {
      if (await run(() => extendPhoneVerify(user.id), t("us.pvExtended"))) onChanged();
    } finally {
      setExtending(false);
    }
  }

  return (
    <li className="flex items-center gap-2 px-4 py-3.5">
      <span className="min-w-0 grow">
        <span className="flex items-center gap-2">
          <span className="truncate text-[15px] font-bold">{name}</span>
          <Badge className="shrink-0 px-2 py-0.5">{t(`us.role.${user.role}`)}</Badge>
          {user.phoneBlocked ? (
            <Badge variant="dark" className="shrink-0 px-2 py-0.5">{t("us.pvBlocked")}</Badge>
          ) : (
            user.phoneVerified === false && (
              <Badge variant="peach" className="shrink-0 px-2 py-0.5">{t("us.pvPending")}</Badge>
            )
          )}
        </span>
        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
          <span className="font-mono">{formatPhone(user.phone)}</span>
          {user.role === "shopper" && ` · ${user.store?.name ?? t("us.noStore")}`}
        </span>
        {user.phoneVerifyDeadline && !user.phoneBlocked && (
          <span className="mt-0.5 block truncate text-xs text-warning">
            {t("us.pvUntil", { date: formatDate(user.phoneVerifyDeadline) })}
          </span>
        )}
      </span>
      {user.phoneBlocked && (
        <Button
          variant="outline"
          size="icon-sm"
          className="shrink-0"
          aria-label={t("us.pvExtendAria", { name })}
          title={t("us.pvExtend")}
          loading={extending}
          onClick={onExtend}
        >
          <Unlock />
        </Button>
      )}
      <Button asChild variant="outline" size="icon-sm" className="shrink-0">
        <Link href={`/users/edit?id=${user.id}`} aria-label={t("us.editAria", { name })} title={t("common.edit")}>
          <Pencil />
        </Link>
      </Button>
      <Button
        variant="danger"
        size="icon-sm"
        className="shrink-0"
        aria-label={t("us.deleteAria", { name })}
        title={t("common.delete")}
        loading={deleting} onClick={onDelete}
      >
        <Trash2 />
      </Button>
    </li>
  );
}

export default function UsersPage() {
  const { t } = useLanguage();
  const { user: me } = useAuth();
  const { data, error, reload } = useApi(getUsers);
  const [role, setRole] = useState<UserRole | "all">("all");
  // The signed-in user edits themselves from the profile, not from this list.
  const rows = data?.filter((user) => user.id !== me?.id && (role === "all" || user.role === role)) ?? [];

  return (
    <>
      <DetailHeader
        backHref="/profile"
        title={t("us.title")}
        aside={
          <Button asChild className="h-10 px-4">
            <Link href="/users/new">
              <Plus />
              {t("common.add")}
            </Link>
          </Button>
        }
      />
      <div className="-mx-4 -mt-4 border-b border-border px-4 py-4">
        <ChipTabs
          label={t("us.role")}
          value={role}
          onChange={setRole}
          options={[
            { value: "all" as const, label: t("common.all") },
            { value: "admin" as const, label: t("us.role.admin") },
            { value: "shopper" as const, label: t("us.role.shopper") },
          ]}
        />
      </div>

      {error && !data ? (
        <div className="pt-4">
          <ErrorState error={error} onRetry={reload} />
        </div>
      ) : !data ? (
        <AttrListSkeleton />
      ) : rows.length === 0 ? (
        <div className="pt-4">
          <EmptyState icon={Users} title={t("us.empty")} />
        </div>
      ) : (
        <ul className="-mx-4 divide-y divide-border border-b border-border bg-white">
          {rows.map((user) => (
            <UserRow key={user.id} user={user} onChanged={reload} />
          ))}
        </ul>
      )}
    </>
  );
}
