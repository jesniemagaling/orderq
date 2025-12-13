import React, { useEffect, useState } from 'react';
import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../../lib/axios';
import Button from '../../components/ui/Button';

interface OrdersPerTableRow {
  table_number: string;
  total_orders: number;
  total_sales: number;
}

export default function OrdersPerTable() {
  const [rows, setRows] = useState<OrdersPerTableRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/sales/orders-per-table');
      const data = Array.isArray(res.data)
        ? res.data
        : res.data
        ? [res.data]
        : [];
      setRows(data);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to fetch orders per table');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const exportExcel = async () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Orders Per Table');
    ws.columns = [
      { header: 'Table Number', key: 'table', width: 15 },
      { header: 'Total Orders', key: 'orders', width: 15 },
      { header: 'Total Sales (PHP)', key: 'sales', width: 20 },
    ];
    rows.forEach((r) =>
      ws.addRow({
        table: r.table_number,
        orders: r.total_orders,
        sales: Number(r.total_sales),
      })
    );
    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders_per_table.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    autoTable(doc, {
      head: [['Table #', 'Total Orders', 'Total Sales (PHP)']],
      body: rows.map((r) => [
        r.table_number,
        r.total_orders,
        Number(r.total_sales).toFixed(2),
      ]),
      headStyles: {
        fillColor: [110, 11, 19],
        textColor: 255,
      },
    });
    doc.save('orders_per_table.pdf');
  };

  return (
    <>
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 mb-6 md:flex-row md:items-center">
        <h2 className="text-2xl font-bold text-gray-800">Orders per Table</h2>
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
        <div className="overflow-x-auto shadow-inner rounded-xl">
          <table className="min-w-[400px] w-full table-auto border-collapse">
            <thead className="text-white bg-primary">
              <tr>
                <th className="p-3 font-semibold text-left">Table</th>
                <th className="p-3 font-semibold text-right">Orders</th>
                <th className="p-3 font-semibold text-right">Total Sales</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-6 text-center text-gray-400">
                    No data available
                  </td>
                </tr>
              )}
              {rows.map((r, i) => (
                <tr
                  key={i}
                  className="transition-colors border-b border-gray-200 hover:bg-[#6e0b13]/10"
                >
                  <td className="p-3 text-gray-800">{r.table_number}</td>
                  <td className="p-3 font-medium text-right text-gray-800">
                    {r.total_orders}
                  </td>
                  <td className="p-3 font-medium text-right text-gray-800">
                    ₱{Number(r.total_sales).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
