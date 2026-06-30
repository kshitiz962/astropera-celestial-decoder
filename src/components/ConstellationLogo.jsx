import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';

// Vertical center position for the constellation logo system (lifted to prevent collision with HTML content)
const LOGO_CENTER_Y = 1.8;

// Coordinate layout mapping for the word "ASTROPERA" on a local grid centered around Y=0.0
const lettersData = [
  // A - Center: -3.0
  {
    xOffset: -3.0,
    nodes: [
      [-0.25, -0.45], // 0: Bottom-left
      [-0.12, 0.0],   // 1: Mid-left
      [0.0, 0.45],    // 2: Peak
      [0.12, 0.0],    // 3: Mid-right
      [0.25, -0.45]   // 4: Bottom-right
    ],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4], [1, 3]]
  },
  // S - Center: -2.25
  {
    xOffset: -2.25,
    nodes: [
      [0.2, 0.4],     // 0: Top-right
      [-0.2, 0.4],    // 1: Top-left
      [-0.2, 0.05],   // 2: Mid-left-top
      [0.2, -0.05],   // 3: Mid-right-bottom
      [0.2, -0.4],    // 4: Bottom-right
      [-0.2, -0.4]    // 5: Bottom-left
    ],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5]]
  },
  // T - Center: -1.5
  {
    xOffset: -1.5,
    nodes: [
      [-0.25, 0.4],   // 0: Top-left
      [0.0, 0.4],     // 1: Top-center
      [0.25, 0.4],    // 2: Top-right
      [0.0, -0.45]    // 3: Bottom-center
    ],
    lines: [[0, 1], [1, 2], [1, 3]]
  },
  // R - Center: -0.75
  {
    xOffset: -0.75,
    nodes: [
      [-0.22, -0.45], // 0: Bottom-left
      [-0.22, 0.4],   // 1: Top-left
      [0.2, 0.4],     // 2: Top-right
      [0.2, 0.0],     // 3: Mid-right
      [-0.22, 0.0],   // 4: Mid-left
      [0.2, -0.45]    // 5: Bottom-right
    ],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5]]
  },
  // O - Center: 0.0
  {
    xOffset: 0.0,
    nodes: [
      [0.0, 0.4],     // 0: Top-center
      [0.22, 0.0],    // 1: Right-center
      [0.0, -0.4],    // 2: Bottom-center
      [-0.22, 0.0]    // 3: Left-center
    ],
    lines: [[0, 1], [1, 2], [2, 3], [3, 0]]
  },
  // P - Center: 0.75
  {
    xOffset: 0.75,
    nodes: [
      [-0.22, -0.45], // 0: Bottom-left
      [-0.22, 0.4],   // 1: Top-left
      [0.2, 0.4],     // 2: Top-right
      [0.2, 0.0],     // 3: Mid-right
      [-0.22, 0.0]    // 4: Mid-left
    ],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4]]
  },
  // E - Center: 1.5
  {
    xOffset: 1.5,
    nodes: [
      [0.22, 0.4],    // 0: Top-right
      [-0.22, 0.4],   // 1: Top-left
      [-0.22, 0.0],   // 2: Mid-left
      [0.12, 0.0],    // 3: Mid-right
      [-0.22, -0.4],  // 4: Bottom-left
      [0.22, -0.4]    // 5: Bottom-right
    ],
    lines: [[0, 1], [1, 4], [4, 5], [2, 3]]
  },
  // R - Center: 2.25
  {
    xOffset: 2.25,
    nodes: [
      [-0.22, -0.45], // 0: Bottom-left
      [-0.22, 0.4],   // 1: Top-left
      [0.2, 0.4],     // 2: Top-right
      [0.2, 0.0],     // 3: Mid-right
      [-0.22, 0.0],   // 4: Mid-left
      [0.2, -0.45]    // 5: Bottom-right
    ],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5]]
  },
  // A - Center: 3.0
  {
    xOffset: 3.0,
    nodes: [
      [-0.25, -0.45], // 0: Bottom-left
      [-0.12, 0.0],   // 1: Mid-left
      [0.0, 0.45],    // 2: Peak
      [0.12, 0.0],    // 3: Mid-right
      [0.25, -0.45]   // 4: Bottom-right
    ],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4], [1, 3]]
  }
];

