import type { InputHTMLAttributes } from "react";
import { IconSearch } from "./icons";

type SearchInputProps = InputHTMLAttributes<HTMLInputElement> & {
  icon?: "search";
};

export const SearchInput = ({ className = "", icon = "search", ...props }: SearchInputProps) => (
  <div className={`input input-bordered flex w-full items-center gap-2 ${className}`}>
    {icon === "search" ? <IconSearch className="size-4 shrink-0 text-neutral" /> : null}
    <input type="search" className="grow border-0 bg-transparent text-sm outline-none" {...props} />
  </div>
);
