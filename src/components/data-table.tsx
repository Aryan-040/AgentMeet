"use client"

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[],
  onRowClick?: (row:TData)=>void;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  onRowClick,
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="rounded-lg border border-slate-700/50 bg-slate-800/50 overflow-hidden table-enhanced table-dark-contrast">
      <Table className="text-slate-200">
       
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
              onClick={()=>onRowClick?.(row.original)}
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
                className="hover:bg-slate-700/30 border-b border-slate-700/30"
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="text-sm p-4 text-slate-200 font-medium">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-19 text-center text-slate-400">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}