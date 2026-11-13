
import dotenv from 'dotenv';
import { SePayPgClient } from 'sepay-pg-node';

dotenv.config();

const requiredEnv = [
    'SEPAY_MERCHANT_ID',
    'SEPAY_SECRET_KEY'
];

for (const key of requiredEnv) {
    if (!process.env[key]) {
        throw new Error(`Missing environment variable: ${key}`);
    }
}

export const sepayClient = new SePayPgClient({
    env: process.env.SEPAY_ENV || 'sandbox',
    merchant_id: process.env.SEPAY_MERCHANT_ID,
    secret_key: process.env.SEPAY_SECRET_KEY
});

export const sepayConfig = {
    checkoutUrl: sepayClient.checkout.initCheckoutUrl(),

    successUrl: process.env.SEPAY_SUCCESS_URL,
    errorUrl: process.env.SEPAY_ERROR_URL,
    cancelUrl: process.env.SEPAY_CANCEL_URL,
    callbackUrl: process.env.SEPAY_CALLBACK_URL
};
