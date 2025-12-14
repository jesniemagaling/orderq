import React, { useEffect, useMemo, useState } from 'react';
import api from '../lib/axios';
import Button from '../components/ui/Button';
import { format } from 'date-fns';
import { toast } from 'react-toastify';

interface OrderAudit {
  id: number;
  order_id: number;
  action: string;
  payload: any;
  username: string | null;
  created_at: string;
}

export default function OrdersHistory() {
  const [logs, setLogs] = useState<OrderAudit[]>([]);
  const [filtered, setFiltered] = useState<OrderAudit[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [start, setStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  });
  const [end, setEnd] = useState(() => new Date().toISOString().slice(0, 10));
  const [actionFilter, setActionFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');

  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/orders/logs'); // backend route
      setLogs(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to load order audit', err);
      toast.error('Failed to load order audit');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Filtering
  useEffect(() => {
    const s = new Date(start + 'T00:00:00');
    const e = new Date(end + 'T23:59:59');

    let out = logs.filter((log) => {
      const d = new Date(log.created_at);
      if (d < s || d > e) return false;

      if (search) {
        const q = search.toLowerCase();
        if (
          !String(log.order_id).includes(q) &&
          !String(log.username ?? '')
            .toLowerCase()
            .includes(q) &&
          !String(log.action ?? '')
            .toLowerCase()
            .includes(q) &&
          !(log.payload?.reason ?? '').toLowerCase().includes(q)
        )
          return false;
      }
      if (actionFilter && log.action !== actionFilter) return false;
      if (userFilter && (log.username ?? 'System') !== userFilter) return false;

      return true;
    });

    setFiltered(out);
    setPage(1);
  }, [logs, start, end, search, userFilter]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page, pageSize]
  );

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gray-900">Orders Audit</h2>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={fetchLogs}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center w-full gap-4 p-4">
        <div className="flex flex-col w-48">
          <label className="px-2 text-xs text-gray-600">Start</label>
          <input
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="px-2 py-2 mt-1 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/60"
          />
        </div>
        <div className="flex flex-col w-48">
          <label className="px-2 text-xs text-gray-600">End</label>
          <input
            type="date"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="px-2 py-2 mt-1 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/60"
          />
        </div>
        <div className="flex flex-col">
          <label className="px-2 text-xs text-gray-600">Search</label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Order #, reason, user..."
            className="px-2 py-2 mt-1 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/60"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto shadow-inner rounded-xl">
        <table className="w-full text-sm border-collapse table-auto">
          <thead className="text-white bg-primary">
            <tr>
              <th className="px-4 py-3 text-left">Order #</th>
              <th className="px-4 py-3 text-left">User</th>
              <th className="px-4 py-3 text-left">Details</th>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">Time</th>
              <th className="px-4 py-3 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-gray-400">
                  Loading...
                </td>
              </tr>
            ) : pageRows.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-gray-400">
                  No audit logs found
                </td>
              </tr>
            ) : (
              pageRows.map((log) => (
                <tr key={log.id} className="border-t hover:bg-primary/5">
                  <td className="px-4 py-3 font-medium">#{log.order_id}</td>
                  <td className="px-4 py-3">{log.username || 'System'}</td>
                  <td className="px-4 py-3">{log.payload?.reason || '-'}</td>
                  <td className="px-4 py-3">
                    {format(new Date(log.created_at), 'yyyy-MM-dd')}
                  </td>
                  <td className="px-4 py-3">
                    {new Date(log.created_at).toLocaleTimeString([], {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="px-4 py-3 font-medium capitalize">
                    {log.action.replace('_', ' ')}
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
              key={i}
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
    </>
  );
}
