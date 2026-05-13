type OutboxItem = {
  id: string
  table: 'transactions' | 'budgets' | 'investment_trades' | 'qris_payments'
  payload: Record<string, unknown>
  createdAt: number
}

const OUTBOX_KEY = 'monetra.outbox.v1'

function readOutbox(): OutboxItem[] {
  try {
    const raw = localStorage.getItem(OUTBOX_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed as OutboxItem[]
  } catch {
    return []
  }
}

function writeOutbox(items: OutboxItem[]) {
  localStorage.setItem(OUTBOX_KEY, JSON.stringify(items))
}

export function enqueueOutbox(item: Omit<OutboxItem, 'createdAt'>) {
  const items = readOutbox()
  items.unshift({ ...item, createdAt: Date.now() })
  writeOutbox(items.slice(0, 200))
}

export async function flushOutbox(insertFn: (table: OutboxItem['table'], payload: Record<string, unknown>) => Promise<void>) {
  const items = readOutbox()
  if (!items.length) return

  const remaining: OutboxItem[] = []
  for (const item of items.reverse()) {
    try {
      await insertFn(item.table, item.payload)
    } catch {
      remaining.unshift(item)
    }
  }

  writeOutbox(remaining)
}

