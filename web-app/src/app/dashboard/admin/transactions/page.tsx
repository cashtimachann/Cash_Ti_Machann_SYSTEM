'use client'

import { useEffect, useMemo, useState } from 'react'
import { formatDateTimeLocal } from '@/utils/datetime'

const API_BASE = 'http://localhost:8000/api'
const API_TOKEN = 'ca876cb231f819f96bc5ab4b29dfa88186291f28'

// Types
interface AdminTransaction {
  id: number | string
  reference_number?: string
  transaction_type?: string
  display_type?: string
  status: string
  amount: number | string
  fee?: number | string
  currency?: string
  sender_name?: string
  receiver_name?: string
  created_at: string
}

interface AdminListResponse {
  results: AdminTransaction[]
  count: number
}

// Helpers
const toNumber = (v: number | string | null | undefined) => {
  if (typeof v === 'number') return v
  if (typeof v === 'string') {
    const n = parseFloat(v)
    return isNaN(n) ? 0 : n
  }
  return 0
}

const formatAmount = (v: number | string | null | undefined) => {
  const n = toNumber(v)
  return n.toLocaleString('fr-HT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const statusLabel = (s: string) => {
  const key = (s || '').toLowerCase()
  const m: Record<string, string> = {
    completed: 'Konfime',
    pending: 'An analiz',
    cancelled: 'Anile',
    failed: 'Echwe',
  }
  return m[key] || s
}

const typeLabel = (t?: string, display_type?: string) => {
  if (display_type) return display_type
  const key = (t || '').toLowerCase()
  const m: Record<string, string> = {
    send: 'Voye',
    deposit: 'Depo',
    withdrawal: 'Retrè',
    request: 'Reqèt',
    bill_payment: 'Peman biznis',
  }
  return (key && m[key]) || (t || '-')
}

export default function AdminTransactions() {
  // Filters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('Tout')
  const [typeFilter, setTypeFilter] = useState('Tout')
  const [userTypeFilter, setUserTypeFilter] = useState('Tout')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')

  // Data
  const [transactions, setTransactions] = useState<AdminTransaction[]>([])
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)
  const limit = 10

  // UX
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [selected, setSelected] = useState<AdminTransaction | null>(null)

  // Build query
  const query = useMemo(() => {
    const p = new URLSearchParams()
    if (search.trim()) p.append('search', search.trim())
    if (statusFilter !== 'Tout') p.append('status', statusFilter)
    if (typeFilter !== 'Tout') p.append('type', typeFilter)
    if (userTypeFilter !== 'Tout') p.append('user_type', userTypeFilter)
    // Date range
    const toIso = (v: string) => {
      if (!v) return ''
      // datetime-local is in local time; convert to ISO with timezone
      const dt = new Date(v)
      return dt.toISOString()
    }
    const fromISO = toIso(startDate)
    const toISO = toIso(endDate)
    if (fromISO) p.append('date_from', fromISO)
    if (toISO) p.append('date_to', toISO)
    p.append('page', String(page))
    p.append('limit', String(limit))
    return p.toString()
  }, [search, statusFilter, typeFilter, userTypeFilter, startDate, endDate, page])

  // Fetch
  useEffect(() => {
    let aborted = false
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`${API_BASE}/transactions/admin/all/?${query}`, {
          headers: {
            Authorization: `Token ${API_TOKEN}`,
            'Content-Type': 'application/json',
          },
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data: AdminListResponse = await res.json()
        if (!aborted) {
          setTransactions(data.results || [])
          setCount(data.count || 0)
        }
      } catch (e: any) {
        if (!aborted) setError(e?.message || 'Erè nan chajman')
      } finally {
        if (!aborted) setLoading(false)
      }
    }
    load()
    return () => { aborted = true }
  }, [query])

  const totalPages = Math.max(1, Math.ceil(count / limit))

  const onRowClick = (t: AdminTransaction) => {
    setSelected(t)
    setShowModal(true)
  }

  const exportCSV = () => {
    const headers = [
      'ID', 'Referans', 'Tip', 'Estati', 'Montan', 'Frè', 'Deviz', 'Voye', 'Resevwa', 'Dat'
    ]
    const rows = transactions.map(t => [
      String(t.id),
      t.reference_number || '',
      typeLabel(t.transaction_type, t.display_type),
      statusLabel(t.status),
      formatAmount(t.amount),
      formatAmount(t.fee || 0),
      t.currency || 'HTG',
      t.sender_name || '',
      t.receiver_name || '',
      new Date(t.created_at).toISOString(),
    ])
    const csv = [headers, ...rows]
      .map(r => r.map((v) => '"' + String(v).replace(/"/g, '""') + '"').join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transactions_${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-black">Jesyon Tranzaksyon yo</h1>
          <p className="text-gray-600 mt-1">Filtre epi konsilte tout tranzaksyon yo</p>
        </div>
        <button onClick={exportCSV} className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700">Telechaje CSV</button>
      </div>

      {/* Filters */}
      <div className="bg-white border rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Chèche pa non, referans, ID..."
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
          />

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
          >
            <option>Tout</option>
            <option>Konfime</option>
            <option>An analiz</option>
            <option>Anile</option>
            <option>Echwe</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1) }}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
          >
            <option>Tout</option>
            <option>Voye</option>
            <option>Depo</option>
            <option>Retrè</option>
            <option>Reqèt</option>
            <option>Peman biznis</option>
          </select>

          <select
            value={userTypeFilter}
            onChange={(e) => { setUserTypeFilter(e.target.value); setPage(1) }}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
          >
            <option>Tout</option>
            <option>Klyan</option>
            <option>Ajan</option>
            <option>Ti machann</option>
            <option>Sistèm</option>
          </select>

          <input
            type="datetime-local"
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); setPage(1) }}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
            placeholder="Kòmanse (dat & lè)"
          />

          <input
            type="datetime-local"
            value={endDate}
            onChange={(e) => { setEndDate(e.target.value); setPage(1) }}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
            placeholder="Fini (dat & lè)"
          />
        </div>
        <div className="mt-3 text-sm text-gray-600">Ap montre {transactions.length} sou {count}</div>
      </div>

      {/* Table */}
      <div className="bg-white border rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-600">Ap chaje...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-600">{error}</div>
        ) : transactions.length === 0 ? (
          <div className="p-8 text-center text-gray-600">Pa gen rezilta</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">ID</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Referans</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Tip</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Estati</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Montan</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Ki moun voye</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Ki moun resevwa</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Dat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {transactions.map((t) => (
                  <tr key={String(t.id)} className="hover:bg-gray-50 cursor-pointer" onClick={() => onRowClick(t)}>
                    <td className="px-4 py-2 text-sm font-mono">{t.id}</td>
                    <td className="px-4 py-2 text-sm font-mono">{t.reference_number || '—'}</td>
                    <td className="px-4 py-2 text-sm">{typeLabel(t.transaction_type, t.display_type)}</td>
                    <td className="px-4 py-2 text-sm">{statusLabel(t.status)}</td>
                    <td className="px-4 py-2 text-sm font-mono">
                      {formatAmount(t.amount)} {t.currency || 'HTG'}
                      {toNumber(t.fee) > 0 && (
                        <div className="text-xs text-gray-500">Frè: {formatAmount(t.fee)} {t.currency || 'HTG'}</div>
                      )}
                    </td>
                    <td className="px-4 py-2 text-sm">{t.sender_name || '—'}</td>
                    <td className="px-4 py-2 text-sm">{t.receiver_name || '—'}</td>
                    <td className="px-4 py-2 text-sm text-gray-500">{formatDateTimeLocal(t.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between px-4 py-3 border-t bg-white">
          <div className="text-sm text-gray-600">Paj {page} nan {totalPages}</div>
          <div className="space-x-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Anvan
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Apre
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-lg bg-white rounded-lg shadow border" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h2 className="font-semibold">Detay tranzaksyon</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="p-4 space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-gray-500">ID</div>
                  <div className="font-mono">{String(selected.id)}</div>
                </div>
                <div>
                  <div className="text-gray-500">Referans</div>
                  <div className="font-mono">{selected.reference_number || '—'}</div>
                </div>
                <div>
                  <div className="text-gray-500">Tip</div>
                  <div>{typeLabel(selected.transaction_type, selected.display_type)}</div>
                </div>
                <div>
                  <div className="text-gray-500">Estati</div>
                  <div>{statusLabel(selected.status)}</div>
                </div>
                <div>
                  <div className="text-gray-500">Montan</div>
                  <div className="font-mono">{formatAmount(selected.amount)} {selected.currency || 'HTG'}</div>
                </div>
                <div>
                  <div className="text-gray-500">Frè</div>
                  <div className="font-mono">{formatAmount(selected.fee || 0)} {selected.currency || 'HTG'}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-gray-500">Voye</div>
                  <div>{selected.sender_name || '—'}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-gray-500">Resevwa</div>
                  <div>{selected.receiver_name || '—'}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-gray-500">Dat</div>
                  <div className="font-mono">{formatDateTimeLocal(selected.created_at)}</div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 px-4 py-3 border-t">
              <button onClick={() => setShowModal(false)} className="px-3 py-2 border rounded">Fèmen</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
