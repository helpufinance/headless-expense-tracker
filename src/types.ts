export type ExpenseCategory =
  | 'housing'
  | 'transportation'
  | 'food'
  | 'utilities'
  | 'healthcare'
  | 'insurance'
  | 'entertainment'
  | 'shopping'
  | 'education'
  | 'personal'
  | 'subscriptions'
  | 'dining'
  | 'travel'
  | 'gifts'
  | 'savings'
  | 'debt'
  | 'other'
export type PaymentMethod =
  | 'cash'
  | 'debit'
  | 'credit'
  | 'bank-transfer'
  | 'mobile-payment'
  | 'other'
export type StorageType = 'local' | 'remote' | 'none'
export interface Expense {
  id: string
  description: string
  amount: number
  category: ExpenseCategory
  date: string
  notes?: string
  paymentMethod?: PaymentMethod
  tags?: string[]
  isRecurring?: boolean
  createdAt: string
  updatedAt: string
}
export interface ExpenseFilter {
  category?: ExpenseCategory
  dateFrom?: string
  dateTo?: string
  minAmount?: number
  maxAmount?: number
  search?: string
  paymentMethod?: PaymentMethod
  tags?: string[]
}
export interface ExpenseSortOptions {
  field: 'date' | 'amount' | 'category' | 'description'
  direction: 'asc' | 'desc'
}
export interface ExpenseSummary {
  totalAmount: number
  count: number
  averageAmount: number
  highestExpense: number
  lowestExpense: number
  categoryBreakdown: CategorySummary[]
  dailyAverage: number
  topCategory: string | null
  dateRange: {
    from: string
    to: string
  } | null
}
export interface CategorySummary {
  category: string
  amount: number
  percentage: number
  count: number
}
export interface MonthlyTrend {
  month: string
  amount: number
  count: number
}
export interface ExpenseTrackerError {
  code: 'INVALID_AMOUNT' | 'INVALID_DATE' | 'NOT_FOUND' | 'STORAGE_ERROR' | 'INVALID_INPUT'
  message: string
  field?: string
}
export interface StorageAdapter {
  getAll(): Expense[]
  saveAll(expenses: Expense[]): void
  clear(): void
}
export interface CategoryConfig {
  key: ExpenseCategory
  label: string
  icon: string
  color: string
}
export const EXPENSE_CATEGORY_CONFIG: Record<ExpenseCategory, CategoryConfig> = {
  housing: { key: 'housing', label: 'Housing', icon: '🏠', color: '#4ade89' },
  transportation: { key: 'transportation', label: 'Transportation', icon: '🚗', color: '#38bdf8' },
  food: { key: 'food', label: 'Food & Groceries', icon: '🛒', color: '#fb923c' },
  utilities: { key: 'utilities', label: 'Utilities', icon: '💡', color: '#a78bfa' },
  healthcare: { key: 'healthcare', label: 'Healthcare', icon: '🏥', color: '#f87171' },
  insurance: { key: 'insurance', label: 'Insurance', icon: '🛡️', color: '#34d399' },
  entertainment: { key: 'entertainment', label: 'Entertainment', icon: '🎬', color: '#c084fc' },
  shopping: { key: 'shopping', label: 'Shopping', icon: '🛍️', color: '#f472b6' },
  education: { key: 'education', label: 'Education', icon: '📚', color: '#60a5fa' },
  personal: { key: 'personal', label: 'Personal Care', icon: '🧴', color: '#fbbf24' },
  subscriptions: { key: 'subscriptions', label: 'Subscriptions', icon: '📱', color: '#2dd4bf' },
  dining: { key: 'dining', label: 'Dining Out', icon: '🍽️', color: '#fb7185' },
  travel: { key: 'travel', label: 'Travel', icon: '✈️', color: '#818cf8' },
  gifts: { key: 'gifts', label: 'Gifts & Donations', icon: '🎁', color: '#e879f9' },
  savings: { key: 'savings', label: 'Savings', icon: '💰', color: '#22c55e' },
  debt: { key: 'debt', label: 'Debt Payments', icon: '💳', color: '#ef4444' },
  other: { key: 'other', label: 'Other', icon: '📦', color: '#94a3b8' },
}
export const PAYMENT_METHODS: Record<
  PaymentMethod,
  {
    label: string
    icon: string
  }
> = {
  cash: { label: 'Cash', icon: '💵' },
  debit: { label: 'Debit Card', icon: '💳' },
  credit: { label: 'Credit Card', icon: '💳' },
  'bank-transfer': { label: 'Bank Transfer', icon: '🏦' },
  'mobile-payment': { label: 'Mobile Payment', icon: '📱' },
  other: { label: 'Other', icon: '💰' },
}
