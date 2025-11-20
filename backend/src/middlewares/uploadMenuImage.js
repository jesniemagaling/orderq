import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), 'uploads/menu');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('Created folder:', uploadDir);
}

// Set storage destination & filename
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `menu_${Date.now()}${ext}`;
    cb(null, filename);
  },
});

const upload = multer({ storage });

export default upload;