// GPU Shaders for the premium circular glowing star particles
const vertexShader = `
  attribute vec4 aColor;
  attribute float aSize;
  attribute float aTwinkleSpeed;
  attribute float aTwinklePhase;
  uniform float uTime;
  varying vec4 vColor;
  varying float vTwinkle;
  void main() {
    vColor = aColor;
    
    // Twinkling logic: oscillates between 0.35 and 1.0
    vTwinkle = 0.65 + 0.35 * sin(uTime * aTwinkleSpeed + aTwinklePhase);
    
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    
    // Size attenuation: scale based on distance and twinkle
    gl_PointSize = aSize * (550.0 / -mvPosition.z) * (0.8 + 0.2 * vTwinkle);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = `
  varying vec4 vColor;
  varying float vTwinkle;
  void main() {
    // Generate beautiful soft circular star flares
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);
    
    if (dist > 0.5) {
      discard;
    }
    
    // Smooth falloff for glow
    float glow = smoothstep(0.5, 0.0, dist);
    float alpha = pow(glow, 2.5); // soft edges
    
    // Hot glowing core in the very center (white/gold core)
    vec3 coreColor = mix(vColor.rgb, vec3(1.0, 0.98, 0.92), smoothstep(0.18, 0.05, dist) * 0.75);
    
    gl_FragColor = vec4(coreColor, vColor.a * alpha * (0.6 + 0.4 * vTwinkle));
  }
