import { TILE_META, tileLabel } from '../game/tiles'

function SuitMark({ tile }) {
  if (tile.suit === 'z') return <span className={`honor honor-${tile.value}`}>{tileLabel(tile)}</span>
  if (tile.suit === 'p') {
    const dots = Array.from({ length: tile.value }, (_, index) => <i key={index} />)
    return <span className={`dot-grid count-${tile.value}`}>{dots}</span>
  }
  if (tile.suit === 's') {
    if (tile.value === 1) return <span className="bamboo-bird">雀</span>
    return <span className="bamboo-mark">{tile.value}<small>索</small></span>
  }
  return <span className="character-mark"><b>{tile.value}</b><small>萬</small></span>
}

export default function Tile({ tile, hidden = false, selected = false, drawn = false, small = false, onClick, disabled = false }) {
  if (hidden) return <div className={`tile tile-back ${small ? 'tile-small' : ''}`} aria-hidden="true"><span /></div>
  const classes = [
    'tile',
    `tile-${TILE_META[tile.suit].className}`,
    selected ? 'is-selected' : '',
    drawn ? 'is-drawn' : '',
    small ? 'tile-small' : '',
  ].filter(Boolean).join(' ')
  const label = tileLabel(tile)
  return onClick ? (
    <button className={classes} onClick={onClick} disabled={disabled} aria-label={label} aria-pressed={selected}>
      <SuitMark tile={tile} />
    </button>
  ) : <div className={classes} aria-label={label}><SuitMark tile={tile} /></div>
}
