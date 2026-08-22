import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Suspense, useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { tileKey, tileLabel } from '../game/tiles'

const textureCache = new Map()
const TILE_SIZE = { width: 0.5, height: 0.16, depth: 0.7 }

function fitCanvasText(context, text, maxWidth) {
  if (context.measureText(text).width <= maxWidth) return text
  let shortened = text
  while (shortened.length > 1 && context.measureText(`${shortened}...`).width > maxWidth) {
    shortened = shortened.slice(0, -1)
  }
  return `${shortened}...`
}

function createCenterTexture({ round, honba, wallCount, currentWind, message }) {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 704
  const context = canvas.getContext('2d')

  const gradient = context.createLinearGradient(0, 0, 0, canvas.height)
  gradient.addColorStop(0, '#163b34')
  gradient.addColorStop(1, '#0a211d')
  context.fillStyle = gradient
  context.fillRect(0, 0, canvas.width, canvas.height)

  context.strokeStyle = '#577068'
  context.lineWidth = 6
  context.strokeRect(16, 16, canvas.width - 32, canvas.height - 32)
  context.strokeStyle = 'rgba(225, 190, 103, .35)'
  context.lineWidth = 2
  context.strokeRect(29, 29, canvas.width - 58, canvas.height - 58)

  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.letterSpacing = '0px'
  context.fillStyle = '#a9c0b7'
  context.font = '600 48px "Noto Sans SC", "PingFang SC", sans-serif'
  context.fillText(`东风战  ·  ${honba} 本场`, 512, 88)

  context.strokeStyle = 'rgba(146, 177, 165, .3)'
  context.beginPath()
  context.moveTo(58, 143)
  context.lineTo(966, 143)
  context.stroke()

  context.fillStyle = '#dce5df'
  context.font = '700 56px "Noto Sans SC", "PingFang SC", sans-serif'
  context.fillText(`东 ${round} 局`, 226, 332)
  context.fillText(`余 ${wallCount}`, 798, 332)

  context.fillStyle = '#efc568'
  context.font = '900 184px "Noto Serif SC", "Songti SC", serif'
  context.fillText(currentWind, 512, 318)

  context.strokeStyle = '#d7ad55'
  context.lineWidth = 5
  context.strokeRect(407, 210, 210, 210)
  context.strokeStyle = 'rgba(215, 173, 85, .28)'
  context.lineWidth = 2
  context.strokeRect(421, 224, 182, 182)

  context.fillStyle = '#e3ece7'
  context.font = '500 43px "Noto Sans SC", "PingFang SC", sans-serif'
  context.fillText(fitCanvasText(context, message, 850), 512, 578)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  texture.needsUpdate = true
  return texture
}

function drawDots(context, count) {
  const positions = {
    1: [[0, 0]],
    2: [[-1, -1], [1, 1]],
    3: [[-1, -1], [0, 0], [1, 1]],
    4: [[-1, -1], [1, -1], [-1, 1], [1, 1]],
    5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]],
    6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]],
    7: [[-1, -1], [1, -1], [0, -.45], [-1, .2], [1, .2], [-1, 1], [1, 1]],
    8: [[-1, -1], [1, -1], [-1, -.35], [1, -.35], [-1, .35], [1, .35], [-1, 1], [1, 1]],
    9: [[-1, -1], [0, -1], [1, -1], [-1, 0], [0, 0], [1, 0], [-1, 1], [0, 1], [1, 1]],
  }
  positions[count].forEach(([x, y], index) => {
    context.beginPath()
    context.arc(96 + x * 48, 128 + y * 70, count === 1 ? 27 : 15, 0, Math.PI * 2)
    context.fillStyle = index % 3 === 1 ? '#c84338' : '#16735b'
    context.fill()
    context.lineWidth = 4
    context.strokeStyle = '#f6ecd9'
    context.stroke()
  })
}

