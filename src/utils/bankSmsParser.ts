import { CategoryType } from '../types';
import { autoDetectCategory } from './budgetEngine';

export interface ParsedBankSms {
  isBankSms: boolean;
  isTransaction: boolean;
  type: 'debit' | 'credit' | 'otp' | 'unknown';
  amount: number;
  merchant: string;
  bankName: string;
  accountEnding?: string;
  referenceNumber?: string;
  category: CategoryType;
  balanceAfter?: number;
  rawSms: string;
  timestamp: string; // ISO date
  dateDisplay: string;
}

// Common Bank Sender IDs in India
const BANK_SENDER_PATTERNS: { regex: RegExp; name: string }[] = [
  { regex: /HDFC/i, name: 'HDFC Bank' },
  { regex: /SBI|STATE\s*BANK/i, name: 'State Bank of India' },
  { regex: /ICICI/i, name: 'ICICI Bank' },
  { regex: /AXIS/i, name: 'Axis Bank' },
  { regex: /KOTAK/i, name: 'Kotak Mahindra Bank' },
  { regex: /PNB|PUNJAB/i, name: 'Punjab National Bank' },
  { regex: /BOB|BARODA/i, name: 'Bank of Baroda' },
  { regex: /CANARA|CANBNK/i, name: 'Canara Bank' },
  { regex: /INDUS/i, name: 'IndusInd Bank' },
  { regex: /IDFC/i, name: 'IDFC FIRST Bank' },
  { regex: /PAYTM/i, name: 'Paytm Payments Bank' },
  { regex: /GPAY|GOOGLE\s*PAY/i, name: 'Google Pay (UPI)' },
  { regex: /PHONEPE/i, name: 'PhonePe (UPI)' },
];

/**
 * Clean up VPA or raw merchant strings
 * e.g. "swiggy@icici" -> "Swiggy"
 * "paytm-9821738@paytm" -> "Paytm Merchant"
 * "UPI/ZEPTO/329102" -> "Zepto"
 */
function cleanMerchantName(raw: string): string {
  let cleaned = raw.trim();

  // Handle UPI slash patterns like "UPI/ZOMATO/32910238"
  if (cleaned.toUpperCase().startsWith('UPI/')) {
    const parts = cleaned.split('/');
    if (parts.length > 1 && parts[1].trim().length > 1) {
      cleaned = parts[1].trim();
    }
  }

  // Handle VPA handles e.g. "merchant@bank"
  if (cleaned.includes('@')) {
    const vpaPrefix = cleaned.split('@')[0];
    cleaned = vpaPrefix.replace(/[._-]/g, ' ');
  }

  // Remove common prefixes/suffixes
  cleaned = cleaned.replace(/^(vpa|to|at|towards|info:?)\s+/i, '');
  cleaned = cleaned.replace(/\s+(ltd|pvt|limited|inc|corp|services|retail|store)\.?$/i, '');

  // Capitalize nicely
  cleaned = cleaned
    .split(' ')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');

  return cleaned.trim() || 'Online Merchant';
}

/**
 * Parse an incoming bank SMS or pasted bank SMS
 */
