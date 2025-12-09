import { useEffect, useState } from 'react';
import api from '../../lib/axios';
import Button from '../../components/ui/Button';

interface Row {
  day: string;
  total_sales: number;
  total_orders: number;
  average_order: number;
}

export default function SalesPerDay() {
  const [rows, setRows] = useState<Row[]>([]);
  const [start, setStart] = useState(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    return firstDay.toISOString().slice(0, 10);
  });

  const [end, setEnd] = useState(() => {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return lastDay.toISOString().slice(0, 10);
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/sales/sales-per-day`, {
        params: { start, end },
      });

      const parsed = res.data.map((r: any) => ({
        ...r,
        total_sales: Number(r.total_sales),
        total_orders: Number(r.total_orders),
        average_order: Number(r.average_order),
      }));

      setRows(parsed);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to fetch sales per day');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [start, end]);

  return (
    <div className="p-6 shadow-lg bg-gray-50 rounded-xl">
      <div className="flex flex-col items-start justify-between gap-4 mb-6 md:flex-row md:items-center">
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-sm text-gray-600">Start</label>
          <input
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/60"
          />

          <label className="text-sm text-gray-600">End</label>
          <input
            type="date"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/60"
          />

          <Button variant="primary" onClick={fetchData} className="h-fit">
            Apply
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-gray-200 shadow-inner rounded-xl">
        <table className="min-w-[600px] w-full border-collapse table-auto">
          <thead className="text-white bg-primary">
            <tr>
              <th className="p-3 font-semibold text-left">Date</th>
              <th className="p-3 font-semibold text-right">Total Sales</th>
              <th className="p-3 font-semibold text-right">Total Orders</th>
              <th className="p-3 font-semibold text-right">Avg Order Value</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="p-6 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={4} className="p-6 text-center text-red-600">
                  {error}
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-6 text-center text-gray-400">
                  No sales found for selected dates.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr
                  key={r.day}
                  className="border-b border-gray-200 hover:bg-[#6e0b13]/10 transition-colors"
                >
                  <td className="p-3 text-gray-800">
                    {new Date(r.day).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                  <td className="p-3 font-medium text-right text-gray-800">
                    ₱{r.total_sales.toFixed(2)}
                  </td>
                  <td className="p-3 font-medium text-right text-gray-800">
                    {r.total_orders}
                  </td>
                  <td className="p-3 font-medium text-right text-gray-800">
                    ₱{r.average_order.toFixed(2)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
