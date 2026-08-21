export const SUITS = ['m', 'p', 's', 'z']

export const TILE_META = {
  m: { name: '万', className: 'characters' },
  p: { name: '筒', className: 'dots' },
  s: { name: '条', className: 'bamboo' },
  z: { name: '字', className: 'honors' },
}

export const HONORS = ['东', '南', '西', '北', '中', '发', '白']

export function tileKey(tile) {
  return `${tile.suit}${tile.value}`
}

export function tileLabel(tile) {
  if (tile.suit === 'z') return HONORS[tile.value - 1]
  return `${tile.value}${TILE_META[tile.suit].name}`
}

export function tileOrder(tile) {
  return SUITS.indexOf(tile.suit) * 10 + tile.value
}

export function sortTiles(tiles) {
  return [...tiles].sort((a, b) => tileOrder(a) - tileOrder(b))
}

export function createWall() {
  const wall = []
  let id = 0
  for (const suit of SUITS) {
    const max = suit === 'z' ? 7 : 9
    for (let value = 1; value <= max; value += 1) {
      for (let copy = 0; copy < 4; copy += 1) {
        wall.push({ id: `${suit}${value}-${copy}-${id++}`, suit, value })
      }
    }
  }
  return wall
}

export function shuffle(items) {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

function countsFromTiles(tiles) {
  const counts = new Map()
  tiles.forEach((tile) => counts.set(tileKey(tile), (counts.get(tileKey(tile)) || 0) + 1))
  return counts
}

function canFormMelds(counts, remaining) {
  if (remaining === 0) return true
  const first = [...counts.entries()].find(([, count]) => count > 0)
  if (!first) return false
  const [key, count] = first
  const suit = key[0]
  const value = Number(key.slice(1))

  if (count >= 3) {
    counts.set(key, count - 3)
    if (canFormMelds(counts, remaining - 3)) return true
    counts.set(key, count)
  }

  if (suit !== 'z' && value <= 7) {
    const second = `${suit}${value + 1}`
    const third = `${suit}${value + 2}`
    if ((counts.get(second) || 0) > 0 && (counts.get(third) || 0) > 0) {
      counts.set(key, count - 1)
      counts.set(second, counts.get(second) - 1)
      counts.set(third, counts.get(third) - 1)
      if (canFormMelds(counts, remaining - 3)) return true
      counts.set(key, count)
      counts.set(second, counts.get(second) + 1)
      counts.set(third, counts.get(third) + 1)
    }
  }
  return false
}

export function isWinningHand(tiles, meldCount = 0) {
  const neededMelds = 4 - meldCount
  if (tiles.length !== neededMelds * 3 + 2) return false
  const counts = countsFromTiles(tiles)
  for (const [key, count] of counts.entries()) {
    if (count < 2) continue
    counts.set(key, count - 2)
    if (canFormMelds(counts, neededMelds * 3)) return true
    counts.set(key, count)
  }
  return false
}

export function claimOptions(hand, tile, canChow, meldCount = 0) {
  const same = hand.filter((item) => tileKey(item) === tileKey(tile)).length
  const options = []
  if (isWinningHand([...hand, tile], meldCount)) options.push({ type: 'win', label: '胡' })
  if (same >= 3) options.push({ type: 'kong', label: '杠' })
  if (same >= 2) options.push({ type: 'pung', label: '碰' })
  if (canChow && tile.suit !== 'z') {
    const values = new Set(hand.filter((item) => item.suit === tile.suit).map((item) => item.value))
    const sequences = [
      [tile.value - 2, tile.value - 1],
      [tile.value - 1, tile.value + 1],
      [tile.value + 1, tile.value + 2],
    ].filter(([a, b]) => a >= 1 && b <= 9 && values.has(a) && values.has(b))
    sequences.forEach((sequence) => options.push({ type: 'chow', label: '吃', sequence }))
  }
  return options
}

export function chooseAIDiscard(hand) {
  const counts = countsFromTiles(hand)
  const scored = hand.map((tile) => {
    const same = counts.get(tileKey(tile)) || 0
    let neighbors = 0
    if (tile.suit !== 'z') {
      for (const offset of [-2, -1, 1, 2]) {
        if (counts.has(`${tile.suit}${tile.value + offset}`)) neighbors += Math.abs(offset) === 1 ? 2 : 1
      }
    }
    const honorPenalty = tile.suit === 'z' && same === 1 ? -2 : 0
    return { tile, score: same * 3 + neighbors + honorPenalty + Math.random() }
  })
  scored.sort((a, b) => a.score - b.score)
  return scored[0].tile.id
}
