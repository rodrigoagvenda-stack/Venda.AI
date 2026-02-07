'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SimplePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function SimplePagination({
  currentPage,
  totalPages,
  onPageChange,
}: SimplePaginationProps) {
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }

    return pages;
  };

  return (
    <div className="flex items-center justify-center gap-1 py-4">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={cn(
          "h-9 w-9 flex items-center justify-center rounded-md transition-colors",
          currentPage === 1
            ? "text-muted-foreground cursor-not-allowed opacity-50"
            : "hover:bg-accent hover:text-accent-foreground"
        )}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {getPageNumbers().map((page, index) => (
        <button
          key={index}
          onClick={() => typeof page === 'number' && onPageChange(page)}
          disabled={page === '...'}
          className={cn(
            "h-9 w-9 flex items-center justify-center rounded-md text-sm font-medium transition-colors",
            page === currentPage
              ? "bg-primary text-primary-foreground"
              : page === '...'
              ? "cursor-default"
              : "hover:bg-accent hover:text-accent-foreground"
          )}
        >
          {page}
        </button>
      ))}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={cn(
          "h-9 w-9 flex items-center justify-center rounded-md transition-colors",
          currentPage === totalPages
            ? "text-muted-foreground cursor-not-allowed opacity-50"
            : "hover:bg-accent hover:text-accent-foreground"
        )}
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
