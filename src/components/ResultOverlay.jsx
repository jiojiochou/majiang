import { RotateCw, Trophy } from 'lucide-react'

export default function ResultOverlay({ winner, players, onNext, onRestart }) {
  const isDraw = winner?.draw
  const wonByUser = winner?.playerId === 0
  const title = isDraw ? '流局' : wonByUser ? '和牌' : `${players[winner.playerId].name} 和牌`
  const subtitle = isDraw ? '牌墙已空，无人和牌' : winner.fromPlayer == null ? '自摸 · 三家支付' : `荣和 · ${players[winner.fromPlayer].name} 放铳`
  return (
    <div className="result-overlay">
      <div className="result-card">
        <span className="result-icon"><Trophy /></span>
        <span className="eyebrow">ROUND COMPLETE</span>
        <h2>{title}</h2>
        <p>{subtitle}</p>
        <div className="result-scores">{players.map((player) => <span key={player.id}><small>{player.name}</small><strong>{player.score.toLocaleString()}</strong></span>)}</div>
        <div className="result-actions"><button className="secondary-button" onClick={onRestart}>结束牌局</button><button className="discard-button" onClick={onNext}><RotateCw size={17} />下一局</button></div>
      </div>
    </div>
  )
}
