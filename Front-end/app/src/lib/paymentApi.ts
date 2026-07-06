import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

/** Opciones de método de pago disponibles en el formulario */
export type PaymentMethod = 'CARD' | 'PSE' | 'NEQUI';

/** Estado posible de un pago (espejo del enum Java) */
export type PaymentStatus = 'PROCESSING' | 'APPROVED' | 'FAILED' | 'REFUNDED';

export interface PaymentRequest {
  orderId: number;
  paymentMethod: PaymentMethod;
  cardNumber?: string;
  cardHolder?: string;
  expiryMonth?: number;
  expiryYear?: number;
  cvv?: string;
}

export interface PaymentResponse {
  paymentId: number;
  orderId: number;
  transactionId: string;
  status: PaymentStatus;
  amount: number;
  paymentMethod: string;
  cardLastFour?: string;
  cardHolder?: string;
  message: string;
  createdAt: string;
  processedAt?: string;
}

/** Inicia el proceso de pago y devuelve el transactionId para polling */
export async function initiatePayment(
  request: PaymentRequest,
  token: string
): Promise<PaymentResponse> {
  const { data } = await axios.post<{ data: PaymentResponse }>(
    `${API_BASE}/payments/initiate`,
    request,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return data.data;
}

/**
 * Consulta el estado actual del pago.
 * Llamar en loop hasta que status !== 'PROCESSING'
 */
export async function getPaymentStatus(
  transactionId: string,
  token: string
): Promise<PaymentResponse> {
  const { data } = await axios.get<{ data: PaymentResponse }>(
    `${API_BASE}/payments/${transactionId}/status`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return data.data;
}

/**
 * Helper: polling automático con intervalo de 2 segundos.
 * Resuelve la promesa cuando el pago ya no está en PROCESSING.
 * Tiene un timeout máximo de 30 segundos.
 */
export function pollPaymentStatus(
  transactionId: string,
  token: string,
  onUpdate?: (response: PaymentResponse) => void
): Promise<PaymentResponse> {
  return new Promise((resolve, reject) => {
    const MAX_ATTEMPTS = 15; // 15 * 2s = 30s timeout
    let attempts = 0;

    const interval = setInterval(async () => {
      attempts++;
      try {
        const response = await getPaymentStatus(transactionId, token);
        onUpdate?.(response);

        if (response.status !== 'PROCESSING') {
          clearInterval(interval);
          resolve(response);
        } else if (attempts >= MAX_ATTEMPTS) {
          clearInterval(interval);
          reject(new Error('Timeout: El pago tardó demasiado. Verifica tu historial.'));
        }
      } catch (error) {
        clearInterval(interval);
        reject(error);
      }
    }, 2000);
  });
}
