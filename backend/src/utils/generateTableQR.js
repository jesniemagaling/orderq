import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';
import { db } from '../config/db.js';
import crypto from 'crypto';

const resolveBackendUrl = () => {
  if (process.env.BACKEND_URL) {
    return String(process.env.BACKEND_URL).replace(/\/$/, '');
  }

  const customerFrontend =
    process.env.CUSTOMER_FRONTEND_URL ||
    process.env.FRONTEND_URL_CUSTOMER ||
    process.env.FRONTEND_URL_2;

  if (customerFrontend) {
    try {
      const u = new URL(String(customerFrontend));
      return `${u.protocol}//${u.hostname}:5000`;
    } catch {
      // ignore parse errors and use fallback below
    }
  }

  return `http://localhost:${process.env.PORT || 5000}`;
};

export const generateAllTableQR = async () => {
  try {
    const [tables] = await db.query(
      'SELECT id, table_number, qr_nonce FROM tables',
    );

    if (!tables.length) {
      console.log('No tables found. QR generation skipped.');
      return;
    }

    const outputDir = path.resolve('public/qrcodes');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    // Safe backend URL: ensures it's always a string
    const backendUrl = resolveBackendUrl();

    console.log('Using backend URL for QR generation:', backendUrl);

    for (const table of tables) {
      if (!table.table_number) {
        console.warn(
          `Skipping table with id=${table.id} because table_number is missing.`,
        );
        continue;
      }

      try {
        const nonce = table.qr_nonce || crypto.randomBytes(16).toString('hex');
        if (!table.qr_nonce) {
          await db.query('UPDATE tables SET qr_nonce = ? WHERE id = ?', [
            nonce,
            table.id,
          ]);
        }

        const qrData = `${backendUrl}/api/sessions/scan/${table.table_number}?nonce=${nonce}`;
        const filePath = path.join(
          outputDir,
          `table-${table.table_number}.png`,
        );

        await QRCode.toFile(filePath, qrData, {
          width: 300,
          errorCorrectionLevel: 'H',
        });

        const qrDbPath = `/qrcodes/table-${table.table_number}.png`;

        await db.query('UPDATE tables SET qr_code = ? WHERE id = ?', [
          qrDbPath,
          table.id,
        ]);

        console.log(`Generated QR for Table ${table.table_number}`);
      } catch (tableErr) {
        console.error(
          `Error generating QR for table ${table.table_number} (id=${table.id}):`,
          tableErr,
        );
      }
    }

    console.log('All QR code generation attempts completed.');
  } catch (err) {
    console.error('QR Generation Error:', err);
    console.error('Stack Trace:', err.stack);
  }
};
