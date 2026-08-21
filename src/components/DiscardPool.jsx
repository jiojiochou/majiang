import Tile from './Tile'

export default function DiscardPool({ player, position }) {
  return (
    <div className={`discard-pool pool-${position}`} aria-label={`${player.name}的牌河`}>
      {player.discards.map((tile) => <Tile key={tile.id} tile={tile} small />)}
    </div>
  )
}
