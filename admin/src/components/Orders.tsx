import { useEffect, useState, useRef } from 'react';
import api from '../lib/axios';
import Button from '../components/ui/Button';
import PrintReceipt from '../components/PrintReceipt';
import { Eye } from 'lucide-react';
import Modal from './ui/Modal';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { useNavigate } from 'react-router';

interface Order {
  id: number;
  table_number: number;
  table_id: string;
  payment_status: 'unpaid' | 'paid' | 'canceled' | 'retracted';
  total_amount: number;
  payment_method: string;
  created_at?: string;
  retract_reason?: string;
  items: {
    id: number;
    name: string;
    quantity: number;
    price: number;
  }[];
}

interface SortConfig {
  key: 'order_id' | 'table_number' | 'price' | 'quantity' | 'products' | null;
  direction: 'asc' | 'desc';
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [filter, setFilter] = useState<
    'all' | 'unpaid' | 'paid' | 'canceled' | 'retracted'
  >('all');

  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: null,
    direction: 'asc',
  });
  const navigate = useNavigate();

  const [retractModalOpen, setRetractModalOpen] = useState(false);
  const [retractReason, setRetractReason] = useState('');
  const [isRetracting, setIsRetracting] = useState(false);

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

  const formatCurrency = (value: number | string) =>
    Number(value).toLocaleString('en-PH', {
      maximumFractionDigits: 0,
    });

  const getUniqueProductsLabel = (order: Order) =>
    `${order.items.length} product${order.items.length > 1 ? 's' : ''}`;

  const formatPaymentMethod = (method: string) =>
    method
      ? method.charAt(0).toUpperCase() + method.slice(1).toLowerCase()
      : '';

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text('Orders Report', 14, 15);

    autoTable(doc, {
      startY: 20,
      head: [
        ['Order #', 'Table', 'Status', 'Products (Unique)', 'Qty', 'Amount'],
      ],
      body: filteredOrders.map((o) => [
        `#${o.id}`,
        o.table_number,
        o.payment_status,
        o.items.length,
        getTotalQuantity(o),
        (Number(o.total_amount) || 0).toFixed(2),
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
      Products: o.items.length,
      'Total Quantity': getTotalQuantity(o),
      Amount: o.total_amount,
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
      case 'retracted':
        return 'text-orange-600';
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

  const handleRetractOrder = (order: Order) => {
    if (order.payment_status !== 'unpaid') return;

    setSelectedOrder(order);
    setRetractReason('');
    setRetractModalOpen(true);
  };

  const handleRetractSubmit = async (orderId: number) => {
    if (!retractReason.trim()) return;

    setIsRetracting(true);

    try {
      await api.put(`/orders/${orderId}/retract`, { reason: retractReason });

      // Update local orders
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                payment_status: 'retracted',
                retract_reason: retractReason,
              }
            : o
        )
      );

      // Update modal if currently viewing
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({
          ...selectedOrder,
          payment_status: 'retracted',
          retract_reason: retractReason,
        });
      }

      setRetractModalOpen(false);
      setRetractReason('');
    } catch (err) {
      console.error('Failed to retract order', err);
      alert('Failed to retract order.');
    } finally {
      setIsRetracting(false);
    }
  };

  const getTotalQuantity = (order: Order) =>
    order.items.reduce((sum, i) => sum + i.quantity, 0);
  // Apply filter and search
  const filteredOrders = orders.filter((o) => {
    if (filter !== 'all' && o.payment_status !== filter) return false;
    if (!search) return true;

    const term = search.toLowerCase();

    // Order-level fields
    if (o.id.toString().includes(term)) return true;
    if (o.table_number.toString().includes(term)) return true;
    if (o.payment_status.toLowerCase().includes(term)) return true;

    // Products
    if (o.items.length.toString().includes(term)) return true;

    // Total Quantity
    if (getTotalQuantity(o).toString().includes(term)) return true;

    // Total Amount
    if (Number(o.total_amount).toString().includes(term)) return true;

    // Product names (still useful)
    if (o.items.some((i) => i.name.toLowerCase().includes(term))) return true;

    return false;
  });

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    if (!sortConfig.key) return a.id - b.id;

    let valA = 0;
    let valB = 0;

    switch (sortConfig.key) {
      case 'order_id':
        valA = a.id;
        valB = b.id;
        break;

      case 'table_number':
        valA = a.table_number;
        valB = b.table_number;
        break;

      case 'quantity':
        valA = getTotalQuantity(a);
        valB = getTotalQuantity(b);
        break;

      case 'price':
        valA = Number(a.total_amount);
        valB = Number(b.total_amount);
        break;

      case 'products':
        valA = a.items.length;
        valB = b.items.length;
        break;
    }

    return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
  });

  const handleSort = (key: SortConfig['key']) => {
    setSortConfig((prev) => ({
      key,
      direction:
        prev.key === key
          ? prev.direction === 'asc'
            ? 'desc'
            : 'asc'
          : key === 'order_id' || key === 'price' || key === 'quantity'
          ? 'desc'
          : 'asc',
    }));
  };

  if (loading) return <p>Loading orders...</p>;

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-3xl font-bold">Orders</h1>
        <Button
          className="flex items-center gap-2"
          onClick={() => navigate('/order-logs')}
        >
          Orders Audit
        </Button>
      </div>

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
          <p className="text-sm text-gray-500">Total Sales</p>₱
          {formatCurrency(
            orders
              .filter((o) => o.payment_status === 'paid')
              .reduce((s, o) => s + Number(o.total_amount), 0)
          )}
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-4 mt-2 text-sm font-semibold">
          {['all', 'unpaid', 'paid', 'canceled', 'retracted'].map((f) => (
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
      <div className="overflow-x-auto overflow-y-auto border shadow-inner rounded-xl max-h-[640px]">
        <table className="min-w-full text-sm border-collapse table-auto">
          <thead className="sticky top-0 z-10 text-white bg-primary">
            <tr>
              <th
                className="px-4 py-3 text-center cursor-pointer select-none"
                onClick={() => handleSort('order_id')}
              >
                Order #
                <span className="ml-1">
                  {sortConfig.key === 'order_id'
                    ? sortConfig.direction === 'asc'
                      ? '↓'
                      : '↑'
                    : '⇅'}
                </span>
              </th>

              <th
                className="px-4 py-3 text-center cursor-pointer select-none"
                onClick={() => handleSort('products')}
              >
                Products
                <span className="ml-1">
                  {sortConfig.key === 'products'
                    ? sortConfig.direction === 'asc'
                      ? '↓'
                      : '↑'
                    : '⇅'}
                </span>
              </th>

              <th
                className="px-4 py-3 text-center cursor-pointer"
                onClick={() => handleSort('table_number')}
              >
                Table Number{' '}
                <span className="ml-1">
                  {sortConfig.key === 'table_number'
                    ? sortConfig.direction === 'asc'
                      ? '↓'
                      : '↑'
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
                      ? '↓'
                      : '↑'
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
                      ? '↓'
                      : '↑'
                    : '⇅'}
                </span>
              </th>
              <th className="px-4 py-3 text-center">Payment Method</th>
              <th className="py-2 text-center">Status</th>
              <th className="px-4 py-3 text-center">Action</th>
            </tr>
          </thead>

          <tbody>
            {sortedOrders.length === 0 && (
              <tr>
                <td colSpan={8} className="p-6 text-center text-gray-500">
                  No orders found.
                </td>
              </tr>
            )}

            {sortedOrders.map((order) => (
              <tr key={order.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 font-semibold text-center cursor-pointer hover:underline">
                  #{order.id}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="font-medium">
                    {getUniqueProductsLabel(order)}
                  </span>

                  {search &&
                    order.items.some((i) =>
                      i.name.toLowerCase().includes(search.toLowerCase())
                    ) && (
                      <span className="block text-xs text-primary">
                        matching product
                      </span>
                    )}
                </td>
                <td className="px-4 py-3 text-center">{order.table_number}</td>
                <td className="px-4 py-3 text-center">
                  {getTotalQuantity(order)}
                </td>
                <td className="px-4 py-3 text-center">
                  ₱{formatCurrency(order.total_amount)}
                </td>

                <td className="px-4 py-3 text-center">
                  {formatPaymentMethod(order.payment_method)}
                </td>
                <td
                  className={`text-center font-medium ${getStatusColor(
                    order.payment_status
                  )}`}
                >
                  {order.payment_status.charAt(0).toUpperCase() +
                    order.payment_status.slice(1)}
                </td>
                <td className="flex items-center justify-center px-4 py-3 space-x-2 text-center">
                  <button
                    onClick={() => {
                      setSelectedOrder(order);
                      setModalOpen(true);
                    }}
                    className="inline-flex p-1 rounded hover:bg-gray-200"
                    title="View Order"
                  >
                    <Eye size={18} />
                  </button>

                  {order.payment_status === 'unpaid' && (
                    <Button
                      size="sm"
                      onClick={() => handleRetractOrder(order)}
                      disabled={updating || isRetracting}
                    >
                      Retract
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {selectedOrder && (
        <Modal
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          title={`Order Details`}
          maxWidth="max-w-4xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 mb-4 border-b">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                Order #{selectedOrder.id}
              </h2>
              <p className="text-sm text-gray-500">
                Table {selectedOrder.table_number ?? '-'} ·{' '}
                {selectedOrder.created_at
                  ? new Date(selectedOrder.created_at).toLocaleString()
                  : ''}
              </p>
            </div>

            <span
              className={`px-3 py-1 text-xs font-medium rounded-full ${
                selectedOrder.payment_status === 'paid'
                  ? 'bg-green-100 text-green-700'
                  : selectedOrder.payment_status === 'unpaid'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {selectedOrder.payment_status}
            </span>
          </div>

          {/* Items Table */}
          <div className="mb-6 overflow-hidden border rounded-xl">
            <div className="max-h-[280px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 text-white bg-primary">
                  <tr>
                    <th className="px-4 py-3 text-left w-[45%]">Product</th>
                    <th className="px-4 py-3 text-center w-[15%]">Qty</th>
                    <th className="px-4 py-3 text-right w-[20%]">Price</th>
                    <th className="px-4 py-3 text-right w-[20%]">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items.map((item, index) => {
                    const price = Number(item.price) || 0;
                    const qty = Number(item.quantity) || 0;

                    return (
                      <tr
                        key={`${selectedOrder.id}-${index}`}
                        className="border-t hover:bg-primary/5"
                      >
                        <td className="px-4 py-2">{item.name}</td>
                        <td className="px-4 py-2 text-center">{qty}</td>
                        <td className="px-4 py-2 text-right">
                          ₱{price.toLocaleString()}
                        </td>
                        <td className="px-4 py-2 font-medium text-right">
                          ₱{(price * qty).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary */}
          <div className="grid gap-4 mb-6 md:grid-cols-2">
            <div className="p-4 border rounded-xl">
              <p className="text-sm text-gray-500">Payment Method</p>
              <p className="mt-1 font-medium">
                {formatPaymentMethod(selectedOrder.payment_method)}
              </p>
            </div>

            <div className="p-4 text-right border rounded-xl">
              <p className="text-sm text-gray-500">Total Amount</p>
              <p className="mt-1 text-2xl font-semibold">
                ₱{formatCurrency(selectedOrder.total_amount)}
              </p>
            </div>
          </div>

          {/* Actions: Print allowed for paid & unpaid */}
          {['unpaid', 'paid'].includes(selectedOrder.payment_status) && (
            <div className="flex justify-end gap-3 pt-4 mt-6 border-t">
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
                  variant="primary"
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

      {retractModalOpen && selectedOrder && (
        <Modal
          isOpen={retractModalOpen}
          onClose={() => setRetractModalOpen(false)}
          maxWidth="max-w-lg"
        >
          <h2 className="mb-2 text-xl font-semibold">
            Retract Order #{selectedOrder.id}
          </h2>
          <p className="mb-4 text-sm text-gray-500">
            Please provide a reason for retracting this order.
          </p>

          <textarea
            className="w-full p-3 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/60"
            rows={4}
            value={retractReason}
            onChange={(e) => setRetractReason(e.target.value)}
            placeholder="Enter reason..."
          />

          <div className="flex justify-end gap-2 mt-6">
            <Button
              variant="secondary"
              onClick={() => setRetractModalOpen(false)}
              disabled={isRetracting}
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleRetractSubmit(selectedOrder.id)}
              disabled={isRetracting || !retractReason.trim()}
            >
              {isRetracting ? 'Retracting...' : 'Retract'}
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
