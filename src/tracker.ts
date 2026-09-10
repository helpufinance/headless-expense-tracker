import type {
  CategorySummary,
  Expense,
  ExpenseCategory,
  ExpenseFilter,
  ExpenseSortOptions,
  ExpenseSummary,
  ExpenseTrackerError,
  MonthlyTrend,
  StorageAdapter,
} from './types'
export function validateExpense(expense: Partial<Expense>): ExpenseTrackerError | null {
  if (!expense.description || expense.description.trim().length === 0) {
    return { code: 'INVALID_INPUT', message: 'Description is required', field: 'description' }
  }
  if (typeof expense.amount !== 'number' || isNaN(expense.amount) || expense.amount <= 0) {
    return { code: 'INVALID_AMOUNT', message: 'Amount must be a positive number', field: 'amount' }
  }
  if (!expense.date || isNaN(Date.parse(expense.date))) {
    return { code: 'INVALID_DATE', message: 'Valid date is required', field: 'date' }
  }
  return null
}
export function createExpense(
  data: Pick<Expense, 'description' | 'amount' | 'category' | 'date'> & Partial<Expense>,
):
  | {
      success: true
      data: Expense
    }
  | {
      success: false
      error: ExpenseTrackerError
    } {
  const validationError = validateExpense(data)
  if (validationError) {
    return { success: false, error: validationError }
  }
  const now = new Date().toISOString()
  const expense: Expense = {
    id: crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    description: data.description,
    amount: parseFloat(data.amount.toFixed(2)),
    category: data.category,
    date: data.date,
    notes: data.notes || '',
    paymentMethod: data.paymentMethod || 'cash',
    tags: data.tags || [],
    isRecurring: data.isRecurring || false,
    createdAt: now,
    updatedAt: now,
  }
  return { success: true, data: expense }
}
export function updateExpense(
  existing: Expense,
  updates: Partial<Omit<Expense, 'id' | 'createdAt'>>,
):
  | {
      success: true
      data: Expense
    }
  | {
      success: false
      error: ExpenseTrackerError
    } {
  const merged = { ...existing, ...updates, updatedAt: new Date().toISOString() }
  const validationError = validateExpense(merged)
  if (validationError) {
    return { success: false, error: validationError }
  }
  return { success: true, data: merged }
}
export function filterExpenses(expenses: Expense[], filter: ExpenseFilter): Expense[] {
  return expenses.filter((expense) => {
    if (filter.category && expense.category !== filter.category) return false
    if (filter.dateFrom && expense.date < filter.dateFrom) return false
    if (filter.dateTo && expense.date > filter.dateTo) return false
    if (filter.minAmount !== undefined && expense.amount < filter.minAmount) return false
    if (filter.maxAmount !== undefined && expense.amount > filter.maxAmount) return false
    if (filter.paymentMethod && expense.paymentMethod !== filter.paymentMethod) return false
    if (filter.search) {
      const search = filter.search.toLowerCase()
      const matchesDescription = expense.description.toLowerCase().includes(search)
      const matchesNotes = expense.notes?.toLowerCase().includes(search) || false
      if (!matchesDescription && !matchesNotes) return false
    }
    if (filter.tags && filter.tags.length > 0) {
      const expenseTags = expense.tags || []
      if (!filter.tags.some((tag) => expenseTags.includes(tag))) return false
    }
    return true
  })
}
export function sortExpenses(expenses: Expense[], sort: ExpenseSortOptions): Expense[] {
  const sorted = [...expenses]
  const dir = sort.direction === 'asc' ? 1 : -1
  sorted.sort((a, b) => {
    switch (sort.field) {
      case 'date':
        return (a.date > b.date ? 1 : a.date < b.date ? -1 : 0) * dir
      case 'amount':
        return (a.amount - b.amount) * dir
      case 'category':
        return a.category.localeCompare(b.category) * dir
      case 'description':
        return a.description.localeCompare(b.description) * dir
      default:
        return 0
    }
  })
  return sorted
}
export function calculateExpenseSummary(expenses: Expense[]): ExpenseSummary {
  if (expenses.length === 0) {
    return {
      totalAmount: 0,
      count: 0,
      averageAmount: 0,
      highestExpense: 0,
      lowestExpense: 0,
      categoryBreakdown: [],
      dailyAverage: 0,
      topCategory: null,
      dateRange: null,
    }
  }
  const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0)
  const amounts = expenses.map((e) => e.amount)
  const dates = expenses.map((e) => e.date).sort()
  const categoryMap = new Map<
    string,
    {
      amount: number
      count: number
    }
  >()
  for (const expense of expenses) {
    const existing = categoryMap.get(expense.category) || { amount: 0, count: 0 }
    categoryMap.set(expense.category, {
      amount: existing.amount + expense.amount,
      count: existing.count + 1,
    })
  }
  const categoryBreakdown: CategorySummary[] = Array.from(categoryMap.entries())
    .map(([category, data]) => ({
      category,
      amount: parseFloat(data.amount.toFixed(2)),
      percentage: totalAmount > 0 ? parseFloat(((data.amount / totalAmount) * 100).toFixed(1)) : 0,
      count: data.count,
    }))
    .sort((a, b) => b.amount - a.amount)
  const dateFrom = new Date(dates[0])
  const dateTo = new Date(dates[dates.length - 1])
  const daysDiff = Math.max(
    1,
    Math.ceil((dateTo.getTime() - dateFrom.getTime()) / (1000 * 60 * 60 * 24)) + 1,
  )
  return {
    totalAmount: parseFloat(totalAmount.toFixed(2)),
    count: expenses.length,
    averageAmount: parseFloat((totalAmount / expenses.length).toFixed(2)),
    highestExpense: parseFloat(Math.max(...amounts).toFixed(2)),
    lowestExpense: parseFloat(Math.min(...amounts).toFixed(2)),
    categoryBreakdown,
    dailyAverage: parseFloat((totalAmount / daysDiff).toFixed(2)),
    topCategory: categoryBreakdown[0]?.category || null,
    dateRange: { from: dates[0], to: dates[dates.length - 1] },
  }
}
export function getMonthlyTrends(expenses: Expense[]): MonthlyTrend[] {
  const monthMap = new Map<
    string,
    {
      amount: number
      count: number
    }
  >()
  for (const expense of expenses) {
    const month = expense.date.slice(0, 7)
    const existing = monthMap.get(month) || { amount: 0, count: 0 }
    monthMap.set(month, {
      amount: existing.amount + expense.amount,
      count: existing.count + 1,
    })
  }
  return Array.from(monthMap.entries())
    .map(([month, data]) => ({
      month,
      amount: parseFloat(data.amount.toFixed(2)),
      count: data.count,
    }))
    .sort((a, b) => a.month.localeCompare(b.month))
}
export function getSpendingByDayOfWeek(expenses: Expense[]): {
  day: string
  amount: number
  count: number
}[] {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const dayMap = new Map<
    number,
    {
      amount: number
      count: number
    }
  >()
  for (let i = 0; i < 7; i++) {
    dayMap.set(i, { amount: 0, count: 0 })
  }
  for (const expense of expenses) {
    const dayOfWeek = new Date(expense.date).getDay()
    const existing = dayMap.get(dayOfWeek)!
    dayMap.set(dayOfWeek, {
      amount: existing.amount + expense.amount,
      count: existing.count + 1,
    })
  }
  return Array.from(dayMap.entries()).map(([dayIndex, data]) => ({
    day: days[dayIndex],
    amount: parseFloat(data.amount.toFixed(2)),
    count: data.count,
  }))
}
export class LocalStorageAdapter implements StorageAdapter {
  private readonly key: string
  constructor(key: string = 'helpu-expense-tracker') {
    this.key = key
  }
  getAll(): Expense[] {
    if (typeof globalThis.localStorage === 'undefined') return []
    try {
      const data = globalThis.localStorage.getItem(this.key)
      return data ? JSON.parse(data) : []
    } catch {
      return []
    }
  }
  saveAll(expenses: Expense[]): void {
    if (typeof globalThis.localStorage === 'undefined') return
    try {
      globalThis.localStorage.setItem(this.key, JSON.stringify(expenses))
    } catch {}
  }
  clear(): void {
    if (typeof globalThis.localStorage === 'undefined') return
    globalThis.localStorage.removeItem(this.key)
  }
}
export class MemoryStorageAdapter implements StorageAdapter {
  private expenses: Expense[] = []
  getAll(): Expense[] {
    return [...this.expenses]
  }
  saveAll(expenses: Expense[]): void {
    this.expenses = [...expenses]
  }
  clear(): void {
    this.expenses = []
  }
}
export class ExpenseTracker {
  private storage: StorageAdapter
  private expenses: Expense[]
  constructor(storage?: StorageAdapter) {
    this.storage = storage || new LocalStorageAdapter()
    this.expenses = this.storage.getAll()
  }
  getAll(): Expense[] {
    return [...this.expenses]
  }
  add(data: Pick<Expense, 'description' | 'amount' | 'category' | 'date'> & Partial<Expense>):
    | {
        success: true
        data: Expense
      }
    | {
        success: false
        error: ExpenseTrackerError
      } {
    const result = createExpense(data)
    if (result.success) {
      this.expenses.push(result.data)
      this.storage.saveAll(this.expenses)
    }
    return result
  }
  update(
    id: string,
    updates: Partial<Omit<Expense, 'id' | 'createdAt'>>,
  ):
    | {
        success: true
        data: Expense
      }
    | {
        success: false
        error: ExpenseTrackerError
      } {
    const index = this.expenses.findIndex((e) => e.id === id)
    if (index === -1) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: `Expense with id "${id}" not found` },
      }
    }
    const result = updateExpense(this.expenses[index], updates)
    if (result.success) {
      this.expenses[index] = result.data
      this.storage.saveAll(this.expenses)
    }
    return result
  }
  delete(id: string): boolean {
    const index = this.expenses.findIndex((e) => e.id === id)
    if (index === -1) return false
    this.expenses.splice(index, 1)
    this.storage.saveAll(this.expenses)
    return true
  }
  filter(filter: ExpenseFilter): Expense[] {
    return filterExpenses(this.expenses, filter)
  }
  sort(sort: ExpenseSortOptions): Expense[] {
    return sortExpenses(this.expenses, sort)
  }
  getSummary(filter?: ExpenseFilter): ExpenseSummary {
    const filtered = filter ? this.filter(filter) : this.expenses
    return calculateExpenseSummary(filtered)
  }
  getTrends(): MonthlyTrend[] {
    return getMonthlyTrends(this.expenses)
  }
  getUsedCategories(): ExpenseCategory[] {
    return [...new Set(this.expenses.map((e) => e.category))]
  }
  export(): string {
    return JSON.stringify(
      {
        expenses: this.expenses,
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
      },
      null,
      2,
    )
  }
  import(jsonString: string):
    | {
        success: true
        count: number
      }
    | {
        success: false
        error: ExpenseTrackerError
      } {
    try {
      const data = JSON.parse(jsonString)
      if (!data.expenses || !Array.isArray(data.expenses)) {
        return {
          success: false,
          error: { code: 'INVALID_INPUT', message: 'Invalid import format' },
        }
      }
      this.expenses = data.expenses
      this.storage.saveAll(this.expenses)
      return { success: true, count: this.expenses.length }
    } catch {
      return {
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Failed to parse import data' },
      }
    }
  }
  clear(): void {
    this.expenses = []
    this.storage.clear()
  }
  get count(): number {
    return this.expenses.length
  }
}
