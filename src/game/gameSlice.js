import { createSlice } from '@reduxjs/toolkit'
import {
  chooseAIDiscard,
  claimOptions,
  createWall,
  isWinningHand,
  shuffle,
  sortTiles,
  tileKey,
} from './tiles'

const PLAYER_INFO = [
  { id: 0, name: '你', wind: '东', avatar: '岚', color: 'coral' },
  { id: 1, name: '林默', wind: '南', avatar: '林', color: 'teal' },
  { id: 2, name: '周然', wind: '西', avatar: '周', color: 'gold' },
  { id: 3, name: '许澄', wind: '北', avatar: '许', color: 'blue' },
]

function createPlayers() {
  return PLAYER_INFO.map((player) => ({ ...player, hand: [], discards: [], melds: [], score: 25000 }))
}

function dealRound(previousScores, dealer = 0) {
  const wall = shuffle(createWall())
  const players = createPlayers()
  if (previousScores) players.forEach((player, index) => { player.score = previousScores[index] })
  const winds = ['东', '南', '西', '北']
  players.forEach((player) => { player.wind = winds[(player.id - dealer + 4) % 4] })
  for (let round = 0; round < 13; round += 1) {
    players.forEach((player) => player.hand.push(wall.pop()))
  }
  players[dealer].hand.push(wall.pop())
  players.forEach((player) => { player.hand = sortTiles(player.hand) })
  return { wall, players }
}

function createInitialState() {
  const { wall, players } = dealRound()
  return {
    wall,
    players,
    currentPlayer: 0,
    dealer: 0,
    round: 1,
    roundWind: '东',
    honba: 0,
    phase: 'discard',
    lastDiscard: null,
    claimOptions: [],
    selectedTileId: null,
    drawnTileId: players[0].hand.at(-1)?.id ?? null,
    canDeclareWin: isWinningHand(players[0].hand),
    winner: null,
    message: '东风一局 · 请打出一张牌',
    eventLog: ['牌局开始，你是东家'],
    soundEnabled: true,
    speed: 'normal',
    showRules: false,
    showSettings: false,
  }
}

function addLog(state, text) {
  state.eventLog.unshift(text)
  state.eventLog = state.eventLog.slice(0, 8)
}

function drawForUser(state) {
  if (!state.wall.length) {
    state.phase = 'ended'
    state.message = '牌墙已空，本局流局'
    state.winner = { draw: true }
    addLog(state, '流局 · 无人和牌')
    return
  }
  const tile = state.wall.pop()
  state.players[0].hand.push(tile)
  state.players[0].hand = sortTiles(state.players[0].hand)
  state.drawnTileId = tile.id
  state.canDeclareWin = isWinningHand(state.players[0].hand, state.players[0].melds.length)
  state.currentPlayer = 0
  state.phase = 'discard'
  state.message = state.canDeclareWin ? '牌已成和，可以胡牌' : '轮到你了 · 选择一张牌打出'
}

function continueAfterDiscard(state, discarderId) {
  const next = (discarderId + 1) % 4
  state.currentPlayer = next
  state.lastDiscard = null
  state.claimOptions = []
  if (next === 0) drawForUser(state)
  else {
    state.phase = 'ai'
    state.message = `${state.players[next].name}正在思考…`
  }
}

function removeMatchingTiles(hand, suit, values) {
  const result = []
  values.forEach((value) => {
    const index = hand.findIndex((tile) => tile.suit === suit && tile.value === value)
    if (index >= 0) result.push(...hand.splice(index, 1))
  })
  return result
}

function settleWin(state, playerId, fromPlayer = null) {
  const base = fromPlayer === null ? 2000 : 3000
  if (fromPlayer === null) {
    state.players.forEach((player) => {
      if (player.id !== playerId) {
        player.score -= base
        state.players[playerId].score += base
      }
    })
  } else {
    state.players[fromPlayer].score -= base * 3
    state.players[playerId].score += base * 3
  }
  state.phase = 'ended'
  state.winner = { playerId, fromPlayer, draw: false }
  state.message = playerId === 0 ? '和牌！漂亮的一局' : `${state.players[playerId].name}和牌`
  addLog(state, `${state.players[playerId].name}${fromPlayer === null ? '自摸' : '荣和'} · +${base * 3}`)
}

