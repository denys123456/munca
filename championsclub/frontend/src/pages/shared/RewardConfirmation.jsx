import { useState } from 'react'
import { Gift } from 'lucide-react'
import { Dialog } from '../../components/ui/Dialog.jsx'
import { availableBalance } from '../../product/selectors.js'

export function RewardConfirmation({ reward, advisor, data, onClose }) {
  const [status, setStatus] = useState({ pending: false, error: '' })
  async function redeem(event) {
    event.preventDefault()
    if (status.pending) return
    setStatus({ pending: true, error: '' })
    try { await data.actions.redeemReward(reward.id, advisor.id); onClose() }
    catch (error) { setStatus({ pending: false, error: error.message }) }
  }
  return <Dialog title="Make it yours." onClose={onClose}><form onSubmit={redeem}>
    <div className="confirmation-feature"><Gift /><span className="eyebrow">{reward.category}</span><h3>{reward.name}</h3><p>For {advisor.name}</p></div>
    <div className="confirmation-summary"><span>Points to redeem</span><strong>{reward.points.toLocaleString('en')}</strong><span>Balance after redemption</span><strong>{(availableBalance(advisor) - reward.points).toLocaleString('en')}</strong></div>
    <p className="soft-copy">Confirm to submit this reward and deduct the points from the available balance.</p>
    {status.error && <p className="form-message error" role="alert">{status.error}</p>}
    <div className="modal-actions"><button type="button" className="secondary-action" onClick={onClose}>Cancel</button><button className="primary-action" disabled={status.pending}>{status.pending ? 'Submitting…' : 'Confirm redemption'}</button></div>
  </form></Dialog>
}
