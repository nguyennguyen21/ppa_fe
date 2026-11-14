
import {
    sepayClient,
    sepayConfig
} from '../sepay.config.js';

import { randomBytes } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

function generateDonationInvoice() {
    const randomCode = randomBytes(4).toString('hex').toUpperCase();

    return `DON${Date.now()}${randomCode}`;
}

async function readDonations() {
    try {
        // File dữ liệu đặt ở thư mục data/ ngoài src/ để Vite không watch
        // (tránh full-page reload khi backend ghi file lúc dev).
        const filePath = path.resolve(
            path.dirname(fileURLToPath(import.meta.url)),
            '../../../../data/donations.json'
        );

        const raw = await fs.readFile(filePath, 'utf8');

        const data = JSON.parse(raw);

        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error('[DONATION] Không đọc được file danh sách ủng hộ:', error);

        return [];
    }
}

async function writeDonations(list) {
    const filePath = path.resolve(
        path.dirname(fileURLToPath(import.meta.url)),
        '../../../../data/donations.json'
    );

    await fs.writeFile(filePath, JSON.stringify(list, null, 4), 'utf8');
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

    // Lưu sẵn bản ghi PENDING kèm tên người ủng hộ
    // để danh sách người ủng hộ có tên ngay cả khi webhook không gửi tên về.
    const donations = await readDonations();

    donations.push({
        id: `DON-${invoiceNumber}`,
        invoiceNumber,
        senderName: senderName?.trim() || 'Khách hàng',
        transferContent: senderName?.trim()
            ? `UNG HO CODEX - ${donationAmount.toLocaleString('vi-VN')}đ - ${senderName.trim()}`
            : `UNG HO CODEX - ${donationAmount.toLocaleString('vi-VN')}đ`,
        amount: donationAmount,
        status: 'PENDING',
        createdAt: new Date().toISOString()
    });

    await writeDonations(donations);

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
        callback_url: sepayConfig.callbackUrl,
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

export async function listDonationsUseCase() {
    const donations = await readDonations();

    // Mới nhất lên đầu
    donations.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    return donations;
}

export async function confirmDonationUseCase({ invoiceNumber, transactionId, status, amount, senderName }) {
    const donations = await readDonations();

    const donationIndex = donations.findIndex(
        (item) => item.invoiceNumber === invoiceNumber
    );

    // Các trạng thái SePay xem là thành công:
    // - Frontend tự xác nhận: 'success'
    // - Webhook mới: transaction_status 'APPROVED' / order_status 'CAPTURED'
    const successStatuses = [
        'success',
        'SUCCESS',
        'CAPTURED',
        'APPROVED',
        'PAID',
        'COMPLETED'
    ];

    const failedStatuses = [
        'failed',
        'FAILED',
        'DECLINED',
        'CANCELLED',
        'CANCELED'
    ];

    const isSuccess = successStatuses.includes(String(status).toUpperCase());
    const isFailed = failedStatuses.includes(String(status).toUpperCase());
    const now = new Date().toISOString();

    let updatedDonation;

    if (donationIndex >= 0) {
        updatedDonation = {
            ...donations[donationIndex],
            // Cập nhật tên người ủng hộ nếu webhook gửi về tên mới.
            senderName: senderName?.trim() || donations[donationIndex].senderName,
            status: isFailed ? 'FAILED' : (isSuccess ? 'SUCCESS' : donations[donationIndex].status),
            updatedAt: now
        };

        donations[donationIndex] = updatedDonation;
    } else {
        updatedDonation = {
            id: `DON-${Date.now()}`,
            invoiceNumber: invoiceNumber || `DON-${Date.now()}`,
            senderName: senderName?.trim() || 'Khách hàng',
            transferContent: `UNG HO CODEX - ${Number(amount) || 0}đ - ${senderName || ''}`.trim(),
            amount: Number(amount) || 0,
            status: isFailed ? 'FAILED' : (isSuccess ? 'SUCCESS' : 'PENDING'),
            createdAt: now
        };

        donations.push(updatedDonation);
    }

    await writeDonations(donations);

    return {
        success: true,
        donation: updatedDonation
    };
}
