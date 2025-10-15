/**
 * Contract CRUD Operations
 *
 * This module provides database operations for event contracts and payments.
 * All functions are designed to be callable by LLM agents as tools.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../supabase/database.types.gen';

/**
 * Get a contract by ID
 *
 * @param supabase - Supabase client instance
 * @param contract_id - The UUID of the contract to retrieve
 * @returns The contract object or null if not found
 * @throws {Error} If the database query fails
 *
 * @example
 * const contract = await getContract(supabase, 'contract-uuid');
 */
export async function getContract(supabase: SupabaseClient<Database>, contract_id: string): Promise<any | null> {
  const { data, error } = await supabase
    .from('contracts')
    .select('*')
    .eq('contract_id', contract_id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Failed to fetch contract: ${error.message}`);
  }

  return data;
}

/**
 * Get contract for an event
 *
 * @param supabase - Supabase client instance
 * @param event_id - The UUID of the event
 * @returns The contract object or null if not found
 * @throws {Error} If the database query fails
 *
 * @example
 * const contract = await getEventContract(supabase, 'event-uuid');
 */
export async function getEventContract(supabase: SupabaseClient<Database>, event_id: string): Promise<any | null> {
  const { data, error } = await supabase
    .from('contracts')
    .select('*')
    .eq('event_id', event_id)
    .order('version', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Failed to fetch event contract: ${error.message}`);
  }

  return data;
}

/**
 * Create a contract
 *
 * @param supabase - Supabase client instance
 * @param contract - The contract data to create
 * @returns The created contract object
 * @throws {Error} If database insert fails
 *
 * @example
 * const contract = await createContract(supabase, {
 *   event_id: 'event-uuid',
 *   total_amount: 15000.00,
 *   currency: 'USD',
 *   payment_schedule: [
 *     {
 *       description: 'Deposit (50%)',
 *       amount: 7500.00,
 *       due_date: '2025-05-15',
 *       paid: false
 *     },
 *     {
 *       description: 'Final Payment',
 *       amount: 7500.00,
 *       due_date: '2025-06-08',
 *       paid: false
 *     }
 *   ],
 *   status: 'draft'
 * });
 */
export async function createContract(supabase: SupabaseClient<Database>, contract: {
  event_id: string;
  total_amount: number;
  currency?: string;
  payment_schedule: any[];
  status?: string;
}): Promise<any> {
  const { data, error } = await supabase
    .from('contracts')
    .insert({
      ...contract,
      currency: contract.currency || 'USD',
      status: contract.status || 'draft',
      stripe_payment_intent_ids: [],
      version: 1,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create contract: ${error.message}`);
  }

  return data;
}

/**
 * Update a contract
 *
 * Creates a new version of the contract with updated information.
 *
 * @param supabase - Supabase client instance
 * @param contract_id - The UUID of the contract to update
 * @param updates - The fields to update
 * @returns The updated contract object
 * @throws {Error} If update fails
 *
 * @example
 * const updated = await updateContract(supabase, 'contract-uuid', {
 *   status: 'signed'
 * });
 */
export async function updateContract(
  supabase: SupabaseClient<Database>,
  contract_id: string,
  updates: {
    total_amount?: number;
    payment_schedule?: any[];
    status?: string;
    stripe_payment_intent_ids?: string[];
  }
): Promise<any> {
  const { data, error } = await supabase
    .from('contracts')
    .update(updates)
    .eq('contract_id', contract_id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update contract: ${error.message}`);
  }

  return data;
}

/**
 * Record a payment on a contract
 *
 * Updates the payment schedule to mark a payment as paid.
 *
 * @param supabase - Supabase client instance
 * @param contract_id - The UUID of the contract
 * @param payment_index - Index of the payment in the schedule (0-based)
 * @param stripe_payment_intent_id - The Stripe payment intent ID
 * @returns The updated contract
 * @throws {Error} If update fails
 *
 * @example
 * await recordContractPayment(supabase, 'contract-uuid', 0, 'pi_123456');
 */
export async function recordContractPayment(
  supabase: SupabaseClient<Database>,
  contract_id: string,
  payment_index: number,
  stripe_payment_intent_id: string
): Promise<any> {
  const contract = await getContract(supabase, contract_id);
  if (!contract) {
    throw new Error('Contract not found');
  }

  const paymentSchedule = [...contract.payment_schedule];
  if (payment_index < 0 || payment_index >= paymentSchedule.length) {
    throw new Error('Invalid payment index');
  }

  // Update the specific payment
  paymentSchedule[payment_index] = {
    ...paymentSchedule[payment_index],
    paid: true,
    paid_at: new Date().toISOString(),
    stripe_payment_intent_id,
  };

  // Add to payment intent IDs array
  const stripeIds = [...(contract.stripe_payment_intent_ids || []), stripe_payment_intent_id];

  // Check if all payments are paid
  const allPaid = paymentSchedule.every((p: any) => p.paid);
  const newStatus = allPaid ? 'paid' : 'partially_paid';

  return updateContract(supabase, contract_id, {
    payment_schedule: paymentSchedule,
    stripe_payment_intent_ids: stripeIds,
    status: newStatus,
  });
}

