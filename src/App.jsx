import { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { CircleHelp, Settings, Volume2, VolumeX } from 'lucide-react'
import ControlBar from './components/ControlBar'
import PlayerSeat from './components/PlayerSeat'
import ResultOverlay from './components/ResultOverlay'
import ThreeMahjongTable from './components/ThreeMahjongTable'
import Tile from './components/Tile'
import { RulesModal, SettingsModal } from './components/Modal'
import {
  aiTurn, claimTile, closePanels, declareKong, declareSelfWin, discardSelected, newRound, reorderHand, restartGame,
  selectTile, setSpeed, skipClaim, toggleRules, toggleSettings, toggleSound,
} from './game/gameSlice'
import { selfKongOptions } from './game/tiles'

const SPEEDS = { slow: 1500, normal: 850, fast: 360 }

export default function App() {
  const dispatch = useDispatch()
  const game = useSelector((state) => state.game)
  const [draggedTileId, setDraggedTileId] = useState(null)
  const dragState = useRef(null)
  const suppressTileClick = useRef(false)

  useEffect(() => {
    if (game.phase !== 'ai') return undefined
    const timer = window.setTimeout(() => dispatch(aiTurn()), SPEEDS[game.speed])
    return () => window.clearTimeout(timer)
  }, [dispatch, game.currentPlayer, game.phase, game.speed])

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') dispatch(closePanels())
      if (event.key === 'Enter' && game.selectedTileId) dispatch(discardSelected())
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dispatch, game.selectedTileId])

  const startTileDrag = (element, pointerId, tileId) => {
    const drag = dragState.current
    if (!drag || drag.pointerId !== pointerId || drag.tileId !== tileId) return
    drag.dragging = true
    drag.lastTargetId = tileId
    try { element.setPointerCapture(pointerId) } catch { /* Pointer may have been cancelled by scrolling. */ }
    setDraggedTileId(tileId)
  }

  const handleTilePointerDown = (event, tileId) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    const element = event.currentTarget
    const drag = {
      tileId,
      pointerId: event.pointerId,
      pointerType: event.pointerType,
      startX: event.clientX,
      startY: event.clientY,
      dragging: false,
      lastTargetId: tileId,
    }
    dragState.current = drag
    // Capture the pointer immediately, but only enter drag mode after movement.
    // A long ordinary touch must remain a click so selecting a tile is reliable.
    try { element.setPointerCapture(event.pointerId) } catch { /* Pointer capture is best-effort. */ }
  }

  const handleTilePointerMove = (event) => {
    const drag = dragState.current
    if (!drag || drag.pointerId !== event.pointerId) return
    if (!drag.dragging) {
      if (Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < 5) return
      startTileDrag(event.currentTarget, event.pointerId, drag.tileId)
    }
    event.preventDefault()
    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest('.hand-tile-slot')
    const targetTileId = target?.dataset.tileId
    if (!targetTileId || targetTileId === drag.lastTargetId) return
    drag.lastTargetId = targetTileId
    dispatch(reorderHand({ tileId: drag.tileId, targetTileId }))
  }

  const finishTileDrag = (event, cancelled = false) => {
    const drag = dragState.current
    if (!drag || drag.pointerId !== event.pointerId) return
    if (drag.dragging && !cancelled) {
      suppressTileClick.current = true
      window.setTimeout(() => { suppressTileClick.current = false }, 0)
    }
    try {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    } catch { /* The pointer may already be released. */ }
    dragState.current = null
    setDraggedTileId(null)
  }

  const handleTileKeyDown = (event, tileId, index) => {
    if (!event.altKey || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return
    const targetIndex = index + (event.key === 'ArrowLeft' ? -1 : 1)
    const target = game.players[0].hand[targetIndex]
    if (!target) return
    event.preventDefault()
    dispatch(reorderHand({ tileId, targetTileId: target.id }))
  }

  const handleTileClick = (tileId) => {
    if (suppressTileClick.current) return
    if (game.selectedTileId === tileId) dispatch(discardSelected(tileId))
    else dispatch(selectTile(tileId))
  }

  const handleControlClaim = (option) => {
    if (option.type === 'selfWin') dispatch(declareSelfWin())
    else dispatch(claimTile(option))
  }

  const user = game.players[0]
  const kongOptions = game.phase === 'discard' && game.currentPlayer === 0 && game.wall.length
    ? selfKongOptions(user.hand, user.melds)
    : []

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-mark">四</span><span><strong>四风牌局</strong><small>FOUR WINDS</small></span></div>
        <div className="round-pill"><span className="live-dot" />东风战 <b>·</b> 第 {game.round} 局</div>
        <nav className="header-actions" aria-label="游戏菜单">
          <button className="icon-button" onClick={() => dispatch(toggleSound())} title={game.soundEnabled ? '关闭音效' : '开启音效'} aria-label={game.soundEnabled ? '关闭音效' : '开启音效'}>{game.soundEnabled ? <Volume2 /> : <VolumeX />}</button>
          <button className="icon-button" onClick={() => dispatch(toggleRules())} title="基础规则" aria-label="基础规则"><CircleHelp /></button>
          <button className="icon-button" onClick={() => dispatch(toggleSettings())} title="牌桌设置" aria-label="牌桌设置"><Settings /></button>
        </nav>
      </header>

      <div className="game-layout">
        <section className="table-stage">
          <div className="mahjong-table">
            <ThreeMahjongTable
              players={game.players}
              latestDiscard={game.latestDiscard}
              wallCount={game.wall.length}
              currentPlayer={game.currentPlayer}
            />
            <PlayerSeat player={game.players[2]} position="top" active={game.currentPlayer === 2} dealer={game.dealer} showRack={false} showMelds={false} />
            <PlayerSeat player={game.players[3]} position="left" active={game.currentPlayer === 3} dealer={game.dealer} showRack={false} showMelds={false} />
            <PlayerSeat player={game.players[1]} position="right" active={game.currentPlayer === 1} dealer={game.dealer} showRack={false} showMelds={false} />

            <section className={`user-area ${game.currentPlayer === 0 ? 'is-active' : ''}`}>
              <div className="user-meta">
                <span className={`avatar avatar-${user.color}`}>{user.avatar}</span>
                <span className="user-copy"><strong>你</strong><small>{user.score.toLocaleString()} 点</small></span>
                <span className="seat-badges">
                  <span className="wind-chip">{user.wind}</span>
                  {game.dealer === 0 && <span className="dealer-dot" title="庄家">庄</span>}
                </span>
              </div>
              <div className="user-tiles-scroll">
                <div className="user-tiles">
                  {user.melds.length > 0 && <div className="user-melds">{user.melds.map((meld, index) => <div className="meld-group" key={index}>{meld.tiles.map((tile) => <Tile key={tile.id} tile={tile} />)}</div>)}</div>}
                  <div className="user-hand">
                    {user.hand.map((tile, index) => (
                      <div
                        className={`hand-tile-slot ${draggedTileId === tile.id ? 'is-dragging' : ''} ${game.drawnTileId === tile.id ? 'is-drawn' : ''}`}
                        data-tile-id={tile.id}
                        key={tile.id}
                        onPointerDown={(event) => handleTilePointerDown(event, tile.id)}
                        onPointerMove={handleTilePointerMove}
                        onPointerUp={finishTileDrag}
                        onPointerCancel={(event) => finishTileDrag(event, true)}
                        onContextMenu={(event) => event.preventDefault()}
                        onClick={() => handleTileClick(tile.id)}
                      >
                        <Tile
                          tile={tile}
                          selected={game.selectedTileId === tile.id}
                          drawn={game.drawnTileId === tile.id}
                          disabled={game.phase !== 'discard' || game.currentPlayer !== 0}
                          onClick={(event) => { event.stopPropagation(); handleTileClick(tile.id) }}
                          onKeyDown={(event) => handleTileKeyDown(event, tile.id, index)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </div>

          <ControlBar
            phase={game.phase}
            selected={game.selectedTileId}
            canWin={game.canDeclareWin}
            kongOptions={kongOptions}
            options={game.claimOptions}
            onDiscard={() => dispatch(discardSelected())}
            onClaim={handleControlClaim}
            onKong={(option) => dispatch(declareKong(option))}
            onSkip={() => dispatch(skipClaim())}
          />
        </section>
      </div>

      {game.showRules && <RulesModal onClose={() => dispatch(toggleRules())} />}
      {game.showSettings && <SettingsModal soundEnabled={game.soundEnabled} speed={game.speed} onSound={() => dispatch(toggleSound())} onSpeed={(value) => dispatch(setSpeed(value))} onRestart={() => dispatch(restartGame())} onClose={() => dispatch(toggleSettings())} />}
      {game.phase === 'ended' && game.winner && <ResultOverlay winner={game.winner} players={game.players} onNext={() => dispatch(newRound())} onRestart={() => dispatch(restartGame())} />}
    </main>
  )
}
