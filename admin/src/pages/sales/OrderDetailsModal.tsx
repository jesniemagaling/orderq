// src/components/sales/OrderDetailsModal.tsx
import React from 'react';
import Button from '../../components/ui/Button';
import api from '../../lib/axios';
import { toast } from 'react-toastify';

interface Props {
  open: boolean;
  order: any | null;
  onClose: () => void;
}

export default function OrderDetailsModal({ open, order, onClose }: Props) {
  if (!open) return null;

  const handleMarkPaid = async () => {
    try {
      await api.put(`/orders/${order.id}/pay`); // adjust if endpoint differs
      toast.success('Order marked as paid');
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Failed to mark paid');
    }
  };

  const handleMarkServed = async () => {
    try {
      await api.put(`/orders/${order.id}/serve`);
      toast.success('Order marked as served');
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Failed to mark served');
    }
  };

  const handleCancel = async () => {
    try {
      await api.delete(`/orders/${order.id}`); // if your cancel endpoint differs adjust
      toast.success('Order canceled');
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Failed to cancel order');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black opacity-40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl p-6 bg-white rounded-lg shadow-lg">
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-semibold">Order #{order?.id}</h3>
          <button onClick={onClose} className="text-gray-500">
            Close
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <p className="text-sm text-gray-500">Table</p>
            <div className="font-medium">
              {order?.table_number ?? order?.table_id}
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-500">Created</p>
            <div className="font-medium">
              {new Date(order?.created_at).toLocaleString()}
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-500">Payment</p>
            <div className="font-medium">
              {order?.payment_method} / {order?.payment_status}
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-500">Total</p>
            <div className="font-medium">
              ₱{Number(order?.total_amount || 0).toFixed(2)}
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h4 className="mb-2 font-semibold">Items</h4>
          <div className="space-y-2">
            {(order?.items || []).map((it: any, i: number) => (
              <div key={i} className="flex justify-between">
                <div>{it.name}</div>
                <div className="text-sm text-gray-600">
                  {it.quantity} × ₱{Number(it.price).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6">
          <Button variant="secondary" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleMarkServed}>Mark Served</Button>
          <Button variant="primary" onClick={handleMarkPaid}>
            Mark Paid
          </Button>
        </div>
      </div>
    </div>
  );
}
