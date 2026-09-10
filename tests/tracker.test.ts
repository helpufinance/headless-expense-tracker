import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  calculateExpenseSummary,
  createExpense,
  ExpenseTracker,
  filterExpenses,
  getSpendingByDayOfWeek,
  getMonthlyTrends,
  LocalStorageAdapter,
  MemoryStorageAdapter,
  sortExpenses,
  validateExpense,
} from '../src/tracker'
import { EXPENSE_CATEGORY_CONFIG, PAYMENT_METHODS } from '../src'
import type { Expense } from '../src/types'
const sampleExpenses: Expense[] = [
  {
    id: '1',
    description: 'Rent',
    amount: 1200,
    category: 'housing',
    date: '2026-01-15',
    paymentMethod: 'bank-transfer',
    tags: [],
    isRecurring: true,
    createdAt: '2026-01-15T00:00:00Z',
    updatedAt: '2026-01-15T00:00:00Z',
  },
  {
    id: '2',
    description: 'Groceries',
    amount: 85.5,
    category: 'food',
    date: '2026-01-18',
    paymentMethod: 'debit',
    tags: ['weekly'],
    isRecurring: false,
    createdAt: '2026-01-18T00:00:00Z',
    updatedAt: '2026-01-18T00:00:00Z',
  },
  {
    id: '3',
    description: 'Netflix',
    amount: 15.99,
    category: 'subscriptions',
    date: '2026-01-01',
    paymentMethod: 'credit',
    tags: ['streaming'],
    isRecurring: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: '4',
    description: 'Dinner out',
    amount: 65,
    category: 'dining',
    date: '2026-02-05',
    paymentMethod: 'credit',
    tags: [],
    isRecurring: false,
    createdAt: '2026-02-05T00:00:00Z',
    updatedAt: '2026-02-05T00:00:00Z',
  },
]
describe('validateExpense', () => {
  it('should reject empty description', () => {
    const error = validateExpense({ description: '', amount: 10, date: '2026-01-01' })
    expect(error).not.toBeNull()
    expect(error?.field).toBe('description')
  })
  it('should reject negative amount', () => {
    const error = validateExpense({ description: 'Test', amount: -5, date: '2026-01-01' })
    expect(error).not.toBeNull()
    expect(error?.field).toBe('amount')
  })
  it('should reject whitespace, non-numeric, and missing amounts or dates', () => {
    expect(validateExpense({ description: '   ', amount: 10, date: '2026-01-01' })?.code).toBe(
      'INVALID_INPUT',
    )
    expect(validateExpense({ description: 'Test', amount: NaN, date: '2026-01-01' })?.code).toBe(
      'INVALID_AMOUNT',
    )
    expect(validateExpense({ description: 'Test', amount: 10, date: '' })?.code).toBe(
      'INVALID_DATE',
    )
  })
  it('should reject invalid date', () => {
    const error = validateExpense({ description: 'Test', amount: 10, date: 'not-a-date' })
    expect(error).not.toBeNull()
    expect(error?.field).toBe('date')
  })
  it('should accept valid expense', () => {
    const error = validateExpense({ description: 'Test', amount: 10, date: '2026-01-01' })
    expect(error).toBeNull()
  })
})
describe('createExpense', () => {
  it('should create expense with defaults', () => {
    const result = createExpense({
      description: 'Coffee',
      amount: 4.5,
      category: 'food',
      date: '2026-01-20',
    })
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.description).toBe('Coffee')
    expect(result.data.amount).toBe(4.5)
    expect(result.data.id).toBeTruthy()
    expect(result.data.createdAt).toBeTruthy()
  })
  it('should create a fallback id when randomUUID is unavailable', () => {
    vi.stubGlobal('crypto', {})
    const result = createExpense({
      description: 'Fallback',
      amount: 1,
      category: 'other',
      date: '2026-01-20',
    })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.id).toMatch(/^\d+-[a-z0-9]+$/)
    vi.unstubAllGlobals()
  })
  it('should preserve explicit optional fields', () => {
    const result = createExpense({
      description: 'Coffee',
      amount: 4.567,
      category: 'food',
      date: '2026-01-20',
      notes: 'With oat milk',
      paymentMethod: 'mobile-payment',
      tags: ['morning'],
      isRecurring: true,
    })
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.amount).toBe(4.57)
    expect(result.data.notes).toBe('With oat milk')
    expect(result.data.paymentMethod).toBe('mobile-payment')
    expect(result.data.tags).toEqual(['morning'])
    expect(result.data.isRecurring).toBe(true)
  })
  it('should reject invalid expense', () => {
    const result = createExpense({
      description: '',
      amount: 0,
      category: 'food',
      date: '2026-01-20',
    })
    expect(result.success).toBe(false)
  })
})
describe('filterExpenses', () => {
  it('should filter by category', () => {
    const result = filterExpenses(sampleExpenses, { category: 'food' })
    expect(result).toHaveLength(1)
    expect(result[0].description).toBe('Groceries')
  })
  it('should filter by date range', () => {
    const result = filterExpenses(sampleExpenses, { dateFrom: '2026-01-10', dateTo: '2026-01-31' })
    expect(result).toHaveLength(2)
  })
  it('should filter by search term', () => {
    const result = filterExpenses(sampleExpenses, { search: 'net' })
    expect(result).toHaveLength(1)
  })
  it('should filter by amount range', () => {
    const result = filterExpenses(sampleExpenses, { minAmount: 50, maxAmount: 100 })
    expect(result).toHaveLength(2)
  })
  it('should filter by payment method, notes, and tags', () => {
    expect(filterExpenses(sampleExpenses, { paymentMethod: 'credit' })).toHaveLength(2)
    expect(
      filterExpenses([{ ...sampleExpenses[0], notes: 'monthly payment', tags: ['fixed'] }], {
        search: 'payment',
      }),
    ).toHaveLength(1)
    expect(filterExpenses(sampleExpenses, { tags: ['missing'] })).toHaveLength(0)
    expect(filterExpenses(sampleExpenses, { tags: ['weekly'] })).toHaveLength(1)
    expect(
      filterExpenses([{ ...sampleExpenses[0], tags: undefined }], { tags: ['missing'] }),
    ).toHaveLength(0)
  })
})
describe('sortExpenses', () => {
  it('should sort by amount ascending', () => {
    const sorted = sortExpenses(sampleExpenses, { field: 'amount', direction: 'asc' })
    expect(sorted[0].amount).toBeLessThanOrEqual(sorted[1].amount)
  })
  it('should sort by date descending', () => {
    const sorted = sortExpenses(sampleExpenses, { field: 'date', direction: 'desc' })
    expect(sorted[0].date >= sorted[1].date).toBe(true)
  })
  it('should sort by date equality, category, and description', () => {
    const sameDate = [
      { ...sampleExpenses[0], description: 'Zed', category: 'food' as const },
      { ...sampleExpenses[1], description: 'Alpha', date: sampleExpenses[0].date },
    ]
    expect(sortExpenses(sameDate, { field: 'date', direction: 'asc' })).toHaveLength(2)
    expect(sortExpenses(sampleExpenses, { field: 'category', direction: 'asc' })[0].category).toBe(
      'dining',
    )
    expect(
      sortExpenses(sampleExpenses, { field: 'description', direction: 'desc' })[0].description,
    ).toBe('Rent')
    expect(
      sortExpenses(sampleExpenses, { field: 'unknown' as never, direction: 'asc' }),
    ).toHaveLength(4)
  })
})
describe('calculateExpenseSummary', () => {
  it('should calculate totals correctly', () => {
    const summary = calculateExpenseSummary(sampleExpenses)
    expect(summary.totalAmount).toBeCloseTo(1366.49, 1)
    expect(summary.count).toBe(4)
    expect(summary.highestExpense).toBe(1200)
    expect(summary.lowestExpense).toBe(15.99)
  })
  it('should produce category breakdown', () => {
    const summary = calculateExpenseSummary(sampleExpenses)
    expect(summary.categoryBreakdown.length).toBeGreaterThan(0)
    expect(summary.topCategory).toBe('housing')
  })
  it('should handle empty array', () => {
    const summary = calculateExpenseSummary([])
    expect(summary.totalAmount).toBe(0)
    expect(summary.count).toBe(0)
    expect(summary.topCategory).toBeNull()
  })
  it('should calculate a zero-total category percentage', () => {
    const summary = calculateExpenseSummary([{ ...sampleExpenses[0], amount: 0 }])
    expect(summary.categoryBreakdown[0].percentage).toBe(0)
    expect(summary.dailyAverage).toBe(0)
  })
  it('should return a null top category for malformed empty category data', () => {
    const summary = calculateExpenseSummary([
      { ...sampleExpenses[0], category: undefined as never },
    ])
    expect(summary.topCategory).toBeNull()
  })
})
describe('getMonthlyTrends', () => {
  it('should group by month', () => {
    const trends = getMonthlyTrends(sampleExpenses)
    expect(trends.length).toBe(2)
    expect(trends[0].month).toBe('2026-01')
    expect(trends[1].month).toBe('2026-02')
  })
  it('should return no trends for an empty list', () => {
    expect(getMonthlyTrends([])).toEqual([])
  })
})
describe('getSpendingByDayOfWeek', () => {
  it('should aggregate spending by weekday', () => {
    const result = getSpendingByDayOfWeek(sampleExpenses)
    expect(result).toHaveLength(7)
    expect(result.reduce((sum, day) => sum + day.amount, 0)).toBeCloseTo(1366.49, 1)
    expect(result.reduce((sum, day) => sum + day.count, 0)).toBe(4)
  })
})
describe('storage adapters', () => {
  it('should handle unavailable, empty, invalid, and failing local storage', () => {
    vi.stubGlobal('localStorage', undefined)
    const unavailable = new LocalStorageAdapter()
    expect(unavailable.getAll()).toEqual([])
    unavailable.saveAll(sampleExpenses)
    unavailable.clear()

    const values = new Map<string, string>()
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    }
    vi.stubGlobal('localStorage', storage)
    const adapter = new LocalStorageAdapter('expenses')
    expect(adapter.getAll()).toEqual([])
    values.set('expenses', '')
    expect(adapter.getAll()).toEqual([])
    adapter.saveAll(sampleExpenses)
    expect(adapter.getAll()).toEqual(sampleExpenses)
    values.set('expenses', 'invalid json')
    expect(adapter.getAll()).toEqual([])
    storage.setItem = () => {
      throw new Error('storage unavailable')
    }
    adapter.saveAll(sampleExpenses)
    adapter.clear()
    vi.unstubAllGlobals()
  })
  it('should store and clear memory data', () => {
    const adapter = new MemoryStorageAdapter()
    adapter.saveAll(sampleExpenses)
    expect(adapter.getAll()).toEqual(sampleExpenses)
    adapter.clear()
    expect(adapter.getAll()).toEqual([])
  })
})
describe('ExpenseTracker', () => {
  let tracker: ExpenseTracker
  beforeEach(() => {
    tracker = new ExpenseTracker(new MemoryStorageAdapter())
  })
  it('should add and retrieve expenses', () => {
    tracker.add({ description: 'Test', amount: 50, category: 'food', date: '2026-01-01' })
    expect(tracker.count).toBe(1)
    expect(tracker.getAll()[0].description).toBe('Test')
  })
  it('should delete expenses', () => {
    tracker.add({ description: 'Test', amount: 50, category: 'food', date: '2026-01-01' })
    const id = tracker.getAll()[0].id
    expect(tracker.delete(id)).toBe(true)
    expect(tracker.count).toBe(0)
  })
  it('should update expenses', () => {
    tracker.add({ description: 'Test', amount: 50, category: 'food', date: '2026-01-01' })
    const id = tracker.getAll()[0].id
    const result = tracker.update(id, { amount: 75 })
    expect(result.success).toBe(true)
    expect(tracker.getAll()[0].amount).toBe(75)
  })
  it('should export and import', () => {
    tracker.add({ description: 'Test1', amount: 50, category: 'food', date: '2026-01-01' })
    tracker.add({ description: 'Test2', amount: 100, category: 'housing', date: '2026-01-02' })
    const exported = tracker.export()
    const newTracker = new ExpenseTracker(new MemoryStorageAdapter())
    const result = newTracker.import(exported)
    expect(result.success).toBe(true)
    if (result.success) expect(result.count).toBe(2)
  })
  it('should filter and sort', () => {
    tracker.add({ description: 'A', amount: 100, category: 'food', date: '2026-01-01' })
    tracker.add({ description: 'B', amount: 50, category: 'housing', date: '2026-01-02' })
    tracker.add({ description: 'C', amount: 75, category: 'food', date: '2026-01-03' })
    const filtered = tracker.filter({ category: 'food' })
    expect(filtered).toHaveLength(2)
    const sorted = tracker.sort({ field: 'amount', direction: 'desc' })
    expect(sorted[0].amount).toBe(100)
  })
  it('should get summary', () => {
    tracker.add({ description: 'A', amount: 100, category: 'food', date: '2026-01-01' })
    tracker.add({ description: 'B', amount: 200, category: 'housing', date: '2026-01-02' })
    const summary = tracker.getSummary()
    expect(summary.totalAmount).toBe(300)
    expect(summary.count).toBe(2)
  })
  it('should handle invalid adds, missing updates, invalid updates, and deletes', () => {
    expect(
      tracker.add({ description: '', amount: 50, category: 'food', date: '2026-01-01' }).success,
    ).toBe(false)
    expect(tracker.update('missing', { amount: 75 }).success).toBe(false)
    tracker.add({ description: 'Test', amount: 50, category: 'food', date: '2026-01-01' })
    const id = tracker.getAll()[0].id
    expect(tracker.update(id, { amount: -1 }).success).toBe(false)
    expect(tracker.delete('missing')).toBe(false)
    expect(tracker.delete(id)).toBe(true)
  })
  it('should expose trends, categories, filtered summaries, exports, and clear', () => {
    tracker.add({ description: 'Food', amount: 50, category: 'food', date: '2026-01-01' })
    tracker.add({ description: 'Rent', amount: 100, category: 'housing', date: '2026-01-02' })
    expect(tracker.getTrends()).toHaveLength(1)
    expect(tracker.getUsedCategories()).toEqual(['food', 'housing'])
    expect(tracker.getSummary({ category: 'food' }).totalAmount).toBe(50)
    expect(JSON.parse(tracker.export()).version).toBe('1.0.0')
    const invalidFormat = tracker.import('{}')
    expect(invalidFormat.success).toBe(false)
    const invalidJson = tracker.import('{')
    expect(invalidJson.success).toBe(false)
    tracker.clear()
    expect(tracker.count).toBe(0)
  })
  it('should use local storage by default', () => {
    const defaultTracker = new ExpenseTracker()
    expect(defaultTracker.count).toBe(0)
  })
})

describe('public exports', () => {
  it('exports category and payment method configurations', () => {
    expect(EXPENSE_CATEGORY_CONFIG.food.label).toBe('Food & Groceries')
    expect(PAYMENT_METHODS.debit.label).toBe('Debit Card')
  })
})
