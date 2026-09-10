<p align="center">
  <a href="https://github.com/helpufinance/helpu.finance">
    <img src="https://raw.githubusercontent.com/helpufinance/.github/refs/heads/main/profile/assets/helpu_finance.png" alt="HelpU Finance" width="260">
  </a>
</p>

# Headless Expense Tracker

[![npm version](https://img.shields.io/npm/v/%40helpu%2Fheadless-expense-tracker?logo=npm)](https://www.npmjs.com/package/@helpu/headless-expense-tracker)

A headless, framework-agnostic expense tracker with localStorage persistence, category management, and analytics.

## What is HelpU Finance?

HelpU Finance is a free, privacy-first platform with financial tools and educational resources. No tracking, no data collection.

We believe that financial literacy should be accessible to everyone.

## Installation

```bash
npm install @helpu/headless-expense-tracker
```

## Usage

```ts
import { calculateExpenseSummary, createExpense } from '@helpu/headless-expense-tracker'

const result = createExpense({
  description: 'Groceries',
  amount: 85,
  category: 'food',
  date: '2026-01-15',
  paymentMethod: 'debit',
})

if (result.success) {
  const summary = calculateExpenseSummary([result.data])
  console.log(summary.totalAmount)
  console.log(summary.categoryBreakdown)
} else {
  console.error(result.error.message)
}
```

Use `MemoryStorageAdapter` or `LocalStorageAdapter` when you need persistence, and combine the filtering, sorting, and summary helpers for your application’s UI.

## Testing

Install the repository dependencies and run the test suite with:

```bash
npm test
```

## Contributing

Contributions are welcome. Please read the [contribution guidelines](https://docs.omisai.com/contribution-guidelines) before opening a pull request.

## Sponsor

Support HelpU Finance through [GitHub Sponsors](https://github.com/sponsors/helpufinance).

## License

This project is available for permitted non-commercial use under the **PolyForm Noncommercial License 1.0.0**.

Personal learning, education, research, experimentation, and other uses permitted by the PolyForm Noncommercial License are welcome.

**Commercial use requires a separate license from Omisai Technologies.**

Commercial licensing helps fund the HelpU Finance mission of creating freely accessible financial tools, educational resources, and technology.

For commercial licensing, see [`COMMERCIAL-LICENSING.md`](./COMMERCIAL-LICENSING.md).

Copyright (c) 2026 Omisai Technologies.

HelpU Finance is a project and brand of Omisai Technologies.
