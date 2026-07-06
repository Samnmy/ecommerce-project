/**
 * VinylAlbum3D v4 — Complete rebuild for premium product look
 *
 * Changes from v3:
 *  • Scale switched to 1.0×1.0 sleeve (user spec)
 *  • 360° unlimited rotation — no azimuth limits on OrbitControls
 *  • backCover prop: real back-cover texture applied to back face
 *  • Sleeve uses RoundedBox from Drei (thin, real cardboard feel)
 *  • Disc rebuilt with ShapeGeometry + spindle HOLE (real geometry, not painted)
 *  • Disc groove bump map (procedural canvas) for depth at any lighting angle
 *  • Dark purple vinyl label (industry-standard deep-purple centre label)
 *  • Disc protrudes ~50% of its diameter from the right sleeve edge
 *  • MeshPhysicalMaterial with clearcoat=1 on disc for authentic vinyl sheen
 *
 * Scene hierarchy:
 *   AlbumGroup (static -0.06 X tilt, OrbitControls moves camera)
 *    ├─ VinylDisc
 *    │   ├─ discFaceGeo (ShapeGeometry, hole punched with THREE.Path)
 *    │   ├─ Outer edge  (CylinderGeometry, openEnded=true)
 *    │   └─ Spindle inner edge (tiny CylinderGeometry, BackSide)
 *    └─ AlbumSleeve
 *        ├─ RoundedBox  (cardboard body, rounded corners)
 *        ├─ Front plane (frontCover texture)
 *        └─ Back plane  (backCover texture — real image, not dark tint)
 */
import {
  useRef, useMemo, Suspense,
  Component, type ReactNode,
} from 'react';
import { Canvas, useFrame }             from '@react-three/fiber';
import { useTexture, OrbitControls, RoundedBox } from '@react-three/drei';
import * as THREE                        from 'three';

// ─── Public interface ────────────────────────────────────────────────────────
export interface VinylAlbum3DProps {
  /** Front cover artwork URL */
  frontCover: string;
  /** Back cover artwork URL — defaults to frontCover if omitted */
  backCover?:  string;
  albumTitle:  string;
}

// ─── Scene constants ─────────────────────────────────────────────────────────
// Sleeve — 1.0 × 1.0 × 0.022 (thin cardboard, RoundedBox smooths corners)
const SW = 1.00;
const SH = 1.00;
const SD = 0.022;  // ~2 mm proportional thickness

// Disc — radius just under sleeve half-width so disc fits inside sleeve
const OUTER_R = 0.474;  // disc outer radius  (sleeve half = 0.500)
const HOLE_R  = 0.013;  // spindle hole radius (~3.2 mm on a real 12" at this scale)
const LABEL_R = 0.170;  // centre label radius (~36% of disc, per real vinyl spec)
const DH      = 0.012;  // disc height / thickness

// Disc X offset — places disc centre so ≈50% of diameter protrudes from right edge
//   protrusion = DX + OUTER_R − SW/2 = 0.474 + 0.474 − 0.500 = 0.448 units
//   0.448 / (OUTER_R*2) ≈ 47% ≈ 50% ✓
const DX = 0.474;

// ─── Error Boundary ──────────────────────────────────────────────────────────
interface EBState { hasError: boolean }
interface EBProps  { coverImage: string; children: ReactNode }

