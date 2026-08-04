"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./ui";

export function PaginationControls({
  page,
  pageSize,
  totalItems,
  label,
  onPageChange
}: {
  page: number;
  pageSize: number;
  totalItems: number;
  label: string;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = totalItems ? (safePage - 1) * pageSize + 1 : 0;
  const end = Math.min(totalItems, safePage * pageSize);
  const canGoBack = safePage > 1;
  const canGoNext = safePage < totalPages;

  if (totalItems <= pageSize) return null;

  return (
    <nav
      aria-label={`Phân trang ${label}`}
      className="mt-4 flex flex-col gap-3 rounded-xl border border-[var(--line)] bg-white/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="muted text-sm">
        Hiển thị <strong className="text-[var(--ink)]">{start}-{end}</strong> trong{" "}
        <strong className="text-[var(--ink)]">{totalItems}</strong> {label}
      </p>
      <div className="flex items-center gap-2">
        <Button aria-label="Trang trước" isDisabled={!canGoBack} isIconOnly variant="tertiary" onPress={() => onPageChange(safePage - 1)}>
          <ChevronLeft aria-hidden="true" size={16} />
        </Button>
        <span className="min-w-[92px] text-center text-sm font-black">
          Trang {safePage}/{totalPages}
        </span>
        <Button aria-label="Trang sau" isDisabled={!canGoNext} isIconOnly variant="tertiary" onPress={() => onPageChange(safePage + 1)}>
          <ChevronRight aria-hidden="true" size={16} />
        </Button>
      </div>
    </nav>
  );
}
