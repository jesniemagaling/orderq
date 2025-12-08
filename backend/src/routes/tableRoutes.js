import express from 'express';
import {
  createTable,
  deleteTable,
  regenerateTableQR,
  regenerateAllQR,
  getAllTables,
  updateTableStatus,
  getTableDetails,
  getTableQR,
  getAllTableQR,
} from '../controllers/tableController.js';

const router = express.Router();

router.post('/', createTable);
router.post('/qr/regenerate', regenerateAllQR);
router.post('/:id/qr', regenerateTableQR);
router.delete('/:id', deleteTable);
router.get('/', getAllTables);
router.get('/qr/all', getAllTableQR);
router.get('/:table_id/details', getTableDetails);
router.get('/:id/qr', getTableQR);
router.put('/:id/status', updateTableStatus);

export default router;
