import { useEffect, useState, useMemo } from 'react';
import { adminSocket } from '../lib/socket';
import api from '../lib/axios';
import Button from '../components/ui/Button';
import { playNotificationSound } from '../lib/sound';
import AutoRefreshSelect from '../components/ui/AutoRefreshSelect';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: number;
  total_amount: number;
  status: string;
  created_at: string;
  waiting_minutes?: number;
  estimated_ready_at?: string | null;
  items: OrderItem[];
  table_id: number;
  table_number: string;
}

interface Table {
  id: number;
  table_number: string;
  status: string;
}

export default function KitchenOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const [tableOrders, setTableOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [tablesWithNotif, setTablesWithNotif] = useState<number[]>([]);
  const [refreshRate, setRefreshRate] = useState(30);

  // Fetch all tables (including available)
  const fetchTables = async () => {
    try {
      const res = await api.get<Table[]>('/tables');
      setTables(res.data);
    } catch (err) {
      console.error('Failed to fetch tables', err);
    }
  };

  // Fetch all orders
  const fetchOrders = async () => {
    try {
      const res = await api.get<Order[]>('/orders');
      setOrders(res.data);
    } catch (err) {
      console.error('Failed to load orders', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch orders for a specific table
  const fetchOrdersForTable = async (tableId: number) => {
    try {
      const res = await api.get(`/tables/${tableId}/details`);
      const data = res.data.orders;

      const filtered = data.filter(
        (order: Order) =>
          order.status === 'unserved' || order.status === 'served',
      );

      const sorted = filtered.sort((a: Order, b: Order) =>
        a.created_at.localeCompare(b.created_at),
      );

      setTableOrders(sorted);
    } catch (err) {
      console.error('Failed to fetch table orders', err);
    }
  };

  // Initial load + socket events
  useEffect(() => {
    const init = async () => {
      await fetchTables();
      await fetchOrders();
    };
    init();

    adminSocket.on('newOrder', async ({ tableId, confirmed }) => {
      if (!confirmed) return;
      playNotificationSound();

      setTablesWithNotif((prev) =>
        prev.includes(tableId) ? prev : [...prev, tableId],
      );

      await fetchOrders();
      await fetchTables();

      if (selectedTableId === tableId) {
        await fetchOrdersForTable(tableId);
        setTablesWithNotif((prev) => prev.filter((id) => id !== tableId));
      }
    });

    adminSocket.on('tableStatusUpdate', async ({ tableId }) => {
      await fetchOrders();
      await fetchTables();

      if (selectedTableId === tableId) {
        await fetchOrdersForTable(tableId);
      }
    });

    return () => {
      adminSocket.off('newOrder');
      adminSocket.off('tableStatusUpdate');
    };
  }, [selectedTableId]);

  useEffect(() => {
    if (!refreshRate) return;
    const id = window.setInterval(async () => {
      await fetchTables();
      await fetchOrders();
      if (selectedTableId) await fetchOrdersForTable(selectedTableId);
    }, refreshRate * 1000);

    return () => window.clearInterval(id);
  }, [refreshRate, selectedTableId]);

  const handleTableClick = (tableId: number) => {
    setSelectedTableId(tableId);
    fetchOrdersForTable(tableId);
    setTablesWithNotif((prev) => prev.filter((id) => id !== tableId));
  };

  const formatRemaining = (estimatedReadyAt?: string | null) => {
    if (!estimatedReadyAt) return '—';
    const diff = new Date(estimatedReadyAt).getTime() - Date.now();
    if (diff <= 0) return 'Ready now';
    const totalSeconds = Math.floor(diff / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}m ${secs}s`;
  };

  const handleExtendEstimate = async (orderId: number, minutes: number) => {
    try {
      await api.put(`/orders/${orderId}/estimate`, { add_minutes: minutes });
      if (selectedTableId) {
        await fetchOrdersForTable(selectedTableId);
      }
      await fetchOrders();
    } catch (err) {
      console.error('Failed to extend estimate:', err);
    }
  };

  // Mark table orders as done (served)
  const handleMarkAsDone = async (tableId: number) => {
    try {
      const unservedOrders = tableOrders.filter((o) => o.status === 'unserved');
      for (const order of unservedOrders) {
        await api.put(`/orders/${order.id}/serve`);
      }

      await fetchOrders();
      await fetchTables();
      await fetchOrdersForTable(tableId);
    } catch (err) {
      console.error('Failed to mark as served:', err);
    }
  };

  // Combine table + order info
  const combinedTables = useMemo(() => {
    return tables.map((table, index) => {
      const relatedOrders = orders.filter((o) => o.table_id === table.id);
      const hasUnserved = relatedOrders.some((o) => o.status === 'unserved');
      const hasServed = relatedOrders.some((o) => o.status === 'served');
      const has_additional_order = tablesWithNotif.includes(table.id);

      return {
        ...table,
        displayNumber: index + 1,
        hasUnserved,
        hasServed,
        has_additional_order,
      };
    });
  }, [tables, orders, tablesWithNotif]);

  if (loading) return <p>Loading orders...</p>;

  return (
    <div className="flex gap-10">
      {/* Tables List */}
      <div className="w-1/2">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">All Tables</h1>
          <AutoRefreshSelect value={refreshRate} onChange={setRefreshRate} />
        </div>

        {combinedTables.length === 0 ? (
          <p className="text-gray-500">No tables found.</p>
        ) : (
          <div className="space-y-4 max-h-[820px] overflow-y-auto pr-4">
            {combinedTables.map((table) => (
              <div
                key={table.id}
                onClick={() => handleTableClick(table.id)}
                className={`relative cursor-pointer flex justify-between rounded-xl p-4 shadow transition ${
                  selectedTableId === table.id
                    ? 'bg-[#820D17] text-white'
                    : 'bg-white hover:bg-gray-50'
                }`}
              >
                <span className="text-lg font-medium">
                  Table #{table.displayNumber}
                </span>
                <span
                  className={`text-sm font-medium ${
                    selectedTableId === table.id
                      ? 'text-white'
                      : table.status === 'available'
                        ? 'text-green-500'
                        : table.hasUnserved
                          ? 'text-red-600'
                          : 'text-blue-400'
                  }`}
                >
                  {table.status
                    .replace('_', ' ')
                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                </span>

                {table.has_additional_order && (
                  <span className="absolute w-3 h-3 bg-red-600 rounded-full top-1 right-1 animate-pulse" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Table Orders */}
      <div className="flex-1 px-2 py-4">
        {selectedTableId ? (
          <>
            <h2 className="mb-6 text-lg font-medium text-right">
              Table #:{' '}
              {combinedTables.find((t) => t.id === selectedTableId)
                ?.table_number || '—'}
            </h2>

            {tableOrders.length > 0 ? (
              <div className="max-h-[740px] overflow-y-auto">
                {tableOrders.map((order, index) => (
                  <div
                    key={order.id}
                    className="px-4 mb-8 border border-gray-200 rounded-lg shadow-sm bg-gray-50"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xl font-semibold">
                        {index === 0
                          ? 'Main Order'
                          : `Additional Order #${index}`}
                        <span className="ml-2 text-sm text-gray-500">
                          (
                          {new Date(order.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          )
                        </span>
                      </h3>

                      {['pending', 'unserved', 'in_progress'].includes(
                        order.status,
                      ) && (
                        <div className="flex items-center gap-2">
                          <Button
                            className="px-2 py-2 text-sm text-white border-0 "
                            onClick={() => handleExtendEstimate(order.id, 5)}
                          >
                            +5 min
                          </Button>
                          <Button
                            className="bg-[#820D17] text-white text-sm px-4 py-2"
                            onClick={() => handleMarkAsDone(order.table_id)}
                          >
                            Done
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="mb-3 text-xs text-gray-600">
                      ETA:{' '}
                      <span className="font-semibold">
                        {formatRemaining(order.estimated_ready_at)}
                      </span>
                      {order.waiting_minutes ? (
                        <span className="ml-2">
                          ({order.waiting_minutes} min total)
                        </span>
                      ) : null}
                    </div>

                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="py-2 font-medium text-gray-600 text-left w-[60%]">
                            Product
                          </th>
                          <th className="py-2 font-medium text-gray-600 text-center w-[20%]">
                            Qty
                          </th>
                          <th className="py-2 font-medium text-gray-600 text-right w-[20%]">
                            Price
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.items.map((item, i) => (
                          <tr key={i} className="border-b">
                            <td className="py-2 w-[60%]">{item.name}</td>
                            <td className="py-2 text-center w-[20%]">
                              {item.quantity}
                            </td>
                            <td className="py-2 text-right w-[20%]">
                              ₱{item.price * item.quantity}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-10 text-center text-gray-500">
                No active orders for this table.
              </p>
            )}
          </>
        ) : (
          <p className="mt-10 text-center text-gray-500">
            Select a table to view orders.
          </p>
        )}
      </div>
    </div>
  );
}
