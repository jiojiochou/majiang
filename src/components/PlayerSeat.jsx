import Tile from './Tile'

export default function PlayerSeat({ player, position, active, dealer }) {
  const isTop = position === 'top'
  const isSide = position === 'left' || position === 'right'
  const hiddenCount = player.hand.length

  return (
    <section className={`player-seat seat-${position} ${active ? 'is-active' : ''}`} aria-label={`${player.name}的座位`}>
      <div className="player-badge">
        <span className={`avatar avatar-${player.color}`}>{player.avatar}</span>
        <span className="player-copy">
          <strong>{player.name}</strong>
          <span>{player.score.toLocaleString()}</span>
        </span>
        <span className="wind-chip">{player.wind}</span>
        {dealer === player.id && <span className="dealer-dot" title="庄家">庄</span>}
      </div>

      <div className={`opponent-rack rack-${position}`} aria-label={`${hiddenCount}张手牌`}>
        {Array.from({ length: Math.min(hiddenCount, 13) }, (_, index) => (
          <Tile key={index} hidden small={isTop || isSide} />
        ))}
      </div>

      {player.melds.length > 0 && (
        <div className="opponent-melds">
          {player.melds.flatMap((meld) => meld.tiles.map((tile) => <Tile key={tile.id} tile={tile} small />))}
        </div>
      )}
    </section>
  )
}
