"use client"

import { useMemo, useState } from "react"
import { ChevronLeft, ChevronRight, Edit2, Loader2, Trash2 } from "lucide-react"

const hasOwn = (object, property) => Object.prototype.hasOwnProperty.call(object, property)

const resolveValue = (row, column) => {
  const normalized = column.trim().toLowerCase()
  const condensedKey = normalized.replace(/\s+/g, "")

  if (hasOwn(row, condensedKey)) return row[condensedKey]
  if (hasOwn(row, normalized)) return row[normalized]
  if (hasOwn(row, column)) return row[column]
  return row[condensedKey] ?? row[normalized] ?? row[column.toLowerCase()] ?? "—"
}

export const DataTable = ({ columns, data, onEdit, onDelete, loading }) => {
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const totalPages = Math.max(1, Math.ceil(data.length / itemsPerPage))
  const pageData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return data.slice(startIndex, startIndex + itemsPerPage)
  }, [currentPage, data])

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-3xl">
      <table className="w-full border-collapse">
        <thead className="bg-background/80">
          <tr className="border-b border-border/60">
            {columns.map((column) => (
              <th
                key={column}
                className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              >
                {column}
              </th>
            ))}
            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {pageData.length === 0 ? (
            <tr>
              <td colSpan={columns.length + 1} className="px-5 py-10 text-center text-sm text-muted-foreground">
                No records found.
              </td>
            </tr>
          ) : (
            pageData.map((row) => (
              <tr
                key={row.id || `${row.email}-${row.name}`}
                className="bg-card/95 text-sm text-foreground transition hover:bg-card"
              >
                {columns.map((column) => (
                  <td key={column} className="px-5 py-4 align-top text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">{resolveValue(row, column)}</span>
                  </td>
                ))}
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onEdit?.(row.id)}
                      className="inline-flex items-center justify-center rounded-full bg-primary/10 p-2 text-primary transition hover:bg-primary/20"
                      aria-label="Edit row"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => onDelete?.(row.id)}
                      className="inline-flex items-center justify-center rounded-full bg-rose-500/10 p-2 text-rose-500 transition hover:bg-rose-500/20"
                      aria-label="Delete row"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className="flex items-center justify-between border-t border-border/60 bg-background/80 px-5 py-4 text-sm text-muted-foreground">
        <span>
          Page {currentPage} of {totalPages}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            disabled={currentPage === 1}
            className="inline-flex items-center justify-center rounded-full border border-border/60 p-2 transition hover:border-primary/60 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Previous page"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            disabled={currentPage === totalPages}
            className="inline-flex items-center justify-center rounded-full border border-border/60 p-2 transition hover:border-primary/60 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Next page"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default DataTable
