import { PermissionsAndroid, Platform } from 'react-native';
import { parseBankSms, ParsedBankSms } from '../utils/bankSmsParser';
import { Transaction } from '../types';

/**
 * List of known Indian bank SMS sender identifiers
 */
export const INDIAN_BANK_SENDERS = [
  'HDFCBK',
  'SBIINB',
  'SBIPSG',
  'ICICIB',
  'AXISBK',
  'KOTAKB',
  'PNBSMS',
  'BOBTXN',
  'IDFCFB',
  'CANBNK',
  'INDUSB',
  'YESBNK',
  'UNIONB',
  'PAYTMB',
  'JUPITR',
  'FIBANK',
  'CREDAP',
];

/**
 * Request SMS permission on Android devices
 */
export async function requestSmsPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return false;
  }

  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.READ_SMS,
      {
        title: 'Bank SMS Access for Live Expense Tracking',
        message:
          'PaisaPilot needs SMS read permission to automatically detect debit transactions from your bank (HDFC, SBI, ICICI, etc.) when you spend money.',
        buttonPositive: 'Allow Live Bank Tracking',
        buttonNegative: 'Not Now',
      }
    );

    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (err) {
    console.warn('SMS Permission request error:', err);
    return false;
  }
}

/**
 * Check if SMS permission is already granted
 */
export async function checkSmsPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  try {
    return await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_SMS);
  } catch {
    return false;
  }
}

/**
 * Convert a parsed real bank SMS into a PaisaPilot Transaction
 */
export function convertBankSmsToTransaction(
  parsed: ParsedBankSms,
  customTimestamp?: string
): Transaction | null {
  if (!parsed.isTransaction || parsed.amount <= 0 || parsed.type === 'otp') {
    return null;
  }

  const bankDetailsNote = [
    `Bank: ${parsed.bankName}${parsed.accountEnding ? ` (A/c **${parsed.accountEnding})` : ''}`,
    parsed.referenceNumber ? `Ref: ${parsed.referenceNumber}` : null,
    parsed.balanceAfter !== undefined ? `Bal: ₹${parsed.balanceAfter.toLocaleString()}` : null,
  ]
    .filter(Boolean)
    .join(' • ');

  return {
    id: `real-tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    title: parsed.merchant || 'Bank Debit',
    amount: parsed.amount,
    category: parsed.category,
    timestamp: customTimestamp || new Date().toISOString(),
    source: 'bank_sync',
    planned: true,
    bankRef: parsed.referenceNumber || `${parsed.bankName.slice(0, 4).toUpperCase()}-UPI-${Date.now().toString().slice(-6)}`,
    notes: bankDetailsNote,
  };
}

/**
 * Process a batch of real bank SMS texts
 */
export function processRawBankSmsList(smsList: string[]): {
  transactions: Transaction[];
  totalDeduction: number;
  latestBalance?: number;
} {
  const transactions: Transaction[] = [];
  let totalDeduction = 0;
  let latestBalance: number | undefined;

  for (const raw of smsList) {
    if (!raw || !raw.trim()) continue;
    const parsed = parseBankSms(raw);
    const tx = convertBankSmsToTransaction(parsed);
    if (tx && parsed.type === 'debit') {
      transactions.push(tx);
      totalDeduction += tx.amount;
      if (parsed.balanceAfter !== undefined) {
        latestBalance = parsed.balanceAfter;
      }
    }
  }

  return { transactions, totalDeduction, latestBalance };
}
