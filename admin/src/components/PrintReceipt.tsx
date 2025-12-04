import Button from './ui/Button';

interface Order {
  id: number;
  table_id: string;
  payment_status: string;
  total_amount: number;
  payment_method: string;
  created_at: string;
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
  const storeInfo = {
    store: 'OrderQ',
    address: 'Malolos, Bulacan\n12345 Capitol View',
    hours: '7:00 - 21:00',
    uid: 'CE12345678',
  };

  const formatPaymentMethod = (method: string) => {
    if (!method) return '';
    return method.charAt(0).toUpperCase() + method.slice(1).toLowerCase();
  };

  const handlePrint = async () => {
    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('Popup blocked! Please allow popups for this site.');
        return;
      }

      const totalAmount = Number(order.total_amount);
      const tax = totalAmount * 0.1;
      const totalWithTax = totalAmount + tax;

      const htmlContent = `
        <html>
          <head>
            <title>Order #${order.id} Receipt</title>
            <style>
              body { font-family: monospace; padding: 20px; background: #fff; color: #000; }
              .receipt { width: 300px; margin: auto; border: 1px solid #000; padding: 16px; }
              h1 { text-align: center; font-size: 18px; font-weight: bold; }
              .address, .hours, .uid { text-align: center; margin: 2px 0; }
              .items { margin-top: 12px; }
              .item { display: flex; justify-content: space-between; margin-bottom: 2px; }
              .totals { border-top: 1px solid #000; margin-top: 8px; padding-top: 4px; font-weight: bold; display: flex; justify-content: space-between; }
              .tax { display: flex; justify-content: space-between; margin-top: 4px; }
              .footer { margin-top: 8px; font-size: 10px; text-align: center; line-height: 1.2; }
            </style>
          </head>
          <body>
            <div class="receipt">
              <h1>${storeInfo.store}</h1>
              <p class="address">${storeInfo.address.replace(/\n/g, '<br>')}</p>
              <p class="hours">Opening Hours: ${storeInfo.hours}</p>
              <p class="uid">UID Nr.: ${storeInfo.uid}</p>

              <div class="items">
                ${order.items
                  .map(
                    (item) => `<div class="item">
                      <span>${item.name} x${item.quantity}</span>
                      <span>₱${(
                        item.price * item.quantity
                      ).toLocaleString()}</span>
                    </div>`
                  )
                  .join('')}
              </div>

              <div class="tax">
                <span>Tax (10%)</span>
                <span>₱${tax.toFixed(2)}</span>
              </div>

              <div class="totals">
                <span>TOTAL</span>
                <span>₱${totalWithTax.toFixed(2)}</span>
              </div>

              <p class="footer">Payment Method: ${formatPaymentMethod(
                order.payment_method
              )}</p>
              <p class="footer">Order Date: ${new Date(
                order.created_at
              ).toLocaleString()}</p>

              <div class="footer">
                <p>Nr. ########3941 0000</p>
                <p>VU - Nr . 15584121</p>
                <p>Genehmigungs - Nr 808191</p>
                <p>Terminal ID 68259456</p>
              </div>

              <div class="footer" style="margin-top: 8px;">
                <p>Don't have a PAYBACK card yet?</p>
                <p>You would have received</p>
                <p>3 points for this purchase</p>
              </div>
            </div>
          </body>
        </html>
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();

      if (onConfirm) onConfirm();
    } catch (error) {
      console.error('Failed to print order:', error);
    }
  };

  return <Button onClick={handlePrint}>Print Receipt</Button>;
}
