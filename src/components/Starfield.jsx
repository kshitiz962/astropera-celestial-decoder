import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function Starfield({ mousePos, rippleOrigin, rippleProgress, scrollProgress }) {
  const bgStarsRef = useRef();
  const constellationNodesRef = useRef();
  const linesRef = useRef();
  const dustRef = useRef();
  const bokehRef = useRef();
  const shootingStarsRef = useRef();
  const cometsRef = useRef();

  const numBgStars = 2200;
  const numInteractiveNodes = 120;
  const maxLines = 150;
  const numDustParticles = 40;
  const numBokehStars = 65;
  const numShootingStars = 3;

  const numComets = 4;
  const numCometTrail = 35;
  const totalCometPoints = numComets * (1 + numCometTrail);

  // 1. GENERATE STATIC BACKGROUND STARS
  const [bgStarData] = useMemo(() => {
    const positions = new Float32Array(numBgStars * 3);
    const colors = new Float32Array(numBgStars * 3);
    const sizes = new Float32Array(numBgStars);

    const goldColor = new THREE.Color('#FFD700');
    const purpleColor = new THREE.Color('#7C3AED');
    const whiteColor = new THREE.Color('#F8FAFC');

    for (let i = 0; i < numBgStars; i++) {
      const radius = 25 + Math.random() * 45;
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi) - 12;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      let rand = Math.random();
      let mixedColor = whiteColor;
      if (rand < 0.12) mixedColor = goldColor;
      else if (rand < 0.22) mixedColor = purpleColor;

      colors[i * 3] = mixedColor.r;
      colors[i * 3 + 1] = mixedColor.g;
      colors[i * 3 + 2] = mixedColor.b;

      sizes[i] = 0.05 + Math.random() * 0.12;
    }

    return [ { positions, colors, sizes } ];
  }, []);

  // 2. INITIALIZE INTERACTIVE CONSTELLATION NODES
  const nodes = useMemo(() => {
    const list = [];
    for (let i = 0; i < numInteractiveNodes; i++) {
      list.push({
        pos: new THREE.Vector3(
          (Math.random() - 0.5) * 26,
          (Math.random() - 0.5) * 16,
          (Math.random() - 0.5) * 10 - 2
        ),
        vel: new THREE.Vector3(
          (Math.random() - 0.5) * 0.012,
          (Math.random() - 0.5) * 0.012,
          (Math.random() - 0.5) * 0.004
        ),
        basePos: new THREE.Vector3(),
        seed: Math.random() * 100
      });
      list[i].basePos.copy(list[i].pos);
    }
    return list;
  }, []);

  const [linePositions, lineColors] = useMemo(() => {
    const pos = new Float32Array(maxLines * 2 * 3);
    const col = new Float32Array(maxLines * 2 * 3);
    return [pos, col];
  }, []);

  // 3. COSMIC DUST TRAILS (POOL SYSTEM)
  const dustParticles = useMemo(() => {
    const list = [];
    for (let i = 0; i < numDustParticles; i++) {
      list.push({
        pos: new THREE.Vector3(9999, 9999, 0),
        vel: new THREE.Vector3(0, 0, 0),
        life: 0,
        maxLife: 1
      });
    }
    return list;
  }, []);

  const [dustPositions, dustColors, dustSizes] = useMemo(() => {
    const pos = new Float32Array(numDustParticles * 3);
    const col = new Float32Array(numDustParticles * 3);
    const sz = new Float32Array(numDustParticles);
    return [pos, col, sz];
  }, []);

  let dustEmitIndex = 0;

  // 4. BOKEH FOREGROUND STARS
  const [bokehData, bokehVelocities] = useMemo(() => {
    const positions = new Float32Array(numBokehStars * 3);
    const colors = new Float32Array(numBokehStars * 3);
    const velocities = [];

    const goldColor = new THREE.Color('#FFD700');
    const purpleColor = new THREE.Color('#8B5CF6');

    for (let i = 0; i < numBokehStars; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 2] = 4 + Math.random() * 8;

      const c = Math.random() > 0.4 ? goldColor : purpleColor;
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;

      velocities.push(new THREE.Vector3(
        -0.002 - Math.random() * 0.003,
        -0.003 - Math.random() * 0.004,
        -0.001 - Math.random() * 0.002
      ));
    }

    return [{ positions, colors }, velocities];
  }, []);

  // 5. SHOOTING STARS ENGINE SETUP
  const shootingStars = useMemo(() => {
    const list = [];
    for (let i = 0; i < numShootingStars; i++) {
      list.push({
        pos: new THREE.Vector3(),
        vel: new THREE.Vector3(),
        active: false,
        life: 0,
        length: 2.5
      });
    }
    return list;
  }, []);

  const [shootingStarPositions, shootingStarColors] = useMemo(() => {
    const pos = new Float32Array(numShootingStars * 2 * 3);
    const col = new Float32Array(numShootingStars * 2 * 3);
    return [pos, col];
  }, []);

  // 6. MOUSE-CLICK COMET SYSTEMS
  const cometsPool = useMemo(() => {
    const list = [];
    for (let i = 0; i < numComets; i++) {
      list.push({
        pos: new THREE.Vector3(),
        vel: new THREE.Vector3(),
        active: false,
        life: 0,
        color: new THREE.Color(),
        trail: [],
        trailIndex: 0
      });
      for (let j = 0; j < numCometTrail; j++) {
        list[i].trail.push(new THREE.Vector3(9999, 9999, 0));
      }
    }
    return list;
  }, []);

  const [cometPositions, cometColors, cometSizes] = useMemo(() => {
    const pos = new Float32Array(totalCometPoints * 3);
    const col = new Float32Array(totalCometPoints * 3);
    const sz = new Float32Array(totalCometPoints);
    for (let i = 0; i < totalCometPoints; i++) {
      pos[i * 3] = 9999;
      pos[i * 3 + 1] = 9999;
      pos[i * 3 + 2] = 0;
      sz[i] = 0;
    }
    return [pos, col, sz];
  }, []);

  const clickTriggeredRef = useRef(false);
  const lastHoverTime = useRef(0.0); // Track activity timing
  const prevMouseX = useRef(0);
  const prevMouseY = useRef(0);

  useEffect(() => {
    const handleWindowClick = (e) => {
      if (
        e.target.closest('button') || 
        e.target.closest('a') || 
        e.target.closest('.action-card') ||
        e.target.closest('.navbar')
      ) return;

      clickTriggeredRef.current = true;
    };

    window.addEventListener('click', handleWindowClick);
    return () => window.removeEventListener('click', handleWindowClick);
  }, []);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const sp = scrollProgress?.current ?? 0.0;
    
    const mouseX = ((mousePos.current?.x || 0) * state.viewport.width) / 2;
    const mouseY = ((mousePos.current?.y || 0) * state.viewport.height) / 2;
    const mouse3D = new THREE.Vector3(mouseX, mouseY, 0);

    // Slowly rotate background stars and apply portal warp stretch
    if (bgStarsRef.current) {
      bgStarsRef.current.rotation.y = time * 0.004;
      bgStarsRef.current.rotation.x = time * 0.0015;

      if (sp >= 0.70) {
        const warpFactor = (sp - 0.70) / 0.30; // 0.0 to 1.0
        // Stretch stars in Z depth and pull them past camera
        bgStarsRef.current.scale.z = THREE.MathUtils.lerp(bgStarsRef.current.scale.z, 1.0 + warpFactor * 12.0, 0.08);
        bgStarsRef.current.position.z = THREE.MathUtils.lerp(bgStarsRef.current.position.z, warpFactor * 36.0, 0.08);
      } else {
        // Smoothly return to default state
        bgStarsRef.current.scale.z = THREE.MathUtils.lerp(bgStarsRef.current.scale.z, 1.0, 0.08);
        bgStarsRef.current.position.z = THREE.MathUtils.lerp(bgStarsRef.current.position.z, 0.0, 0.08);
      }
    }

    // Update Interactive Constellation Nodes
    const nodePositionsAttr = constellationNodesRef.current.geometry.attributes.position;
    
    nodes.forEach((node, idx) => {
      node.pos.add(node.vel);
      
      const xLim = state.viewport.width / 2 + 3;
      const yLim = state.viewport.height / 2 + 3;
      if (Math.abs(node.pos.x) > xLim) node.pos.x = -Math.sign(node.pos.x) * xLim;
      if (Math.abs(node.pos.y) > yLim) node.pos.y = -Math.sign(node.pos.y) * yLim;

      // Mouse gravity pull (subtle)
      const distToMouse = node.pos.distanceTo(mouse3D);
      if (distToMouse < 4.0) {
        const pull = new THREE.Vector3().subVectors(mouse3D, node.pos);
        pull.normalize().multiplyScalar(0.015 * (1.0 - distToMouse / 4.0));
        node.pos.add(pull);
      }

      // Gravitational lens warp (Stage 4 & 5 zoom portal)
      // Pull nodes physically inward toward the eclipse center at [0, 0, 0]
      if (sp > 0.68) {
        const warpProgress = Math.min((sp - 0.68) / 0.22, 1.0); // 0 -> 1
        const dirToCenter = new THREE.Vector3(0, 0, 0).sub(node.pos);
        const distToCenter = dirToCenter.length();
        dirToCenter.normalize();
        
        // Stars closer to center warp faster
        const warpForce = warpProgress * (1.0 - Math.min(distToCenter / 12.0, 1.0)) * 0.045;
        node.pos.addScaledVector(dirToCenter, warpForce);
      }

      // Shockwave Ripple Displacement
      if (rippleProgress.current > 0 && rippleProgress.current < 1) {
        const distToRipple = node.pos.distanceTo(rippleOrigin.current);
        const waveRadius = rippleProgress.current * 18.0;
        const waveWidth = 2.0;

        if (Math.abs(distToRipple - waveRadius) < waveWidth) {
          const dir = new THREE.Vector3().subVectors(node.pos, rippleOrigin.current).normalize();
          const force = (1.0 - Math.abs(distToRipple - waveRadius) / waveWidth) * 0.38;
          node.pos.addScaledVector(dir, force);
        }
      }

      nodePositionsAttr.setXYZ(idx, node.pos.x, node.pos.y, node.pos.z);
    });
    nodePositionsAttr.needsUpdate = true;

    // Track cursor activity for constellation lines fade-out
    const currX = mousePos.current?.x || 0;
    const currY = mousePos.current?.y || 0;
    const speed = Math.abs(currX - (prevMouseX.current || 0)) + Math.abs(currY - (prevMouseY.current || 0));
    prevMouseX.current = currX;
    prevMouseY.current = currY;

    if (speed > 0.005) {
      lastHoverTime.current = time; // User is active
    }

    // Inactivity decay factor: starts fading after 1.5s, fully invisible at 2.0s
    const timeSinceActive = time - lastHoverTime.current;
    let inactivityFactor = 1.0;
    if (timeSinceActive > 1.5) {
      inactivityFactor = Math.max(1.0 - (timeSinceActive - 1.5) / 0.5, 0.0);
    }

    // Build Constellation Lines
    let lineCount = 0;
    const goldColor = new THREE.Color('#FFD700');
    const purpleColor = new THREE.Color('#8B5CF6');

    for (let i = 0; i < numInteractiveNodes; i++) {
      for (let j = i + 1; j < numInteractiveNodes; j++) {
        if (lineCount >= maxLines) break;

        const nodeA = nodes[i];
        const nodeB = nodes[j];
        const dist = nodeA.pos.distanceTo(nodeB.pos);

        if (dist < 2.8) {
          const distA = nodeA.pos.distanceTo(mouse3D);
          const distB = nodeB.pos.distanceTo(mouse3D);
          const avgDist = (distA + distB) * 0.5;

          if (avgDist < 4.8 && inactivityFactor > 0.01) {
            const mouseFactor = 1.0 - avgDist / 4.8;
            const distFactor = 1.0 - dist / 2.8;
            
            // Constellation line opacity fades based on inactivity
            const opacity = mouseFactor * distFactor * 0.82 * inactivityFactor;

            const idx = lineCount * 2;
            
            linePositions[idx * 3] = nodeA.pos.x;
            linePositions[idx * 3 + 1] = nodeA.pos.y;
            linePositions[idx * 3 + 2] = nodeA.pos.z;

            linePositions[(idx + 1) * 3] = nodeB.pos.x;
            linePositions[(idx + 1) * 3 + 1] = nodeB.pos.y;
            linePositions[(idx + 1) * 3 + 2] = nodeB.pos.z;

            // Soft white-gold color gradient
            const edgeColor = purpleColor.clone().lerp(goldColor, mouseFactor * 0.7);
            
            lineColors[idx * 3] = edgeColor.r * opacity;
            lineColors[idx * 3 + 1] = edgeColor.g * opacity;
            lineColors[idx * 3 + 2] = edgeColor.b * opacity;

            lineColors[(idx + 1) * 3] = edgeColor.r * opacity;
            lineColors[(idx + 1) * 3 + 1] = edgeColor.g * opacity;
            lineColors[(idx + 1) * 3 + 2] = edgeColor.b * opacity;

            lineCount++;
          }
        }
      }
    }

    if (linesRef.current) {
      linesRef.current.geometry.attributes.position.needsUpdate = true;
      linesRef.current.geometry.attributes.color.needsUpdate = true;
      linesRef.current.geometry.setDrawRange(0, lineCount * 2);
    }

    // Update Cosmic Dust Trail (Mouse emitter)
    if (speed > 0.005) {
      const p = dustParticles[dustEmitIndex];
      p.pos.copy(mouse3D).add(new THREE.Vector3(
        (Math.random() - 0.5) * 0.4,
        (Math.random() - 0.5) * 0.4,
        (Math.random() - 0.5) * 0.2
      ));
      p.vel.set(
        (Math.random() - 0.5) * 0.04 - (state.pointer.x * 0.025),
        (Math.random() - 0.5) * 0.04 - (state.pointer.y * 0.025),
        (Math.random() - 0.5) * 0.02
      );
      p.life = 1.0;
      p.maxLife = 0.5 + Math.random() * 0.6;
      dustEmitIndex = (dustEmitIndex + 1) % numDustParticles;
    }

    const dustPosAttr = dustRef.current.geometry.attributes.position;
    const dustColAttr = dustRef.current.geometry.attributes.color;
    const dustSzAttr = dustRef.current.geometry.attributes.size;

    dustParticles.forEach((p, idx) => {
      if (p.life > 0) {
        p.pos.add(p.vel);
        p.vel.multiplyScalar(0.95);
        p.life -= 0.016 / p.maxLife;

        dustPosAttr.setXYZ(idx, p.pos.x, p.pos.y, p.pos.z);
        const pColor = goldColor.clone().lerp(purpleColor, 1.0 - p.life);
        
        dustColAttr.setXYZ(idx, pColor.r * p.life * 1.5, pColor.g * p.life * 1.2, pColor.b * p.life);
        dustSzAttr.setX(idx, p.life * 0.20);
      } else {
        dustPosAttr.setXYZ(idx, 9999, 9999, 0);
      }
    });

    dustPosAttr.needsUpdate = true;
    dustColAttr.needsUpdate = true;
    dustSzAttr.needsUpdate = true;

    // UPDATE BOKEH FOREGROUND DUST
    if (bokehRef.current) {
      const bokehPosAttr = bokehRef.current.geometry.attributes.position;
      const positionsArray = bokehPosAttr.array;
      for (let i = 0; i < numBokehStars; i++) {
        positionsArray[i * 3] += bokehVelocities[i].x;
        positionsArray[i * 3 + 1] += bokehVelocities[i].y;
        positionsArray[i * 3 + 2] += bokehVelocities[i].z;

        if (positionsArray[i * 3] < -12) positionsArray[i * 3] = 12;
        if (positionsArray[i * 3 + 1] < -8) positionsArray[i * 3 + 1] = 8;
        if (positionsArray[i * 3 + 2] < 3.0) positionsArray[i * 3 + 2] = 12.0;

        bokehPosAttr.setXYZ(i, positionsArray[i * 3], positionsArray[i * 3 + 1], positionsArray[i * 3 + 2]);
      }
      bokehPosAttr.needsUpdate = true;
    }

    // SHOOTING STARS ENGINE (RANDOM TRIGGER)
    shootingStars.forEach((star, idx) => {
      if (!star.active) {
        if (Math.random() < 0.004) {
          const screenSide = Math.random() > 0.5;
          star.pos.set(
            screenSide ? -18 - Math.random() * 4 : 8 + Math.random() * 10,
            12 + Math.random() * 4,
            -5 - Math.random() * 8
          );
          star.vel.set(
            screenSide ? 0.38 + Math.random() * 0.2 : -0.38 - Math.random() * 0.2,
            -0.28 - Math.random() * 0.15,
            -0.05 - Math.random() * 0.1
          );
          star.active = true;
          star.life = 1.0;
        }
      } else {
        star.pos.add(star.vel);
        star.life -= 0.02;

        const lineIdx = idx * 2;
        
        shootingStarPositions[lineIdx * 3] = star.pos.x;
        shootingStarPositions[lineIdx * 3 + 1] = star.pos.y;
        shootingStarPositions[lineIdx * 3 + 2] = star.pos.z;

        shootingStarPositions[(lineIdx + 1) * 3] = star.pos.x - star.vel.x * star.length;
        shootingStarPositions[(lineIdx + 1) * 3 + 1] = star.pos.y - star.vel.y * star.length;
        shootingStarPositions[(lineIdx + 1) * 3 + 2] = star.pos.z - star.vel.z * star.length;

        const opacity = star.life;
        const starColor = new THREE.Color('#FFFFFF').lerp(new THREE.Color('#FFD700'), 0.35);

        shootingStarColors[lineIdx * 3] = starColor.r * opacity;
        shootingStarColors[lineIdx * 3 + 1] = starColor.g * opacity;
        shootingStarColors[lineIdx * 3 + 2] = starColor.b * opacity;

        shootingStarColors[(lineIdx + 1) * 3] = starColor.r * opacity * 0.1;
        shootingStarColors[(lineIdx + 1) * 3 + 1] = starColor.g * opacity * 0.1;
        shootingStarColors[(lineIdx + 1) * 3 + 2] = starColor.b * opacity * 0.1;

        if (star.life <= 0 || Math.abs(star.pos.y) > 16 || Math.abs(star.pos.x) > 22) {
          star.active = false;
          shootingStarPositions[lineIdx * 3] = 9999;
          shootingStarPositions[(lineIdx + 1) * 3] = 9999;
        }
      }
    });

    if (shootingStarsRef.current) {
      shootingStarsRef.current.geometry.attributes.position.needsUpdate = true;
      shootingStarsRef.current.geometry.attributes.color.needsUpdate = true;
    }

    // CLICK COMETS SIMULATION
    if (clickTriggeredRef.current) {
      const inactiveComet = cometsPool.find(c => !c.active);
      if (inactiveComet) {
        inactiveComet.active = true;
        inactiveComet.pos.copy(mouse3D);
        
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.22 + Math.random() * 0.14;
        
        inactiveComet.vel.set(
          Math.cos(angle) * speed,
          Math.sin(angle) * speed,
          -0.12 - Math.random() * 0.12
        );
        inactiveComet.life = 1.0;

        const rand = Math.random();
        if (rand < 0.33) {
          inactiveComet.color.set('#FFD700');
        } else if (rand < 0.66) {
          inactiveComet.color.set('#00F2FE');
        } else {
          inactiveComet.color.set('#FF007F');
        }

        for (let j = 0; j < numCometTrail; j++) {
          inactiveComet.trail[j].copy(mouse3D);
        }
        inactiveComet.trailIndex = 0;
      }
      clickTriggeredRef.current = false;
    }

    for (let c = 0; c < numComets; c++) {
      const comet = cometsPool[c];
      const startIdx = c * (1 + numCometTrail);

      if (comet.active) {
        comet.pos.add(comet.vel);
        comet.life -= 0.016;

        comet.trail[comet.trailIndex].copy(comet.pos);
        comet.trailIndex = (comet.trailIndex + 1) % numCometTrail;

        if (comet.life <= 0 || Math.abs(comet.pos.x) > 28 || Math.abs(comet.pos.y) > 18) {
          comet.active = false;
        }

        cometPositions[startIdx * 3] = comet.pos.x;
        cometPositions[startIdx * 3 + 1] = comet.pos.y;
        cometPositions[startIdx * 3 + 2] = comet.pos.z;

        cometColors[startIdx * 3] = comet.color.r * 1.5;
        cometColors[startIdx * 3 + 1] = comet.color.g * 1.5;
        cometColors[startIdx * 3 + 2] = comet.color.b * 1.5;
        cometSizes[startIdx] = 0.52;

        for (let t = 0; t < numCometTrail; t++) {
          const trailPosIdx = (comet.trailIndex - 1 - t + numCometTrail) % numCometTrail;
          const trailPos = comet.trail[trailPosIdx];
          const pointIdx = startIdx + 1 + t;

          cometPositions[pointIdx * 3] = trailPos.x;
          cometPositions[pointIdx * 3 + 1] = trailPos.y;
          cometPositions[pointIdx * 3 + 2] = trailPos.z;

          const ageFactor = 1.0 - (t / numCometTrail);
          const opacity = ageFactor * comet.life;

          cometColors[pointIdx * 3] = comet.color.r * opacity;
          cometColors[pointIdx * 3 + 1] = comet.color.g * opacity;
          cometColors[pointIdx * 3 + 2] = comet.color.b * opacity;
          cometSizes[pointIdx] = ageFactor * 0.32;
        }
      } else {
        cometPositions[startIdx * 3] = 9999;
        cometSizes[startIdx] = 0;
        for (let t = 0; t < numCometTrail; t++) {
          const pointIdx = startIdx + 1 + t;
          cometPositions[pointIdx * 3] = 9999;
          cometSizes[pointIdx] = 0;
        }
      }
    }

    if (cometsRef.current) {
      cometsRef.current.geometry.attributes.position.needsUpdate = true;
      cometsRef.current.geometry.attributes.color.needsUpdate = true;
      cometsRef.current.geometry.attributes.size.needsUpdate = true;
    }
  });

  return (
    <group>
      {/* 1. BACKGROUND STARS */}
      <points ref={bgStarsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[bgStarData.positions, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[bgStarData.colors, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.12}
          vertexColors
          transparent
          opacity={0.65}
          sizeAttenuation={true}
          depthWrite={false}
        />
      </points>

      {/* 2. FOREGROUND BOKEH DUST */}
      <points ref={bokehRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[bokehData.positions, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[bokehData.colors, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.35}
          vertexColors
          transparent
          opacity={0.32}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          sizeAttenuation={true}
        />
      </points>

      {/* 3. INTERACTIVE CONSTELLATION NODES */}
      <points ref={constellationNodesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array(numInteractiveNodes * 3), 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#FFD700"
          size={0.15}
          transparent
          opacity={0.95}
          sizeAttenuation={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* 4. CONSTELLATION LINES */}
      <lineSegments ref={linesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[linePositions, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[lineColors, 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial
          vertexColors
          transparent
          linewidth={1}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>

      {/* 5. COSMIC DUST TRAILS */}
      <points ref={dustRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[dustPositions, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[dustColors, 3]}
          />
          <bufferAttribute
            attach="attributes-size"
            args={[dustSizes, 1]}
          />
        </bufferGeometry>
        <pointsMaterial
          vertexColors
          sizeAttenuation={true}
          depthWrite={false}
          transparent
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* 6. SHOOTING STARS */}
      <lineSegments ref={shootingStarsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[shootingStarPositions, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[shootingStarColors, 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial
          vertexColors
          transparent
          linewidth={2}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>

      {/* 7. MOUSE-CLICK RELEASED COMETS */}
      <points ref={cometsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[cometPositions, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[cometColors, 3]}
          />
          <bufferAttribute
            attach="attributes-size"
            args={[cometSizes, 1]}
          />
        </bufferGeometry>
        <pointsMaterial
          vertexColors
          sizeAttenuation={true}
          depthWrite={false}
          transparent
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}
