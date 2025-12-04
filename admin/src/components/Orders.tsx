import { useEffect, useState } from 'react';
import api from '../lib/axios';
import Button from '../components/ui/Button';
import PrintReceipt from '../components/PrintReceipt';

interface Order {
  id: number;
  table_id: string;
  payment_status: 'unpaid' | 'paid' | 'canceled';
  total_amount: number;
  payment_method: string;
  items: {
    id: number;
    name: string;
    quantity: number;
    price: number;
  }[];
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unpaid' | 'paid' | 'canceled'>(
    'all'
  );

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

  const formatPaymentMethod = (method: string) => {
    if (!method) return '';
    return method.charAt(0).toUpperCase() + method.slice(1).toLowerCase();
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
      console.error('Failed to mark as paid', err);
      alert('Failed to bill out. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <p>Loading orders...</p>;

  // Filter and sort orders
  const filteredOrders = orders
    .filter((o) => filter === 'all' || o.payment_status === filter)
    .sort((a, b) => {
      if (a.payment_status === 'unpaid' && b.payment_status !== 'unpaid')
        return -1;
      if (a.payment_status !== 'unpaid' && b.payment_status === 'unpaid')
        return 1;
      return b.id - a.id; // newest first
    });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'unpaid':
        return 'text-yellow-600';
      case 'paid':
        return 'text-blue-500';
      case 'canceled':
        return 'text-red-600';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <>
      <h1 className="mb-4 text-3xl font-bold">Orders</h1>

      {/* Filter Buttons */}
      <div className="flex gap-2 mb-6">
        {['all', 'unpaid', 'paid', 'canceled'].map((f) => (
          <Button
            key={f}
            className={filter === f ? 'bg-primary' : ''}
            onClick={() => setFilter(f as any)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </Button>
        ))}
      </div>

      <div className="flex gap-10">
        {/* Orders List */}
        <div className="w-1/2 max-h-[820px] overflow-y-auto pr-2">
          {filteredOrders.length === 0 ? (
            <p className="text-gray-500">No orders found.</p>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className={`cursor-pointer flex justify-between rounded-xl p-4 shadow transition ${
                    selectedOrder?.id === order.id
                      ? 'bg-primary text-white'
                      : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  <div>
                    <p className="text-lg font-medium">Order #{order.id}</p>
                    <p
                      className={`text-sm ${
                        selectedOrder?.id === order.id
                          ? 'text-white/60'
                          : 'text-gray-500'
                      }`}
                    >
                      Table: {order.table_id}
                    </p>
                  </div>

                  <div className="text-right">
                    <p
                      className={`text-sm font-medium ${
                        selectedOrder?.id === order.id
                          ? 'text-white/80'
                          : getStatusColor(order.payment_status)
                      }`}
                    >
                      {order.payment_status.charAt(0).toUpperCase() +
                        order.payment_status.slice(1)}
                    </p>
                    <p className="font-medium">
                      ₱{Number(order.total_amount).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Order Details */}
        <div className="flex-1 px-2 py-4">
          {selectedOrder ? (
            <>
              <h2 className="mb-3 text-lg font-medium text-right">
                Order #{selectedOrder.id}
              </h2>
              <h3 className="mb-2 text-xl font-medium">Order Details</h3>

              <table className="w-full mb-6 text-sm table-fixed">
                <thead>
                  <tr className="border-b">
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
                        {item.quantity}
                      </td>
                      <td className="py-1 text-center w-[20%]">
                        {item.quantity}
                      </td>
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

              {/* Action buttons (hide if canceled) */}
              {selectedOrder.payment_status !== 'canceled' && (
                <div className="flex gap-3">
                  <PrintReceipt
                    order={selectedOrder}
                    onConfirm={() => {
                      setOrders((prev) =>
                        prev.map((o) =>
                          o.id === selectedOrder.id
                            ? { ...o, status: 'unserved' }
                            : o
                        )
                      );
                    }}
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
            </>
          ) : (
            <p className="mt-10 text-center text-gray-500">
              Select an order to view details
            </p>
          )}
        </div>
      </div>
    </>
  );
}
