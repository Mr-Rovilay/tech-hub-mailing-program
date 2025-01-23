import express from 'express';
import multer from 'multer';
import { uploadContacts, getContacts, getSingleContact, updateContact, deleteSingleContact } from '../controllers/contactController.js';
import { addContact } from '../controllers/contactController.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload', upload.single('file'), uploadContacts);
router.post("/", addContact);
router.get('/', getContacts);
router.get('/:id', getSingleContact);
router.put('/:id', updateContact);
router.delete('/:id', deleteSingleContact);

export default router;