function createTileTexture(tile, faceDown) {
  const cacheKey = faceDown ? 'back' : tileKey(tile)
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey)

  const canvas = document.createElement('canvas')
  canvas.width = 192
  canvas.height = 256
  const context = canvas.getContext('2d')
  context.fillStyle = faceDown ? '#0e6755' : '#fbf5e8'
  context.fillRect(0, 0, canvas.width, canvas.height)

  if (faceDown) {
    context.strokeStyle = 'rgba(241,226,190,.55)'
    context.lineWidth = 5
    context.strokeRect(15, 15, 162, 226)
    context.lineWidth = 2
    for (let offset = -220; offset < 220; offset += 22) {
      context.beginPath()
      context.moveTo(offset, 0)
      context.lineTo(offset + 256, 256)
      context.stroke()
    }
  } else if (tile.suit === 'p') {
    drawDots(context, tile.value)
  } else {
    const isHonor = tile.suit === 'z'
    const mainText = isHonor ? tileLabel(tile) : String(tile.value)
    const suitText = tile.suit === 'm' ? '万' : tile.suit === 's' ? '条' : ''
    const honorColors = ['#222d29', '#222d29', '#222d29', '#222d29', '#c53d34', '#147157', '#315b77']
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.fillStyle = isHonor ? honorColors[tile.value - 1] : tile.suit === 's' ? '#176d55' : '#28332f'
    context.font = `900 ${isHonor ? 126 : 122}px "Noto Serif SC", serif`
    context.fillText(mainText, 96, isHonor ? 132 : 103)
    if (suitText) {
      context.fillStyle = tile.suit === 'm' ? '#c54237' : '#176d55'
      context.font = '900 58px "Noto Serif SC", serif'
      context.fillText(suitText, 96, 205)
    }
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4
  texture.needsUpdate = true
  textureCache.set(cacheKey, texture)
  return texture
}

function Tile3D({ tile, position, rotation = [0, 0, 0], scale = 1, faceDown = false, castShadow = true }) {
  const texture = useMemo(() => createTileTexture(tile, faceDown), [faceDown, tile])
  const width = TILE_SIZE.width * scale
  const height = TILE_SIZE.height * scale
  const depth = TILE_SIZE.depth * scale

  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow={castShadow} receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color="#ded4c1" roughness={0.56} metalness={0.02} />
      </mesh>
      <mesh position={[0, height / 2 + 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width * 0.88, depth * 0.88]} />
        <meshStandardMaterial map={texture} roughness={0.48} />
      </mesh>
    </group>
  )
}

function TableBody() {
  return (
    <group>
      <mesh position={[0, -0.64, 0]} receiveShadow>
        <boxGeometry args={[14.8, 0.9, 10.8]} />
        <meshStandardMaterial color="#171e1c" roughness={0.5} metalness={0.25} />
      </mesh>
      <mesh position={[0, -0.13, 0]} receiveShadow>
        <boxGeometry args={[13.85, 0.16, 9.85]} />
        <meshStandardMaterial color="#0c594a" roughness={0.93} />
      </mesh>
      <mesh position={[0, -0.02, -4.96]} receiveShadow castShadow>
        <boxGeometry args={[14.6, 0.46, 0.44]} />
        <meshStandardMaterial color="#26312e" roughness={0.44} metalness={0.2} />
      </mesh>
      <mesh position={[0, -0.02, 4.96]} receiveShadow castShadow>
        <boxGeometry args={[14.6, 0.46, 0.44]} />
        <meshStandardMaterial color="#26312e" roughness={0.44} metalness={0.2} />
      </mesh>
      <mesh position={[-6.89, -0.02, 0]} receiveShadow castShadow>
        <boxGeometry args={[0.44, 0.46, 10.4]} />
        <meshStandardMaterial color="#26312e" roughness={0.44} metalness={0.2} />
      </mesh>
      <mesh position={[6.89, -0.02, 0]} receiveShadow castShadow>
        <boxGeometry args={[0.44, 0.46, 10.4]} />
        <meshStandardMaterial color="#26312e" roughness={0.44} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0.07, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[4.65, 4.7, 4]} />
        <meshBasicMaterial color="#c69b4a" transparent opacity={0.28} />
      </mesh>
    </group>
  )
}

