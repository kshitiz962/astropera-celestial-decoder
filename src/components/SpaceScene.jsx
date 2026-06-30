import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import Eclipse from './Eclipse';
import Starfield from './Starfield';
import Nebula from './Nebula';
import FloatingCards from './FloatingCards';
import Galaxy from './Galaxy';
import AudioOrb3D from './AudioOrb3D';

function SceneController({ 
  scrollProgress, 
  portalOpenVal, 
  rippleOrigin, 
  rippleProgress, 
  mousePos, 
  onToggleAudioActive,
  lastPageRef,
  isCtaHovered,
  selectedPlanet,
  cosmicMode,
  decoderSynced
}) {
  const ambientLightRef = useRef();
  const pointLight1Ref = useRef();
  const pointLight2Ref = useRef();
  const currentSp = useRef(0.0);

  useFrame((state) => {
    const targetSp = window.cosmicScrollProgress !== undefined ? window.cosmicScrollProgress : 0.0;
    currentSp.current = THREE.MathUtils.lerp(currentSp.current, targetSp, 0.08);
    const sp = currentSp.current;
    
    // Sync the passed-in ref so other components can read it
    scrollProgress.current = sp;

    let targetZ = 14;
    let targetY = 0;
    let targetRotX = 0;
    let targetRotY = 0;
    let portalOpen = 0.0;

    // Evaluate Camera Position & Rotation based on the updated scroll stages
    if (sp < 0.15) {
      targetZ = 14;
      targetY = 0;
      targetRotX = 0;
      targetRotY = 0;
      portalOpen = 0.0;
    } else if (sp < 0.25) {
      const f = (sp - 0.15) / 0.10;
      targetZ = THREE.MathUtils.lerp(14, 13.0, f);
      targetY = 0;
      targetRotX = 0;
      targetRotY = 0;
      portalOpen = 0.0;
    } else if (sp < 0.40) {
      const f = (sp - 0.25) / 0.15;
      targetZ = THREE.MathUtils.lerp(13.0, 10.5, f);
      targetY = THREE.MathUtils.lerp(0, -0.5, f);
      targetRotX = THREE.MathUtils.lerp(0, 0.05, f);
      targetRotY = 0;
      portalOpen = 0.0;
    } else if (sp < 0.55) {
      const f = (sp - 0.40) / 0.15;
      targetZ = THREE.MathUtils.lerp(10.5, 8.5, f);
      targetY = THREE.MathUtils.lerp(-0.5, -0.8, f);
      targetRotX = THREE.MathUtils.lerp(0.05, 0.10, f);
      targetRotY = 0;
      portalOpen = 0.0;
    } else if (sp < 0.70) {
      const f = (sp - 0.55) / 0.15;
      targetZ = THREE.MathUtils.lerp(8.5, 6.0, f);
      targetY = THREE.MathUtils.lerp(-0.8, -1.0, f);
      targetRotX = THREE.MathUtils.lerp(0.10, 0.15, f);
      targetRotY = THREE.MathUtils.lerp(0.0, -0.05, f);
      portalOpen = 0.0;
    } else {
      const f = (sp - 0.70) / 0.30;
      portalOpen = f;
      targetZ = THREE.MathUtils.lerp(6.0, -2.5, f);
      targetY = THREE.MathUtils.lerp(-1.0, 0.0, f);
      targetRotX = THREE.MathUtils.lerp(0.15, 0.0, f);
      targetRotY = THREE.MathUtils.lerp(-0.05, 0.0, f);
    }

    // Apply mouse parallax displacement (subtle tilting based on cursor)
    const mouseDisplaceX = (mousePos.current?.x || 0) * 0.4;
    const mouseDisplaceY = (mousePos.current?.y || 0) * 0.2;

    // Smoothly interpolate camera properties
    state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, targetZ, 0.05);
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, targetY + mouseDisplaceY, 0.05);
    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, mouseDisplaceX, 0.05);

    state.camera.rotation.x = THREE.MathUtils.lerp(state.camera.rotation.x, targetRotX, 0.05);
    state.camera.rotation.y = THREE.MathUtils.lerp(state.camera.rotation.y, targetRotY, 0.05);

    // Calculate a perspective warp stretch (FOV expansion) near stage boundaries
    const boundaries = [0.25, 0.40, 0.55, 0.70];
    let warpFactor = 0;
    boundaries.forEach((b, idx) => {
      const dist = Math.abs(sp - b);
      const width = idx === 3 ? 0.08 : 0.035; // slightly wider for portal zoom
      if (dist < width) {
        const intensity = 1.0 - (dist / width);
        const eased = Math.pow(intensity, 4); // sharp peak
        warpFactor = Math.max(warpFactor, eased);
      }
    });

    const targetFov = 55 + warpFactor * 18;
    state.camera.fov = THREE.MathUtils.lerp(state.camera.fov, targetFov, 0.08); // smooth transition
    state.camera.updateProjectionMatrix();

    // Interpolate portal open ref
    portalOpenVal.current = THREE.MathUtils.lerp(portalOpenVal.current, portalOpen, 0.08);

    // Update shockwave progress if active
    if (rippleProgress.current > 0) {
      rippleProgress.current += 0.025;
      if (rippleProgress.current > 1.0) {
        rippleProgress.current = 0; // reset
      }
    }

    // Dynamic Color Temperature Shift (Cool Blue-White -> Volcanic Amber Gold)
    const coolBlue = new THREE.Color('#E0F2FE');
    const goldAmber = new THREE.Color('#F59E0B');
    const currentLightColor = coolBlue.clone().lerp(goldAmber, sp);

    if (ambientLightRef.current) {
      ambientLightRef.current.color.copy(currentLightColor);
    }

    if (pointLight1Ref.current) {
      const coreWhite = new THREE.Color('#FFFFFF');
      const hotRed = new THREE.Color('#FF4D00');
      pointLight1Ref.current.color.copy(coreWhite.clone().lerp(hotRed, sp));
    }

    // Toggle the active class of the Zodiac page only after complete zoom entry (camera Z <= 1.0 and scroll >= 90%)
    if (lastPageRef && lastPageRef.current) {
      if (sp >= 0.90 && state.camera.position.z <= 1.0) {
        lastPageRef.current.classList.add('active');
      } else {
        lastPageRef.current.classList.remove('active');
      }
    }
  });

  return (
    <>
      {/* 3D LIGHTS WITH SCROLL-TEMPERATURE SHIFTS */}
      <ambientLight ref={ambientLightRef} intensity={0.25} />
      <pointLight ref={pointLight1Ref} position={[10, 10, 10]} intensity={2.0} />
      <pointLight ref={pointLight2Ref} position={[-10, -10, -10]} color="#4C1D95" intensity={2.0} />

      {/* Rotating 3D Galaxy Deep Disc & God Rays */}
      <Galaxy scrollProgress={scrollProgress} />

      {/* Volumetric Nebulas */}
      <Nebula scrollProgress={scrollProgress} />

      {/* Reactive Starfield with line connections */}
      <Starfield 
        mousePos={mousePos} 
        rippleOrigin={rippleOrigin} 
        rippleProgress={rippleProgress} 
        scrollProgress={scrollProgress}
      />

      {/* Celestial Eclipse Core */}
      <Eclipse scrollProgress={scrollProgress} portalOpenVal={portalOpenVal} isCtaHovered={isCtaHovered} />

      {/* 3D Orbiting Action Cards */}
      {cosmicMode !== 'interactive' && <FloatingCards scrollProgress={scrollProgress} />}

      {/* 3D Gold Audio Orb core mesh */}
      <AudioOrb3D 
        onToggleActive={onToggleAudioActive} 
        rippleOrigin={rippleOrigin}
        rippleProgress={rippleProgress}
      />

      {/* 3D Interactive Planet displaying during transits stage */}
      <InteractivePlanet 
        scrollProgress={scrollProgress} 
        selectedPlanet={selectedPlanet} 
        cosmicMode={cosmicMode}
        decoderSynced={decoderSynced}
      />
    </>
  );
}

