import { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../../lib/axios';
import Button from '../../components/ui/Button';

type HeatRow = {
  hour: number;
  orders_count: number;
  total_sales: number;
};

export default function HourlyHeatmap() {
  const [data, setData] = useState<HeatRow[]>([]);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (d: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/sales/hourly-heatmap', {
        params: { date: d },
      });
      const parsed = res.data.map((r: any) => ({
        ...r,
        orders_count: Number(r.orders_count),
        total_sales: Number(r.total_sales),
      }));
      setData(parsed);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to fetch hourly heatmap');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(date);
  }, []);

  const visibleData = data.filter(
    (r) => r.orders_count > 0 || r.total_sales > 0
  );

  const exportExcel = () => {
    const sheet = XLSX.utils.json_to_sheet(visibleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, sheet, 'Hourly Heatmap');
    XLSX.writeFile(wb, `hourly_heatmap_${date}.xlsx`);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    autoTable(doc, {
      head: [['Hour', 'Orders', 'Sales']],
      body: visibleData.map((r) => [
        `${r.hour}:00`,
        r.orders_count,
        r.total_sales,
      ]),
      headStyles: { fillColor: [110, 11, 19], textColor: 255 },
    });
    doc.save(`hourly_heatmap_${date}.pdf`);
  };

  if (loading) {
    return <p>Loading hourly heatmap...</p>;
  }

  if (error) {
    return <p className="text-red-500">Error: {error}</p>;
  }

  return (
    <>
      <h2 className="mb-4 text-2xl font-bold text-gray-800">Hourly Heatmap</h2>
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 mb-6 md:flex-row md:items-center">
        <div className="flex flex-wrap items-center gap-4">
          <label className="font-medium text-gray-600">Select Date:</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/60"
          />
          <Button variant="primary" onClick={() => fetchData(date)}>
            Go
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="primary" onClick={exportExcel}>
            Export Excel
          </Button>
          <Button variant="secondary" onClick={exportPDF}>
            Export PDF
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto shadow-inner rounded-xl">
        <table className="min-w-[400px] w-full table-auto border-collapse">
          <thead className="text-white bg-primary">
            <tr>
              <th className="p-3 font-semibold text-left">Hour</th>
              <th className="p-3 font-semibold text-right">Orders</th>
              <th className="p-3 font-semibold text-right">Sales</th>
            </tr>
          </thead>
          <tbody>
            {visibleData.length === 0 ? (
              <tr>
                <td colSpan={3} className="p-6 text-center text-gray-400">
                  No data available
                </td>
              </tr>
            ) : (
              visibleData.map((row, idx) => {
                const localHour = (row.hour + 8) % 24; // for UTC+8
                const hourLabel =
                  localHour === 0
                    ? '12 AM'
                    : localHour < 12
                    ? `${localHour} AM`
                    : localHour === 12
                    ? '12 PM'
                    : `${localHour - 12} PM`;

                return (
                  <tr
                    key={idx}
                    className="transition-colors border-b border-gray-200 hover:bg-[#6e0b13]/10"
                  >
                    <td className="p-3 text-gray-800">{hourLabel}</td>
                    <td className="p-3 font-medium text-right text-gray-800">
                      {row.orders_count}
                    </td>
                    <td className="p-3 font-medium text-right text-gray-800">
                      ₱
                      {Number(row.total_sales).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
