import type { ComponentType, SVGProps } from "react";
import { NavLink } from "react-router-dom";

type IconProps = SVGProps<SVGSVGElement>;

type NavItemProps = {
  to: string;
  label: string;
  icon: ComponentType<IconProps>;
  end?: boolean;
  badge?: number;
};

export default function NavItem({
  to,
  label,
  icon: Icon,
  end = false,
  badge,
}: NavItemProps) {
  return (
    <li>
      <NavLink
        to={to}
        end={end}
        className={({ isActive }) =>
          [
            "relative flex h-full flex-col items-center justify-center gap-0.5 text-[10px] leading-tight",
            isActive ? "text-nav-active" : "text-nav-inactive",
          ].join(" ")
        }
      >
        {({ isActive }) => (
          <>
            <span className="relative">
              <Icon className="h-[22px] w-[22px]" />
              {badge != null && badge > 0 ? (
                <span
                  className={[
                    "absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold text-white",
                    isActive ? "bg-nav-active" : "bg-gray-400",
                  ].join(" ")}
                >
                  {badge}
                </span>
              ) : null}
            </span>
            <span className={isActive ? "font-medium" : "font-normal"}>
              {label}
            </span>
          </>
        )}
      </NavLink>
    </li>
  );
}