function WallTiles({ count }) {
  const pairCount = Math.min(44, Math.ceil(count / 2))
  return Array.from({ length: pairCount }, (_, index) => {
    const side = index % 4
    const offsetIndex = Math.floor(index / 4)
    const sideCount = Math.ceil(pairCount / 4)
    const offset = (offsetIndex - (sideCount - 1) / 2) * 0.62
    const position = side === 0 ? [offset, 0.08, -4.15]
      : side === 1 ? [5.98, 0.08, offset]
        : side === 2 ? [-offset, 0.08, 4.15]
          : [-5.98, 0.08, -offset]
    const rotation = side % 2 ? [0, Math.PI / 2, 0] : [0, 0, 0]
    const hasTopTile = index * 2 + 1 < count
    return (
      <group key={index}>
        <Tile3D position={position} rotation={rotation} scale={0.8} faceDown castShadow={false} />
        {hasTopTile && <Tile3D position={[position[0], position[1] + 0.14, position[2]]} rotation={rotation} scale={0.8} faceDown castShadow={false} />}
      </group>
    )
  })
}

function OpponentHand({ player, position }) {
  const tileCount = Math.min(player.hand.length, 13)
  return Array.from({ length: tileCount }, (_, index) => {
    const offset = (index - (tileCount - 1) / 2) * 0.53
    const tilePosition = position === 'top' ? [offset, 0.12, -3.32]
      : position === 'left' ? [-5.2, 0.12, -offset]
        : [5.2, 0.12, offset]
    const rotation = position === 'top' ? [0, Math.PI, 0]
      : position === 'left' ? [0, Math.PI / 2, 0]
        : [0, -Math.PI / 2, 0]
    return <Tile3D key={index} position={tilePosition} rotation={rotation} scale={0.88} faceDown />
  })
}

function DiscardTiles({ player, position }) {
  return player.discards.map((tile, index) => {
    const column = index % 6
    const row = Math.floor(index / 6)
    const offset = (column - 2.5) * 0.43
    let tilePosition
    let rotation
    if (position === 'bottom') {
      tilePosition = [offset, 0.12, 1.52 + row * 0.58]
      rotation = [0, 0, 0]
    } else if (position === 'top') {
      tilePosition = [-offset, 0.12, -1.52 - row * 0.58]
      rotation = [0, Math.PI, 0]
    } else if (position === 'left') {
      tilePosition = [-1.9 - row * 0.58, 0.12, -offset]
      rotation = [0, Math.PI / 2, 0]
    } else {
      tilePosition = [1.9 + row * 0.58, 0.12, offset]
      rotation = [0, -Math.PI / 2, 0]
    }
    return <Tile3D key={tile.id} tile={tile} position={tilePosition} rotation={rotation} scale={0.78} />
  })
}

function MeldTiles({ player, position }) {
  const tiles = player.melds.flatMap((meld) => meld.tiles)
  return tiles.map((tile, index) => {
    const offset = index * 0.48
    const tilePosition = position === 'top' ? [-5.15 + offset, 0.12, -3.35]
      : position === 'left' ? [-5.2, 0.12, 3.45 - offset]
        : [5.2, 0.12, -3.45 + offset]
    const rotation = position === 'top' ? [0, Math.PI, 0]
      : position === 'left' ? [0, Math.PI / 2, 0]
        : [0, -Math.PI / 2, 0]
    return <Tile3D key={tile.id} tile={tile} position={tilePosition} rotation={rotation} scale={0.78} />
  })
}

