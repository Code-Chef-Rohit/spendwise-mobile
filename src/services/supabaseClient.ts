import 'react-native-url-polyfill/auto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Transaction, ConnectedBankAccount } from '../types';

// Default Supabase config keys (can be configured in app settings or .env)
export const DEFAULT_SUPABASE_URL = '';
export const DEFAULT_SUPABASE_ANON_KEY = '';

const STORAGE_KEY_SUPABASE_URL = '@paisapilot_supabase_url';
const STORAGE_KEY_SUPABASE_KEY = '@paisapilot_supabase_key';

let supabaseInstance: SupabaseClient | null = null;

/**
 * Initialize or get Supabase Client
 */
export async function getSupabaseClient(): Promise<SupabaseClient | null> {
  if (supabaseInstance) return supabaseInstance;

  try {
    const savedUrl = await AsyncStorage.getItem(STORAGE_KEY_SUPABASE_URL);
    const savedKey = await AsyncStorage.getItem(STORAGE_KEY_SUPABASE_KEY);

    const url = savedUrl || DEFAULT_SUPABASE_URL;
    const anonKey = savedKey || DEFAULT_SUPABASE_ANON_KEY;

    if (url && anonKey) {
      supabaseInstance = createClient(url, anonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
      return supabaseInstance;
    }
  } catch (err) {
    console.warn('Failed to initialize Supabase client:', err);
  }

  return null;
}

/**
 * Configure Supabase credentials dynamically
 */
export async function configureSupabase(url: string, anonKey: string): Promise<boolean> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY_SUPABASE_URL, url.trim());
    await AsyncStorage.setItem(STORAGE_KEY_SUPABASE_KEY, anonKey.trim());

    supabaseInstance = createClient(url.trim(), anonKey.trim(), {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    return true;
  } catch (e) {
    console.error('Error saving Supabase configuration:', e);
    return false;
  }
}

/**
 * Check if Supabase credentials are set
 */
export async function isSupabaseConnected(): Promise<boolean> {
  const client = await getSupabaseClient();
  return client !== null;
}

/**
 * Get current configured Supabase credentials
 */
export async function getSupabaseConfig(): Promise<{ url: string; anonKey: string }> {
  const url = (await AsyncStorage.getItem(STORAGE_KEY_SUPABASE_URL)) || DEFAULT_SUPABASE_URL;
  const anonKey = (await AsyncStorage.getItem(STORAGE_KEY_SUPABASE_KEY)) || DEFAULT_SUPABASE_ANON_KEY;
  return { url, anonKey };
}

/**
 * Fetch cloud transactions from Supabase
 */
export async function fetchTransactionsFromCloud(): Promise<Transaction[]> {
  const client = await getSupabaseClient();
  if (!client) return [];

  try {
    const { data, error } = await client
      .from('transactions')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(100);

    if (error) {
      console.warn('Supabase fetch error:', error.message);
      return [];
    }

    return (data || []).map((t: any) => ({
      id: t.id,
      title: t.title,
      amount: Number(t.amount),
      category: t.category,
      timestamp: t.timestamp,
      source: t.source || 'bank_sync',
      bankRef: t.bank_ref,
      notes: t.notes,
      planned: t.planned !== false,
    }));
  } catch (e) {
    console.warn('Supabase transaction fetch failed:', e);
    return [];
  }
}

/**
 * Push single transaction to Supabase
 */
export async function pushTransactionToCloud(tx: Transaction): Promise<boolean> {
  const client = await getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('transactions').upsert({
      id: tx.id,
      title: tx.title,
      amount: tx.amount,
      category: tx.category,
      timestamp: tx.timestamp,
      source: tx.source,
      bank_ref: tx.bankRef,
      notes: tx.notes,
      planned: tx.planned,
    });

    if (error) {
      console.warn('Failed to push transaction to Supabase:', error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.warn('Supabase push error:', e);
    return false;
  }
}

/**
 * Bulk sync all local transactions to Supabase
 */
export async function syncAllTransactionsToCloud(transactions: Transaction[]): Promise<number> {
  const client = await getSupabaseClient();
  if (!client || transactions.length === 0) return 0;

  try {
    const payload = transactions.map((tx) => ({
      id: tx.id,
      title: tx.title,
      amount: tx.amount,
      category: tx.category,
      timestamp: tx.timestamp,
      source: tx.source,
      bank_ref: tx.bankRef,
      notes: tx.notes,
      planned: tx.planned,
    }));

    const { data, error } = await client
      .from('transactions')
      .upsert(payload, { onConflict: 'id' })
      .select('id');

    if (error) {
      console.warn('Bulk sync to Supabase failed:', error.message);
      return 0;
    }

    return data ? data.length : 0;
  } catch (e) {
    console.warn('Bulk sync error:', e);
    return 0;
  }
}

/**
 * Listen for live real-time transactions from Supabase Realtime channel
 */
export function subscribeToCloudRealtimeTransactions(
  onNewTransaction: (tx: Transaction) => void
): (() => void) | null {
  if (!supabaseInstance) return null;

  try {
    const channel = supabaseInstance
      .channel('public:transactions')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'transactions' },
        (payload) => {
          const row = payload.new as any;
          if (row) {
            const mappedTx: Transaction = {
              id: row.id,
              title: row.title,
              amount: Number(row.amount),
              category: row.category,
              timestamp: row.timestamp || new Date().toISOString(),
              source: row.source || 'bank_sync',
              bankRef: row.bank_ref,
              notes: row.notes,
              planned: row.planned !== false,
            };
            onNewTransaction(mappedTx);
          }
        }
      )
      .subscribe();

    return () => {
      supabaseInstance?.removeChannel(channel);
    };
  } catch (e) {
    console.warn('Failed to subscribe to Supabase Realtime:', e);
    return null;
  }
}
