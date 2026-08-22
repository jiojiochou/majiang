import test from 'node:test'
import assert from 'node:assert/strict'
import { isWinningHand } from './tiles.js'

function createHand(keys) {
  return keys.map((key, index) => ({
    id: `${key}-${index}`,
    suit: key[0],
    value: Number(key.slice(1)),
  }))
}

test('recognizes a winning hand after manual reordering', () => {
  const tiles = createHand([
    's2', 's2', 's2',
    's7', 's8', 's9',
    'm4', 'm4',
    'p5', 'p6', 'p7',
    'm8', 'm9', 'm7',
  ])

  assert.equal(isWinningHand(tiles), true)
})

test('rejects the same hand when the dots sequence is incomplete', () => {
  const tiles = createHand([
    's2', 's2', 's2',
    's7', 's8', 's9',
    'm4', 'm4',
    'p5', 'p6', 'p9',
    'm8', 'm9', 'm7',
  ])

  assert.equal(isWinningHand(tiles), false)
})
