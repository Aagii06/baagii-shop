import logo from "@/assets/logo.png";
import { cn } from "@/lib/utils";
import Image from "next/image";

// Full-page loading state: the shop logo inside a spinning ring.
export default function PageLoader({ className }: { className?: string }) {
  return (
    <div
      role="status"
      aria-busy="true"
      className={cn("container mx-auto px-4 py-24 flex justify-center", className)}
    >
      <span className="relative grid h-20 w-20 place-items-center">
        <span className="absolute inset-0 rounded-full border-[3px] border-muted border-t-primary animate-spin" />
        <Image
          src={logo}
          alt=""
          className="h-14 w-14 object-contain animate-pulse"
          priority
        />
      </span>
    </div>
  );
}