`;

export default function ConstellationLogo({ scrollProgress }) {
  const pointsRef = useRef();
  const linesRef = useRef();
  const mapLinesRef = useRef();
  const lineDrawProgress = useRef(0.0);

  // Parse structural nodes and connection lists
  const { nodesList, connectionsList } = useMemo(() => {
    const nodes = [];
    const connections = [];
    let nodeCounter = 0;
    lettersData.forEach((letter) => {
      const letterStartIdx = nodeCounter;
      // 1. Create Anchor Nodes (Letter Vertices)
      letter.nodes.forEach((n) => {
        nodes.push({
          id: nodeCounter,
          isAnchor: true,
          // Positioned centered at Y=LOGO_CENTER_Y in front of the eclipse at Z=2.0
          basePos: new THREE.Vector3(letter.xOffset, n[1] + LOGO_CENTER_Y, 2.0),
          localOffset: new THREE.Vector3(n[0], 0, 0),
          driftDir: new THREE.Vector3(
            (Math.random() - 0.5) * 2.2,
            (Math.random() - 0.5) * 2.2,
            (Math.random() - 0.5) * 1.5
          ).normalize(),
          driftSpeed: 1.0 + Math.random() * 1.2,
          twinklePhase: Math.random() * Math.PI * 2,
          twinkleSpeed: 1.5 + Math.random() * 2.0,
          size: 0.36, // Scaled up anchor star size for better high-resolution presence
          baseColor: new THREE.Color('#FFF8E7').lerp(new THREE.Color('#ECC94B'), Math.random() * 0.5), // Pale gold to yellow-gold
          pos: new THREE.Vector3()
        });
        nodeCounter++;
      });
      // 2. Create connections for anchor lines
      letter.lines.forEach((conn) => {
        connections.push({
          from: letterStartIdx + conn[0],
          to: letterStartIdx + conn[1]
        });
      });
      // 3. Generate organic dust particles along the connection lines to make it look like a field of stars
      letter.lines.forEach((conn) => {
        const nodeA = letter.nodes[conn[0]];
        const nodeB = letter.nodes[conn[1]];
        const dustCount = 4; // 4 dust particles per constellation line segment
        for (let k = 0; k < dustCount; k++) {
          const t = 0.15 + (k / (dustCount - 1)) * 0.7; // distribute t between 0.15 and 0.85 to avoid overlapping anchors
          const x = THREE.MathUtils.lerp(nodeA[0], nodeB[0], t);
          const y = THREE.MathUtils.lerp(nodeA[1], nodeB[1], t);
          // Add organic offset to make it look like a celestial star dust field
          const xJitter = (Math.random() - 0.5) * 0.12;
          const yJitter = (Math.random() - 0.5) * 0.12;
          const zJitter = (Math.random() - 0.5) * 0.08;
          // Determine color (mix of celestial purple/indigo and amber gold dust)
          let dustColor;
          if (Math.random() > 0.3) {
            // Purple/violet celestial dust
            dustColor = new THREE.Color('#A855F7').lerp(new THREE.Color('#6366F1'), Math.random() * 0.4);
          } else {
            // Gold star dust
            dustColor = new THREE.Color('#ECC94B').lerp(new THREE.Color('#D4AF37'), Math.random() * 0.3);
          }
          nodes.push({
            id: nodeCounter,
            isAnchor: false,
            basePos: new THREE.Vector3(letter.xOffset, y + LOGO_CENTER_Y, 2.0),
            localOffset: new THREE.Vector3(x + xJitter, yJitter, zJitter),
            driftDir: new THREE.Vector3(
              (Math.random() - 0.5) * 2.2,
              (Math.random() - 0.5) * 2.2,
              (Math.random() - 0.5) * 1.5
            ).normalize(),
            driftSpeed: 0.8 + Math.random() * 1.4,
            twinklePhase: Math.random() * Math.PI * 2,
            twinkleSpeed: 2.5 + Math.random() * 3.5, // Twinkle slightly faster
            size: 0.12 + Math.random() * 0.08, // Scaled up dust particle size for better visibility
            baseColor: dustColor,
            pos: new THREE.Vector3()
          });
          nodeCounter++;
        }
      });
    });
    return { nodesList: nodes, connectionsList: connections };
  }, []);

  // Generate background circular map lines (ancient celestial map aesthetic)
  const mapLines = useMemo(() => {
    const lines = [];
    const centerY = LOGO_CENTER_Y;
    const centerZ = 1.95; // Slightly behind the logo plane to avoid Z-clipping
    // 1. Dashed outer gold circle (Radius 3.7)
    const segments1 = 120;
    const r1 = 3.7;
    for (let i = 0; i < segments1; i++) {
      const theta1 = (i / segments1) * Math.PI * 2;
      const theta2 = ((i + 1) / segments1) * Math.PI * 2;
      
      if (i % 2 === 0) {
        lines.push({
          start: new THREE.Vector3(Math.cos(theta1) * r1, Math.sin(theta1) * r1 + centerY, centerZ),
          end: new THREE.Vector3(Math.cos(theta2) * r1, Math.sin(theta2) * r1 + centerY, centerZ),
          color: '#D4AF37', // metallic gold
          opacity: 0.28
        });
      }
    }
    // 2. Solid outer thin purple circle (Radius 3.5)
    const r2 = 3.5;
    for (let i = 0; i < segments1; i++) {
      const theta1 = (i / segments1) * Math.PI * 2;
      const theta2 = ((i + 1) / segments1) * Math.PI * 2;
      
      lines.push({
        start: new THREE.Vector3(Math.cos(theta1) * r2, Math.sin(theta1) * r2 + centerY, centerZ),
        end: new THREE.Vector3(Math.cos(theta2) * r2, Math.sin(theta2) * r2 + centerY, centerZ),
        color: '#8B5CF6', // violet purple
        opacity: 0.18
      });
    }
    // 3. Central coordinate rings (Radius 0.7 solid purple & 0.8 dashed gold)
    const r3 = 0.7;
    const r4 = 0.8;
    for (let i = 0; i < 60; i++) {
      const theta1 = (i / 60) * Math.PI * 2;
      const theta2 = ((i + 1) / 60) * Math.PI * 2;
      
      lines.push({
        start: new THREE.Vector3(Math.cos(theta1) * r3, Math.sin(theta1) * r3 + centerY, centerZ),
        end: new THREE.Vector3(Math.cos(theta2) * r3, Math.sin(theta2) * r3 + centerY, centerZ),
        color: '#8B5CF6',
        opacity: 0.15
      });
      if (i % 2 === 0) {
        lines.push({
          start: new THREE.Vector3(Math.cos(theta1) * r4, Math.sin(theta1) * r4 + centerY, centerZ),
          end: new THREE.Vector3(Math.cos(theta2) * r4, Math.sin(theta2) * r4 + centerY, centerZ),
          color: '#D4AF37',
          opacity: 0.22
        });
      }
    }
    // 4. Subtle coordinate axes (horizontal and vertical crosshairs)
    lines.push({
      start: new THREE.Vector3(-4.0, centerY, centerZ),
      end: new THREE.Vector3(4.0, centerY, centerZ),
      color: '#8B5CF6',
      opacity: 0.12
    });
    lines.push({
      start: new THREE.Vector3(0, -1.8 + centerY, centerZ),
      end: new THREE.Vector3(0, 1.8 + centerY, centerZ),
      color: '#8B5CF6',
      opacity: 0.12
    });
    // 5. Diagonal mapping grid lines
    const angles = [Math.PI/6, Math.PI/4, Math.PI/3, 2*Math.PI/3, 3*Math.PI/4, 5*Math.PI/6];
    angles.forEach(ang => {
      lines.push({
        start: new THREE.Vector3(Math.cos(ang) * -3.7, Math.sin(ang) * -3.7 + centerY, centerZ),
        end: new THREE.Vector3(Math.cos(ang) * 3.7, Math.sin(ang) * 3.7 + centerY, centerZ),
        color: '#D4AF37',
        opacity: 0.06
      });
    });
    return lines;
  }, []);

  const totalNodes = nodesList.length;
  const totalConns = connectionsList.length;

  // Initialize buffer arrays and populate static attributes synchronously inside useMemo
  const [
    positionsArray,
    colorsArray,
    sizesArray,
    twinkleSpeedsArray,
    twinklePhasesArray,
    linePositionsArray,
    lineColorsArray,
    mapPositionsArray,
    mapColorsArray
  ] = useMemo(() => {
    const pos = new Float32Array(totalNodes * 3);
    const col = new Float32Array(totalNodes * 4); // 4 components: RGBA
    const sz = new Float32Array(totalNodes);
    const tsp = new Float32Array(totalNodes);
    const tph = new Float32Array(totalNodes);
    const lPos = new Float32Array(totalConns * 2 * 3);
    const lCol = new Float32Array(totalConns * 2 * 3);
    const mPos = new Float32Array(mapLines.length * 2 * 3);
    const mCol = new Float32Array(mapLines.length * 2 * 3);

    // Populate static shader attributes synchronously
    nodesList.forEach((p, i) => {
      sz[i] = p.size;
      tsp[i] = p.twinkleSpeed;
      tph[i] = p.twinklePhase;
    });

    // Populate static map positions synchronously
    mapLines.forEach((line, idx) => {
      const baseIdx = idx * 2;
      mPos[baseIdx * 3] = line.start.x;
      mPos[baseIdx * 3 + 1] = line.start.y;
      mPos[baseIdx * 3 + 2] = line.start.z;
      mPos[(baseIdx + 1) * 3] = line.end.x;
      mPos[(baseIdx + 1) * 3 + 1] = line.end.y;
      mPos[(baseIdx + 1) * 3 + 2] = line.end.z;
    });

    return [pos, col, sz, tsp, tph, lPos, lCol, mPos, mCol];
  }, [totalNodes, totalConns, mapLines, nodesList]);

  // Gradually draw constellation lines on mount
  useEffect(() => {
    gsap.to(lineDrawProgress, {
      current: 1.0,
      duration: 3.2,
      ease: "power2.out"
    });
  }, []);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 }
  }), []);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const sp = scrollProgress ? scrollProgress.current : 0.0;
    const drawProgress = lineDrawProgress.current;

    // Feed time uniform to the star shaders
    uniforms.uTime.value = time;

    // 1. UPDATE PARTICLES & STAGES PHYSICS
    nodesList.forEach((p, i) => {
      const fullBasePos = p.basePos.clone().add(p.localOffset);
      const colorVal = p.baseColor;
      
      // Determine state by scroll triggers (0-20%, 20-50%, 50-80%, 80-100%)
      if (sp < 0.20) {
        // --- STAGE 1: FULLY FORMED LOGO (0% - 20%) ---
        // Organic floating/breathing motion
        const floatY = Math.sin(time * 1.1 + p.twinklePhase) * 0.02;
        const floatX = Math.cos(time * 0.7 + p.twinklePhase) * 0.015;
        
        p.pos.copy(fullBasePos).add(new THREE.Vector3(floatX, floatY, 0));
        
        colorsArray[i * 4] = colorVal.r;
        colorsArray[i * 4 + 1] = colorVal.g;
        colorsArray[i * 4 + 2] = colorVal.b;
        colorsArray[i * 4 + 3] = 1.0; // Fully visible
        
      } else if (sp < 0.50) {
        // --- STAGE 2: DISASSEMBLE & DRIFT (20% - 50%) ---
        const f = (sp - 0.20) / 0.30; // 0.0 -> 1.0
        const easedF = f * f * (3.0 - 2.0 * f); // smoothstep
        
        // Calculate drift position
        p.pos.copy(fullBasePos).addScaledVector(p.driftDir, p.driftSpeed * easedF * 2.8);
        
        // Slow fade out on color intensity
        const opacity = Math.max(0.0, 1.0 - f * 0.45);
        colorsArray[i * 4] = colorVal.r;
        colorsArray[i * 4 + 1] = colorVal.g;
        colorsArray[i * 4 + 2] = colorVal.b;
        colorsArray[i * 4 + 3] = opacity;
      } else if (sp < 0.80) {
        // --- STAGE 3: ATTRACT TO ASTROLOGY MODULES (50% - 80%) ---
        const f = (sp - 0.50) / 0.30; // 0.0 -> 1.0
        const easedF = Math.pow(f, 1.8);
        // Find active target card coordinate (i % 4 maps to card 0-3)
        const cardIdx = p.id % 4;
        const cardBaseAngle = cardIdx * (Math.PI / 2);
        
        // Calculate dynamic card orbit coordinates (mirroring FloatingCards orbit)
        const orbitRadius = 5.2;
        const angle = cardBaseAngle + time * 0.035;
        const cardTargetPos = new THREE.Vector3(
          Math.cos(angle) * orbitRadius,
          Math.sin(angle) * (orbitRadius * 0.55),
          0.8
        );
        // Deterministic drift position at the end of stage 2
        const driftEndPos = fullBasePos.clone().addScaledVector(p.driftDir, p.driftSpeed * 2.8);
        // Lerp from driftEndPos to active card position
        p.pos.lerpVectors(driftEndPos, cardTargetPos, easedF);
        colorsArray[i * 4] = colorVal.r;
        colorsArray[i * 4 + 1] = colorVal.g;
        colorsArray[i * 4 + 2] = colorVal.b;
        colorsArray[i * 4 + 3] = 0.85; // Solid visibility during attraction
      } else {
        // --- STAGE 4: PORTAL FLOW & SPIRAL TRANSITION (80% - 100%) ---
        const f = (sp - 0.80) / 0.20; // 0.0 -> 1.0
        const easedF = f * f;
        const cardIdx = p.id % 4;
        const cardBaseAngle = cardIdx * (Math.PI / 2);
        
        // Orbit position from which it starts collapsing
        const orbitRadius = 5.2;
        const angle = cardBaseAngle + time * 0.035;
        
        // Spiral vortex calculation: pull into Z=-12.0 and spin around Z-axis
        const spiralAngle = angle + easedF * 7.5;
        const radius = orbitRadius * (1.0 - easedF);
        
        const vortexPos = new THREE.Vector3(
          Math.cos(spiralAngle) * radius,
          Math.sin(spiralAngle) * (radius * 0.55),
          THREE.MathUtils.lerp(0.8, -12.0, easedF)
        );
        p.pos.copy(vortexPos);
        // Fade to zero as it approaches center singularity
        const opacity = Math.max(0.0, 1.0 - easedF);
        colorsArray[i * 4] = colorVal.r;
        colorsArray[i * 4 + 1] = colorVal.g;
        colorsArray[i * 4 + 2] = colorVal.b;
        colorsArray[i * 4 + 3] = opacity;
      }
      // Populate positions buffer
      positionsArray[i * 3] = p.pos.x;
      positionsArray[i * 3 + 1] = p.pos.y;
      positionsArray[i * 3 + 2] = p.pos.z;
    });

    // 2. UPDATE CONNECTION LINES DRAWING (anchor lines)
    connectionsList.forEach((conn, idx) => {
      const fromNode = nodesList[conn.from];
      const toNode = nodesList[conn.to];
      // Sequential growing animation on load (left to right)
      const connDrawProgress = Math.max(0.0, Math.min(1.0, (drawProgress - (conn.from / totalNodes) * 0.4) / 0.4));
      
      // Calculate drawing endpoint
      const endPoint = fromNode.pos.clone().lerp(toNode.pos, connDrawProgress);
      const lineIdx = idx * 2;
      linePositionsArray[lineIdx * 3] = fromNode.pos.x;
      linePositionsArray[lineIdx * 3 + 1] = fromNode.pos.y;
      linePositionsArray[lineIdx * 3 + 2] = fromNode.pos.z;
      linePositionsArray[(lineIdx + 1) * 3] = endPoint.x;
      linePositionsArray[(lineIdx + 1) * 3 + 1] = endPoint.y;
      linePositionsArray[(lineIdx + 1) * 3 + 2] = endPoint.z;
      // Line opacity fades out rapidly when scrolling starts disassembling
      let scrollFade = 1.0;
      if (sp > 0.20) {
        scrollFade = Math.max(0.0, 1.0 - (sp - 0.20) / 0.15); // completely gone by 35%
      }
      
      // Subtle pulse to lines
      const pulse = 0.8 + 0.2 * Math.sin(time * 3.0 + conn.from);
      const lineOpacity = 0.55 * connDrawProgress * scrollFade * pulse;
      const midColor = new THREE.Color('#8B5CF6').lerp(new THREE.Color('#D4AF37'), 0.4);
      lineColorsArray[lineIdx * 3] = midColor.r * lineOpacity;
      lineColorsArray[lineIdx * 3 + 1] = midColor.g * lineOpacity;
      lineColorsArray[lineIdx * 3 + 2] = midColor.b * lineOpacity;
      lineColorsArray[(lineIdx + 1) * 3] = midColor.r * lineOpacity;
      lineColorsArray[(lineIdx + 1) * 3 + 1] = midColor.g * lineOpacity;
      lineColorsArray[(lineIdx + 1) * 3 + 2] = midColor.b * lineOpacity;
    });

    // 3. UPDATE ANCIENT CELESTIAL MAP LINES
    const mapRef = mapLinesRef.current;
    if (mapRef) {
      let scrollFade = 1.0;
      if (sp > 0.20) {
        scrollFade = Math.max(0.0, 1.0 - (sp - 0.20) / 0.15); // completely gone by 35%
      }
      const finalOpacity = drawProgress * scrollFade;
      mapLines.forEach((line, idx) => {
        const baseIdx = idx * 2;
        const col = new THREE.Color(line.color);
        const op = line.opacity * finalOpacity;
        mapColorsArray[baseIdx * 3] = col.r * op;
        mapColorsArray[baseIdx * 3 + 1] = col.g * op;
        mapColorsArray[baseIdx * 3 + 2] = col.b * op;
        mapColorsArray[(baseIdx + 1) * 3] = col.r * op;
        mapColorsArray[(baseIdx + 1) * 3 + 1] = col.g * op;
        mapColorsArray[(baseIdx + 1) * 3 + 2] = col.b * op;
      });
      mapRef.geometry.attributes.color.needsUpdate = true;
    }

    // Notify updates to GPU attributes
    if (pointsRef.current) {
      pointsRef.current.geometry.attributes.position.needsUpdate = true;
      pointsRef.current.geometry.attributes.aColor.needsUpdate = true;
    }
    if (linesRef.current) {
      linesRef.current.geometry.attributes.position.needsUpdate = true;
      linesRef.current.geometry.attributes.color.needsUpdate = true;
    }
  });

  return (
    <group>
      {/* 1. Ancient Celestial Map Background Grid (fades out on scroll) */}
      <lineSegments ref={mapLinesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[mapPositionsArray, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[mapColorsArray, 3]}
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

      {/* 2. Constellation Star Vertices & Organic Dust Field */}
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positionsArray, 3]}
          />
          <bufferAttribute
            attach="attributes-aColor"
            args={[colorsArray, 4]}
          />
          <bufferAttribute
            attach="attributes-aSize"
            args={[sizesArray, 1]}
          />
          <bufferAttribute
            attach="attributes-aTwinkleSpeed"
            args={[twinkleSpeedsArray, 1]}
          />
          <bufferAttribute
            attach="attributes-aTwinklePhase"
            args={[twinklePhasesArray, 1]}
          />
        </bufferGeometry>
        <shaderMaterial
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          depthTest={true}
        />
      </points>

      {/* 3. Constellation Connection Lines */}
      <lineSegments ref={linesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[linePositionsArray, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[lineColorsArray, 3]}
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
    </group>
  );
}
