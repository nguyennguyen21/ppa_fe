
import { paymentService } from '../services/payment.service.js';

export const paymentController = {
    // =====================================
    // THANH TOÁN ĐƠN HÀNG
    // =====================================
    async createPayment(req, res) {
        try {
            const { orderId } = req.body;

            const result = await paymentService.createPayment({
                orderId,
                getOrderById: req.app.locals.getOrderById
            });

            return res.status(201).json({
                success: true,
                message: 'Tạo thanh toán thành công',
                data: result
            });

        } catch (error) {
            console.error('[CREATE PAYMENT]', error);

            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // =====================================
    // TẠO GIAO DỊCH ỦNG HỘ CODEX
    // =====================================
    async createDonation(req, res) {
        try {
            const { amount, senderName } = req.body;

            // Kiểm tra số tiền
            if (
                !Number.isSafeInteger(amount) ||
                amount < 1000 ||
                amount > 50000000
            ) {
                return res.status(400).json({
                    success: false,
                    message: 'Số tiền ủng hộ phải từ 1.000đ đến 50.000.000đ.'
                });
            }

            // Gọi Service tạo giao dịch
            const result = await paymentService.createDonation({
                amount,
                senderName
            });

            return res.status(201).json({
                success: true,
                message: 'Tạo giao dịch ủng hộ thành công',
                data: result
            });

        } catch (error) {
            console.error('[CREATE DONATION]', error);

            return res.status(400).json({
                success: false,
                message: error.message || 'Không thể tạo giao dịch ủng hộ.'
            });
        }
    },

    // =====================================
    // XÁC NHẬN THANH TOÁN THÀNH CÔNG (WEBHOOK SEPAY)
    // =====================================
    async handleSepayWebhook(req, res) {
        try {
            const payload = req.body || {};

            const status = payload.transaction_status || payload.status || 'success';
            const invoiceNumber = payload.order_invoice_number;
            const amount = payload.order_amount;
            const senderName = payload.customer_name || payload.order_info;

            const result = await paymentService.confirmDonation({
                invoiceNumber,
                transactionId: payload.transaction_id,
                status,
                amount,
                senderName
            });

            return res.status(200).json({
                success: true,
                data: result
            });

        } catch (error) {
            console.error('[SEPAY WEBHOOK]', error);

            return res.status(400).json({
                success: false,
                message: error.message || 'Không thể xác nhận thanh toán ủng hộ.'
            });
        }
    }
};
