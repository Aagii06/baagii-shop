import { cdnBaseUrl } from "../../../constant/config";
import type Category from "../../../models/eshop/Category";

type PostCategoryBadgeProps = {
  category?: Category | null;
};

export default function PostCategoryBadge({
  category,
}: PostCategoryBadgeProps) {
  if (!category?.name) return null;

  return (
    <span className="inline-flex max-w-full items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-medium text-brand">
      {category.image ? (
        <img
          src={`${cdnBaseUrl}/file/thumbnail/${category.image}`}
          alt=""
          className="h-3.5 w-3.5 shrink-0 rounded-full object-cover"
          loading="lazy"
        />
      ) : null}
      <span className="truncate">{category.name}</span>
    </span>
  );
}
