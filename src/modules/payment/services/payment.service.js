
import { createPaymentUseCase } from '../usecases/create-payment.usecase.js';
import {
    createDonationUseCase,
    confirmDonationUseCase,
    listDonationsUseCase
} from '../usecases/create-donation.usecase.js';

export const paymentService = {
    async createPayment(params) {
        return await createPaymentUseCase(params);
    },

    async createDonation(params) {
        return await createDonationUseCase(params);
    },

    async confirmDonation(params) {
        return await confirmDonationUseCase(params);
    },

    async listDonations() {
        return await listDonationsUseCase();
    }
};
