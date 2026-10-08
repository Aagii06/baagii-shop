import { useCallback, useState } from "react";
import type Category from "../../../models/eshop/Category";
import { getCategoryTree } from "../../../services/categoryService";
import CategoryDrawer from "./CategoryDrawer";
import { MenuIcon } from "./icons";

type CategoryMenuProps = {
  selectedId?: number | null;
  onSelect?: (category: Category) => void;
};

export default function CategoryMenu({
  selectedId,
  onSelect,
}: CategoryMenuProps) {
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    if (loaded) return;
    setLoading(true);
    setError(null);
    const res = await getCategoryTree();
    if (!res.success || !res.data) {
      setError(res.message || "Ангилал ачааллахад алдаа гарлаа.");
      setCategories([]);
    } else {
      setCategories(res.data);
      setLoaded(true);
    }
    setLoading(false);
  }, [loaded]);

  const handleOpen = () => {
    setOpen(true);
    void load();
  };

  const handleSelect = (category: Category) => {
    onSelect?.(category);
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        aria-label="Ангилал"
        aria-expanded={open}
        onClick={handleOpen}
        className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full p-1"
      >
        <MenuIcon className="h-6 w-6" />
      </button>

      <CategoryDrawer
        open={open}
        onClose={() => setOpen(false)}
        categories={categories}
        loading={loading}
        error={error}
        selectedId={selectedId}
        onSelect={handleSelect}
      />
    </>
  );
}