function InteractivePlanet({ scrollProgress, selectedPlanet, cosmicMode, decoderSynced }) {
  const meshRef = useRef();
  const ringsRef = useRef();
  const groupRef = useRef();

  useFrame((state) => {
    if (!meshRef.current) return;
    const sp = scrollProgress.current;

    let targetScale = 0;
    let targetX = 1.8;
    let targetY = 0.1;
    let targetZ = 4.0;

    if (cosmicMode === 'interactive') {
      let factor = 0;
      if (sp >= 0.15 && sp < 0.40) {
        if (sp < 0.18) {
          factor = (sp - 0.15) / 0.03;
        } else if (sp > 0.37) {
          factor = (0.40 - sp) / 0.03;
        } else {
          factor = 1.0;
        }
      } else if (sp >= 0.55 && sp < 0.70) {
        if (!decoderSynced) {
          factor = 0; // hide planet during tracing!
        } else {
          if (sp < 0.58) {
            factor = (sp - 0.55) / 0.03;
          } else if (sp > 0.67) {
            factor = (0.70 - sp) / 0.03;
          } else {
            factor = 1.0;
          }
        }
      }
      targetScale = THREE.MathUtils.lerp(0, 0.68, factor);
      targetX = 1.6;
      targetY = 0.40;
      targetZ = 11.5;
    } else {
      targetX = 1.8;
      targetY = 0.1;
      targetZ = 4.0;
      targetScale = 0;
    }

    const currentScale = THREE.MathUtils.lerp(meshRef.current.scale.x, targetScale, 0.08);
    meshRef.current.scale.setScalar(currentScale);

    if (ringsRef.current) {
      ringsRef.current.scale.set(currentScale * 1.5, currentScale * 1.5, currentScale * 1.5);
      ringsRef.current.rotation.z += 0.006;
    }

    if (groupRef.current) {
      groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, targetX, 0.08);
      groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, 0.08);
      groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, targetZ, 0.08);
    }

    // User controlled rotation speed-up and tilt using the R3F pointer coords
    meshRef.current.rotation.y += 0.007 + state.pointer.x * 0.015;
    meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, -state.pointer.y * 0.6 + 0.15, 0.08);
  });

  // Decide materials based on selected planet
  let color = "#f59e0b"; // default Saturn gold
  let emissive = "#4c1d95";
  let emissiveIntensity = 0.2;
  let showRings = false;

  if (selectedPlanet === "Saturn") {
    color = "#F59E0B";
    showRings = true;
  } else if (selectedPlanet === "Sun") {
    color = "#EF4444";
    emissive = "#EF4444";
    emissiveIntensity = 1.5;
  } else if (selectedPlanet === "Moon") {
    color = "#94A3B8";
    emissive = "#1E293B";
    emissiveIntensity = 0.15;
  } else if (selectedPlanet === "Mars") {
    color = "#DC2626";
    emissive = "#7F1D1D";
    emissiveIntensity = 0.6;
  } else if (selectedPlanet === "Mercury") {
    color = "#7dd3fc"; // pale blue-silver
    emissive = "#0369a1";
    emissiveIntensity = 0.4;
  } else if (selectedPlanet === "Venus") {
    color = "#fda4af"; // soft pastel pink
    emissive = "#be185d";
    emissiveIntensity = 0.45;
  } else if (selectedPlanet === "Jupiter") {
    color = "#fb923c"; // gas giant orange-gold
    emissive = "#c2410c";
    emissiveIntensity = 0.35;
    showRings = true; // giant gas ring
  } else if (selectedPlanet === "Neptune") {
    color = "#38bdf8"; // bright deep ice blue
    emissive = "#1d4ed8";
    emissiveIntensity = 0.8;
  } else if (selectedPlanet === "Uranus") {
    color = "#a5f3fc"; // light cyan-green
    emissive = "#0891b2";
    emissiveIntensity = 0.5;
  } else if (selectedPlanet === "Pluto") {
    color = "#7c2d12"; // dark red-gold charcoal
    emissive = "#451a03";
    emissiveIntensity = 0.35;
  }

  return (
    <group ref={groupRef} position={[1.8, 0.1, 4.0]}>
      {/* Sphere Mesh */}
      <mesh ref={meshRef} scale={[0, 0, 0]}>
        <sphereGeometry args={[0.9, 32, 32]} />
        <meshStandardMaterial 
          color={color} 
          roughness={0.4} 
          metalness={0.15}
          emissive={new THREE.Color(emissive)}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>
      
      {/* Ring Mesh for Saturn / Jupiter */}
      {showRings && (
        <mesh ref={ringsRef} scale={[0, 0, 0]} rotation={[Math.PI / 2.3, 0, 0]}>
          <ringGeometry args={[1.1, 1.8, 64]} />
          <meshStandardMaterial 
            color="#D97706" 
            side={THREE.DoubleSide} 
            transparent={true} 
            opacity={0.65} 
          />
        </mesh>
      )}
    </group>
  );
}

