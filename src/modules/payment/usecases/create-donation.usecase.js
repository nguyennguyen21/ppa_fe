
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
        const filePath = path.resolve(
            path.dirname(fileURLToPath(import.meta.url)),
            '../../data/donations.json'
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
        '../../data/donations.json'
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

export async function confirmDonationUseCase({ invoiceNumber, transactionId, status, amount, senderName }) {
    const donations = await readDonations();

    const donationIndex = donations.findIndex(
        (item) => item.invoiceNumber === invoiceNumber
    );

    const isSuccess = status === 'success' || status === 'SUCCESS';
    const now = new Date().toISOString();

    let updatedDonation;

    if (donationIndex >= 0) {
        updatedDonation = {
            ...donations[donationIndex],
            status: isSuccess ? 'SUCCESS' : 'FAILED',
            updatedAt: now
        };

        donations[donationIndex] = updatedDonation;
    } else {
        updatedDonation = {
            id: `DON-${Date.now()}`,
            invoiceNumber: invoiceNumber || `DON-${Date.now()}`,
            senderName: senderName || 'Khách hàng',
            transferContent: `UNG HO CODEX - ${Number(amount) || 0}đ - ${senderName || ''}`.trim(),
            amount: Number(amount) || 0,
            status: isSuccess ? 'SUCCESS' : 'FAILED',
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