class VinylErrorBoundary extends Component<EBProps, EBState> {
  state: EBState = { hasError: false };
  static getDerivedStateFromError(): EBState { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex items-center justify-center p-8">
          <img
            src={this.props.coverImage}
            alt="" aria-hidden="true"
            className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl opacity-90"
            style={{ aspectRatio: '1 / 1' }}
          />
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Procedural vinyl groove texture ────────────────────────────────────────
// 2048 × 2048 canvas for crisp grooves at any zoom.
// Centre label: dark purple gradient (industry-standard vinyl label colour).
// Grooves: alternating ridge/valley rings with iridescent blue→purple shimmer.
function useVinylGrooveTexture(): THREE.Texture {
  return useMemo(() => {
    const SIZE = 2048;
    const c   = document.createElement('canvas');
    c.width = c.height = SIZE;
    const ctx = c.getContext('2d')!;
    const cx  = SIZE / 2; // 1024

    // ── ShapeGeometry UV mapping: centre → UV(0.5,0.5)
    // ── disc outer radius (0.474) → UV edge (0 or 1)
    // ── canvas pixel radius for disc outer edge = cx = 1024px
    const GROOVE_START = Math.round(0.39 * cx); // just outside label   = 400 px
    const GROOVE_END   = Math.round(0.96 * cx); // near outer edge      = 983 px
    const LABEL_PX     = Math.round((LABEL_R / OUTER_R) * cx); // 368 px
    const HOLE_PX      = Math.round((HOLE_R  / OUTER_R) * cx); // 28 px

    // Base — deep near-black
    ctx.fillStyle = '#060606';
    ctx.fillRect(0, 0, SIZE, SIZE);

    // ── Groove rings ──────────────────────────────────────────────────────────
    // Alternating ridge (slightly bright, iridescent) / valley (dark)
    const step = 3.8; // pixels per groove cycle
    for (let r = GROOVE_START; r < GROOVE_END; r += step) {
      const fraction = (r - GROOVE_START) / (GROOVE_END - GROOVE_START);
      const isRidge  = Math.floor(r / step) % 2 === 0;

      // Iridescent hue shifts from blue (inner) to purple (outer)
      const hue = 210 + fraction * 70;

      if (isRidge) {
        // Ridge: visible sheen — brighter, coloured
        ctx.strokeStyle = `hsla(${hue}, 55%, 26%, 0.95)`;
        ctx.lineWidth   = 2.2;
      } else {
        // Valley: very dark
        ctx.strokeStyle = 'rgba(6, 6, 6, 1.0)';
        ctx.lineWidth   = 1.8;
      }
      ctx.beginPath();
      ctx.arc(cx, cx, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // ── Transition band (between label edge and groove area) ─────────────────
    for (let r = LABEL_PX; r < GROOVE_START; r += 2.5) {
      ctx.strokeStyle = 'rgba(20, 18, 22, 0.9)';
      ctx.lineWidth   = 2;
      ctx.beginPath();
      ctx.arc(cx, cx, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // ── Dark purple centre label ──────────────────────────────────────────────
    const labelGrad = ctx.createRadialGradient(cx, cx, 0, cx, cx, LABEL_PX);
    labelGrad.addColorStop(0,    '#5a1878'); // bright purple highlight at centre
    labelGrad.addColorStop(0.30, '#3e0e58'); // mid purple
    labelGrad.addColorStop(0.75, '#2a0840'); // dark indigo
    labelGrad.addColorStop(1,    '#180424'); // nearly-black outer edge
    ctx.fillStyle = labelGrad;
    ctx.beginPath();
    ctx.arc(cx, cx, LABEL_PX, 0, Math.PI * 2);
    ctx.fill();

    // Label outer highlight ring
    ctx.strokeStyle = 'rgba(190, 100, 255, 0.32)';
    ctx.lineWidth   = 3;
    ctx.beginPath();
    ctx.arc(cx, cx, LABEL_PX - 5, 0, Math.PI * 2);
    ctx.stroke();

    // Label concentric decorative rings
    ctx.strokeStyle = 'rgba(150, 70, 220, 0.18)';
    ctx.lineWidth   = 1.5;
    [0.70, 0.45, 0.25].forEach(f => {
      ctx.beginPath();
      ctx.arc(cx, cx, LABEL_PX * f, 0, Math.PI * 2);
      ctx.stroke();
    });

    // ── Spindle hole — paint it dark so the hole geometry reads cleanly ──────
    ctx.fillStyle = '#010101';
    ctx.beginPath();
    ctx.arc(cx, cx, HOLE_PX, 0, Math.PI * 2);
    ctx.fill();

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace  = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    return tex;
  }, []);
}

// ─── Procedural groove bump map ──────────────────────────────────────────────
// Same concentric ring structure, alternating light/dark.
// bumpMap on the MeshPhysicalMaterial makes grooves catch light.
function useVinylBumpMap(): THREE.Texture {
  return useMemo(() => {
    const SIZE = 1024;
    const c   = document.createElement('canvas');
    c.width = c.height = SIZE;
    const ctx = c.getContext('2d')!;
    const cx  = SIZE / 2;

    const GROOVE_START = Math.round(0.39 * cx);
    const GROOVE_END   = Math.round(0.96 * cx);

    // Neutral grey base (no bump)
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, SIZE, SIZE);

    const step = 1.9;
    for (let r = GROOVE_START; r < GROOVE_END; r += step) {
      const isRidge = Math.floor(r / step) % 2 === 0;
      // Ridge = bright (raised), Valley = dark (depressed)
      ctx.strokeStyle = isRidge ? '#d8d8d8' : '#282828';
      ctx.lineWidth   = 1.4;
      ctx.beginPath();
      ctx.arc(cx, cx, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(c);
    tex.needsUpdate = true;
    return tex;
  }, []);
}

// ─── Vinyl disc ──────────────────────────────────────────────────────────────
//
// Geometry breakdown:
//   1. discFaceGeo  — ShapeGeometry with a PATH-based spindle hole
//                     (real geometry, not a painted circle)
//   2. Outer edge   — CylinderGeometry, open-ended, for the disc thickness
//   3. Spindle edge — tiny CylinderGeometry, BackSide, for hole interior
//
// The disc lies in the XY plane (ShapeGeometry default) and spins around Z.
// No rotation on outer group needed — ShapeGeometry is already coplanar
// with the sleeve faces (both in XY plane, normals along ±Z).
//
function VinylDisc() {
  const spinRef    = useRef<THREE.Group>(null!);
  const grooveTex  = useVinylGrooveTexture();
  const bumpMap    = useVinylBumpMap();

  // Spin around Z (perpendicular to disc face)
  useFrame((_, delta) => {
    if (spinRef.current) {
      spinRef.current.rotation.z -= delta * 0.45;
    }
  });

  // ── Disc face geometry with spindle hole ────────────────────────────────
  const discFaceGeo = useMemo(() => {
    const outerShape = new THREE.Shape();
    outerShape.absarc(0, 0, OUTER_R, 0, Math.PI * 2, false);

    // Real hole — this removes geometry at the spindle, not just paints it
    const spindleHole = new THREE.Path();
    spindleHole.absarc(0, 0, HOLE_R, 0, Math.PI * 2, true); // clockwise = hole
    outerShape.holes.push(spindleHole);

    return new THREE.ShapeGeometry(outerShape, 96);
  }, []);

  // ── Open-ended cylinder for disc outer edge ─────────────────────────────
  const edgeGeo = useMemo(
    () => new THREE.CylinderGeometry(OUTER_R, OUTER_R, DH, 128, 1, true),
    []
  );

  // ── Tiny open cylinder for spindle hole interior ────────────────────────
  const spindleEdgeGeo = useMemo(
    () => new THREE.CylinderGeometry(HOLE_R, HOLE_R, DH + 0.002, 32, 1, true),
    []
  );

  // vinyl physical material — clearcoatRoughness tuned so warm key-light
  // does NOT wash the purple label to orange. Higher roughness = softer/wider
  // specular highlight that sits on top of the base colour rather than masking it.
  const vinylMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    map:                grooveTex,
    bumpMap:            bumpMap,
    bumpScale:          0.004,
    color:              new THREE.Color('#0c0c0c'),
    roughness:          0.22,
    metalness:          0.05,
    clearcoat:          0.85,
    clearcoatRoughness: 0.35,   // wider specular → label colour readable through it
    side:               THREE.DoubleSide,
  }), [grooveTex, bumpMap]);

  return (
    // Outer group: positions disc centre at DX on X, at Z=0 (inside sleeve depth).
    // Z=0 means sleeve faces at z=±SD/2 = ±0.011 are in front → depth test occludes disc.
    <group position={[DX, 0, 0]}>
      {/* Inner group spins around Z */}
      <group ref={spinRef}>

        {/* Disc face — DoubleSide so back is visible after 180° orbit */}
        <mesh geometry={discFaceGeo} material={vinylMat} castShadow />

        {/* Outer edge — open-ended cylinder for disc thickness
             geometry prop is the correct R3F way to attach a BufferGeometry */}
        <mesh rotation={[Math.PI / 2, 0, 0]} geometry={edgeGeo}>
          <meshStandardMaterial
            color="#0a0a0a"
            roughness={0.30}
            metalness={0.08}
          />
        </mesh>

        {/* Spindle hole interior — BackSide shows inner surface of the tiny hole */}
        <mesh rotation={[Math.PI / 2, 0, 0]} geometry={spindleEdgeGeo}>
          <meshStandardMaterial
            color="#1a1a1a"
            roughness={0.80}
            side={THREE.BackSide}
          />
        </mesh>

      </group>
    </group>
  );
}

// ─── Album sleeve ────────────────────────────────────────────────────────────
//
// Structure:
//   RoundedBox — thin cardboard body with naturally soft corners
//   Front plane — frontCover artwork, placed just in front of box face
//   Back  plane — backCover artwork, placed just behind box face
//
// The planes are identical in size to the RoundedBox face so artwork
// covers the full face. The rounded corners of the box are visible
// at the edges, exactly like a real cardboard sleeve.
//
function AlbumSleeve({
  frontCover, backCover,
}: { frontCover: string; backCover: string }) {

  // Load both textures. useTexture caches by URL so identical URLs share cache.
  // Clone to avoid mutating the shared cache entry (would corrupt other consumers).
  const [rawFront, rawBack] = useTexture([frontCover, backCover]);

  const fTex = useMemo(() => {
    const t = rawFront.clone();
    t.colorSpace  = THREE.SRGBColorSpace;
    t.needsUpdate = true;
    return t;
  }, [rawFront]);

  const bTex = useMemo(() => {
    const t = rawBack.clone();
    t.colorSpace  = THREE.SRGBColorSpace;
    t.needsUpdate = true;
    return t;
  }, [rawBack]);

  const hd = SD / 2; // half-depth = 0.011

  return (
    <group>
      {/* ── Cardboard body — RoundedBox, very thin with subtle corner rounding */}
      <RoundedBox
        args={[SW, SH, SD]}
        radius={0.014}
        smoothness={4}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color="#c2a87a" roughness={0.90} metalness={0.0} />
      </RoundedBox>

      {/* ── Front cover artwork ─────────────────────────────────────────── */}
      <mesh position={[0, 0, hd + 0.001]} castShadow receiveShadow>
        <planeGeometry args={[SW, SH]} />
        <meshStandardMaterial
          map={fTex}
          roughness={0.28}
          metalness={0.04}
        />
      </mesh>

      {/* ── Back cover artwork — real texture, NO dark tint ─────────────── */}
      <mesh position={[0, 0, -(hd + 0.001)]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[SW, SH]} />
        <meshStandardMaterial
          map={bTex}
          roughness={0.38}
          metalness={0.0}
        />
      </mesh>
    </group>
  );
}

// ─── Scene ───────────────────────────────────────────────────────────────────
function AlbumScene({
  frontCover,
  backCover,
}: { frontCover: string; backCover: string }) {
  return (
    <>
      {/* ── Studio lighting ───────────────────────────────────────────────── */}
      {/* Key — warm, front-top */}
      <directionalLight
        position={[3.5, 5, 4]}
        intensity={1.8}
        color="#fff8f0"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      {/* Cool fill — left */}
      <directionalLight position={[-4, 1.5, -1.5]} intensity={0.55} color="#a0b8ff" />
      {/* Back fill — prevents back face going completely dark during 360° orbit */}
      <directionalLight position={[0, 1, -5]}      intensity={0.65} color="#ffd8a0" />
      {/* Rim kicker — bottom, warm amber */}
      <pointLight      position={[0, -3, 3]}        intensity={0.55} color="#d97706" />
      {/* Soft ambient */}
      <ambientLight intensity={0.48} color="#ffe0cc" />

      {/*
       * Album group — static position; OrbitControls moves the camera.
       * Slight -X tilt for a product-photography looking-down angle.
       * VinylDisc renders BEFORE AlbumSleeve → depth buffer occludes disc
       * wherever the sleeve faces (at z = ±0.011) cover it.
       */}
      <group rotation={[-0.06, 0, 0]}>
        <VinylDisc />
        <AlbumSleeve frontCover={frontCover} backCover={backCover} />
      </group>

      {/*
       * OrbitControls
       * ─────────────────────────────────────────────────────────────────────
       * • NO azimuth limits → full 360° orbit (user sees front, sides, back)
       * • autoRotate=true  → continuous slow rotation when idle
       * • enableDamping    → smooth deceleration on mouse release;
       *                      auto-rotation resumes from current orientation
       * • enableZoom/Pan   → disabled (pure product viewer)
       * • polar limits     → prevent flipping completely upside-down
       */}
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate={true}
        autoRotateSpeed={1.2}
        enableDamping={true}
        dampingFactor={0.055}
        minPolarAngle={Math.PI * 0.30}
        maxPolarAngle={Math.PI * 0.70}
        // No minAzimuthAngle / maxAzimuthAngle → unlimited 360° horizontal orbit
      />
    </>
  );
}

// ─── Public component ────────────────────────────────────────────────────────
export function VinylAlbum3D({
  frontCover,
  backCover,
  albumTitle,
}: VinylAlbum3DProps) {
  // Guarantee backCover is always a string (default = frontCover)
  const resolvedBack = backCover ?? frontCover;

  return (
    <div
      className="w-full h-full"
      role="img"
      aria-label={`Vista 3D de ${albumTitle}`}
      style={{ cursor: 'grab' }}
      onMouseDown={e => { (e.currentTarget as HTMLDivElement).style.cursor = 'grabbing'; }}
      onMouseUp={e   => { (e.currentTarget as HTMLDivElement).style.cursor = 'grab'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.cursor = 'grab'; }}
    >
      <VinylErrorBoundary coverImage={frontCover}>
        <Canvas
          camera={{ position: [0, 0.22, 2.42], fov: 42 }}
          shadows
          gl={{
            antialias: true,
            alpha:     true,
            toneMapping:         THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.12,
          }}
          style={{ background: 'transparent' }}
        >
          <Suspense fallback={null}>
            <AlbumScene frontCover={frontCover} backCover={resolvedBack} />
          </Suspense>
        </Canvas>
      </VinylErrorBoundary>
    </div>
  );
}
