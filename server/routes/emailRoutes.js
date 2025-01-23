// src/routes/emailRoutes.js
import express from 'express';
import { sendBulkEmail, sendSingleEmail } from '../controllers/emailController.js';

const router = express.Router();

router.post('/send-bulk', sendBulkEmail);
router.post('/single',sendSingleEmail);

export default router;