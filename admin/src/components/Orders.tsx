import React, { useEffect, useState, useRef } from 'react';
import api from '../lib/axios';
import Button from '../components/ui/Button';
import PrintReceipt from '../components/PrintReceipt';
import { Eye } from 'lucide-react';
import Modal from './ui/Modal';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface Order {
  id: number;
  table_number: number;
  table_id: string;
  payment_status: 'unpaid' | 'paid' | 'canceled';
  total_amount: number;
  payment_method: string;
  created_at?: string;
  items: {
    id: number;
    name: string;
    quantity: number;
    price: number;
  }[];
}

interface OrderRow {
  orderId: number;
  table_number: number;
  payment_status: 'unpaid' | 'paid' | 'canceled';
  total_amount: number;
  payment_method: string;
  created_at?: string;
  item: {
    id: number;
    name: string;
    quantity: number;
    price: number;
  };
}

interface SortConfig {
  key: 'table_number' | 'price' | 'quantity' | null;
  direction: 'asc' | 'desc';
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unpaid' | 'paid' | 'canceled'>(
    'all'
  );
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: null,
    direction: 'asc',
  });

  // Fetch orders
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await api.get('/orders');
        setOrders(res.data);
      } catch (err) {
        console.error('Failed to load orders', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  // Close modal on Escape
  useEffect(() => {
    if (!modalOpen) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
    };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [modalOpen]);

  // Focus first element in modal on open
  useEffect(() => {
    if (modalOpen && modalRef.current) {
      const focusable = modalRef.current.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      focusable?.focus();
    }
  }, [modalOpen]);

  const closeModal = () => {
    setModalOpen(false);
    setSelectedOrder(null);
  };

  const formatPaymentMethod = (method: string) =>
    method
      ? method.charAt(0).toUpperCase() + method.slice(1).toLowerCase()
      : '';

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text('Orders Report', 14, 15);

    autoTable(doc, {
      startY: 20,
      head: [['Order #', 'Table', 'Status', 'Amount', 'Items']],
      body: filteredOrders.map((o) => [
        `#${o.id}`,
        o.table_number,
        o.payment_status,
        (Number(o.total_amount) || 0).toFixed(2),
        o.items.map((i) => i.name).join(', '),
      ]),
      headStyles: { fillColor: [30, 41, 59] },
    });

    doc.save(`orders_report.pdf`);
  };

  const exportExcel = () => {
    const wsData = filteredOrders.map((o) => ({
      'Order #': o.id,
      Table: o.table_number,
      Status: o.payment_status,
      Amount: o.total_amount,
      Items: o.items.map((i) => `${i.name} (x${i.quantity})`).join(', '),
    }));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, 'Orders');
    XLSX.writeFile(wb, 'orders_report.xlsx');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'unpaid':
        return 'text-yellow-600';
      case 'paid':
        return 'text-green-600';
      case 'canceled':
        return 'text-red-600';
      default:
        return 'text-gray-500';
    }
  };

  const handleBillOut = async (orderId: number) => {
    try {
      setUpdating(true);
      await api.put(`/orders/${orderId}/pay`);
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, payment_status: 'paid' } : order
        )
      );
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, payment_status: 'paid' });
      }
    } catch (err) {
      console.error('Failed to bill out', err);
      alert('Failed to bill out. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  // Apply filter and search
  const filteredOrders = orders.filter((o) => {
    if (filter !== 'all' && o.payment_status !== filter) return false;

    if (!search) return true;

    const term = search.toLowerCase();

    if (o.id.toString().includes(term)) return true;
    if (o.table_number.toString().includes(term)) return true;
    if (o.items.some((item) => item.name.toLowerCase().includes(term)))
      return true;

    return false;
  });

  // Flatten orders into rows for sorting
  const flattenedRows: OrderRow[] = filteredOrders.flatMap((o) =>
    o.items.map((item) => ({
      orderId: o.id,
      table_number: o.table_number,
      payment_status: o.payment_status,
      total_amount: o.total_amount,
      payment_method: o.payment_method,
      created_at: o.created_at,
      item,
    }))
  );

  // Sort flattened rows
  const sortedRows = [...flattenedRows].sort((a, b) => {
    if (!sortConfig.key) return a.orderId - b.orderId; // default sort

    const { key, direction } = sortConfig;

    let valA: number;
    let valB: number;

    if (key === 'table_number') {
      valA = a.table_number;
      valB = b.table_number;
    } else if (key === 'quantity') {
      valA = a.item.quantity;
      valB = b.item.quantity;
    } else {
      valA = a.item.price;
      valB = b.item.price;
    }

    return direction === 'asc' ? valA - valB : valB - valA;
  });

  const handleSort = (key: SortConfig['key']) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  if (loading) return <p>Loading orders...</p>;

  // Group sorted rows back into orders for rowspan rendering
  const groupedOrders: Record<number, OrderRow[]> = {};
  sortedRows.forEach((row) => {
    if (!groupedOrders[row.orderId]) groupedOrders[row.orderId] = [];
    groupedOrders[row.orderId].push(row);
  });

  return (
    <>
      <h1 className="mb-6 text-3xl font-bold">Orders</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-4">
        <div className="p-4 bg-white border rounded-xl">
          <p className="text-sm text-gray-500">Total Orders</p>
          <p className="text-2xl font-semibold">{orders.length}</p>
        </div>

        <div className="p-4 bg-white border rounded-xl">
          <p className="text-sm text-gray-500">Unpaid</p>
          <p className="text-2xl font-semibold text-yellow-600">
            {orders.filter((o) => o.payment_status === 'unpaid').length}
          </p>
        </div>

        <div className="p-4 bg-white border rounded-xl">
          <p className="text-sm text-gray-500">Paid</p>
          <p className="text-2xl font-semibold text-green-600">
            {orders.filter((o) => o.payment_status === 'paid').length}
          </p>
        </div>

        <div className="p-4 bg-white border rounded-xl">
          <p className="text-sm text-gray-500">Total Sales</p>
          <p className="text-2xl font-semibold">
            ₱
            {orders
              .filter((o) => o.payment_status === 'paid')
              .reduce((s, o) => s + Number(o.total_amount), 0)
              .toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-4 mt-2 text-sm font-semibold">
          {['all', 'unpaid', 'paid', 'canceled'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`pb-2 border-b-2 transition ${
                filter === f
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-800 hover:text-gray-600'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex items-center w-full gap-2 md:w-auto">
          <label className="text-sm text-gray-600 md:whitespace-nowrap">
            Search:
          </label>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Order #, table, status, product..."
            className="flex-1 px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/60"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="primary" size="md" onClick={exportExcel}>
            Export Excel
          </Button>
          <Button variant="secondary" size="md" onClick={exportPDF}>
            Export PDF
          </Button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="overflow-x-auto shadow-inner rounded-xl">
        <table className="min-w-full text-sm text-left border-collapse table-auto">
          <thead className="text-white bg-primary">
            <tr>
              <th className="px-4 py-3">Order #</th>
              <th className="px-4 py-3">Product Name</th>
              <th
                className="px-4 py-3 text-center cursor-pointer"
                onClick={() => handleSort('table_number')}
              >
                Table Number{' '}
                <span className="ml-1">
                  {sortConfig.key === 'table_number'
                    ? sortConfig.direction === 'asc'
                      ? '↑'
                      : '↓'
                    : '⇅'}
                </span>
              </th>
              <th
                className="px-4 py-3 text-center cursor-pointer"
                onClick={() => handleSort('quantity')}
              >
                Quantity{' '}
                <span className="ml-1">
                  {sortConfig.key === 'quantity'
                    ? sortConfig.direction === 'asc'
                      ? '↑'
                      : '↓'
                    : '⇅'}
                </span>
              </th>
              <th
                className="px-4 py-3 text-center cursor-pointer"
                onClick={() => handleSort('price')}
              >
                Price{' '}
                <span className="ml-1">
                  {sortConfig.key === 'price'
                    ? sortConfig.direction === 'asc'
                      ? '↑'
                      : '↓'
                    : '⇅'}
                </span>
              </th>
              <th className="py-2 text-center">Status</th>
              <th className="px-4 py-3 text-center">Action</th>
            </tr>
          </thead>

          <tbody>
            {Object.values(groupedOrders).length === 0 && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-gray-500">
                  No orders found.
                </td>
              </tr>
            )}

            {Object.values(groupedOrders).map((rows) => {
              const firstRow = rows[0];
              return rows.map((row, idx) => (
                <tr
                  key={`${row.orderId}-${row.item.id}`}
                  className="transition border-b last:border-b-0 hover:bg-gray-50"
                >
                  {idx === 0 && (
                    <td
                      rowSpan={rows.length}
                      className="px-4 py-3 font-semibold align-middle cursor-pointer hover:underline"
                      onClick={() => {
                        const order = orders.find((o) => o.id === row.orderId);
                        if (order) {
                          setSelectedOrder(order);
                          setModalOpen(true);
                        }
                      }}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const order = orders.find(
                            (o) => o.id === row.orderId
                          );
                          if (order) {
                            setSelectedOrder(order);
                            setModalOpen(true);
                          }
                        }
                      }}
                      aria-label={`View details for order #${row.orderId}`}
                    >
                      #{row.orderId}
                    </td>
                  )}

                  <td className="px-4 py-3 align-middle">{row.item.name}</td>

                  {idx === 0 && (
                    <td
                      rowSpan={rows.length}
                      className="px-4 py-3 text-center align-middle"
                    >
                      {row.table_number}
                    </td>
                  )}

                  <td className="px-4 py-3 text-center align-middle">
                    {row.item.quantity}
                  </td>
                  <td className="px-4 py-3 text-center align-middle">
                    ₱{row.item.price.toLocaleString()}
                  </td>

                  {idx === 0 && (
                    <td
                      rowSpan={rows.length}
                      className={`py-2 text-center font-medium ${getStatusColor(
                        row.payment_status
                      )}`}
                    >
                      {row.payment_status.charAt(0).toUpperCase() +
                        row.payment_status.slice(1)}
                    </td>
                  )}

                  {idx === 0 && (
                    <td
                      rowSpan={rows.length}
                      className="px-4 py-3 space-x-4 text-center align-middle"
                    >
                      <button
                        onClick={() => {
                          const order = orders.find(
                            (o) => o.id === row.orderId
                          );
                          if (order) {
                            setSelectedOrder(order);
                            setModalOpen(true);
                          }
                        }}
                        aria-label={`View order #${row.orderId} details`}
                        className="inline-flex items-center justify-center p-1 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        type="button"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  )}
                </tr>
              ));
            })}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {selectedOrder && (
        <Modal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedOrder(null);
          }}
          maxWidth="max-w-4xl"
        >
          <h2 className="my-4 text-lg font-medium text-right">
            Order #{selectedOrder.id}
          </h2>
          <h3 className="mb-2 text-xl font-medium">Order Details</h3>

          <table className="w-full mb-6 text-sm border table-fixed">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="py-2 text-left w-[60%]">Product Name</th>
                <th className="py-2 text-left w-[20%]">Table Number</th>
                <th className="py-2 text-center w-[20%]">Quantity</th>
                <th className="py-2 text-right w-[20%]">Price</th>
              </tr>
            </thead>
            <tbody>
              {selectedOrder.items.map((item) => (
                <tr key={item.id} className="border-b">
                  <td className="py-1 w-[60%]">{item.name}</td>
                  <td className="py-1 text-center w-[20%]">
                    {selectedOrder.table_number}
                  </td>
                  <td className="py-1 text-center w-[20%]">{item.quantity}</td>
                  <td className="py-1 text-right w-[20%]">
                    ₱{Number(item.price).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mb-6">
            <p className="mb-1 text-lg font-medium">Payment Method</p>
            <p className="text-sm">
              {formatPaymentMethod(selectedOrder.payment_method)}
            </p>
          </div>

          {selectedOrder.payment_status !== 'canceled' && (
            <div className="flex gap-3">
              <PrintReceipt
                order={{
                  ...selectedOrder,
                  created_at:
                    selectedOrder.created_at || new Date().toISOString(),
                }}
                onConfirm={() => {}}
              />

              {selectedOrder.payment_status === 'unpaid' && (
                <Button
                  onClick={() => handleBillOut(selectedOrder.id)}
                  disabled={updating}
                >
                  {updating ? 'Processing...' : 'Bill Out'}
                </Button>
              )}
            </div>
          )}
        </Modal>
      )}
    </>
  );
}
