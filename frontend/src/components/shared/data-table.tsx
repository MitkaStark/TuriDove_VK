"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search } from "lucide-react";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
}

interface PaginationProps {
  page: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  pagination?: PaginationProps;
  loading?: boolean;
  emptyMessage?: string;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  searchValue?: string;
}

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
const PAGE_SIZE_STORAGE_KEY = "dataTable.pageSize";

function getInitialPageSize(): number {
  if (typeof window === "undefined") return 10;
  const stored = sessionStorage.getItem(PAGE_SIZE_STORAGE_KEY);
  const parsed = stored ? parseInt(stored, 10) : NaN;
  return PAGE_SIZE_OPTIONS.includes(parsed) ? parsed : 10;
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  pagination,
  loading = false,
  emptyMessage = "No se encontraron resultados.",
  searchPlaceholder = "Buscar...",
  onSearch,
  searchValue,
}: DataTableProps<T>) {
  // Internal pagination state (used when no external pagination prop)
  const [internalPage, setInternalPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);

  // Hydrate pageSize from sessionStorage after mount (avoids SSR mismatch)
  React.useEffect(() => {
    setPageSize(getInitialPageSize());
  }, []);

  // Reset to page 1 when data or search changes
  React.useEffect(() => {
    setInternalPage(1);
  }, [data.length, searchValue]);

  const useInternal = !pagination;
  const totalItems = useInternal ? data.length : pagination!.total;
  const currentPage = useInternal ? internalPage : pagination!.page;
  const currentLimit = useInternal ? pageSize : pagination!.limit;
  const totalPages = Math.max(1, Math.ceil(totalItems / currentLimit));

  // Slice data for internal pagination
  const displayData = useInternal
    ? data.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : data;

  const goToPage = (page: number) => {
    const p = Math.max(1, Math.min(page, totalPages));
    if (useInternal) {
      setInternalPage(p);
    } else {
      pagination!.onPageChange(p);
    }
  };

  const handlePageSizeChange = (size: string) => {
    const newSize = parseInt(size);
    setPageSize(newSize);
    setInternalPage(1);
    if (typeof window !== "undefined") {
      sessionStorage.setItem(PAGE_SIZE_STORAGE_KEY, String(newSize));
    }
  };

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * currentLimit + 1;
  const endItem = Math.min(currentPage * currentLimit, totalItems);

  return (
    <div className="space-y-4">
      {/* Search + Page size selector */}
      <div className="flex items-center justify-between gap-4">
        {onSearch ? (
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-300" />
            <Input
              placeholder={searchPlaceholder}
              value={searchValue ?? ""}
              onChange={(e) => onSearch(e.target.value)}
              className="pl-9 border-navy-200 focus-visible:ring-gold-400/50 focus-visible:border-gold-400 text-navy-800 placeholder:text-navy-300"
            />
          </div>
        ) : <div />}
        {useInternal && data.length > 10 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-navy-400 whitespace-nowrap font-body">Mostrar</span>
            <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
              <SelectTrigger className="h-8 w-[70px] border-navy-200 text-navy-700"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <SelectItem key={size} value={String(size)}>{size}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-card overflow-hidden border border-navy-100/50">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-navy-100/50 bg-cream-100 hover:bg-cream-100">
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  className="text-left px-4 py-3 text-[10px] font-body font-semibold tracking-[0.15em] uppercase text-navy-400"
                >
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <div className="flex items-center justify-center"><LoadingSpinner /></div>
                </TableCell>
              </TableRow>
            ) : displayData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-navy-400 font-body text-sm">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              displayData.map((item, index) => (
                <TableRow
                  key={(item.id as string | number) ?? index}
                  className="border-b border-navy-100/30 hover:bg-navy-50/40 transition-colors"
                >
                  {columns.map((column) => (
                    <TableCell key={column.key} className="px-4 py-3 text-sm font-body text-navy-700">
                      {column.render
                        ? column.render(item)
                        : (item[column.key] as React.ReactNode) ?? "-"}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination footer */}
      {totalItems > 0 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-navy-400 font-body">
            {startItem}-{endItem} de {totalItems}
          </p>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => goToPage(1)}
                disabled={currentPage <= 1}
                className="px-3 py-1.5 rounded-lg border border-navy-200 text-sm text-navy-600 hover:bg-navy-50 disabled:opacity-40 transition-colors"
                aria-label="Primera página"
              >
                <ChevronsLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage <= 1}
                className="px-3 py-1.5 rounded-lg border border-navy-200 text-sm text-navy-600 hover:bg-navy-50 disabled:opacity-40 transition-colors"
                aria-label="Página anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-3 py-1.5 rounded-full bg-gold-400 text-white text-sm font-medium">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="px-3 py-1.5 rounded-lg border border-navy-200 text-sm text-navy-600 hover:bg-navy-50 disabled:opacity-40 transition-colors"
                aria-label="Página siguiente"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => goToPage(totalPages)}
                disabled={currentPage >= totalPages}
                className="px-3 py-1.5 rounded-lg border border-navy-200 text-sm text-navy-600 hover:bg-navy-50 disabled:opacity-40 transition-colors"
                aria-label="Última página"
              >
                <ChevronsRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
