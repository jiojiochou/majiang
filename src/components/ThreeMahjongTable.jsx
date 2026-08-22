import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Suspense, useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { tileKey, tileLabel } from '../game/tiles'

const textureCache = new Map()
const TILE_SIZE = { width: 0.5, height: 0.16, depth: 0.7 }

function createWindTexture(wind, active) {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const context = canvas.getContext('2d')
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.letterSpacing = '0px'
  context.fillStyle = active ? '#38250d' : '#adc1b9'
  context.shadowColor = active ? 'rgba(255, 236, 176, .75)' : 'transparent'
  context.shadowBlur = active ? 10 : 0
  context.font = '900 170px "Noto Serif SC", "Songti SC", serif'
  context.fillText(wind, 128, 132)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4
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
        <meshStandardMaterial color={faceDown ? '#176d58' : '#ded4c1'} roughness={0.56} metalness={0.02} />
      </mesh>
      {faceDown && (
        <mesh position={[0, -height * 0.38, 0]} receiveShadow>
          <boxGeometry args={[width * 1.012, height * 0.24, depth * 1.012]} />
          <meshStandardMaterial color="#ded4c1" roughness={0.58} metalness={0.01} />
        </mesh>
      )}
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
      <mesh position={[0, -0.025, -3.72]} receiveShadow>
        <boxGeometry args={[9.1, 0.045, 0.78]} />
        <meshStandardMaterial color="#08493e" roughness={0.88} />
      </mesh>
      <mesh position={[0, -0.025, 3.72]} receiveShadow>
        <boxGeometry args={[9.1, 0.045, 0.78]} />
        <meshStandardMaterial color="#08493e" roughness={0.88} />
      </mesh>
      <mesh position={[-5.4, -0.025, 0]} receiveShadow>
        <boxGeometry args={[0.78, 0.045, 8.55]} />
        <meshStandardMaterial color="#08493e" roughness={0.88} />
      </mesh>
      <mesh position={[5.4, -0.025, 0]} receiveShadow>
        <boxGeometry args={[0.78, 0.045, 8.55]} />
        <meshStandardMaterial color="#08493e" roughness={0.88} />
      </mesh>
    </group>
  )
}

function WallTiles({ count }) {
  const stackCount = Math.min(68, Math.ceil(count / 2))
  const stacksPerSide = Array.from({ length: 4 }, (_, side) => (
    Math.floor(stackCount / 4) + (side < stackCount % 4 ? 1 : 0)
  ))
  const sideOffsets = stacksPerSide.reduce((offsets, sideCount, side) => {
    offsets[side] = side === 0 ? 0 : offsets[side - 1] + stacksPerSide[side - 1]
    return offsets
  }, [])

  return Array.from({ length: stackCount }, (_, index) => {
    const side = index % 4
    const sideIndex = Math.floor(index / 4)
    const offset = (sideIndex - (stacksPerSide[side] - 1) / 2) * 0.48
    const position = side === 0 ? [offset, 0.08, -3.72]
      : side === 1 ? [5.4, 0.08, offset]
        : side === 2 ? [-offset, 0.08, 3.72]
          : [-5.4, 0.08, -offset]
    const rotation = side % 2 ? [0, Math.PI / 2, 0] : [0, 0, 0]
    const stackOrder = sideOffsets[side] + sideIndex
    const hasTopTile = stackOrder * 2 + 1 < count
    return (
      <group key={index}>
        <Tile3D position={position} rotation={rotation} scale={0.92} faceDown castShadow={false} />
        {hasTopTile && <Tile3D position={[position[0], position[1] + 0.155, position[2]]} rotation={rotation} scale={0.92} faceDown castShadow={false} />}
      </group>
    )
  })
}

function OpponentHand({ player, position }) {
  const tileCount = Math.min(player.hand.length, 13)
  return Array.from({ length: tileCount }, (_, index) => {
    const offset = (index - (tileCount - 1) / 2) * 0.53
    const tilePosition = position === 'top' ? [offset, 0.4, -4.43]
      : position === 'left' ? [-6.28, 0.4, -offset]
        : [6.28, 0.4, offset]
    const rotation = position === 'top' ? [Math.PI / 2, 0, 0]
      : position === 'left' ? [-Math.PI / 2, 0, -Math.PI / 2]
        : [-Math.PI / 2, 0, Math.PI / 2]
    return <Tile3D key={index} position={tilePosition} rotation={rotation} scale={0.88} faceDown />
  })
}

function LatestDiscardMarker({ position }) {
  const marker = useRef()
  const ring = useRef()

  useFrame((state) => {
    const pulse = Math.sin(state.clock.elapsedTime * 4)
    if (marker.current) marker.current.position.y = position[1] + 0.62 + pulse * 0.035
    if (ring.current) {
      ring.current.scale.setScalar(1 + pulse * 0.08)
      ring.current.material.opacity = 0.48 - pulse * 0.1
    }
  })

  return (
    <>
      <group ref={marker} position={[position[0], position[1] + 0.62, position[2]]}>
        <mesh castShadow>
          <sphereGeometry args={[0.105, 24, 16]} />
          <meshStandardMaterial color="#ffb632" emissive="#d35a0c" emissiveIntensity={0.65} roughness={0.3} metalness={0.12} />
        </mesh>
        <mesh position={[0, -0.135, 0]} rotation={[0, 0, Math.PI]} castShadow>
          <coneGeometry args={[0.075, 0.18, 20]} />
          <meshStandardMaterial color="#f28b16" emissive="#b94108" emissiveIntensity={0.45} roughness={0.35} />
        </mesh>
        <pointLight color="#ff9f24" intensity={0.9} distance={1.1} decay={2} />
      </group>
      <mesh ref={ring} position={[position[0], position[1] + 0.075, position[2]]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.235, 0.28, 32]} />
        <meshBasicMaterial color="#ffc24b" transparent opacity={0.48} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
    </>
  )
}

