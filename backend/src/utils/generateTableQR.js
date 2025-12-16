import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';
import { db } from '../config/db.js';

export const generateAllTableQR = async () => {
  try {
    const [tables] = await db.query('SELECT id, table_number FROM tables');

    if (!tables.length) {
      console.log('No tables found. QR generation skipped.');
      return;
    }

    const outputDir = path.resolve('public/qrcodes');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    const backendUrl = (
      process.env.BACKEND_URL || 'https://orderq-backend.onrender.com'
    ).replace(/\/$/, '');

    for (const table of tables) {
      if (!table.table_number) {
        console.warn(
          `Skipping table with id=${table.id} because table_number is missing.`
        );
        continue;
      }

      const qrData = `${backendUrl}/api/sessions/scan/${table.table_number}`;
      const filePath = `${outputDir}/table-${table.table_number}.png`;

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
    }

    console.log('All QR codes generated successfully.');
  } catch (err) {
    console.error('QR Generation Error:', err);
    console.error('Stack Trace:', err.stack);
  }
};
