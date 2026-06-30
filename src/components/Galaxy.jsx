import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function Galaxy({ scrollProgress }) {
  const galaxyRef = useRef();
  const godRaysGroupRef = useRef();

  const numGalaxyStars = 800;

  // 1. GENERATE SPIRAL GALAXY PARTICLES
  const [galaxyData] = useMemo(() => {
    const positions = new Float32Array(numGalaxyStars * 3);
    const colors = new Float32Array(numGalaxyStars * 3);
    const sizes = new Float32Array(numGalaxyStars);

    const goldColor = new THREE.Color('#FFD700');
    const cyanColor = new THREE.Color('#00F2FE');
    const purpleColor = new THREE.Color('#7C3AED');
    const coreColor = new THREE.Color('#FFFFFF');

    for (let i = 0; i < numGalaxyStars; i++) {
      // Split into 2 spiral arms
      const isArm2 = i % 2 === 0;
      
      // Cluster radius closer to center (using exponential decay distribution)
      const r = Math.pow(Math.random(), 2.2) * 18.0 + 0.4;
      
      // Logarithmic spiral angle theta = a * ln(r) or a simple linear spin
      // Adds random dispersion to puff out the arms
      const theta = r * 0.38 + (isArm2 ? Math.PI : 0.0) + (Math.random() - 0.5) * (0.65 / (r * 0.1 + 0.5));
      
      // Coordinates (flat disc, thicker in center)
      const x = Math.cos(theta) * r;
      const y = Math.sin(theta) * r;
      const z = (Math.random() - 0.5) * (2.2 / (r * 0.3 + 0.4)) - 18.0; // placed deep behind the eclipse at z = -18

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      // Color mapping: Core is bright white/gold, arms transition to cyan/purple
      let c = coreColor;
      if (r > 6.0) {
        c = Math.random() > 0.4 ? cyanColor.clone().lerp(purpleColor, (r - 6.0) / 12.0) : goldColor;
      } else if (r > 2.0) {
        c = coreColor.clone().lerp(cyanColor, (r - 2.0) / 4.0);
      }

      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;

      // Sizes larger in core, smaller in arms
      sizes[i] = 0.06 + (1.0 / (r * 0.4 + 1.0)) * 0.25;
    }

    return [{ positions, colors, sizes }];
  }, []);

  // 2. SETUP VOLUMETRIC GOD RAY CYLINDERS
  const numRays = 8;
  const rayMaterials = useMemo(() => {
    const list = [];
    const colorsList = ['#FFD700', '#FF7700', '#7C3AED', '#00F2FE'];
    
    for (let i = 0; i < numRays; i++) {
      const col = new THREE.Color(colorsList[i % colorsList.length]);
      list.push(
        new THREE.MeshBasicMaterial({
          color: col,
          transparent: true,
          opacity: 0.045, // extremely faint to keep it sophisticated
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          side: THREE.DoubleSide
        })
      );
    }
    return list;
  }, []);

  // Preset ray specifications
  const rays = useMemo(() => {
    const list = [];
    for (let i = 0; i < numRays; i++) {
      const angle = (i / numRays) * Math.PI * 2 + Math.random() * 0.2;
      list.push({
        rotZ: angle,
        length: 12.0 + Math.random() * 8.0,
        width: 0.8 + Math.random() * 1.2,
        speed: (0.015 + Math.random() * 0.02) * (Math.random() > 0.5 ? 1 : -1)
      });
    }
    return list;
  }, []);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const sp = scrollProgress.current;

    // Slowly rotate galaxy spiral
    if (galaxyRef.current) {
      galaxyRef.current.rotation.z = time * 0.008;
      // Slight tilt drift
      galaxyRef.current.rotation.y = Math.sin(time * 0.1) * 0.02;
    }

    // Spin and breathe god ray cylinders
    if (godRaysGroupRef.current) {
      const children = godRaysGroupRef.current.children;
      
      rays.forEach((ray, idx) => {
        const mesh = children[idx];
        if (mesh) {
          // Slow rotation
          mesh.rotation.z = ray.rotZ + time * ray.speed;
          
          // Organic breathing scale and opacity
          const breatheOpacity = 0.035 + Math.sin(time * 1.2 + idx) * 0.015;
          mesh.material.opacity = breatheOpacity * (1.0 - sp * 0.5); // fade rays slightly in final zoom stage
          
          const breatheScaleY = 1.0 + Math.sin(time * 0.6 + idx) * 0.06;
          mesh.scale.set(1.0, breatheScaleY, 1.0);
        }
      });
    }
  });

  return (
    <group>
      {/* 3D SPIRAL GALAXY DEEP BACKGROUND */}
      <points ref={galaxyRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[galaxyData.positions, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[galaxyData.colors, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.16}
          vertexColors
          transparent
          opacity={0.5}
          sizeAttenuation={true}
          depthWrite={false}
        />
      </points>

      {/* VOLUMETRIC GOD RAYS (EMITTING FROM CENTER STAR) */}
      <group ref={godRaysGroupRef} position={[0, 0, -1.0]}>
        {rays.map((ray, idx) => (
          <mesh 
            key={idx} 
            rotation={[0, 0, ray.rotZ]} 
          >
            {/* Long thin cone stretching outwards */}
            <coneGeometry args={[ray.width, ray.length, 4, 1, true]} />
            <primitive object={rayMaterials[idx]} attach="material" />
          </mesh>
        ))}
      </group>
    </group>
  );
}
