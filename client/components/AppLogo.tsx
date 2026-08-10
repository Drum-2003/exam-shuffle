"use client";

const sizes = {
  compact: "h-10 w-[150px]",
  sidebar: "h-20 w-full max-w-[210px]",
  login: "h-24 w-full max-w-[290px]"
} as const;

export function AppLogo({
  size = "compact",
  className = ""
}: {
  size?: keyof typeof sizes;
  className?: string;
}) {
  return (
    <div className={`${sizes[size]} overflow-hidden rounded-lg bg-white ${className}`}>
      <img
        alt="Exam Shuffle"
        className="h-full w-full object-contain"
        draggable={false}
        src="/logo.png"
      />
    </div>
  );
}
