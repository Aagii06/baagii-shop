import { useState } from "react";
import { cdnBaseUrl } from "../../../constant/config";
import type Category from "../../../models/eshop/Category";
import { ChevronDownIcon } from "./icons";

type CategoryTreeProps = {
  categories: Category[];
  selectedId?: number | null;
  onSelect?: (category: Category) => void;
};

export default function CategoryTree({
  categories,
  selectedId,
  onSelect,
}: CategoryTreeProps) {
  return (
    <ul className="py-1">
      {categories.map((category) => (
        <CategoryTreeNode
          key={category.id}
          category={category}
          depth={0}
          selectedId={selectedId}
          onSelect={onSelect}
        />
      ))}
    </ul>
  );
}

function CategoryTreeNode({
  category,
  depth,
  selectedId,
  onSelect,
}: {
  category: Category;
  depth: number;
  selectedId?: number | null;
  onSelect?: (category: Category) => void;
}) {
  const children = category.children ?? [];
  const hasChildren = children.length > 0;
  const [expanded, setExpanded] = useState(depth === 0 && hasChildren);
  const selected = selectedId === category.id;

  return (
    <li>
      <button
        type="button"
        onClick={() => {
          if (hasChildren) {
            setExpanded((v) => !v);
            return;
          }
          onSelect?.(category);
        }}
        className={`flex w-full items-center gap-3 py-2.5 pr-3 text-left transition-colors hover:bg-orange-50 ${
          expanded || selected ? "bg-orange-50/70" : ""
        }`}
        style={{ paddingLeft: 16 + depth * 18 }}
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-surface">
          {category.image ? (
            <img
              src={`${cdnBaseUrl}/file/thumbnail/${category.image}`}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <span className="text-sm font-semibold text-brand">
              {category.name.slice(0, 1)}
            </span>
          )}
        </span>

        <span
          className={`min-w-0 flex-1 truncate text-[13px] ${
            depth === 0 ? "font-semibold text-gray-900" : "text-gray-600"
          }`}
        >
          {category.name}
        </span>

        {hasChildren ? (
          <ChevronDownIcon
            className={`h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200 ${
              expanded ? "rotate-0" : "-rotate-90"
            }`}
          />
        ) : null}
      </button>

      {hasChildren && expanded ? (
        <ul className="relative">
          <span
            className="absolute bottom-2 top-0 w-px bg-orange-100"
            style={{ left: 16 + depth * 18 + 18 }}
          />
          {children.map((child) => (
            <CategoryTreeNode
              key={child.id}
              category={child}
              depth={depth + 1}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}
