import React, { useEffect, useMemo, useState } from 'react';
import api from '../lib/axios';
import Button from '../components/ui/Button';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import Modal from '../components/ui/Modal';

type OrderItem = {
  name: string;
  quantity: number;
  price: number | string;
};

type OrderRow = {
  id: number;
  table_number?: string;
  total_amount?: number | string;
  status?: string;
  payment_method?: string;
  payment_status?: string;
  created_at?: string;
  items?: OrderItem[];
};

type SortKey = 'id' | 'table' | 'date' | 'amount' | null;

export default function Sales() {
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [filtered, setFiltered] = useState<OrderRow[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderRow | null>(null);
  const [expandedItem, setExpandedItem] = useState<number | null>(null);
  const [sortConfig, setSortConfig] = useState<{
    key: SortKey;
    direction: 'asc' | 'desc';
  }>({
    key: null,
    direction: 'asc',
  });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [start, setStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  });
  const [end, setEnd] = useState(() => new Date().toISOString().slice(0, 10));
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/orders');
      setRows(Array.isArray(res.data) ? res.data : []);
    } catch {
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

    setFiltered(
      rows.filter((r) => {
        if (!r.created_at) return false;
        const d = new Date(r.created_at);
        if (d < s || d > e) return false;

        if (!search) return true;
        return (
          String(r.id).includes(search) ||
          String(r.table_number ?? '').includes(search)
        );
      })
    );
    setPage(1);
  }, [rows, start, end, search]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const sortedRows = useMemo(() => {
    if (!sortConfig.key) return filtered;

    return [...filtered].sort((a, b) => {
      let valA: number | string = '';
      let valB: number | string = '';

      switch (sortConfig.key) {
        case 'id':
          valA = a.id;
          valB = b.id;
          break;

        case 'table':
          valA = Number(a.table_number || 0);
          valB = Number(b.table_number || 0);
          break;

        case 'date':
          valA = new Date(a.created_at || '').getTime();
          valB = new Date(b.created_at || '').getTime();
          break;

        case 'amount':
          valA = Number(a.total_amount || 0);
          valB = Number(b.total_amount || 0);
          break;
      }

      return sortConfig.direction === 'asc'
        ? Number(valA) - Number(valB)
        : Number(valB) - Number(valA);
    });
  }, [filtered, sortConfig]);

  const pageRows = useMemo(
    () => sortedRows.slice((page - 1) * pageSize, page * pageSize),
    [sortedRows, page]
  );

  const badge = (value?: string) => {
    if (!value) return 'bg-gray-100 text-gray-600';
    if (value === 'paid') return 'bg-green-100 text-green-700';
    if (value === 'unpaid') return 'bg-yellow-100 text-yellow-700';
    if (value === 'canceled') return 'bg-red-100 text-red-700';
    return 'bg-gray-100 text-gray-700';
  };

  const sortIndicator = (key: SortKey) => {
    if (sortConfig.key !== key) return '⇅';
    return sortConfig.direction === 'asc' ? '↓' : '↑';
  };

  const handleSort = (key: SortKey) => {
    setSortConfig((prev) => ({
      key,
      direction:
        prev.key === key
          ? prev.direction === 'asc'
            ? 'desc'
            : 'asc'
          : key === 'amount' || key === 'date'
          ? 'desc'
          : 'asc',
    }));
  };

  return (
    <div className="bg-white border shadow-sm rounded-xl">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h2 className="text-lg font-semibold">Sales Overview</h2>
          <p className="text-sm text-gray-500">Completed orders</p>
        </div>
        <Button size="sm" onClick={fetchOrders}>
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="grid gap-3 p-4 border-b md:grid-cols-3">
        <input
          type="date"
          value={start}
          onChange={(e) => setStart(e.target.value)}
          className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/60"
        />
        <input
          type="date"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
          className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/60"
        />
        <input
          placeholder="Search order or table..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/60"
        />
      </div>

      {/* TABLE (with max height) */}
      <div className="overflow-x-auto max-h-[720px] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 text-white bg-primary">
            <tr>
              <th
                className="px-4 py-3 text-left cursor-pointer select-none"
                onClick={() => handleSort('id')}
              >
                Order <span className="ml-1">{sortIndicator('id')}</span>
              </th>
              <th
                className="px-4 py-3 cursor-pointer select-none"
                onClick={() => handleSort('table')}
              >
                Table <span className="ml-1">{sortIndicator('table')}</span>
              </th>
              <th
                className="px-4 py-3 cursor-pointer select-none"
                onClick={() => handleSort('date')}
              >
                Date <span className="ml-1">{sortIndicator('date')}</span>
              </th>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Payment</th>
              <th
                className="px-4 py-3 text-right cursor-pointer select-none"
                onClick={() => handleSort('amount')}
              >
                Amount <span className="ml-1">{sortIndicator('amount')}</span>
              </th>
              <th className="px-4 py-3 text-center">Action</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-gray-400">
                  Loading...
                </td>
              </tr>
            ) : (
              pageRows.map((r) => {
                const date = r.created_at ? new Date(r.created_at) : null;

                return (
                  <tr key={r.id} className="border-t hover:bg-primary/5">
                    <td className="px-4 py-3 font-medium">#{r.id}</td>
                    <td className="px-4 py-3 text-center">
                      {r.table_number ?? '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {date ? format(date, 'yyyy-MM-dd') : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {date ? format(date, 'HH:mm:ss') : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${badge(
                          r.status
                        )}`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${badge(
                          r.payment_status
                        )}`}
                      >
                        {r.payment_method} / {r.payment_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-right">
                      ₱{Number(r.total_amount || 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Button
                        size="sm"
                        onClick={() => {
                          setExpandedItem(null);
                          setSelectedOrder(r);
                        }}
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      <Modal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={`Order #${selectedOrder?.id}`}
        maxWidth="max-w-xl"
      >
        {selectedOrder && (
          <div className="space-y-4">
            {/* Items */}
            <table className="w-full overflow-hidden text-sm border rounded-lg">
              <thead className="text-white bg-primary">
                <tr>
                  <th className="px-3 py-2 text-left">Item</th>
                  <th className="px-3 py-2 text-center">Qty</th>
                  <th className="px-3 py-2 text-right">Price</th>
                </tr>
              </thead>
              <tbody>
                {selectedOrder.items?.map((item, i) => {
                  const price = Number(item.price || 0);
                  const qty = Number(item.quantity || 0);

                  return (
                    <React.Fragment key={i}>
                      <tr
                        onClick={() =>
                          setExpandedItem(expandedItem === i ? null : i)
                        }
                        className="border-t cursor-pointer hover:bg-gray-50"
                      >
                        <td className="px-3 py-2">{item.name}</td>
                        <td className="px-3 py-2 text-center">{qty}</td>
                        <td className="px-3 py-2 text-right">
                          ₱{price.toFixed(2)}
                        </td>
                      </tr>

                      {expandedItem === i && (
                        <tr className="bg-gray-50">
                          <td
                            colSpan={3}
                            className="px-4 py-2 text-xs text-right"
                          >
                            Subtotal: ₱{(price * qty).toFixed(2)}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>

            {/* Total */}
            <div className="pt-3 font-semibold text-right border-t">
              Total: ₱{Number(selectedOrder.total_amount || 0).toFixed(2)}
            </div>

            {/* Footer */}
            <div className="flex justify-end pt-4">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedOrder(null)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
