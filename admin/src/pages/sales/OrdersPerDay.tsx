import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../../lib/axios';
import Button from '../../components/ui/Button';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface OrdersPerDayRow {
  day: string;
  orders_count: number;
}

function fillDateRange(start: string, end: string, data: OrdersPerDayRow[]) {
  const map = new Map(
    data.map((d) => [d.day.slice(0, 10), Number(d.orders_count)])
  );

  const result: OrdersPerDayRow[] = [];
  let cur = new Date(start);
  const last = new Date(end);

  while (cur <= last) {
    const key = cur.toISOString().slice(0, 10);
    result.push({
      day: key,
      orders_count: map.get(key) ?? 0,
    });
    cur.setDate(cur.getDate() + 1);
  }

  return result;
}

export default function OrdersPerDay() {
  const [rows, setRows] = useState<OrdersPerDayRow[]>([]);
  const [start, setStart] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  });
  const [end, setEnd] = useState<string>(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (s = start, e = end) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/sales/orders-per-day`, {
        params: { start: s, end: e },
      });
      const data = Array.isArray(res.data)
        ? res.data
        : res.data
        ? [res.data]
        : [];
      setRows(fillDateRange(s, e, data));
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to fetch orders per day');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [start, end]);

  const chartData = {
    labels: rows.map((r) => new Date(r.day + 'T00:00:00').toLocaleDateString()),
    datasets: [
      {
        label: 'Orders',
        data: rows.map((r) => r.orders_count),
        fill: false,
        tension: 0.3,
        borderColor: '#6e0b13',
        backgroundColor: '#6e0b13',
      },
    ],
  };

  const exportExcel = async () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Orders Per Day');
    ws.columns = [
      { header: 'Date', key: 'date', width: 20 },
      { header: 'Orders', key: 'orders', width: 15 },
    ];
    rows.forEach((r) =>
      ws.addRow({
        date: new Date(r.day + 'T00:00:00').toLocaleDateString(),
        orders: r.orders_count,
      })
    );
    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders_per_day_${start}_to_${end}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    autoTable(doc, {
      head: [['Date', 'Orders']],
      body: rows.map((r) => [
        new Date(r.day + 'T00:00:00').toLocaleDateString(),
        r.orders_count,
      ]),
      headStyles: {
        fillColor: [110, 11, 19],
        textColor: 255,
      },
    });
    doc.save(`orders_per_day_${start}_to_${end}.pdf`);
  };

  return (
    <>
      {/* Header */}
      <h2 className="mb-4 text-2xl font-bold text-gray-800">Orders Per Day</h2>
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

          <Button variant="primary" onClick={() => fetchData(start, end)}>
            Apply
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

      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : (
        <>
          <div className="w-full py-6 h-66">
            <Line
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: true,
                  },
                },
                scales: {
                  x: {
                    ticks: {
                      autoSkip: true,
                      maxRotation: 0,
                    },
                  },
                },
              }}
            />
          </div>

          <div className="overflow-x-auto shadow-inner rounded-xl">
            <table className="min-w-[400px] w-full table-auto border-collapse">
              <thead className="text-white bg-primary">
                <tr>
                  <th className="p-3 font-semibold text-left">Date</th>
                  <th className="p-3 font-semibold text-right">Orders</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr
                    key={i}
                    className="transition-colors border-b border-gray-200 hover:bg-[#6e0b13]/10"
                  >
                    <td className="p-3 text-gray-800">
                      {new Date(r.day + 'T00:00:00').toLocaleDateString(
                        undefined,
                        {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        }
                      )}
                    </td>
                    <td className="p-3 font-medium text-right text-gray-800">
                      {r.orders_count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
