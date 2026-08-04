export type ContractStatus = 'draft' | 'active' | 'settled' | 'cancelled' | 'renegotiated';

export type InstallmentStatus = 'open' | 'overdue' | 'partial' | 'paid' | 'cancelled' | 'renegotiated';

export type PaymentMethod =
  | 'cash'
  | 'pix'
  | 'bank_transfer'
  | 'bank_slip'
  | 'credit_card'
  | 'debit_card'
  | 'other';

export interface SalesContract {
  id: string;
  created_at: string;
  updated_at?: string;
  created_by?: string | null;
  property_id: string;
  buyer_id: string;
  contract_number: string;
  sale_date: string;
  total_amount: number;
  down_payment_amount: number;
  installments_count: number;
  installment_amount: number;
  first_installment_date: string;
  status: ContractStatus;
  notes?: string | null;
  property?: Record<string, unknown> | null;
  buyer?: Record<string, unknown> | null;
}

export interface Installment {
  id: string;
  created_at: string;
  updated_at?: string;
  contract_id: string;
  installment_number: number;
  due_date: string;
  original_amount: number;
  adjusted_amount: number;
  paid_amount: number;
  balance: number;
  status: InstallmentStatus;
  paid_at?: string | null;
}

export interface Payment {
  id: string;
  created_at: string;
  installment_id: string;
  contract_id: string;
  payment_date: string;
  paid_amount: number;
  payment_method: PaymentMethod;
  receipt_path?: string | null;
  notes?: string | null;
  created_by?: string | null;
  installment?: Installment | null;
}
