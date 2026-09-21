import logo from "@/assets/logo.png";
import { cn } from "@/lib/utils";
import Image from "next/image";

export default function BrandMark({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <span className="relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-white ring-2 ring-white">
        <Image src={logo} alt="" fill sizes="40px" className="object-contain" priority />
      </span>
      <span className="leading-tight">
        <span className="block font-display text-lg font-bold tracking-tight">
          GOLDEN UVS
        </span>
        <span className="eyebrow block text-primary-ink">Admin</span>
      </span>
    </span>
  );
}
