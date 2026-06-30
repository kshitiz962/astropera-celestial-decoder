import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { drone } from '../utils/audio';

export default function AudioOrb3D({ onToggleActive, rippleOrigin, rippleProgress }) {
  const orbRef = useRef();
  const ring1Ref = useRef();
  const ring2Ref = useRef();
  const sparksRef = useRef();

  const [isHovered, setIsHovered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const sparkProgressRef = useRef(0.0);

  // Spark burst particles setup (60 particles)
  const numSparks = 60;
  const [sparkData, sparkVelocities] = useMemo(() => {
    const positions = new Float32Array(numSparks * 3);
    const colors = new Float32Array(numSparks * 3);
    const velocities = [];

    const gold = new THREE.Color('#FF7700');
    const white = new THREE.Color('#FFFFFF');

    for (let i = 0; i < numSparks; i++) {
      // Start at center
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;

      // Spherical explosion velocities
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      const speed = 0.08 + Math.random() * 0.15; // fast spark speed

      velocities.push(new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta) * speed,
        Math.sin(phi) * Math.sin(theta) * speed,
        Math.cos(phi) * speed
      ));

      // Gold to white sparks
      const c = gold.clone().lerp(white, Math.random());
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    return [{ positions, colors }, velocities];
  }, []);

  // Trigger spark burst and audio toggle
  const handleOrbClick = (e) => {
    e.stopPropagation();
    
    // 1. Toggle ambient synth
    const active = drone.toggle();
    setIsPlaying(active);
    if (onToggleActive) onToggleActive(active);

    // 2. Spawn a physical ripple in R3F starfield centered at the 3D orb
    rippleOrigin.current.set(0, -1.8, 0.5);
    rippleProgress.current = 0.01; // initiates update in Starfield.jsx

    // 3. Trigger local spark burst animation
    sparkProgressRef.current = 0.01;
    
    // Reset spark positions in geometry
    if (sparksRef.current) {
      const posAttr = sparksRef.current.geometry.attributes.position;
      for (let i = 0; i < numSparks; i++) {
        posAttr.setXYZ(i, 0, 0, 0);
      }
      posAttr.needsUpdate = true;
    }
  };

  // Ensure custom cursor resets on unmount
  useEffect(() => {
    return () => {
      document.body.style.cursor = 'default';
    };
  }, []);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    // 1. Breathing scale pulse (1.0 -> 1.08)
    const basePulse = 1.0 + Math.sin(time * 3.5) * 0.04;
    // Scale expands slightly on hover
    const targetScale = (isHovered ? 1.15 : 1.0) * basePulse * 0.42;

    if (orbRef.current) {
      orbRef.current.scale.setScalar(
        THREE.MathUtils.lerp(orbRef.current.scale.x, targetScale, 0.1)
      );
      // Rotation
      orbRef.current.rotation.y = time * 0.4;
      orbRef.current.rotation.x = time * 0.2;
    }

    // 2. Orbiting rings speed up on hover
    const rotSpeed = isHovered ? 1.8 : 1.0;
    
    if (ring1Ref.current) {
      ring1Ref.current.rotation.z = time * 0.3 * rotSpeed;
      ring1Ref.current.rotation.x = Math.PI / 4 + Math.sin(time * 0.6) * 0.05;
    }
    
    if (ring2Ref.current) {
      ring2Ref.current.rotation.z = -time * 0.45 * rotSpeed;
      ring2Ref.current.rotation.y = -Math.PI / 4 + Math.cos(time * 0.5) * 0.05;
    }

    // 3. Animate Spark Burst particles
    if (sparkProgressRef.current > 0) {
      sparkProgressRef.current += 0.024; // expands and fades in ~0.7 seconds
      
      const progress = sparkProgressRef.current;
      const posAttr = sparksRef.current.geometry.attributes.position;
      const colAttr = sparksRef.current.geometry.attributes.color;

      for (let i = 0; i < numSparks; i++) {
        // Move particle outward along velocity
        const v = sparkVelocities[i];
        posAttr.setXYZ(
          i,
          v.x * progress * 16.0,
          v.y * progress * 16.0,
          v.z * progress * 16.0
        );

        // Fade colors out
        const opacity = 1.0 - progress;
        colAttr.setXYZ(
          i,
          sparkData.colors[i * 3] * opacity * 2.0, // over-glow factor
          sparkData.colors[i * 3 + 1] * opacity * 1.5,
          sparkData.colors[i * 3 + 2] * opacity
        );
      }
      
      posAttr.needsUpdate = true;
      colAttr.needsUpdate = true;

      if (progress >= 1.0) {
        sparkProgressRef.current = 0.0; // deactivate
      }
    }
  });

  return (
    <group position={[0, -1.8, 0.5]}>
      {/* 1. HTML ORB PILL LABEL (Directly above the 3D sphere) */}
      <Html 
        position={[0, 0.85, 0]} 
        center 
        style={{ pointerEvents: 'none' }}
      >
        <div 
          className={`orb-pill-label ${isPlaying ? 'active' : 'inactive'}`}
          style={{
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
            fontVariant: 'small-caps',
            fontSize: '11px',
            letterSpacing: '0.15em',
            padding: '0.5rem 1.2rem',
            borderRadius: '999px',
            fontFamily: "var(--font-mono)",
            background: 'rgba(18, 16, 24, 0.65)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            color: isPlaying ? '#FFD700' : '#94A3B8',
            border: isPlaying ? '1px solid rgba(255, 215, 0, 0.6)' : '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: isPlaying ? '0 0 15px rgba(255, 215, 0, 0.3)' : 'none',
            transition: 'all 0.3s ease',
            willChange: 'transform, opacity'
          }}
        >
          {isPlaying ? 'Oracle Active' : 'Sync Voice'}
        </div>
      </Html>

      {/* 2. INTERACTIVE GOLDEN ORB CORE */}
      <mesh
        ref={orbRef}
        onClick={handleOrbClick}
        onPointerOver={() => {
          setIsHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setIsHovered(false);
          document.body.style.cursor = 'default';
        }}
      >
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial
          color={isPlaying ? '#FFE066' : '#FFD700'} // brightens if active
          metalness={0.92}
          roughness={0.12}
          bumpScale={0.05}
          // Simple glowing gold reflections
          emissive={isPlaying ? '#4C1D95' : '#1A1100'}
          emissiveIntensity={0.6}
        />
      </mesh>

      {/* 2. GLOWING CONCENTRIC ORBIT RINGS */}
      <mesh ref={ring1Ref} scale={[0.55, 0.55, 0.55]}>
        <torusGeometry args={[1, 0.012, 8, 60]} />
        <meshBasicMaterial
          color={isPlaying ? '#00F2FE' : '#FFD700'} // turns cyan if active
          transparent
          opacity={0.5}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      <mesh ref={ring2Ref} scale={[0.66, 0.66, 0.66]}>
        <torusGeometry args={[1, 0.008, 8, 60]} />
        <meshBasicMaterial
          color={isPlaying ? '#FF007F' : '#4C1D95'} // turns magenta if active
          transparent
          opacity={0.6}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* 3. CLICK SHOCKWAVE SPARKS */}
      <points ref={sparksRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[sparkData.positions, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[sparkData.colors, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.12}
          vertexColors
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          sizeAttenuation={true}
        />
      </points>
    </group>
  );
}