export default function SpaceScene({ 
  wrapperRef,
  scrollProgress, 
  portalOpenVal, 
  rippleOrigin, 
  rippleProgress, 
  onToggleAudioActive,
  lastPageRef,
  isCtaHovered,
  selectedPlanet,
  cosmicMode,
  decoderSynced
}) {
  const mousePos = useRef(new THREE.Vector2(0, 0));

  useEffect(() => {
    const handleMouseMove = (e) => {
      mousePos.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mousePos.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    const handleTouchMove = (e) => {
      if (e.touches && e.touches.length > 0) {
        const touch = e.touches[0];
        mousePos.current.x = (touch.clientX / window.innerWidth) * 2 - 1;
        mousePos.current.y = -(touch.clientY / window.innerHeight) * 2 + 1;
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchstart', handleTouchMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchstart', handleTouchMove);
    };
  }, []);

  return (
    <div ref={wrapperRef} className="canvas-wrapper">
      <Canvas 
        camera={{ fov: 55, near: 0.1, far: 150 }}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        dpr={[1, 2]}
        style={{ width: '100%', height: '100%', background: '#050816' }}
      >
        <SceneController 
          scrollProgress={scrollProgress}
          portalOpenVal={portalOpenVal}
          rippleOrigin={rippleOrigin}
          rippleProgress={rippleProgress}
          mousePos={mousePos}
          onToggleAudioActive={onToggleAudioActive}
          lastPageRef={lastPageRef}
          isCtaHovered={isCtaHovered}
          selectedPlanet={selectedPlanet}
          cosmicMode={cosmicMode}
          decoderSynced={decoderSynced}
        />
      </Canvas>
    </div>
  );
}
