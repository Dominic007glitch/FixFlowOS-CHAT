import { useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { BadgeCheck, CalendarClock, CreditCard, Sparkles, ShieldCheck } from 'lucide-react'
import { db } from '../firebase.js'
import { useAuth } from '../contexts/AuthContext.jsx'
import { money, dateTime } from '../utils/format.js'
import { Alert, EmptyState, LoadingScreen, SectionHeader } from '../components/ui.jsx'

const initialPlans = [
  { id: 'plano1', name: 'Plano 1', price: 499, users: 'Até 7 usuários', features: ['Ordens de serviço', 'Estoque e PDV', 'Controle de caixa'] },
  { id: 'plano2', name: 'Plano 2', price: 599, users: 'Até 10 usuários', features: ['Tudo do Plano 1', 'Mais acessos para equipe', 'Visão operacional ampliada'] },
  { id: 'plano3', name: 'Plano 3', price: 750, users: 'Usuários ilimitados', features: ['Tudo do Plano 2', 'Equipe sem limite de usuários', 'Para operações maiores'] },
]
export default function Planos() {
  const { user } = useAuth()
  const [subscription, setSubscription] = useState(null)
  const [store, setStore] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    if (!db || !user?.lojaId) { setLoading(false); return undefined }
    const unsub1 = onSnapshot(doc(db, 'lojas', user.lojaId, 'assinatura', 'atual'), snap => { setSubscription(snap.exists() ? snap.data() : null); setLoading(false) }, err => { setError(err.message); setLoading(false) })
    const unsub2 = onSnapshot(doc(db, 'lojas', user.lojaId), snap => setStore(snap.exists() ? snap.data() : null), err => setError(err.message))
    return () => { unsub1(); unsub2() }
  }, [user?.lojaId])
  if (loading) return <LoadingScreen label="Consultando assinatura..." />
  const periodLabels = { semanal: 'Semanal', mensal: 'Mensal', tresMeses: '3 Meses', anual: '1 Ano', vitalicio: 'Vitalício' }
  const statusLabels = { active: 'Ativa', trial: 'Em teste grátis', expired: 'Vencida', suspended: 'Suspensa' }
  const currentPlan = initialPlans.find(p => p.id === subscription?.planoId) || initialPlans.find(p => p.name === subscription?.plano) || null
  return <div className="page-stack"><SectionHeader eyebrow="PLANO E ACESSOS" title="Assinatura" description="Consulte o plano ativo, o período contratado e o status da sua assistência." />{error && <Alert>{error}</Alert>}
    <section className="subscription-hero"><div className="subscription-hero-content"><span className="subscription-pill"><Sparkles size={14} /> FIXFLOWOS</span><h2>{subscription ? (currentPlan?.name || subscription.planoNome || subscription.plano || 'Plano personalizado') : 'Assinatura não configurada'}</h2><p>{subscription?.status === 'trial' ? 'Sua assistência está utilizando o período de teste gratuito.' : subscription ? 'Confira abaixo as informações registradas para sua assinatura.' : 'A administração do SaaS ainda não vinculou um plano a esta loja.'}</p></div><div className="subscription-hero-status"><span className="eyebrow">STATUS</span><strong className={`subscription-status status-${subscription?.status || 'unknown'}`}>{statusLabels[subscription?.status] || 'Não configurada'}</strong><small>{subscription?.status === 'trial' ? '1 semana de teste grátis' : 'Informação do Firestore'}</small></div></section>
    {subscription ? <div className="stats-grid subscription-stats"><article className="stat-card"><div className="stat-icon stat-purple"><CreditCard size={19} /></div><span className="stat-label">Preço configurado</span><strong className="stat-value">{money(subscription.preco ?? currentPlan?.price ?? 0)}</strong><span className="stat-foot">Valor salvo pelo Super Admin</span></article><article className="stat-card"><div className="stat-icon stat-blue"><CalendarClock size={19} /></div><span className="stat-label">Período</span><strong className="stat-value stat-value-text">{periodLabels[subscription.periodo] || subscription.periodo || '—'}</strong><span className="stat-foot">Duração contratada</span></article><article className="stat-card"><div className="stat-icon stat-green"><BadgeCheck size={19} /></div><span className="stat-label">Válida até</span><strong className="stat-value stat-value-text">{subscription.periodo === 'vitalicio' ? 'Vitalício' : dateTime(subscription.dataFim || subscription.expiresAt)}</strong><span className="stat-foot">Conforme registro da assinatura</span></article></div> : <EmptyState title="Plano ainda não vinculado" description="Entre em contato com a administração do FixFlowOS para configurar plano, preço e período para a loja." />}
    <section className="panel"><div className="panel-title-row"><div><h2>Planos de referência</h2><p>Os valores iniciais podem ser personalizados pelo Super Admin.</p></div><span className="private-tag"><ShieldCheck size={14} /> Preços administrados pelo SaaS</span></div><div className="plans-grid">{initialPlans.map((plan, index) => <article className={`plan-card ${currentPlan?.id === plan.id ? 'plan-current' : ''}`} key={plan.id}>{currentPlan?.id === plan.id && <span className="plan-current-badge">SEU PLANO</span>}<span className="plan-index">0{index + 1}</span><h3>{plan.name}</h3><strong className="plan-price">{money(plan.price)}<small>/ referência inicial</small></strong><span className="plan-users">{plan.users}</span><ul>{plan.features.map(feature => <li key={feature}><BadgeCheck size={15} />{feature}</li>)}</ul></article>)}</div><div className="trial-note"><Sparkles size={17} /><div><strong>1 semana de teste grátis</strong><p>O período de teste precisa ser concedido e registrado pela administração do SaaS. Esta tela não simula renovação ou pagamento.</p></div></div></section>
  </div>
}
