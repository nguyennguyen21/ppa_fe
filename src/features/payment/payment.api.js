
const API_URL = 'http://localhost:3001/api/payments';

export async function createSepayPayment(orderId) {
    const response = await fetch(`${API_URL}/sepay/create`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ orderId })
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
        throw new Error(result.message || 'Tạo thanh toán thất bại');
    }

    return result.data;
}