export function parseBankSms(smsText: string, senderId = ''): ParsedBankSms {
  const text = smsText.trim();
  const lower = text.toLowerCase();

  // 1. Check for OTP / Security verification (Non-transactional)
  const isOtp =
    (lower.includes('otp') ||
      lower.includes('verification code') ||
      lower.includes('one time password') ||
      lower.includes('do not share')) &&
    !lower.includes('debited') &&
    !lower.includes('spent') &&
    !lower.includes('withdrawn') &&
    !lower.includes('credited');

  if (isOtp) {
    return {
      isBankSms: true,
      isTransaction: false,
      type: 'otp',
      amount: 0,
      merchant: 'Bank OTP Verification',
      bankName: detectBankName(text, senderId),
      category: 'Others',
      rawSms: text,
      timestamp: new Date().toISOString(),
      dateDisplay: 'Just now',
    };
  }

  // 2. Identify Debit vs Credit
  const isDebit =
    lower.includes('debited') ||
    lower.includes('spent') ||
    lower.includes('withdrawn') ||
    lower.includes('paid') ||
    lower.includes('sent') ||
    lower.includes('purchase') ||
    lower.includes('deducted') ||
    lower.includes('dr ') ||
    lower.includes('dr.');

  const isCredit =
    !isDebit &&
    (lower.includes('credited') ||
      lower.includes('received') ||
      lower.includes('refund') ||
      lower.includes('salary') ||
      lower.includes('deposited') ||
      lower.includes('cr ') ||
      lower.includes('cr.'));

  // 3. Extract Amount
  let amount = 0;
  // Match patterns like: "Rs. 450.00", "INR 1,299", "Rs 500", "₹120", "debited by Rs 350.50"
  const amountPatterns = [
    /(?:rs\.?|inr|₹)\s*([0-9]+(?:,[0-9]+)*(?:\.[0-9]{1,2})?)/i,
    /(?:debited|spent|paid|withdrawn|sent|credited|received)\s*(?:by|with|of)?\s*(?:rs\.?|inr|₹)?\s*([0-9]+(?:,[0-9]+)*(?:\.[0-9]{1,2})?)/i,
    /(?:amt|amount)\s*(?:is|:)?\s*(?:rs\.?|inr|₹)?\s*([0-9]+(?:,[0-9]+)*(?:\.[0-9]{1,2})?)/i,
    /([0-9]+(?:,[0-9]+)*(?:\.[0-9]{1,2})?)\s*(?:rs|inr)/i,
  ];

  for (const regex of amountPatterns) {
    const match = text.match(regex);
    if (match && match[1]) {
      const cleanNumStr = match[1].replace(/,/g, '');
      const parsed = parseFloat(cleanNumStr);
      if (!isNaN(parsed) && parsed > 0) {
        amount = Math.round(parsed);
        break;
      }
    }
  }

  // 4. Extract Merchant / Destination
  let rawMerchant = 'Bank Transaction';
  const merchantPatterns = [
    /(?:at|to|towards)\s+([A-Za-z0-9_\s&.@-]{2,30}?)(?=\s+(?:on|using|via|avl|bal|upi|ref|txn|a\/c|\.|$))/i,
    /(?:info:?\s*upi\/)([A-Za-z0-9_\s&.-]{2,30}?)(?=\/|\s|$)/i,
    /(?:vpa\s+)([A-Za-z0-9_.@-]{2,30}?)(?=\s|$)/i,
    /(?:paid to\s+)([A-Za-z0-9_\s&.-]{2,30}?)(?=\s+(?:via|on|\.|$))/i,
  ];

  for (const regex of merchantPatterns) {
    const match = text.match(regex);
    if (match && match[1]) {
      rawMerchant = match[1].trim();
      break;
    }
  }

  const cleanMerchant = cleanMerchantName(rawMerchant);

  // 5. Extract Bank Name
  const bankName = detectBankName(text, senderId);

  // 6. Extract Account / Card ending
  let accountEnding: string | undefined;
  const accMatch = text.match(/(?:a\/c|acct|account|card)\s*(?:no\.?)?\s*(?:ending\s*(?:with)?)?[:\s]*([xX*]*\d{3,4})/i);
  if (accMatch && accMatch[1]) {
    accountEnding = accMatch[1].replace(/[^0-9]/g, '');
  }

  // 7. Extract UPI Reference or Transaction ID
  let referenceNumber: string | undefined;
  const refMatch = text.match(/(?:upi\s*(?:ref\s*(?:no\.?)?|id)?|txn\s*(?:id|no\.?)?|rrn)[:\s]*([A-Za-z0-9]{6,16})/i);
  if (refMatch && refMatch[1]) {
    referenceNumber = refMatch[1];
  }

  // 8. Extract Remaining Bank Balance (if present in SMS)
  let balanceAfter: number | undefined;
  const balMatch = text.match(/(?:bal(?:ance)?|avl\s*bal|available\s*bal(?:ance)?)\s*(?:is|:)?\s*(?:rs\.?|inr|₹)?\s*([0-9]+(?:,[0-9]+)*(?:\.[0-9]{1,2})?)/i);
  if (balMatch && balMatch[1]) {
    const balNum = parseFloat(balMatch[1].replace(/,/g, ''));
    if (!isNaN(balNum)) {
      balanceAfter = Math.round(balNum);
    }
  }

  // 9. Auto-Categorize
  const category = autoDetectCategory(cleanMerchant, text);

  const isTransaction = amount > 0 && (isDebit || isCredit);

  return {
    isBankSms: isDebit || isCredit || isOtp || bankName !== 'Unknown Bank',
    isTransaction,
    type: isDebit ? 'debit' : isCredit ? 'credit' : 'unknown',
    amount,
    merchant: cleanMerchant,
    bankName,
    accountEnding,
    referenceNumber,
    category,
    balanceAfter,
    rawSms: text,
    timestamp: new Date().toISOString(),
    dateDisplay: new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }),
  };
}

function detectBankName(text: string, senderId = ''): string {
  const combined = `${senderId} ${text}`;
  for (const pattern of BANK_SENDER_PATTERNS) {
    if (pattern.regex.test(combined)) {
      return pattern.name;
    }
  }
  return 'Bank Account';
}

/**
 * Authentic real-world Indian Bank SMS presets for one-tap simulation & testing
 */
export const REAL_BANK_SMS_PRESETS = [
  {
    id: 'hdfc-swiggy',
    bank: 'HDFC Bank',
    merchant: 'Swiggy',
    amount: 349,
    sms: 'Rs. 349.00 debited from A/C **1234 on 24-OCT-26 to VPA swiggy@icici (UPI Ref no 4298102384). Avl bal: Rs 34,200.00 - HDFC Bank',
  },
  {
    id: 'sbi-amazon',
    bank: 'SBI',
    merchant: 'Amazon India',
    amount: 1499,
    sms: 'Dear SBI User, your A/C ending with 4321 debited by Rs 1,499.00 on 24Oct26 by UPI ref no 32910283 at AMAZON. Avail Bal: Rs 15,300.00',
  },
  {
    id: 'icici-zepto',
    bank: 'ICICI Bank',
    merchant: 'Zepto Groceries',
    amount: 275,
    sms: 'Acct XX456 debited with INR 275.00 on 24-Oct-26. Info: UPI/ZEPTO/329102. Available Bal is INR 8,450.00. - ICICI Bank',
  },
  {
    id: 'axis-zomato',
    bank: 'Axis Bank',
    merchant: 'Zomato',
    amount: 520,
    sms: 'INR 520.00 spent on Axis Bank Card ending 8765 at ZOMATO on 24-OCT-2026. Avail Limit: INR 75,000.00 - Axis Bank',
  },
  {
    id: 'kotak-pharmacy',
    bank: 'Kotak Bank',
    merchant: 'Apollo Pharmacy',
    amount: 450,
    sms: 'Sent Rs. 450.00 from Kotak Bank AC XX1122 to Apollo Pharmacy on 24-10-2026. UPI Ref 4910283. Bal Rs 12,400.00',
  },
  {
    id: 'hdfc-salary',
    bank: 'HDFC Bank (Credit)',
    merchant: 'Monthly Salary',
    amount: 45000,
    sms: 'Rs 45,000.00 credited to a/c **1234 on 01-10-26 by SALARY from TECH CORP. Avl Bal: Rs 68,000.00 - HDFC Bank',
  },
];