function DiscardTiles({ player, position, latestDiscard }) {
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
    const isLatest = latestDiscard?.playerId === player.id && latestDiscard.tileId === tile.id
    return (
      <group key={tile.id}>
        <Tile3D tile={tile} position={tilePosition} rotation={rotation} scale={0.78} />
        {isLatest && <LatestDiscardMarker position={tilePosition} />}
      </group>
    )
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

function WindSegment({ index, active }) {
  const segment = useRef()
  const centers = [-Math.PI / 2, 0, Math.PI / 2, Math.PI]
  const gap = 0.055
  const start = centers[index] - Math.PI / 4 + gap / 2

  useFrame((state) => {
    if (!active || !segment.current) return
    segment.current.material.emissiveIntensity = 0.65 + Math.sin(state.clock.elapsedTime * 3.5) * 0.18
  })

  return (
    <mesh ref={segment} position={[0, 0.13, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.67, 1.03, 40, 1, start, Math.PI / 2 - gap]} />
      <meshStandardMaterial
        color={active ? '#d69b2f' : '#244b43'}
        emissive={active ? '#b96814' : '#000000'}
        emissiveIntensity={active ? 0.65 : 0}
        roughness={0.5}
        metalness={0.22}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

function WindLabel({ wind, active, position }) {
  const texture = useMemo(() => createWindTexture(wind, active), [active, wind])
  useEffect(() => () => texture.dispose(), [texture])

  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[0.48, 0.48]} />
      <meshBasicMaterial map={texture} transparent depthWrite={false} />
    </mesh>
  )
}

function CenterUnit({ currentPlayer, winds }) {
  const labelPositions = [
    [0, 0.145, 0.79],
    [0.79, 0.145, 0],
    [0, 0.145, -0.79],
    [-0.79, 0.145, 0],
  ]

  return (
    <group>
      <mesh position={[0, 0.015, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.13, 1.17, 0.16, 64]} />
        <meshStandardMaterial color="#132d29" roughness={0.38} metalness={0.48} />
      </mesh>
      <mesh position={[0, 0.105, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.63, 64]} />
        <meshStandardMaterial color="#0b211e" roughness={0.42} metalness={0.35} />
      </mesh>
      <mesh position={[0, 0.138, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.61, 0.65, 64]} />
        <meshBasicMaterial color="#7c9b91" transparent opacity={0.55} side={THREE.DoubleSide} />
      </mesh>
      {[0, 1, 2, 3].map((index) => (
        <group key={index}>
          <WindSegment index={index} active={currentPlayer === index} />
          <WindLabel wind={winds[index]} active={currentPlayer === index} position={labelPositions[index]} />
        </group>
      ))}
      <mesh position={[0, 0.14, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.11, 32]} />
        <meshBasicMaterial color="#d7b358" />
      </mesh>
    </group>
  )
}

function CameraRig() {
  const { camera, size } = useThree()
  useEffect(() => {
    const aspect = size.width / size.height
    const distance = aspect < 0.9 ? 19.5 : aspect < 1.25 ? 17.5 : 14.7
    const heightRatio = aspect < 0.9 ? 0.84 : aspect < 1.25 ? 0.82 : 0.8
    const depthRatio = aspect < 0.9 ? 0.54 : aspect < 1.25 ? 0.57 : 0.6
    const focusZ = aspect < 0.9 ? 0.72 : aspect < 1.25 ? 0.84 : 1
    camera.position.set(0, distance * heightRatio, distance * depthRatio)
    camera.fov = aspect < 0.9 ? 35 : 37
    camera.near = 0.1
    camera.far = 80
    camera.lookAt(0, 0, focusZ)
    camera.updateProjectionMatrix()
  }, [camera, size.height, size.width])
  return null
}

function Scene({ players, latestDiscard, wallCount, currentPlayer }) {
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
      <DiscardTiles player={players[2]} position="top" latestDiscard={latestDiscard} />
      <DiscardTiles player={players[3]} position="left" latestDiscard={latestDiscard} />
      <DiscardTiles player={players[1]} position="right" latestDiscard={latestDiscard} />
      <DiscardTiles player={players[0]} position="bottom" latestDiscard={latestDiscard} />
      <CenterUnit currentPlayer={currentPlayer} winds={players.map((player) => player.wind)} />
    </>
  )
}

export default function ThreeMahjongTable({ players, latestDiscard, wallCount, currentPlayer }) {
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
            latestDiscard={latestDiscard}
            wallCount={wallCount}
            currentPlayer={currentPlayer}
          />
        </Canvas>
      </Suspense>
    </div>
  )
}
