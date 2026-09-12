import { STATUS_LABELS } from '../utils/helpers'

const FLOW = ['request_sent', 'service_notified', 'en_route', 'arriving_soon', 'help_arrived', 'completed']

export default function StatusTracker({ status }) {
  if (status === 'cancelled') {
    return <div className="alert alert-warn">This emergency request was cancelled.</div>
  }

  const currentIdx = FLOW.indexOf(status)

  return (
    <div className="status-track" aria-label="Request status">
      {FLOW.map((step, idx) => {
        const done = idx < currentIdx
        const current = idx === currentIdx
        return (
          <div key={step} className={`status-step${done ? ' done' : ''}${current ? ' current' : ''}`}>
            <span className="status-dot" aria-hidden />
            <div>
              <strong>{STATUS_LABELS[step]}</strong>
              {current && <div className="service-meta">Current status</div>}
            </div>
          </div>
        )
      })}
    </div>
  )
}
