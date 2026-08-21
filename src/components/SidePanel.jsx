import { History, Layers3 } from 'lucide-react'

export default function SidePanel({ players, eventLog, wallCount }) {
  return (
    <aside className="side-panel">
      <div className="side-section score-section">
        <div className="section-title"><Layers3 size={16} /><span>本局座次</span></div>
        <div className="score-list">
          {[...players].sort((a, b) => b.score - a.score).map((player, index) => (
            <div className="score-row" key={player.id}>
              <span className="rank">{index + 1}</span>
              <span className={`mini-avatar avatar-${player.color}`}>{player.avatar}</span>
              <span className="score-name">{player.name}<small>{player.wind}家</small></span>
              <strong>{player.score.toLocaleString()}</strong>
            </div>
          ))}
        </div>
      </div>
      <div className="side-section log-section">
        <div className="section-title"><History size={16} /><span>对局记录</span><small>{wallCount} 张余牌</small></div>
        <ol className="event-log">
          {eventLog.map((entry, index) => <li key={`${entry}-${index}`} className={index === 0 ? 'latest' : ''}>{entry}</li>)}
        </ol>
      </div>
    </aside>
  )
}
