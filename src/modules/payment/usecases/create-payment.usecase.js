
import {
    sepayClient,
    sepayConfig
} from '../sepay.config.js';

/**
 * Tạo thông tin thanh toán SePay.
 *
 * getOrderById phải lấy đơn hàng từ database
 * hoặc dịch vụ quản lý đơn hàng đáng tin cậy.
 */
export async function createPaymentUseCase({
    orderId,
    getOrderById
}) {
    if (!orderId) {
        throw new Error('Order ID không được để trống');
    }

    if (typeof getOrderById !== 'function') {
        throw new Error('Chưa cấu hình dịch vụ lấy đơn hàng');
    }

    // 1. Lấy đơn hàng từ nguồn dữ liệu đáng tin cậy
    const order = await getOrderById(orderId);

    if (!order) {
        throw new Error('Không tìm thấy đơn hàng');
    }

    if (order.status === 'PAID') {
        throw new Error('Đơn hàng đã được thanh toán');
    }

    const amount = Number(order.amount);

    if (!Number.isSafeInteger(amount) || amount <= 0) {
        throw new Error('Số tiền đơn hàng không hợp lệ');
    }

    if (!order.invoiceNumber) {
        throw new Error('Mã hóa đơn không hợp lệ');
    }

    // 2. Tạo URL quay về frontend
    const resultUrl =
        `${sepayConfig.successUrl}?invoice=${encodeURIComponent(
            order.invoiceNumber
        )}`;

    // 3. SDK tạo các trường thanh toán và chữ ký
    const fields = sepayClient.checkout.initOneTimePaymentFields({
        operation: 'PURCHASE',

        payment_method: 'BANK_TRANSFER',

        order_invoice_number: order.invoiceNumber,

        order_amount: amount,

        currency: 'VND',

        order_description: `Thanh toan don hang ${order.invoiceNumber}`,

        success_url: resultUrl,

        error_url: sepayConfig.errorUrl,

        cancel_url: sepayConfig.cancelUrl
    });

    // 4. Trả thông tin checkout cho controller
    return {
        invoiceNumber: order.invoiceNumber,
        amount,
        currency: 'VND',
        status: 'PENDING',
        checkoutUrl: sepayConfig.checkoutUrl,
        fields
    };
}
