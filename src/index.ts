import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import authRoutes from './routes/authRoutes'
import faqRoutes from './routes/faqRoutes'
const PORT = process.env.PORT || 5000;
const app = express();
app.use(express.json());

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/faqs', faqRoutes);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}) 