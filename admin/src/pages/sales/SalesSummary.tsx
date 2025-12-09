import { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../../lib/axios';
import Button from '../../components/ui/Button';

type Summary = {
  gross_sales: number;
  total_orders: number;
  cash_sales: number;
  gcash_sales: number;
  paypal_sales: number;
  canceled_amount: number;
  avg_order_value: number;
};

export default function SalesSummary() {
  const [data, setData] = useState<Summary | null>(null);
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

  const fetchSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/sales/summary`, {
        params: { start, end },
      });
      setData(res.data);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to fetch summary');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const exportExcel = () => {
    if (!data) return;
    const sheet = XLSX.utils.json_to_sheet([data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, sheet, 'Summary');
    XLSX.writeFile(wb, `sales_summary_${start}_to_${end}.xlsx`);
  };

  const exportPDF = () => {
    if (!data) return;
    const doc = new jsPDF();
    autoTable(doc, {
      head: [['Metric', 'Value']],
      body: Object.entries(data).map(([k, v]) => [
        k.replace(/_/g, ' '),
        `₱${Number(v).toFixed(2)}`,
      ]),
      headStyles: { fillColor: [110, 11, 19], textColor: 255 },
    });
    doc.save(`sales_summary_${start}_to_${end}.pdf`);
  };

  const capitalizeFirst = (str: string) =>
    str.charAt(0).toUpperCase() + str.slice(1);

  return (
    <div className="p-6 shadow-lg bg-gray-50 rounded-xl">
      {/* Filters */}
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
          <Button variant="primary" onClick={fetchSummary} className="h-fit">
            Apply
          </Button>
        </div>

        <div className="flex gap-2">
          <Button variant="primary" onClick={exportExcel}>
            Export Excel
          </Button>
          <Button variant="secondary" onClick={exportPDF}>
            Export PDF
          </Button>
        </div>
      </div>

      {/* Loading / Error */}
      {loading && <p className="p-6 text-center text-gray-500">Loading...</p>}
      {error && <p className="p-6 text-center text-red-600">{error}</p>}

      {/* Summary Cards */}
      {data && (
        <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-4">
          {Object.entries(data).map(([key, val]) => (
            <div
              key={key}
              className="flex flex-col p-4 bg-white rounded-lg shadow"
            >
              <p className="text-sm text-gray-500">
                {capitalizeFirst(key.replace(/_/g, ' '))}
              </p>
              <p className="mt-1 text-2xl font-bold text-gray-800">
                ₱
                {Number(val).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      {data && (
        <div className="overflow-x-auto shadow-inner rounded-xl">
          <table className="min-w-[400px] w-full table-auto border-collapse">
            <thead className="text-white bg-primary">
              <tr>
                <th className="p-3 font-semibold text-left">Metric</th>
                <th className="p-3 font-semibold text-right">Value</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(data).map(([key, val]) => (
                <tr
                  key={key}
                  className="border-b border-gray-200 hover:bg-[#6e0b13]/10 transition-colors"
                >
                  <td className="p-3 text-gray-800">
                    {capitalizeFirst(key.replace(/_/g, ' '))}
                  </td>
                  <td className="p-3 font-medium text-right text-gray-800">
                    ₱
                    {Number(val).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
