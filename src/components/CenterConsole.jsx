import { CircleDot, Dices, Timer } from 'lucide-react'

export default function CenterConsole({ round, honba, wallCount, currentWind, message }) {
  return (
    <div className="center-console">
      <div className="console-head">
        <span>东风战</span>
        <CircleDot size={14} />
        <span>{honba} 本场</span>
      </div>
      <div className="wind-display">
        <span className="round-label">东 {round} 局</span>
        <strong>{currentWind}</strong>
        <span className="wall-counter"><Dices size={15} /> 余 {wallCount}</span>
      </div>
      <div className="turn-message"><Timer size={14} /> <span>{message}</span></div>
    </div>
  )
}
