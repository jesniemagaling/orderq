import React, { useEffect, useState } from 'react';
import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../../lib/axios';
import Button from '../../components/ui/Button';

interface ItemSalesRow {
  name: string;
  total_sold: string;
  total_revenue: string;
}

export default function ItemSales() {
  const [rows, setRows] = useState<ItemSalesRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/sales/items');
      const data = Array.isArray(res.data)
        ? res.data
        : res.data
        ? [res.data]
        : [];
      setRows(data);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to fetch item sales');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const exportExcel = async () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Item Sales');
    ws.columns = [
      { header: 'Item', key: 'item', width: 30 },
      { header: 'Qty Sold', key: 'qty', width: 15 },
      { header: 'Revenue (PHP)', key: 'rev', width: 20 },
    ];
    rows.forEach((r) =>
      ws.addRow({
        item: r.name,
        qty: Number(r.total_sold),
        rev: Number(r.total_revenue),
      })
    );
    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `item_sales.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    autoTable(doc, {
      head: [['Item', 'Qty Sold', 'Revenue (PHP)']],
      body: rows.map((r) => [
        r.name,
        Number(r.total_sold),
        Number(r.total_revenue).toFixed(2),
      ]),
      headStyles: {
        fillColor: [110, 11, 19],
        textColor: 255,
      },
    });
    doc.save('item_sales.pdf');
  };

  const top = [...rows]
    .sort((a, b) => Number(b.total_sold) - Number(a.total_sold))
    .slice(0, 10);

  return (
    <div className="p-6 shadow-lg bg-gray-50 rounded-xl">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 mb-6 md:flex-row md:items-center">
        <h2 className="text-2xl font-bold text-gray-800">
          Item Sales / Top Selling
        </h2>
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
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Table */}
          <div className="overflow-x-auto shadow-inner rounded-xl">
            <table className="min-w-[400px] w-full table-auto border-collapse">
              <thead className="text-white bg-primary">
                <tr>
                  <th className="p-3 font-semibold text-left">Item</th>
                  <th className="p-3 font-semibold text-right">Qty Sold</th>
                  <th className="p-3 font-semibold text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr
                    key={i}
                    className="transition-colors border-b border-gray-200 hover:bg-[#6e0b13]/10"
                  >
                    <td className="p-3 text-gray-800">{r.name}</td>
                    <td className="p-3 font-medium text-right text-gray-800">
                      {Number(r.total_sold)}
                    </td>
                    <td className="p-3 font-medium text-right text-gray-800">
                      ₱
                      {Number(r.total_revenue).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Top Sellers */}
          <div className="p-4 bg-white rounded-lg shadow">
            <h3 className="mb-2 font-semibold text-gray-700">Top Sellers</h3>
            <ul className="space-y-2">
              {top.map((t, i) => (
                <li key={i} className="flex justify-between">
                  <span className="text-gray-800">{t.name}</span>
                  <span className="font-semibold text-gray-800">
                    {Number(t.total_sold)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
