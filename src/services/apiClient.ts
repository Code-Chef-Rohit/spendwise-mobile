// PaisaPilot Mobile API Client
// Connects mobile frontend to PaisaPilot Node.js Backend

const DEFAULT_BACKEND_URL = 'http://localhost:5000/api';

export interface BackendResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

/**
 * Health check to verify backend connectivity
 */
export async function checkBackendHealth(baseUrl = 'http://localhost:5000'): Promise<boolean> {
  try {
    const res = await fetch(`${baseUrl}/health`, { method: 'GET' });
    const data = await res.json();
    return data.status === 'healthy';
  } catch {
    return false;
  }
}

/**
 * Fetch live Account Aggregator financial transactions from backend
 */
export async function fetchLiveBankFeedFromBackend(
  bankCode = 'HDFC',
  maskedAccNumber = '•••• 4892',
  baseUrl = DEFAULT_BACKEND_URL
): Promise<{ success: boolean; transactions: any[]; newBalance: number }> {
  try {
    const res = await fetch(`${baseUrl}/aa/fi/fetch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bankCode, maskedAccNumber }),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        return {
          success: true,
          transactions: json.data.transactions || [],
          newBalance: json.data.newBalance || 34200,
        };
      }
    }
  } catch (e) {
    console.warn('Backend AA fetch unreachable, using on-device ledger:', e);
  }

  return { success: false, transactions: [], newBalance: 34200 };
}

/**
 * Initiate Account Aggregator Consent via Backend
 */
export async function initiateBackendConsent(
  bankCode: string,
  phone: string,
  baseUrl = DEFAULT_BACKEND_URL
) {
  try {
    const res = await fetch(`${baseUrl}/aa/consent/initiate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bankCode, phone }),
    });
    return await res.json();
  } catch (e) {
    return { success: false, error: 'Could not connect to backend' };
  }
}
