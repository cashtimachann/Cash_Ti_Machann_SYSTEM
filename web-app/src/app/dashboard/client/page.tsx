'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useUserCoreData, formatTimeAgo } from '../../utils/useUserCoreData'

export default function ClientDashboard() {
  const INACTIVITY_LIMIT_MS = 10 * 60 * 1000 // 10 min
  const WARNING_DURATION_MS = 30 * 1000 // 30 sec
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('overview')
  const [showInactivityWarning, setShowInactivityWarning] = useState(false)
  const inactivityTimer = useRef<NodeJS.Timeout | null>(null)
  const warningTimer = useRef<NodeJS.Timeout | null>(null)
  const [loadingRedirect, setLoadingRedirect] = useState(true)
  const { loading, userData, transactions, stats, refreshAll, requestVerification } = useUserCoreData({ role: 'client' })
  const [topupForm, setTopupForm] = useState({ recipientNumber: '', carrier: 'digicel', amount: '', message: '' })
  const verificationStatus = userData?.profile?.verification_status
  const showRequestVerification = verificationStatus === 'pending'

  // Redirect logic when role mismatch
  useEffect(() => {
    if (!loading && userData?.user?.user_type && userData.user.user_type !== 'client') {
      switch (userData.user.user_type) {
        case 'admin': router.push('/dashboard/admin'); break
        case 'agent': router.push('/dashboard/agent'); break
        case 'enterprise': router.push('/dashboard/enterprise'); break
        default: router.push('/login');
      }
    }
  }, [loading, userData, router])
  // Inactivity detection
  useEffect(() => {
    const resetTimer = () => {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current)
      if (warningTimer.current) clearTimeout(warningTimer.current)
      setShowInactivityWarning(false)
      inactivityTimer.current = setTimeout(() => {
        setShowInactivityWarning(true)
        warningTimer.current = setTimeout(() => {
          handleLogout()
        }, WARNING_DURATION_MS)
      }, INACTIVITY_LIMIT_MS)
    }
    // Listen to user events
    const events = ['mousemove','mousedown','keydown','touchstart','scroll']
    events.forEach(e => window.addEventListener(e, resetTimer))
    resetTimer()
    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimer))
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current)
      if (warningTimer.current) clearTimeout(warningTimer.current)
    }
  }, [])

  const handleLogout = async () => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      try { await fetch('http://127.0.0.1:8000/api/auth/logout/', { method: 'POST', headers: { 'Authorization': `Token ${token}`, 'Content-Type': 'application/json', }, }) } catch {}
    }
    localStorage.removeItem('auth_token')
    router.push('/login')
  }

  const handleTopupSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = localStorage.getItem('auth_token')
    if (!token) { router.push('/login'); return }
    try {
      const response = await fetch('http://127.0.0.1:8000/api/transactions/topup/', { method: 'POST', headers: { 'Authorization': `Token ${token}`, 'Content-Type': 'application/json', }, body: JSON.stringify({ recipient_phone: topupForm.recipientNumber, carrier: topupForm.carrier, amount: topupForm.amount, message: topupForm.message }) })
      if (response.ok) {
        alert(`✅ Voye ${topupForm.amount} HTG minit ${topupForm.carrier} nan ${topupForm.recipientNumber}`)
        setTopupForm({ recipientNumber: '', carrier: 'digicel', amount: '', message: '' })
        await refreshAll()
      } else {
        let msg = 'Tranzaksyon an echwe'
        try { const err = await response.json(); msg = err.error || err.detail || err.message || JSON.stringify(err) } catch {}
        alert(`❌ Erè: ${msg}`)
      }
    } catch {
      alert('❌ Erè nan koneksyon an')
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="text-center"><div className="animate-spin h-12 w-12 rounded-full border-b-2 border-primary-600 mx-auto"/><p className="mt-4 text-gray-600">Chajman done...</p></div></div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {showInactivityWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-sm mx-auto text-center">
            <h2 className="text-xl font-bold text-red-600 mb-4">Inaktivite Detekte</h2>
            <p className="text-gray-700 mb-4">Ou pa fè okenn aksyon sou kont ou depi 10 minit. Ou pral dekonekte otomatikman nan 30 segond si ou pa fè okenn aksyon.</p>
            <button className="bg-primary-600 text-white px-4 py-2 rounded" onClick={() => { setShowInactivityWarning(false); if (warningTimer.current) clearTimeout(warningTimer.current); }}>Mwen la!</button>
          </div>
        </div>
      )}
      <header className="bg-dark-950 shadow-sm"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"><div className="flex justify-between items-center h-14 sm:h-16"><div className="flex items-center"><h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-white"><span className="hidden sm:inline">Cash Ti </span><span className="text-primary-600"><span className="sm:hidden">CTM</span><span className="hidden sm:inline">Machann</span></span><span className="hidden md:inline"> - Kliyan</span></h1></div><div className="flex items-center space-x-2 sm:space-x-4"><div className="hidden md:block text-sm text-gray-300">Byenveni, <span className="font-medium text-white">{userData?.user?.first_name}</span></div><button onClick={handleLogout} className="bg-primary-600 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-md text-xs sm:text-sm hover:bg-primary-700 transition-colors"><span className="sm:hidden">Soti</span><span className="hidden sm:inline">Dekonekte</span></button></div></div></div></header>
      <div className="flex">
        <nav className="w-64 bg-white shadow-sm min-h-screen"><div className="p-4"><ul className="space-y-2">{['overview','wallet','transactions','topup','settings'].map(id => (<li key={id}><button onClick={()=>setActiveTab(id)} className={`w-full flex items-center px-4 py-2 text-left rounded-lg transition-colors ${activeTab===id?'bg-primary-600 text-white':'text-gray-700 hover:bg-gray-100'}`}>{id==='overview' && '📊 Apèsi Jeneral'}{id==='wallet' && '💰 Wallet'}{id==='transactions' && '📋 Tranzaksyon'}{id==='topup' && '📞 Top Up'}{id==='settings' && '⚙️ Paramèt'}</button></li>))}</ul></div></nav>
        <main className="flex-1 p-8">
          {activeTab==='overview' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard Kliyan</h2>
              {verificationStatus && <div className="mb-4 flex items-center gap-3"><span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${verificationStatus==='verified'?'bg-green-100 text-green-700':verificationStatus==='rejected'?'bg-red-100 text-red-700':'bg-yellow-100 text-yellow-700'}`}>Verifikasyon: {verificationStatus}</span>{showRequestVerification && <button onClick={async ()=>{const ok=await requestVerification(); if(ok){alert('Demann voye'); refreshAll()} else {alert('Demann pa pase')}}} className="text-xs bg-primary-600 text-white px-3 py-1 rounded hover:bg-primary-700">Mande Verifikasyon</button>}</div>}
              {userData?.wallet && <div className="mb-6 bg-white p-4 rounded-lg border shadow-sm flex items-center justify-between"><div><p className="text-sm text-gray-600">Balans Wallet</p><p className="text-2xl font-bold text-gray-900">{userData.wallet.balance} {userData.wallet.currency}</p></div><button onClick={refreshAll} className="text-xs bg-gray-100 px-3 py-1 rounded hover:bg-gray-200">Refresh</button></div>}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">{stats && <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"><p className="text-sm text-gray-600 mb-1">Tranzaksyon Mwa Sa a</p><p className="text-2xl font-bold text-gray-900">{stats.monthly_transactions}</p></div>}<div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"><p className="text-sm text-gray-600 mb-1">Dènye Aktivite</p><p className="text-sm font-medium text-gray-900">{stats?.recent_transaction?formatTimeAgo(stats.recent_transaction):'—'}</p></div><div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"><p className="text-sm text-gray-600 mb-1">Balans</p><p className="text-2xl font-bold text-gray-900">{stats?.balance || userData?.wallet?.balance} HTG</p></div></div>
              <div className="mt-10"><div className="flex items-center justify-between mb-3"><h3 className="text-lg font-semibold text-gray-900">Dènye Tranzaksyon</h3><button onClick={refreshAll} className="text-xs text-primary-600 hover:underline">Mizajou</button></div>{transactions.length===0?<p className="text-sm text-gray-500">Pa gen tranzaksyon pou kounye a.</p>:(<ul className="divide-y divide-gray-200 bg-white rounded-lg border">{transactions.slice(0,10).map(t=>(<li key={t.id} className="px-4 py-3 flex items-center justify-between text-sm"><div><p className="font-medium text-gray-800">{t.display_type || t.transaction_type}</p><p className="text-xs text-gray-500">{formatTimeAgo(t.created_at)}</p></div><div className="text-right"><p className="font-semibold text-gray-900">{t.amount} HTG</p><p className="text-xs text-gray-500">{t.status}</p></div></li>))}</ul>)}</div>
            </div>
          )}
          {activeTab==='wallet' && (<div><h2 className="text-2xl font-bold text-gray-900 mb-6">Wallet</h2>{userData?.wallet?(<div className="bg-white p-6 rounded-lg shadow-sm border"><p className="text-sm text-gray-600 mb-1">Balans</p><p className="text-3xl font-bold text-gray-900 mb-4">{userData.wallet.balance} {userData.wallet.currency}</p><button onClick={refreshAll} className="text-xs bg-gray-100 px-3 py-1 rounded hover:bg-gray-200">Mizajou</button></div>):<p className="text-sm text-gray-500">Pa gen wallet.</p>}</div>)}
          {activeTab==='transactions' && (<div><h2 className="text-2xl font-bold text-gray-900 mb-6">Tout Tranzaksyon</h2>{transactions.length===0?<p className="text-sm text-gray-500">Pa gen tranzaksyon.</p>:(<div className="overflow-x-auto bg-white border rounded-lg"><table className="min-w-full text-sm"><thead className="bg-gray-50"><tr><th className="px-4 py-2 text-left font-medium text-gray-600">Tip</th><th className="px-4 py-2 text-left font-medium text-gray-600">Montan</th><th className="px-4 py-2 text-left font-medium text-gray-600">Eta</th><th className="px-4 py-2 text-left font-medium text-gray-600">Lè</th></tr></thead><tbody className="divide-y divide-gray-200">{transactions.map(t=>(<tr key={t.id}><td className="px-4 py-2">{t.display_type || t.transaction_type}</td><td className="px-4 py-2">{t.amount} HTG</td><td className="px-4 py-2">{t.status}</td><td className="px-4 py-2">{formatTimeAgo(t.created_at)}</td></tr>))}</tbody></table></div>)}</div>)}
          {activeTab==='topup' && (<div><h2 className="text-2xl font-bold text-gray-900 mb-6">Voye Minit</h2><form onSubmit={handleTopupSubmit} className="bg-white p-6 rounded-lg shadow-sm border space-y-4 max-w-md"><div><label className="block text-sm font-medium text-gray-700 mb-1">Nimewo Benefisyè</label><input value={topupForm.recipientNumber} onChange={e=>setTopupForm({...topupForm, recipientNumber:e.target.value})} className="w-full border rounded px-3 py-2 text-sm" required /></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Operatè</label><select value={topupForm.carrier} onChange={e=>setTopupForm({...topupForm, carrier:e.target.value})} className="w-full border rounded px-3 py-2 text-sm"><option value="digicel">Digicel</option><option value="natcom">Natcom</option></select></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Montan (HTG)</label><input type="number" value={topupForm.amount} onChange={e=>setTopupForm({...topupForm, amount:e.target.value})} className="w-full border rounded px-3 py-2 text-sm" required /></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Mesaj (opsyonèl)</label><textarea value={topupForm.message} onChange={e=>setTopupForm({...topupForm, message:e.target.value})} className="w-full border rounded px-3 py-2 text-sm" rows={3}></textarea></div><div className="flex justify-between items-center"><button type="submit" className="bg-primary-600 text-white px-4 py-2 rounded text-sm hover:bg-primary-700">Voye</button><button type="button" onClick={()=>refreshAll()} className="text-xs text-gray-500 hover:underline">Refresh</button></div></form></div>)}
          {activeTab==='settings' && (<div><h2 className="text-2xl font-bold text-gray-900 mb-6">Paramèt</h2><p className="text-sm text-gray-600 mb-4">Plis paramèt ap vini...</p></div>)}
        </main>
      </div>
    </div>
  )
}