function CenterUnit({ currentPlayer, round, honba, wallCount, currentWind, message }) {
  const marker = useRef()
  const displayTexture = useMemo(
    () => createCenterTexture({ round, honba, wallCount, currentWind, message }),
    [currentWind, honba, message, round, wallCount],
  )
  useEffect(() => () => displayTexture.dispose(), [displayTexture])
  useFrame((state, delta) => {
    if (!marker.current) return
    marker.current.rotation.z -= delta * 0.55
    marker.current.material.opacity = 0.38 + Math.sin(state.clock.elapsedTime * 2.4) * 0.12
  })
  const direction = [[0, 0, 1], [1, 0, 0], [0, 0, -1], [-1, 0, 0]][currentPlayer]

  return (
    <group>
      <mesh position={[0, 0.03, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.78, 0.16, 1.98]} />
        <meshStandardMaterial color="#172d29" roughness={0.32} metalness={0.42} />
      </mesh>
      <mesh position={[0, 0.118, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.5, 1.7]} />
        <meshStandardMaterial map={displayTexture} roughness={0.38} metalness={0.04} />
      </mesh>
      <mesh ref={marker} position={[0, 0.128, 0.01]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.48, 0.5, 4]} />
        <meshBasicMaterial color="#f2cb72" transparent opacity={0.5} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh position={[direction[0] * 1.31, 0.126, direction[2] * 0.91]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.08, 24]} />
        <meshBasicMaterial color="#ee765e" />
      </mesh>
    </group>
  )
}

function CameraRig() {
  const { camera, size } = useThree()
  useEffect(() => {
    const aspect = size.width / size.height
    const distance = aspect < 0.9 ? 20 : aspect < 1.25 ? 19 : 16
    camera.position.set(0, distance * 0.71, distance * 0.7)
    camera.fov = aspect < 0.9 ? 35 : 38
    camera.near = 0.1
    camera.far = 80
    camera.lookAt(0, 0, 0.25)
    camera.updateProjectionMatrix()
  }, [camera, size.height, size.width])
  return null
}

function Scene({ players, wallCount, currentPlayer, round, honba, currentWind, message }) {
  return (
    <>
      <CameraRig />
      <color attach="background" args={['#071b17']} />
      <fog attach="fog" args={['#071b17', 18, 42]} />
      <hemisphereLight args={['#fff4dc', '#08281f', 1.65]} />
      <directionalLight
        castShadow
        color="#fff1cf"
        intensity={3.2}
        position={[-5, 10, 7]}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={35}
        shadow-camera-left={-9}
        shadow-camera-right={9}
        shadow-camera-top={7}
        shadow-camera-bottom={-7}
      />
      <pointLight color="#3ca385" intensity={15} distance={13} position={[0, 4, -2]} />
      <TableBody />
      <WallTiles count={wallCount} />
      <OpponentHand player={players[2]} position="top" />
      <OpponentHand player={players[3]} position="left" />
      <OpponentHand player={players[1]} position="right" />
      <MeldTiles player={players[2]} position="top" />
      <MeldTiles player={players[3]} position="left" />
      <MeldTiles player={players[1]} position="right" />
      <DiscardTiles player={players[2]} position="top" />
      <DiscardTiles player={players[3]} position="left" />
      <DiscardTiles player={players[1]} position="right" />
      <DiscardTiles player={players[0]} position="bottom" />
      <CenterUnit
        currentPlayer={currentPlayer}
        round={round}
        honba={honba}
        wallCount={wallCount}
        currentWind={currentWind}
        message={message}
      />
    </>
  )
}

export default function ThreeMahjongTable({ players, wallCount, currentPlayer, round, honba, currentWind, message }) {
  return (
    <div className="three-canvas-wrap" aria-label="3D麻将牌桌">
      <Suspense fallback={<div className="scene-loading">牌桌加载中</div>}>
        <Canvas
          shadows
          dpr={[1, 1.5]}
          camera={{ position: [0, 12, 12], fov: 38 }}
          gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        >
          <Scene
            players={players}
            wallCount={wallCount}
            currentPlayer={currentPlayer}
            round={round}
            honba={honba}
            currentWind={currentWind}
            message={message}
          />
        </Canvas>
      </Suspense>
    </div>
  )
}
