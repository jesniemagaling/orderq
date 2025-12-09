import { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../../lib/axios';
import Button from '../../components/ui/Button';

type CategoryRow = {
  category: string;
  total_sold: number;
  revenue: number;
};

export default function CategorySales() {
  const [data, setData] = useState<CategoryRow[]>([]);

  useEffect(() => {
    api.get('/sales/category-sales').then((res) => setData(res.data));
  }, []);

  const exportExcel = () => {
    const sheet = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, sheet, 'Category Sales');
    XLSX.writeFile(wb, 'category_sales.xlsx');
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    autoTable(doc, {
      head: [['Category', 'Qty Sold', 'Revenue']],
      body: data.map((r) => [r.category, r.total_sold, r.revenue]),
      headStyles: {
        fillColor: [110, 11, 19],
        textColor: 255,
      },
    });
    doc.save('category_sales.pdf');
  };

  return (
    <div className="p-6 shadow-lg bg-gray-50 rounded-xl">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 mb-6 md:flex-row md:items-center">
        <h2 className="text-2xl font-bold text-gray-800">Category Sales</h2>
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
        <table className="min-w-[500px] w-full table-auto border-collapse">
          <thead className="text-white bg-primary">
            <tr>
              <th className="p-3 font-semibold text-left">Category</th>
              <th className="p-3 font-semibold text-right">Qty Sold</th>
              <th className="p-3 font-semibold text-right">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={3} className="p-6 text-center text-gray-400">
                  No data available
                </td>
              </tr>
            ) : (
              data.map((r, idx) => (
                <tr
                  key={idx}
                  className="transition-colors border-b border-gray-200 hover:bg-[#6e0b13]/10"
                >
                  <td className="p-3 text-gray-800">{r.category}</td>
                  <td className="p-3 font-medium text-right text-gray-800">
                    {r.total_sold}
                  </td>
                  <td className="p-3 font-medium text-right text-gray-800">
                    ₱
                    {Number(r.revenue).toLocaleString(undefined, {
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
