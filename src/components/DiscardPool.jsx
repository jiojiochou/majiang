import Tile from './Tile'

export default function DiscardPool({ player, position }) {
  const density = player.discards.length > 21 ? 'is-compact' : player.discards.length > 12 ? 'is-dense' : ''

  return (
    <div className={`discard-pool pool-${position} ${density}`} aria-label={`${player.name}的牌河`}>
      {player.discards.map((tile) => <Tile key={tile.id} tile={tile} small />)}
    </div>
  )
}
