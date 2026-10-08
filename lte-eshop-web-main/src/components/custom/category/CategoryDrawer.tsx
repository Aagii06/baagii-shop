import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type Category from "../../../models/eshop/Category";
import CategoryTree from "./CategoryTree";
import { CloseIcon } from "./icons";

type CategoryDrawerProps = {
  open: boolean;
  onClose: () => void;
  categories: Category[];
  loading: boolean;
  error: string | null;
  selectedId?: number | null;
  onSelect?: (category: Category) => void;
};

export default function CategoryDrawer({
  open,
  onClose,
  categories,
  loading,
  error,
  selectedId,
  onSelect,
}: CategoryDrawerProps) {
  const [present, setPresent] = useState(open);
  const [entered, setEntered] = useState(false);
  const [shell, setShell] = useState<Element | null>(null);

  useEffect(() => {
    setShell(document.querySelector(".app-shell"));
  }, []);

  useEffect(() => {
    if (open) {
      setPresent(true);
      const id = requestAnimationFrame(() => {
        requestAnimationFrame(() => setEntered(true));
      });
      return () => cancelAnimationFrame(id);
    }
    setEntered(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!present || !shell) return null;

  return createPortal(
    <div className="absolute inset-0 z-50">
      <button
        type="button"
        aria-label="Хаах"
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
          entered ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Барааны ангилал"
        onTransitionEnd={() => {
          if (!open) setPresent(false);
        }}
        className={`absolute inset-y-0 left-0 flex w-[82%] flex-col bg-white shadow-2xl transition-transform duration-300 ease-out ${
          entered ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <header className="flex h-14 shrink-0 items-center justify-between bg-brand px-4 text-white">
          <h2 className="text-[17px] font-semibold tracking-wide">Ангилал</h2>
          <button
            type="button"
            aria-label="Хаах"
            onClick={onClose}
            className="rounded-full p-1 hover:bg-white/15"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto pb-[env(safe-area-inset-bottom)]">
          {loading ? (
            <p className="py-10 text-center text-sm text-gray-400">
              Ачаалж байна…
            </p>
          ) : error ? (
            <p className="px-4 py-10 text-center text-sm text-danger">
              {error}
            </p>
          ) : categories.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-400">
              Ангилал олдсонгүй
            </p>
          ) : (
            <CategoryTree
              categories={categories}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          )}
        </div>
      </aside>
    </div>,
    shell,
  );
}