const gameSlice = createSlice({
  name: 'game',
  initialState: createInitialState(),
  reducers: {
    selectTile(state, action) {
      if (state.phase !== 'discard' || state.currentPlayer !== 0) return
      state.selectedTileId = state.selectedTileId === action.payload ? null : action.payload
    },
    discardSelected(state) {
      if (state.phase !== 'discard' || state.currentPlayer !== 0 || !state.selectedTileId) return
      const hand = state.players[0].hand
      const index = hand.findIndex((tile) => tile.id === state.selectedTileId)
      if (index < 0) return
      const [tile] = hand.splice(index, 1)
      state.players[0].discards.push(tile)
      state.lastDiscard = { tile, playerId: 0 }
      state.selectedTileId = null
      state.drawnTileId = null
      state.canDeclareWin = false
      addLog(state, `你打出 ${tileKey(tile)}`)
      state.currentPlayer = 1
      state.phase = 'ai'
      state.message = `${state.players[1].name}正在思考…`
    },
    aiTurn(state) {
      if (state.phase !== 'ai' || state.currentPlayer === 0) return
      const player = state.players[state.currentPlayer]
      if (!state.wall.length) {
        state.phase = 'ended'
        state.winner = { draw: true }
        state.message = '牌墙已空，本局流局'
        return
      }
      if (player.hand.length % 3 === 1) player.hand.push(state.wall.pop())
      player.hand = sortTiles(player.hand)
      if (isWinningHand(player.hand, player.melds.length)) {
        settleWin(state, player.id)
        return
      }
      const discardId = chooseAIDiscard(player.hand)
      const index = player.hand.findIndex((tile) => tile.id === discardId)
      const [tile] = player.hand.splice(index, 1)
      player.discards.push(tile)
      state.lastDiscard = { tile, playerId: player.id }
      addLog(state, `${player.name}打出 ${tileKey(tile)}`)

      const options = claimOptions(state.players[0].hand, tile, player.id === 3, state.players[0].melds.length)
      if (options.length) {
        state.claimOptions = options
        state.phase = 'claim'
        state.message = '可以鸣牌 · 请选择操作'
      } else {
        continueAfterDiscard(state, player.id)
      }
    },
    claimTile(state, action) {
      if (state.phase !== 'claim' || !state.lastDiscard) return
      const option = action.payload
      const { tile, playerId } = state.lastDiscard
      const discarder = state.players[playerId]
      discarder.discards.pop()
      if (option.type === 'win') {
        settleWin(state, 0, playerId)
        return
      }
      let claimedTiles = []
      if (option.type === 'pung') {
        claimedTiles = removeMatchingTiles(state.players[0].hand, tile.suit, [tile.value, tile.value])
      } else if (option.type === 'kong') {
        claimedTiles = removeMatchingTiles(state.players[0].hand, tile.suit, [tile.value, tile.value, tile.value])
      } else if (option.type === 'chow') {
        claimedTiles = removeMatchingTiles(state.players[0].hand, tile.suit, option.sequence)
      }
      state.players[0].melds.push({ type: option.type, tiles: sortTiles([...claimedTiles, tile]), from: playerId })
      state.players[0].hand = sortTiles(state.players[0].hand)
      state.currentPlayer = 0
      state.lastDiscard = null
      state.claimOptions = []
      state.phase = 'discard'
      state.message = `${option.label} · 请打出一张牌`
      addLog(state, `你选择了${option.label}`)
      if (option.type === 'kong' && state.wall.length) {
        const replacement = state.wall.pop()
        state.players[0].hand.push(replacement)
        state.players[0].hand = sortTiles(state.players[0].hand)
        state.drawnTileId = replacement.id
        state.canDeclareWin = isWinningHand(state.players[0].hand, state.players[0].melds.length)
      }
    },
    skipClaim(state) {
      if (state.phase !== 'claim' || !state.lastDiscard) return
      const discarderId = state.lastDiscard.playerId
      state.players[discarderId].discards.push(state.lastDiscard.tile)
      // The tile was never removed unless a claim is taken, so remove the duplicate added above.
      state.players[discarderId].discards.pop()
      continueAfterDiscard(state, discarderId)
    },
    declareSelfWin(state) {
      if (state.currentPlayer === 0 && state.canDeclareWin) settleWin(state, 0)
    },
    newRound(state) {
      const scores = state.players.map((player) => player.score)
      const nextDealer = (state.dealer + 1) % 4
      const next = dealRound(scores, nextDealer)
      state.wall = next.wall
      state.players = next.players
      state.round = state.round >= 4 ? 1 : state.round + 1
      state.dealer = nextDealer
      state.currentPlayer = nextDealer
      state.phase = nextDealer === 0 ? 'discard' : 'ai'
      state.lastDiscard = null
      state.claimOptions = []
      state.selectedTileId = null
      state.drawnTileId = nextDealer === 0 ? state.players[0].hand.at(-1)?.id ?? null : null
      state.canDeclareWin = nextDealer === 0 && isWinningHand(state.players[0].hand)
      state.winner = null
      state.message = nextDealer === 0
        ? `东风${['一', '二', '三', '四'][state.round - 1]}局 · 请打出一张牌`
        : `${state.players[nextDealer].name}坐庄 · 正在思考…`
      state.eventLog = [`东风${['一', '二', '三', '四'][state.round - 1]}局开始`]
    },
    restartGame() {
      return createInitialState()
    },
    toggleRules(state) { state.showRules = !state.showRules },
    toggleSettings(state) { state.showSettings = !state.showSettings },
    toggleSound(state) { state.soundEnabled = !state.soundEnabled },
    setSpeed(state, action) { state.speed = action.payload },
    closePanels(state) { state.showRules = false; state.showSettings = false },
  },
})

export const {
  aiTurn,
  claimTile,
  closePanels,
  declareSelfWin,
  discardSelected,
  newRound,
  restartGame,
  selectTile,
  setSpeed,
  skipClaim,
  toggleRules,
  toggleSettings,
  toggleSound,
} = gameSlice.actions

export default gameSlice.reducer
