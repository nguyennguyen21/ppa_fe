
import {
    sepayClient,
    sepayConfig
} from '../sepay.config.js';

import { randomBytes } from 'node:crypto';

function generateDonationInvoice() {
    const randomCode = randomBytes(4).toString('hex').toUpperCase();

    return `DON${Date.now()}${randomCode}`;
}

export async function createDonationUseCase({ amount, senderName }) {

    // Kiểm tra số tiền
    const donationAmount = Number(amount);

    if (
        !Number.isSafeInteger(donationAmount) ||
        donationAmount < 1000 ||
        donationAmount > 50000000
    ) {
        throw new Error(
            'Số tiền ủng hộ phải từ 1.000đ đến 50.000.000đ'
        );
    }

    // Tạo mã hóa đơn
    const invoiceNumber = generateDonationInvoice();

    // URL quay về Frontend
    const resultUrl =
        `${sepayConfig.successUrl}?invoice=${encodeURIComponent(invoiceNumber)}`;

    // Tạo thông tin thanh toán SePay
    const fields = sepayClient.checkout.initOneTimePaymentFields({
        operation: 'PURCHASE',
        payment_method: 'BANK_TRANSFER',
        order_invoice_number: invoiceNumber,
        order_amount: donationAmount,
        currency: 'VND',
        order_description: senderName
            ? `Ung ho CODEX ${senderName} - ${invoiceNumber}`
            : `Ung ho CODEX ${invoiceNumber}`,
        success_url: resultUrl,
        error_url: sepayConfig.errorUrl,
        cancel_url: sepayConfig.cancelUrl
    });

    return {
        invoiceNumber,
        amount: donationAmount,
        currency: 'VND',
        status: 'PENDING',
        checkoutUrl: sepayConfig.checkoutUrl,
        fields
    };
}
