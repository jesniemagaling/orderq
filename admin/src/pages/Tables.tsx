import { useEffect, useState } from 'react';
import api from '../lib/axios';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { debounce } from 'lodash';
import { adminSocket as socket } from '../lib/socket';
import { toast } from 'react-toastify';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: number;
  total_amount: number;
  status: string;
  payment_status: string;
  payment_method: string;
  created_at: string;
  items: OrderItem[];
  is_additional?: boolean;
}

interface Table {
  id: number;
  table_number: string;
  status: 'available' | 'occupied' | 'in_progress' | 'served' | 'canceled';
  has_additional_order?: boolean;
  has_canceled_order?: boolean;
  sessionToken?: string;
}

interface TableDetailsResponse {
  table: Table;
  session: { id: number; token: string } | null;
  orders: Order[];
  has_additional_order: boolean;
}

export default function Tables() {
  const [tables, setTables] = useState<Table[]>([]);
  const [allQR, setAllQR] = useState<any[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTable, setLoadingTable] = useState<number | null>(null);
  const [printOrder, setPrintOrder] = useState<Order | null>(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrPreview, setQrPreview] = useState<string | null>(null);
  const [qrTableNumber, setQrTableNumber] = useState<string | null>(null);

  const debouncedFetchTableOrders = debounce((tableId: number) => {
    fetchTableOrders(tableId);
  }, 1000);

  // Fetch all tables from API
  const fetchTables = async () => {
    try {
      const res = await api.get<Table[]>('/tables');
      const sorted = res.data.sort(
        (a, b) => Number(a.table_number) - Number(b.table_number)
      );
      setTables(sorted);
    } catch (err) {
      console.error('Failed to load tables', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllQR = async () => {
    try {
      const res = await api.get('/tables/qr/all');
      setAllQR(res.data);
    } catch (err) {
      console.error('Failed to fetch QR list', err);
    }
  };

  // Establish socket and handle incoming updates
  useEffect(() => {
    fetchTables();
    fetchAllQR();

    socket.on('connect', () => {
      console.log('Connected to WebSocket server');
    });

    socket.on('disconnect', () => {
      console.warn('Disconnected from WebSocket server');
    });

    socket.on('newOrder', (data: { tableId: number }) => {
      console.warn('Received new order for table:', data.tableId);

      setTables((prev) =>
        prev.map((t) =>
          t.id === data.tableId ? { ...t, has_additional_order: true } : t
        )
      );

      // Optionally refresh if the same table is open
      setSelectedTable((prev) => {
        if (prev && prev.id === data.tableId) {
          debouncedFetchTableOrders(data.tableId);
        }
        return prev;
      });
    });

    socket.on('tableStatusUpdate', ({ tableId, status }) => {
      console.log('Table status updated:', tableId, status);

      setTables((prev) =>
        prev.map((t) => (t.id === tableId ? { ...t, status } : t))
      );

      setSelectedTable((prev) =>
        prev && prev.id === tableId ? { ...prev, status } : prev
      );
    });

    return () => {
      socket.off('newOrder');
      socket.off('tableStatusUpdate');
      socket.off('connect');
      socket.off('disconnect');
    };
  }, []);

  useEffect(() => {
    const handleOrderCancelled = (data: {
      tableId: number;
      orderId: number;
    }) => {
      console.log('Order cancelled:', data);

      setTables((prev) =>
        prev.map((t) =>
          t.id === data.tableId ? { ...t, has_canceled_order: true } : t
        )
      );

      if (selectedTable?.id === data.tableId) {
        setOrders((prev) =>
          prev.map((order) =>
            order.id === data.orderId ? { ...order, status: 'canceled' } : order
          )
        );
        setTables((prev) =>
          prev.map((t) =>
            t.id === data.tableId ? { ...t, has_canceled_order: false } : t
          )
        );
      }
    };

    socket.on('orderCancelled', handleOrderCancelled);
    return () => {
      socket.off('orderCancelled', handleOrderCancelled);
    };
  }, [selectedTable]);

  // Fetch specific table’s orders
  const fetchTableOrders = async (tableId: number) => {
    if (loadingTable === tableId) return;
    setLoadingTable(tableId);

    try {
      const res = await api.get<TableDetailsResponse>(
        `/tables/${tableId}/details`
      );
      const data = res.data;

      setOrders(data.orders);
      setTables((prev) =>
        prev.map((t) =>
          t.id === tableId
            ? {
                ...t,
                has_additional_order: false,
                sessionToken: data.session?.token,
              }
            : t
        )
      );

      setSelectedTable((prev) =>
        prev && prev.id === tableId
          ? {
              ...prev,
              sessionToken: data.session?.token,
              has_additional_order: false,
            }
          : prev
      );
    } catch (err) {
      console.error('Failed to load table orders', err);
    } finally {
      setLoadingTable(null);
    }
  };

  const handleTableClick = (table: Table) => {
    setSelectedTable(table);
    fetchTableOrders(table.id);
  };

  const handlePrintInvoice = (order: Order) => {
    setPrintOrder(order);
  };

  const handleConfirmPrint = async () => {
    if (printOrder) {
      try {
        window.print();
        await api.post(`/orders/${printOrder.id}/confirm`);

        setOrders((prev) =>
          prev.map((order) =>
            order.id === printOrder.id
              ? { ...order, status: 'unserved' }
              : order
          )
        );

        if (selectedTable) {
          setTables((prev) =>
            prev.map((t) =>
              t.id === selectedTable.id ? { ...t, status: 'in_progress' } : t
            )
          );
        }

        setPrintOrder(null);
        console.log(`Order #${printOrder.id} confirmed and updated`);
      } catch (error) {
        console.error('Failed to confirm order:', error);
      }
    }
  };

  const handleEndSession = async (tableId: number) => {
    const table = tables.find((t) => t.id === tableId);

    if (!table?.sessionToken) {
      console.error('No active session token for this table');
      return;
    }

    try {
      await api.post(`/sessions/end/${table.sessionToken}`);

      setSelectedTable(null);
      setOrders([]);

      setTables((prev) =>
        prev.map((t) =>
          t.id === tableId
            ? {
                ...t,
                status: 'available',
                has_additional_order: false,
                sessionToken: undefined,
              }
            : t
        )
      );

      console.log(`Session for table ${tableId} ended`);
    } catch (err) {
      console.error('Failed to end session', err);
    }
  };

  const handleShowQR = async (table: Table) => {
    try {
      const qrData = allQR.find((x) => x.id === table.id);

      if (!qrData?.qr_image_url) {
        alert('No QR found for this table.');
        return;
      }

      setQrPreview(qrData.qr_image_url);
      setQrTableNumber(table.table_number);
      setQrModalOpen(true);
    } catch (err) {
      console.error('Failed to show QR code', err);
      alert('Failed to load QR code.');
    }
  };

  const handleRegenerateAllQR = async () => {
    const ok = confirm(
      'Are you sure you want to regenerate all QR codes? This will overwrite existing QR codes.'
    );
    if (!ok) return;

    try {
      toast.info('Regenerating all QR codes...');

      await api.post('/tables/qr/regenerate');
      await fetchAllQR();

      toast.success('All QR codes regenerated successfully!');
    } catch (err) {
      console.error('Failed to regenerate QR codes', err);
      toast.error('Failed to regenerate QR codes');
    }
  };

  const handleAddTable = async () => {
    try {
      const last = tables[tables.length - 1];
      const newNumber = last ? Number(last.table_number) + 1 : 1;

      const res = await api.post('/tables', {
        table_number: String(newNumber),
      });

      const created = res.data;

      try {
        await api.post(`/tables/${created.id}/qr`);
      } catch (qrErr) {
        console.error('QR generation failed', qrErr);
      }

      await fetchTables();
      await fetchAllQR();

      toast.success(`Table #${newNumber} added successfully`);
    } catch (err) {
      console.error('Failed to add table:', err);
      toast.error('Failed to add table');
    }
  };

  const handleDeleteTable = async (tableId: number) => {
    const ok = confirm('Are you sure you want to delete this table?');
    if (!ok) return;

    try {
      await api.delete(`/tables/${tableId}`);
      await fetchTables();
      await fetchAllQR();

      toast.success('Table deleted');
    } catch (err) {
      console.error('Delete failed:', err);
      toast.error('Failed to delete table');
    }
  };

  if (loading) return <p>Loading tables...</p>;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'text-green-500';
      case 'occupied':
        return 'text-red-600';
      case 'in_progress':
        return 'text-yellow-500';
      case 'served':
        return 'text-blue-400';
      default:
        return 'text-gray-500';
    }
  };

  const formatPaymentMethod = (method: string) => {
    switch (method) {
      case 'cash':
        return 'Cash';
      case 'card':
        return 'Card';
      case 'gcash':
        return 'GCash';
      default:
        return method || '-';
    }
  };

  return (
    <div className="flex gap-10">
      {/* Tables list */}
      <div className="w-1/2">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold">All Tables</h1>

          <div className="flex gap-2">
            <Button onClick={handleAddTable}>Add New Table</Button>

            <Button onClick={handleRegenerateAllQR}>Regenerate All QR</Button>
          </div>
        </div>

        {tables.length === 0 ? (
          <p className="text-gray-500">No tables found.</p>
        ) : (
          <div className="space-y-4 max-h-[820px] overflow-y-auto pr-4">
            {tables.map((table) => (
              <div
                key={table.id}
                className={`relative flex justify-between items-center rounded-xl p-4 shadow transition ${
                  selectedTable?.id === table.id
                    ? 'bg-primary text-white'
                    : 'bg-white hover:bg-gray-50'
                }`}
              >
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() => handleTableClick(table)}
                >
                  <p className="text-lg font-medium">
                    Table #{table.table_number}
                  </p>

                  <p
                    className={`text-sm font-medium ${
                      selectedTable?.id === table.id
                        ? 'text-white'
                        : getStatusColor(table.status)
                    }`}
                  >
                    {table.status
                      .replace('_', ' ')
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                  </p>
                </div>

                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteTable(table.id);
                  }}
                >
                  Delete
                </Button>

                {(table.has_additional_order || table.has_canceled_order) && (
                  <span className="absolute w-3 h-3 bg-red-600 rounded-full top-1 right-1 animate-pulse" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Orders panel */}
      <div className="flex-1 px-2 py-4">
        {selectedTable ? (
          <>
            <div className="flex items-center gap-2 mb-6 text-lg font-medium">
              <span className="px-2">Table#: {selectedTable.table_number}</span>
              <Button onClick={() => handleShowQR(selectedTable)}>
                View QR
              </Button>
              {selectedTable.sessionToken && (
                <Button onClick={() => handleEndSession(selectedTable.id)}>
                  End Session
                </Button>
              )}
            </div>

            {orders.length > 0 ? (
              <div className="max-h-[740px] overflow-y-auto">
                {orders.map((order, orderIdx) => (
                  <div
                    key={order.id}
                    className={`px-4 mb-8 border-b ${
                      order.status === 'canceled' ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xl font-semibold">
                        {orderIdx === 0
                          ? 'Main Order'
                          : `Additional Order #${orderIdx}`}
                        <span className="ml-2 text-sm text-gray-500">
                          (
                          {new Date(order.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          )
                        </span>
                      </h3>

                      {order.status === 'pending' && (
                        <Button
                          className="bg-primary"
                          onClick={() => handlePrintInvoice(order)}
                        >
                          Print Invoice
                        </Button>
                      )}

                      {order.status === 'canceled' && (
                        <span className="px-2 py-1 text-sm font-semibold border rounded text-primary border-primary">
                          Cancelled
                        </span>
                      )}
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
                        {order.items.map((item, idx) => (
                          <tr key={idx} className="border-b">
                            <td className="py-1 w-[60%]">{item.name}</td>
                            <td className="py-1 text-center w-[20%]">
                              {item.quantity}
                            </td>
                            <td className="py-1 text-right w-[20%]">
                              ₱{(item.price * item.quantity).toLocaleString()}
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
                No orders for this table.
              </p>
            )}
          </>
        ) : (
          <p className="mt-10 text-center text-gray-500">
            Select a table to view details
          </p>
        )}
      </div>

      {/* Print Order Modal */}
      <Modal
        isOpen={!!printOrder}
        onClose={() => setPrintOrder(null)}
        maxWidth="max-w-sm"
        title={
          printOrder
            ? printOrder.is_additional
              ? `Additional Order #${orders.findIndex(
                  (o) => o.id === printOrder.id
                )}`
              : 'Main Order'
            : ''
        }
      >
        {printOrder && (
          <>
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
                    {printOrder.items.map((item, i) => {
                      const price = Number(item.price) || 0;
                      const qty = Number(item.quantity) || 0;
                      return (
                        <tr key={i} className="border-t hover:bg-primary/5">
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
                  {formatPaymentMethod(printOrder.payment_method)}
                </p>
              </div>

              <div className="p-4 text-right border rounded-xl">
                <p className="text-sm text-gray-500">Total Amount</p>
                <p className="mt-1 text-2xl font-semibold">
                  ₱{Number(printOrder.total_amount).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 mt-6 border-t">
              <Button variant="primary" onClick={handleConfirmPrint}>
                Confirm Print
              </Button>
            </div>
          </>
        )}
      </Modal>

      {/* QR Modal */}
      <Modal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        title={`Table #${qrTableNumber} QR Code`}
        maxWidth="max-w-xs"
      >
        <div className="text-center">
          {qrPreview ? (
            <img
              src={qrPreview}
              alt="QR Code"
              className="w-64 h-64 p-2 mx-auto mb-4 bg-white border rounded-lg"
            />
          ) : (
            <p>Loading QR...</p>
          )}

          <Button
            className="w-full bg-primary"
            onClick={async () => {
              if (!qrPreview) return;
              const response = await fetch(qrPreview);
              const blob = await response.blob();
              const link = document.createElement('a');
              link.href = URL.createObjectURL(blob);
              link.download = `Table-${qrTableNumber}-QR.png`;
              link.click();
            }}
          >
            Download QR
          </Button>
        </div>
      </Modal>
    </div>
  );
}