/**
 * Get contract payment status
 *
 * Returns information about paid and outstanding payments.
 *
 * @param supabase - Supabase client instance
 * @param contract_id - The UUID of the contract
 * @returns Object with payment status information
 * @throws {Error} If contract not found
 *
 * @example
 * const status = await getContractPaymentStatus(supabase, 'contract-uuid');
 * // { total: 15000, paid: 7500, outstanding: 7500, payments_due: [...] }
 */
export async function getContractPaymentStatus(supabase: SupabaseClient<Database>, contract_id: string): Promise<{
  total: number;
  paid: number;
  outstanding: number;
  all_paid: boolean;
  payments_due: any[];
  overdue_payments: any[];
}> {
  const contract = await getContract(supabase, contract_id);
  if (!contract) {
    throw new Error('Contract not found');
  }

  const now = new Date();
  const status = {
    total: contract.total_amount,
    paid: 0,
    outstanding: 0,
    all_paid: true,
    payments_due: [] as any[],
    overdue_payments: [] as any[],
  };

  contract.payment_schedule?.forEach((payment: any) => {
    if (payment.paid) {
      status.paid += payment.amount;
    } else {
      status.outstanding += payment.amount;
      status.all_paid = false;
      status.payments_due.push(payment);

      const dueDate = new Date(payment.due_date);
      if (dueDate < now) {
        status.overdue_payments.push(payment);
      }
    }
  });

  return status;
}

/**
 * Sign a contract
 *
 * Marks the contract as signed and updates status.
 *
 * @param supabase - Supabase client instance
 * @param contract_id - The UUID of the contract
 * @returns The updated contract
 * @throws {Error} If update fails
 *
 * @example
 * await signContract(supabase, 'contract-uuid');
 */
export async function signContract(supabase: SupabaseClient<Database>, contract_id: string): Promise<any> {
  return updateContract(supabase, contract_id, { status: 'signed' });
}

/**
 * Generate payment schedule
 *
 * Helper function to generate a payment schedule based on deposit rules.
 *
 * @param total_amount - Total contract amount
 * @param event_date - Event date (ISO string)
 * @param deposit_percentage - Percentage for deposit (0-100, default: 50)
 * @param deposit_due_days_before - Days before event deposit is due (default: 30)
 * @param final_due_days_before - Days before event final payment is due (default: 7)
 * @returns Array of payment schedule items
 *
 * @example
 * const schedule = generatePaymentSchedule(10000, '2025-06-15T14:00:00Z', 50, 30, 7);
 */
export function generatePaymentSchedule(
  total_amount: number,
  event_date: string,
  deposit_percentage: number = 50,
  deposit_due_days_before: number = 30,
  final_due_days_before: number = 7
): any[] {
  const eventDate = new Date(event_date);

  // Calculate deposit due date
  const depositDueDate = new Date(eventDate);
  depositDueDate.setDate(depositDueDate.getDate() - deposit_due_days_before);

  // Calculate final payment due date
  const finalDueDate = new Date(eventDate);
  finalDueDate.setDate(finalDueDate.getDate() - final_due_days_before);

  const depositAmount = (total_amount * deposit_percentage) / 100;
  const finalAmount = total_amount - depositAmount;

  return [
    {
      description: `Deposit (${deposit_percentage}%)`,
      amount: depositAmount,
      due_date: depositDueDate.toISOString().split('T')[0],
      paid: false,
    },
    {
      description: 'Final Payment',
      amount: finalAmount,
      due_date: finalDueDate.toISOString().split('T')[0],
      paid: false,
    },
  ];
}

/**
 * Get contracts requiring attention
 *
 * Returns contracts with overdue payments or requiring signatures.
 *
 * @param supabase - Supabase client instance
 * @param venue_id - Optional: filter by venue
 * @returns Array of contracts needing attention
 * @throws {Error} If database query fails
 *
 * @example
 * const needsAttention = await getContractsRequiringAttention(supabase, 'venue-uuid');
 */
export async function getContractsRequiringAttention(supabase: SupabaseClient<Database>, venue_id?: string): Promise<any[]> {
  let query = supabase
    .from('contracts')
    .select('*, events!inner(*)')
    .in('status', ['draft', 'pending_signature', 'partially_paid']);

  if (venue_id) {
    query = query.eq('events.venue_id', venue_id);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to get contracts requiring attention: ${error.message}`);
  }

  const now = new Date();
  const needsAttention: any[] = [];

  for (const contract of data || []) {
    // Check for overdue payments
    const schedule = contract.payment_schedule as any[];
    const hasOverduePayment = Array.isArray(schedule) && schedule.some((payment: any) => {
      return !payment.paid && new Date(payment.due_date) < now;
    });

    if (hasOverduePayment || contract.status === 'draft' || contract.status === 'pending_signature') {
      needsAttention.push(contract);
    }
  }

  return needsAttention;
}
