import { useEffect, useState } from 'react';
import api from '../lib/axios';
import Button from '../components/ui/Button';
import PrintReceipt from '../components/PrintReceipt';

interface Order {
  id: number;
  table_id: string;
  payment_status: string;
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

      // update order state locally
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, payment_status: 'paid' } : order
        )
      );

      // also update selected order if currently open
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

  return (
    <>
      <h1 className="text-3xl font-bold mb-6">Orders</h1>
      <div className="flex gap-10">
        <div className="w-1/2 max-h-[820px] overflow-y-auto pr-2">
          {orders.length === 0 ? (
            <p className="text-gray-500">No orders found.</p>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
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
                    <p className="font-medium text-lg">Order #{order.id}</p>
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
                        order.payment_status === 'paid'
                          ? selectedOrder?.id === order.id
                            ? 'text-blue-300'
                            : 'text-blue-500'
                          : selectedOrder?.id === order.id
                          ? 'text-yellow-200'
                          : 'text-yellow-600'
                      }`}
                    >
                      {order.payment_status === 'paid' ? 'Paid' : 'Unpaid'}
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

        <div className="flex-1 py-4 px-2">
          {selectedOrder ? (
            <>
              <h2 className="text-lg text-right font-medium mb-3">
                Order #{selectedOrder.id}
              </h2>
              <h3 className="text-xl font-medium mb-2">Order Details</h3>

              <table className="w-full text-sm mb-6 table-fixed">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 text-left w-[60%]">Product Name</th>
                    <th className="py-2 text-left w-[20%]">Table Number</th>
                    <th className="py-2 text-center w-[20%]">Quantity</th>
                    <th className="py-2 text-right w-[20%]">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items?.map((item) => (
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
                <p className="font-medium text-lg mb-1">Payment Method</p>
                <p className="text-sm ">
                  {formatPaymentMethod(selectedOrder.payment_method)}
                </p>
              </div>

              {selectedOrder && (
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
                  {selectedOrder.payment_status !== 'paid' && (
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
            <p className="text-gray-500 mt-10 text-center">
              Select an order to view details
            </p>
          )}
        </div>
      </div>
    </>
  );
}
