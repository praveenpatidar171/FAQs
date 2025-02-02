import express from 'express'
import { createFAQ, deleteFAQ, getFAQs, updateFAQ } from '../controllers/faqControllers';
import authMiddleware from '../middlewares/authMiddleware';
const router = express.Router();

// fetch all the FAQs
router.get('/', getFAQs);

// Protected Routes: Only Admins can modify FAQs 
router.post("/", authMiddleware, createFAQ);
router.put("/:id", authMiddleware, updateFAQ);
router.delete("/:id", authMiddleware, deleteFAQ);

export default router;