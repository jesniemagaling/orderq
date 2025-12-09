import { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../../lib/axios';
import Button from '../../components/ui/Button';

type Breakdown = {
  payment_method: string;
  count: number;
  total: number;
};

export default function PaymentMethodBreakdown() {
  const [data, setData] = useState<Breakdown[]>([]);

  useEffect(() => {
    api.get('/sales/payment-breakdown').then((res) => setData(res.data));
  }, []);

  const exportExcel = () => {
    const sheet = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, sheet, 'Payment Breakdown');
    XLSX.writeFile(wb, 'payment_breakdown.xlsx');
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    autoTable(doc, {
      head: [['Method', 'Count', 'Total']],
      body: data.map((r) => [r.payment_method, r.count, r.total]),
      headStyles: {
        fillColor: [110, 11, 19],
        textColor: 255,
      },
    });
    doc.save('payment_breakdown.pdf');
  };

  const capitalize = (str: string) =>
    str.charAt(0).toUpperCase() + str.slice(1);

  return (
    <div className="p-6 shadow-lg bg-gray-50 rounded-xl">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 mb-6 md:flex-row md:items-center">
        <h2 className="text-2xl font-bold text-gray-800">
          Payment Method Breakdown
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

      {/* Table */}
      <div className="overflow-x-auto shadow-inner rounded-xl">
        <table className="min-w-[400px] w-full table-auto border-collapse">
          <thead className="text-white bg-primary">
            <tr>
              <th className="p-3 font-semibold text-left">Method</th>
              <th className="p-3 font-semibold text-right">Count</th>
              <th className="p-3 font-semibold text-right">Total</th>
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
                  <td className="p-3 text-gray-800">
                    {capitalize(r.payment_method)}
                  </td>
                  <td className="p-3 font-medium text-right text-gray-800">
                    {r.count}
                  </td>
                  <td className="p-3 font-medium text-right text-gray-800">
                    ₱
                    {Number(r.total).toLocaleString(undefined, {
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
