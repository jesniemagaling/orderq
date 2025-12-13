import React, { useEffect, useMemo, useState } from 'react';
import api from '../lib/axios';
import Button from '../components/ui/Button';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type OrderRow = {
  id: number;
  table_id?: number;
  table_number?: string;
  total_amount?: number;
  status?: string;
  payment_method?: string;
  payment_status?: string;
  created_at?: string;
  items?: any[];
};

function downloadCSV(filename: string, rows: any[]) {
  if (!rows || rows.length === 0) return;

  const keys = Object.keys(rows[0]);
  const csv =
    keys.join(',') +
    '\n' +
    rows
      .map((r) =>
        keys.map((k) => `"${String(r[k] ?? '').replace(/"/g, '""')}"`).join(',')
      )
      .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Sales() {
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [filtered, setFiltered] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [start, setStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  });
  const [end, setEnd] = useState(() => new Date().toISOString().slice(0, 10));
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [sortKey, setSortKey] = useState<'created_at' | 'total_amount'>(
    'created_at'
  );
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/orders');
      setRows(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    const s = new Date(start + 'T00:00:00');
    const e = new Date(end + 'T23:59:59');

    const out = rows
      .filter((r) => {
        if (!r.created_at) return false;
        const d = new Date(r.created_at);
        if (d < s || d > e) return false;

        if (!search) return true;
        const q = search.toLowerCase();
        return (
          String(r.id).includes(q) ||
          String(r.table_number ?? r.table_id ?? '')
            .toLowerCase()
            .includes(q) ||
          String(r.total_amount ?? '').includes(q) ||
          (r.status ?? '').toLowerCase().includes(q) ||
          (r.payment_method ?? '').toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (sortKey === 'created_at') {
          const da = new Date(a.created_at ?? 0).getTime();
          const db = new Date(b.created_at ?? 0).getTime();
          return sortDir === 'asc' ? da - db : db - da;
        }
        return sortDir === 'asc'
          ? Number(a.total_amount ?? 0) - Number(b.total_amount ?? 0)
          : Number(b.total_amount ?? 0) - Number(a.total_amount ?? 0);
      });

    setFiltered(out);
    setPage(1);
  }, [rows, start, end, search, sortKey, sortDir]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page, pageSize]
  );

  const exportPDF = () => {
    if (!filtered.length) return;

    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text('Sales Orders Report', 14, 15);

    doc.setFontSize(10);
    doc.text(`Period: ${start} to ${end}`, 14, 22);
    doc.text(`Total Orders: ${filtered.length}`, 14, 28);

    autoTable(doc, {
      startY: 34,
      head: [
        [
          'Order #',
          'Table',
          'Date',
          'Time',
          'Status',
          'Payment',
          'Amount (₱)',
          'Items',
        ],
      ],
      body: filtered.map((r) => [
        `#${r.id}`,
        r.table_number ?? r.table_id ?? '-',
        r.created_at ? format(new Date(r.created_at), 'yyyy-MM-dd') : '-',
        r.created_at
          ? new Date(r.created_at).toLocaleTimeString([], {
              hour: 'numeric',
              minute: '2-digit',
            })
          : '-',
        r.status ?? '-',
        `${r.payment_method ?? '-'} / ${r.payment_status ?? '-'}`,
        Number(r.total_amount ?? 0).toFixed(2),
        Array.isArray(r.items) ? r.items.length : '-',
      ]),
      styles: {
        fontSize: 8,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [110, 11, 19],
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
    });

    doc.save(`sales-orders_${start}_to_${end}.pdf`);
  };

  return (
    <div className="bg-white border border-gray-100 shadow-sm rounded-xl">
      {/* Header */}
      <div className="flex flex-col gap-4 p-4 border-b md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">
            Sales Overview
          </h2>
          <p className="text-sm text-gray-500">
            All completed orders within selected period
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={fetchOrders}>
            Refresh
          </Button>
          <Button size="sm" variant="secondary" onClick={exportPDF}>
            Export PDF
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() =>
              downloadCSV(`orders_${start}_to_${end}.csv`, filtered)
            }
          >
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 gap-3 p-4 border-b md:grid-cols-4 md:items-end">
        {/* Start Date */}
        <div className="flex flex-col">
          <label className="px-2 text-xs text-gray-600">Start</label>
          <input
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="px-2 py-2 mt-1 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/60"
          />
        </div>

        {/* End Date */}
        <div className="flex flex-col">
          <label className="px-2 text-xs text-gray-600">End</label>
          <input
            type="date"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="px-2 py-2 mt-1 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/60"
          />
        </div>

        {/* Search */}
        <div className="flex flex-col md:col-span-2">
          <label className="px-2 text-xs text-gray-600">Search</label>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Order #, table, status, payment..."
            className="w-full px-3 py-2 mt-1 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/60"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto shadow-inner rounded-xl">
        <table className="w-full text-sm border-collapse table-auto">
          <thead className="text-white bg-primary">
            <tr>
              <th className="px-4 py-3 text-left">Order</th>
              <th className="px-4 py-3 text-left">Table</th>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">Time</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Payment</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3 text-center">Items</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="py-10 text-center text-gray-400">
                  Loading...
                </td>
              </tr>
            ) : pageRows.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-10 text-center text-gray-400">
                  No orders found
                </td>
              </tr>
            ) : (
              pageRows.map((r) => (
                <tr key={r.id} className="border-t hover:bg-primary/5">
                  <td className="px-4 py-3 font-medium">#{r.id}</td>
                  <td className="px-4 py-3">
                    {r.table_number ?? r.table_id ?? '-'}
                  </td>
                  <td className="px-4 py-3">
                    {r.created_at
                      ? format(new Date(r.created_at), 'yyyy-MM-dd')
                      : '-'}
                  </td>
                  <td className="px-4 py-3">
                    {r.created_at
                      ? new Date(r.created_at).toLocaleTimeString([], {
                          hour: 'numeric',
                          minute: '2-digit',
                        })
                      : '-'}
                  </td>
                  <td className="px-4 py-3">{r.status ?? '-'}</td>
                  <td className="px-4 py-3">
                    {r.payment_method ?? '-'} / {r.payment_status ?? '-'}
                  </td>
                  <td className="px-4 py-3 font-medium text-right">
                    ₱{Number(r.total_amount ?? 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {Array.isArray(r.items) ? r.items.length : '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3 border-t">
        <div className="text-sm text-gray-600">
          Page {page} of {pages}
        </div>

        <div className="flex gap-1">
          {['«', '‹', '›', '»'].map((label, i) => (
            <button
              key={label}
              onClick={() =>
                i === 0
                  ? setPage(1)
                  : i === 1
                  ? setPage((p) => Math.max(1, p - 1))
                  : i === 2
                  ? setPage((p) => Math.min(pages, p + 1))
                  : setPage(pages)
              }
              disabled={(i < 2 && page === 1) || (i > 1 && page === pages)}
              className="px-2 py-1 text-xs border rounded disabled:opacity-40"
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
