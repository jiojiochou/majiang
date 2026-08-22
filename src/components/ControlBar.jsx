import { Check, ChevronDown, Hand, X } from 'lucide-react'

export default function ControlBar({ phase, selected, canWin, kongOptions, options, onDiscard, onClaim, onKong, onSkip }) {
  if (phase === 'claim') {
    return (
      <div className="control-bar claim-bar">
        <div className="claim-copy"><Hand size={18} /><span>响应这张牌</span></div>
        <div className="claim-actions">
          {options.map((option, index) => (
            <button className={`action-button action-${option.type}`} key={`${option.type}-${index}`} onClick={() => onClaim(option)}>
              {option.label}{option.sequence ? <small>{option.sequence.join(' · ')}</small> : null}
            </button>
          ))}
          <button className="icon-text-button pass-button" onClick={onSkip}><X size={17} />过</button>
        </div>
      </div>
    )
  }

  return (
    <div className="control-bar">
      <div className="selection-hint"><ChevronDown size={16} /><span>{selected ? '再次点击牌或按下打出' : '选择一张手牌'}</span></div>
      <div className="primary-actions">
        {canWin && <button className="action-button action-win" onClick={() => onClaim({ type: 'selfWin' })}>胡</button>}
        {kongOptions.map((option) => (
          <button className="action-button action-kong" key={`${option.kind}-${option.key}`} onClick={() => onKong(option)}>
            杠<small>{option.label}</small>
          </button>
        ))}
        <button className="discard-button" disabled={!selected || phase !== 'discard'} onClick={onDiscard}>
          <Check size={18} />打出
        </button>
      </div>
    </div>
  )
}
