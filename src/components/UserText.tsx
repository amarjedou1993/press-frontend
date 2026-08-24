import type { ElementType, ReactNode } from "react";

export function UserText({
  children,
  as: Tag = "p",
  className = "",
}: {
  children: ReactNode;
  /** p by default; blockquote, span and dd are the other common ones. */
  as?: ElementType;
  className?: string;
}) {
  return (
    <Tag dir="auto" className={`user-text ${className}`}>
      {children}
    </Tag>
  );
}
