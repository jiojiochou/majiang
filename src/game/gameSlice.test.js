import test from 'node:test'
import assert from 'node:assert/strict'
import gameReducer, { discardSelected, selectTile } from './gameSlice.js'

test('tracks the newest discarded tile for the table marker', () => {
  const initial = gameReducer(undefined, { type: '@@init' })
  const tile = initial.players[0].hand[0]
  const selected = gameReducer(initial, selectTile(tile.id))

  const discarded = gameReducer(selected, discardSelected())

  assert.deepEqual(discarded.latestDiscard, { tileId: tile.id, playerId: 0 })
  assert.equal(discarded.players[0].discards.at(-1).id, tile.id)
})
