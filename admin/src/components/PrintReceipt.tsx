import React from 'react';
import api from '../lib/axios';
import Button from './ui/Button';

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

interface PrintReceiptProps {
  order: Order;
  onConfirm?: () => void; // optional callback after confirm
}

export default function PrintReceipt({ order, onConfirm }: PrintReceiptProps) {
  const formatPaymentMethod = (method: string) => {
    if (!method) return '';
    return method.charAt(0).toUpperCase() + method.slice(1).toLowerCase();
  };

  const handlePrint = async () => {
    try {
      // Open a new window for printing
      const printWindow = window.open('', '_blank');

      if (!printWindow) {
        alert('Popup blocked! Please allow popups for this site.');
        return;
      }

      const htmlContent = `
        <html>
          <head>
            <title>Order #${order.id} Receipt</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1 { text-align: center; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f4f4f4; }
              .total { font-weight: bold; text-align: right; margin-top: 10px; }
              .payment { margin-top: 5px; }
            </style>
          </head>
          <body>
            <h1>Order #${order.id} Receipt</h1>
            <p><strong>Table:</strong> ${order.table_id}</p>
            <table>
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Quantity</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                ${order.items
                  .map(
                    (item) => `
                  <tr>
                    <td>${item.name}</td>
                    <td>${item.quantity}</td>
                    <td>₱${item.price.toLocaleString()}</td>
                  </tr>
                `
                  )
                  .join('')}
              </tbody>
            </table>
            <p class="total">Total: ₱${order.total_amount.toLocaleString()}</p>
            <p class="payment"><strong>Payment Method:</strong> ${formatPaymentMethod(
              order.payment_method
            )}</p>
          </body>
        </html>
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();

      // Call optional callback
      if (onConfirm) onConfirm();
      console.log(`Order #${order.id} printed and confirmed`);
    } catch (error) {
      console.error('Failed to print order:', error);
    }
  };

  return <Button onClick={handlePrint}>Print Receipt</Button>;
}
