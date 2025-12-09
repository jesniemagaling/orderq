import React, { useEffect, useState } from 'react';
import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../../lib/axios';
import Button from '../../components/ui/Button';

interface DailyIncomeRow {
  day: string; // ISO timestamp
  total_income: string; // "450.00"
}

export default function DailyIncome() {
  const [data, setData] = useState<DailyIncomeRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [date, setDate] = useState<string>(() =>
    new Date().toISOString().slice(0, 10)
  );

  useEffect(() => {
    fetchData(date);
  }, []);

  const fetchData = async (d: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(
        `/sales/daily-income?date=${encodeURIComponent(d)}`
      );
      const rows = Array.isArray(res.data)
        ? res.data
        : res.data
        ? [res.data]
        : [];
      setData(rows);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to fetch daily income');
    } finally {
      setLoading(false);
    }
  };

  const exportExcel = async () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Daily Income');

    ws.columns = [
      { header: 'Date', key: 'date', width: 20 },
      { header: 'Total Income (PHP)', key: 'income', width: 20 },
    ];

    data.forEach((r) => {
      ws.addRow({
        date: new Date(r.day).toLocaleDateString(),
        income: Number(r.total_income),
      });
    });

    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `daily_income_${date}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    const doc = new jsPDF();

    autoTable(doc, {
      head: [['Date', 'Total Income (PHP)']],
      body: data.map((r) => [
        new Date(r.day).toLocaleDateString(),
        Number(r.total_income).toFixed(2),
      ]),
      headStyles: {
        fillColor: [110, 11, 19],
        textColor: 255,
      },
    });

    doc.save(`daily_income_${date}.pdf`);
  };

  const totalIncome = data.reduce((acc, r) => acc + Number(r.total_income), 0);

  return (
    <div className="p-6 shadow-lg bg-gray-50 rounded-xl">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 mb-6 md:flex-row md:items-center">
        <div className="flex flex-wrap items-center gap-3">
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

      {/* Summary Card */}
      {data.length > 0 && (
        <div className="mb-4">
          <div className="w-full p-4 bg-white rounded-lg shadow md:w-64">
            <p className="text-sm text-gray-500">Total Income</p>
            <p className="text-2xl font-bold text-gray-800">
              ₱
              {totalIncome.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
            </p>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto shadow-inner rounded-xl">
        <table className="min-w-[400px] w-full table-auto border-collapse">
          <thead className="text-white bg-primary">
            <tr>
              <th className="p-3 font-semibold text-left">Date</th>
              <th className="p-3 font-semibold text-right">Total Income</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={2} className="p-6 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={2} className="p-6 text-center text-red-600">
                  {error}
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={2} className="p-6 text-center text-gray-400">
                  No data available
                </td>
              </tr>
            ) : (
              data.map((r, i) => (
                <tr
                  key={i}
                  className="transition-colors border-b border-gray-200 hover:bg-[#6e0b13]/10"
                >
                  <td className="p-3 text-gray-800">
                    {new Date(r.day).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                  <td className="p-3 font-medium text-right text-gray-800">
                    ₱
                    {Number(r.total_income).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
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
