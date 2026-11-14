
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import paymentRoutes from './routes/payment.routes.js';
import { paymentController } from './controllers/payment.controller.js';

dotenv.config();

const app = express();

const PORT = process.env.PORT || 3001;

// Cho phép React gọi API
app.use(cors({
    origin: process.env.FRONTEND_URL,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// TODO: Kết nối hàm lấy đơn hàng từ database/dịch vụ đơn hàng.
// Đây là ví dụ tạm thời để kiểm tra luồng tích hợp.
app.locals.getOrderById = async (orderId) => {
    // Không dùng dữ liệu mẫu này khi triển khai thật.
    if (String(orderId) !== '1') {
        return null;
    }

    return {
        id: 1,
        invoiceNumber: 'TEST001',
        amount: 10000,
        status: 'PENDING'
    };
};

// Routes thanh toán
app.use('/api/payments', paymentRoutes);

// SePay đôi khi POST webhook về đúng tên miền nhưng không kèm path
// (URL webhook cấu hình trong dashboard SePay). Chấp nhận cả ở gốc '/'
// để không bỏ sót thông báo thanh toán.
app.post('/', paymentController.handleSepayWebhook);

// Health check
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Payment server is running'
    });
});

app.listen(PORT, () => {
    console.log(`Payment server running at http://localhost:${PORT}`);
});
