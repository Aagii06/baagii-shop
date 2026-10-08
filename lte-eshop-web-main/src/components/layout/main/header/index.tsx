import { CategoryMenu } from "../../../custom/category";
import type Category from "../../../../models/eshop/Category";
import HeaderUser from "./HeaderUser";

type PageHeaderProps = {
  title: string;
  showMenu?: boolean;
  selectedCategoryId?: number | null;
  onCategorySelect?: (category: Category) => void;
};

export default ({
  title,
  showMenu = false,
  selectedCategoryId,
  onCategorySelect,
}: PageHeaderProps) => {
  return (
    <header
      className={`sticky top-0 z-20 flex h-14 shrink-0 items-center justify-center bg-brand text-white ${
        showMenu ? "px-12" : "pl-4"
      } pr-31`}
    >
      {showMenu ? (
        <CategoryMenu
          selectedId={selectedCategoryId}
          onSelect={onCategorySelect}
        />
      ) : null}
      <h1 className="truncate text-[17px] font-semibold tracking-wide">
        {title}
      </h1>
      <HeaderUser />
    </header>
  );
};
