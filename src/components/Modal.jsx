import { RotateCcw, Volume2, VolumeX, X } from 'lucide-react'

export function RulesModal({ onClose }) {
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <section className="modal" onMouseDown={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="rules-title">
        <div className="modal-head"><div><span className="eyebrow">PLAY GUIDE</span><h2 id="rules-title">基础规则</h2></div><button className="icon-button" onClick={onClose} aria-label="关闭"><X /></button></div>
        <div className="rules-grid">
          <article><span>01</span><h3>摸牌与出牌</h3><p>轮到自己时摸一张牌，再从手牌中打出一张。四家按逆时针顺序轮转。</p></article>
          <article><span>02</span><h3>吃碰杠</h3><p>上家打出的牌可以吃；任意一家打出的牌都可以碰或明杠。碰牌后摸到第四张相同牌时可以补杠，杠后需补摸一张牌。</p></article>
          <article><span>03</span><h3>和牌</h3><p>常规和牌由四组顺子或刻子，加一组对子组成。当前版本采用基础和牌判定。</p></article>
          <article><span>04</span><h3>计分</h3><p>自摸时三家各支付 2,000 点；荣和时放铳者支付 9,000 点。</p></article>
        </div>
      </section>
    </div>
  )
}

export function SettingsModal({ soundEnabled, speed, onSound, onSpeed, onRestart, onClose }) {
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <section className="modal settings-modal" onMouseDown={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="settings-title">
        <div className="modal-head"><div><span className="eyebrow">TABLE OPTIONS</span><h2 id="settings-title">牌桌设置</h2></div><button className="icon-button" onClick={onClose} aria-label="关闭"><X /></button></div>
        <div className="setting-row"><div><strong>游戏音效</strong><p>摸牌与出牌提示音</p></div><button className={`toggle ${soundEnabled ? 'on' : ''}`} onClick={onSound} aria-pressed={soundEnabled}>{soundEnabled ? <Volume2 /> : <VolumeX />}<span /></button></div>
        <div className="setting-row speed-row"><div><strong>对手速度</strong><p>调整电脑玩家思考时间</p></div><div className="segmented">{[['slow','悠闲'],['normal','标准'],['fast','快速']].map(([value,label]) => <button className={speed === value ? 'active' : ''} onClick={() => onSpeed(value)} key={value}>{label}</button>)}</div></div>
        <button className="restart-button" onClick={onRestart}><RotateCcw size={17} />重新开始整场</button>
      </section>
    </div>
  )
}
