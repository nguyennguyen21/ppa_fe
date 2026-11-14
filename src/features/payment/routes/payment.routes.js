
import express from 'express';

import {
    paymentController
} from '../controllers/payment.controller.js';

const router = express.Router();

// Tạo giao dịch thanh toán thông thường
router.post(
    '/sepay/create',
    paymentController.createPayment
);

// Tạo giao dịch ủng hộ CODEX
router.post(
    '/sepay/create-donation',
    paymentController.createDonation
);

// Danh sách người ủng hộ
router.get(
    '/donations',
    paymentController.listDonations
);

// Webhook nhận kết quả thanh toán từ SePay
router.post(
    '/sepay/webhook',
    paymentController.handleSepayWebhook
);

export default router;
