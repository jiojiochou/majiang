import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { CircleHelp, Settings, Volume2, VolumeX } from 'lucide-react'
import CenterConsole from './components/CenterConsole'
import ControlBar from './components/ControlBar'
import DiscardPool from './components/DiscardPool'
import PlayerSeat from './components/PlayerSeat'
import ResultOverlay from './components/ResultOverlay'
import SidePanel from './components/SidePanel'
import Tile from './components/Tile'
import { RulesModal, SettingsModal } from './components/Modal'
import {
  aiTurn, claimTile, closePanels, declareSelfWin, discardSelected, newRound, restartGame,
  selectTile, setSpeed, skipClaim, toggleRules, toggleSettings, toggleSound,
} from './game/gameSlice'

const SPEEDS = { slow: 1500, normal: 850, fast: 360 }

export default function App() {
  const dispatch = useDispatch()
  const game = useSelector((state) => state.game)

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

  const handleControlClaim = (option) => {
    if (option.type === 'selfWin') dispatch(declareSelfWin())
    else dispatch(claimTile(option))
  }

  const user = game.players[0]

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
            <div className="table-inlay" />
            <PlayerSeat player={game.players[2]} position="top" active={game.currentPlayer === 2} dealer={game.dealer} />
            <PlayerSeat player={game.players[3]} position="left" active={game.currentPlayer === 3} dealer={game.dealer} />
            <PlayerSeat player={game.players[1]} position="right" active={game.currentPlayer === 1} dealer={game.dealer} />

            <div className="river-layout">
              <DiscardPool player={game.players[2]} position="top" />
              <DiscardPool player={game.players[3]} position="left" />
              <CenterConsole round={game.round} honba={game.honba} wallCount={game.wall.length} currentWind={game.players[game.currentPlayer].wind} message={game.message} />
              <DiscardPool player={game.players[1]} position="right" />
              <DiscardPool player={game.players[0]} position="bottom" />
            </div>

            <section className={`user-area ${game.currentPlayer === 0 ? 'is-active' : ''}`}>
              <div className="user-meta">
                <span className="wind-chip">{user.wind}</span>
                <span><strong>你的手牌</strong><small>{user.score.toLocaleString()} 点</small></span>
                {game.dealer === 0 && <span className="dealer-label">庄家</span>}
              </div>
              {user.melds.length > 0 && <div className="user-melds">{user.melds.map((meld, index) => <div className="meld-group" key={index}>{meld.tiles.map((tile) => <Tile key={tile.id} tile={tile} small />)}</div>)}</div>}
              <div className="user-hand">
                {user.hand.map((tile) => (
                  <Tile
                    key={tile.id}
                    tile={tile}
                    selected={game.selectedTileId === tile.id}
                    drawn={game.drawnTileId === tile.id}
                    disabled={game.phase !== 'discard' || game.currentPlayer !== 0}
                    onClick={() => dispatch(selectTile(tile.id))}
                  />
                ))}
              </div>
            </section>
          </div>

          <ControlBar
            phase={game.phase}
            selected={game.selectedTileId}
            canWin={game.canDeclareWin}
            options={game.claimOptions}
            onDiscard={() => dispatch(discardSelected())}
            onClaim={handleControlClaim}
            onSkip={() => dispatch(skipClaim())}
          />
        </section>
        <SidePanel players={game.players} eventLog={game.eventLog} wallCount={game.wall.length} />
      </div>

      {game.showRules && <RulesModal onClose={() => dispatch(toggleRules())} />}
      {game.showSettings && <SettingsModal soundEnabled={game.soundEnabled} speed={game.speed} onSound={() => dispatch(toggleSound())} onSpeed={(value) => dispatch(setSpeed(value))} onRestart={() => dispatch(restartGame())} onClose={() => dispatch(toggleSettings())} />}
      {game.phase === 'ended' && game.winner && <ResultOverlay winner={game.winner} players={game.players} onNext={() => dispatch(newRound())} onRestart={() => dispatch(restartGame())} />}
    </main>
  )
}
