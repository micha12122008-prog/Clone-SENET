import type { ReactNode } from "react";
import { cn } from "../../helpers/cn";

export interface Column<T> {
  key: string;
  header: string;
  /** Що показати в комірці для конкретного рядка. */
  render: (row: T) => ReactNode;
  className?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  getRowId: (row: T) => string | number;
  isLoading?: boolean;
  emptyText?: string;
}

export function Table<T>({
  columns,
  data,
  getRowId,
  isLoading = false,
  emptyText = "Немає даних",
}: TableProps<T>) {
  const stateText = isLoading ? "Завантаження…" : data.length === 0 ? emptyText : null;

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={cn("px-4 py-3 text-left font-medium text-gray-600", col.className)}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {stateText ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-500">
                {stateText}
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr key={getRowId(row)} className="hover:bg-gray-50">
                {columns.map((col) => (
                  <td key={col.key} className={cn("px-4 py-3 text-gray-900", col.className)}>
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
