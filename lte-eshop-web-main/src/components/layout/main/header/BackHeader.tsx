import { ChevronLeftIcon } from "../../../custom/post/detail";

type BackHeaderProps = {
  title: string;
  onBack: () => void;
};

export default function BackHeader({ title, onBack }: BackHeaderProps) {
  return (
    <header className="relative flex h-14 shrink-0 items-center justify-center bg-brand px-12 text-white">
      <button
        type="button"
        aria-label="Буцах"
        onClick={onBack}
        className="absolute left-3 top-1/2 -translate-y-1/2 p-1"
      >
        <ChevronLeftIcon className="h-6 w-6" />
      </button>
      <h1 className="truncate text-[17px] font-semibold tracking-wide">
        {title}
      </h1>
    </header>
  );
}
