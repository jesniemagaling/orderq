import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';
import { db } from '../config/db.js';

export const generateQRForTable = async (id, table_number) => {
  try {
    const outputDir = path.resolve('public/qrcodes');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const qrData = `${process.env.BACKEND_URL.replace(
      /\/$/,
      ''
    )}/api/sessions/scan/${table_number}`;
    const filePath = `${outputDir}/table-${table_number}.png`;

    await QRCode.toFile(filePath, qrData, {
      width: 300,
      errorCorrectionLevel: 'H',
    });

    const qrDbPath = `/qrcodes/table-${table_number}.png`;

    await db.query('UPDATE tables SET qr_code = ? WHERE id = ?', [
      qrDbPath,
      id,
    ]);

    console.log(`QR generated: table ${table_number}`);

    return filePath;
  } catch (err) {
    console.error(`QR Generation Error for table ${table_number}:`, err);
    console.error(err.stack);
  }
};
