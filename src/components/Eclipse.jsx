import React, { useRef, useMemo } from 'react';
import { useFrame, extend } from '@react-three/fiber';
import * as THREE from 'three';

// Custom Shader for the Golden Corona / Eclipse Aura
const CoronaShader = {
  uniforms: {
    uTime: { value: 0 },
    uGlowColor: { value: new THREE.Color('#FFD700') },
    uPurpleColor: { value: new THREE.Color('#4C1D95') },
    uIntensity: { value: 1.0 },
    uPortalOpen: { value: 0.0 }, // 0.0 (dark eclipse) -> 1.0 (star portal)
    uMouse: { value: new THREE.Vector2(0, 0) }
  },
  vertexShader: `
    varying vec2 vUv;
    varying vec3 vPosition;
    void main() {
      vUv = uv;
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float uTime;
    uniform vec3 uGlowColor;
    uniform vec3 uPurpleColor;
    uniform float uIntensity;
    uniform float uPortalOpen;
    uniform vec2 uMouse;
    
    varying vec2 vUv;
    varying vec3 vPosition;

    vec2 hash( vec2 p ) {
      p = vec2( dot(p,vec2(127.1,311.7)), dot(p,vec2(269.5,183.3)) );
      return -1.0 + 2.0*fract(sin(p)*43758.5453123);
    }

    float noise( in vec2 p ) {
      const float K1 = 0.366025404;
      const float K2 = 0.211324865;
      vec2 i = floor( p + (p.x+p.y)*K1 );
      vec2 a = p - i + (i.x+i.y)*K2;
      float m = step(a.y,a.x); 
      vec2 o = vec2(m,1.0-m);
      vec2 b = a - o + K2;
      vec2 c = a - 1.0 + 2.0*K2;
      vec3 h = max( 0.5-vec3(dot(a,a), dot(b,b), dot(c,c) ), 0.0 );
      vec3 n = h*h*h*h*vec3( dot(a,hash(i+0.0)), dot(b,hash(i+o)), dot(c,hash(i+1.0)));
      return dot( n, vec3(70.0) );
    }

    float fbm(in vec2 p) {
      float f = 0.0;
      float amplitude = 0.5;
      float frequency = 1.0;
      for(int i = 0; i < 4; i++) {
        f += amplitude * noise(p * frequency);
        frequency *= 2.0;
        amplitude *= 0.5;
      }
      return f;
    }

    void main() {
      vec2 center = vec2(0.5);
      vec2 uv = vUv - center;
      float dist = length(uv);

      float angle = atan(uv.y, uv.x);
      vec2 noiseCoord = vec2(cos(angle), sin(angle)) * 2.2 - vec2(0.0, uTime * 0.45);
      
      float rimNoise = fbm(noiseCoord + fbm(noiseCoord * 1.5)) * 0.5 + 0.5;
      
      float baseCorona = 0.23;
      float coronaRange = 0.26 + rimNoise * 0.18;
      
      float glow = smoothstep(baseCorona, baseCorona + coronaRange, dist);
      float glowFactor = pow(1.0 - glow, 3.2) * uIntensity;
      
      float coreRadius = baseCorona - (uPortalOpen * 0.15);
      float coreMask = smoothstep(coreRadius - 0.01, coreRadius + 0.005, dist);

      vec3 finalColor = mix(uPurpleColor * 1.9, uGlowColor, dist * 1.7);
      
      float vortex = 0.0;
      if (uPortalOpen > 0.05) {
        float insideFactor = 1.0 - smoothstep(0.0, coreRadius, dist);
        float swirl = fbm(uv * 12.0 + vec2(uTime * 3.5, -uTime * 2.5));
        vortex = insideFactor * uPortalOpen * (0.65 + swirl * 0.35);
      }

      float alpha = glowFactor * coreMask;
      vec3 colorOut = finalColor * (glowFactor + vortex * 0.8);
      
      float ringEdge = smoothstep(coreRadius, coreRadius + 0.02, dist) * (1.0 - smoothstep(coreRadius + 0.03, coreRadius + 0.07, dist));
      colorOut += vec3(1.0, 0.95, 0.8) * ringEdge * 1.6 * uIntensity;

      if (uPortalOpen > 0.01) {
        alpha = max(alpha, vortex * 0.75);
        colorOut += uPurpleColor * vortex;
      }

      gl_FragColor = vec4(colorOut, alpha);
    }
  `
};

// Custom Shader for the Central Obsidian Orb with Procedural Gold Cracks
const CoreCracksShader = {
  uniforms: {
    uTime: { value: 0 },
    uFractureProgress: { value: 0.0 },
    uGoldColor: { value: new THREE.Color('#FFD700') }
  },
  vertexShader: `
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec3 vViewPosition;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vPosition = position;
      vViewPosition = -mvPosition.xyz;
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    uniform float uTime;
    uniform float uFractureProgress;
    uniform vec3 uGoldColor;
    
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec3 vViewPosition;

    // Simplex 3D noise generator by Ian McEwan, Ashima Arts
    vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
    vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

    float snoise(vec3 v){ 
      const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
      const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

      vec3 i  = floor(v + dot(v, C.yyy) );
      vec3 x0 =   v - i + dot(i, C.xxx) ;

      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min( g.xyz, l.zxy );
      vec3 i2 = max( g.xyz, l.zxy );

      vec3 x1 = x0 - i1 + 1.0 * C.xxx;
      vec3 x2 = x0 - i2 + 2.0 * C.xxx;
      vec3 x3 = x0 - D.yyy;

      i = mod(i, 289.0 ); 
      vec4 p = permute( permute( permute( 
                 i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
               + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
               + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

      float n_ = 0.142857142857; // 1.0/7.0
      vec3  ns = n_ * D.wyz - D.xzx;

      vec4 j = p - 49.0 * floor(p * ns.z);

      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_ );

      vec4 x = x_ *ns.x + ns.yyyy;
      vec4 y = y_ *ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);

      vec4 b0 = vec4( x.xy, y.xy );
      vec4 b1 = vec4( x.zw, y.zw );

      vec4 s0 = floor(b0)*2.0 + 1.0;
      vec4 s1 = floor(b1)*2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));

      vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
      vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

      vec3 p0 = vec3(a0.xy,h.x);
      vec3 p1 = vec3(a0.zw,h.y);
      vec3 p2 = vec3(a1.xy,h.z);
      vec3 p3 = vec3(a1.zw,h.w);

      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
      p0 *= norm.x;
      p1 *= norm.y;
      p2 *= norm.z;
      p3 *= norm.w;

      vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
      m = m * m;
      return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
                                    dot(p2,x2), dot(p3,x3) ) );
    }

    void main() {
      vec3 normal = normalize(vNormal);
      vec3 viewDir = normalize(vViewPosition);
      
      // Obsidian-like base material with rim reflection
      float rim = 1.0 - max(dot(viewDir, normal), 0.0);
      rim = pow(rim, 4.0);
      vec3 rimColor = vec3(0.08, 0.06, 0.15) * rim;
      vec3 baseColor = vec3(0.003, 0.003, 0.008) + rimColor;

      // Crack lines from FBM noise
      float n1 = snoise(vPosition * 4.0);
      float n2 = snoise(vPosition * 8.0 + vec3(0.0, uTime * 0.04, 0.0));
      float crackPattern = 1.0 - abs(n1 + 0.35 * n2);
      
      // Ultra-sharp crack veins
      float sharpCrack = pow(crackPattern, 24.0);
      
      // Soft glowing envelope around the cracks
      float softGlow = pow(crackPattern, 6.0) * 0.45;
      
      // Dynamic gold veins that pulse and grow
      float progress = uFractureProgress;
      float activeCrack = sharpCrack * progress;
      float activeGlow = softGlow * progress;
      
      // Golden crack pulsing & flickers
      float pulse = 1.0 + 0.3 * sin(uTime * 4.0) + 0.1 * sin(uTime * 15.0);
      vec3 crackColor = uGoldColor * (activeCrack * 5.0 + activeGlow * 1.8) * pulse;

      // Mix everything
      vec3 finalColor = baseColor + crackColor;
      
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
};

export default function Eclipse({ scrollProgress, portalOpenVal, isCtaHovered }) {
  const coronaRef = useRef();
  const coreRef = useRef();
  const ring1Ref = useRef();
  const ring2Ref = useRef();
  const diskRef = useRef();
  
  // Interpolated CTA hover value
  const ctaHover = useRef(0.0);
  
  // Create corona shader material reference
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.clone(CoronaShader.uniforms),
      vertexShader: CoronaShader.vertexShader,
      fragmentShader: CoronaShader.fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
  }, []);

  // Create core cracks shader material reference
  const coreMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.clone(CoreCracksShader.uniforms),
      vertexShader: CoreCracksShader.vertexShader,
      fragmentShader: CoreCracksShader.fragmentShader
    });
  }, []);

  // Swirling Accretion Disk Particle Setup
  const numDiskParticles = 400;
  const [diskData, particleSpeeds, particleAngles, particleRadii] = useMemo(() => {
    const positions = new Float32Array(numDiskParticles * 3);
    const colors = new Float32Array(numDiskParticles * 3);
    const speeds = new Float32Array(numDiskParticles);
    const angles = new Float32Array(numDiskParticles);
    const radii = new Float32Array(numDiskParticles);

    const goldColor = new THREE.Color('#FFD700');
    const purpleColor = new THREE.Color('#7C3AED');

    for (let i = 0; i < numDiskParticles; i++) {
      const r = 2.2 + Math.random() * 1.6;
      const angle = Math.random() * Math.PI * 2;
      radii[i] = r;
      angles[i] = angle;
      
      speeds[i] = (0.55 + Math.random() * 0.45) * (1.8 / Math.sqrt(r));

      positions[i * 3] = Math.cos(angle) * r;
      positions[i * 3 + 1] = Math.sin(angle) * r;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.15;

      const t = (r - 2.2) / 1.6;
      const c = goldColor.clone().lerp(purpleColor, t);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    return [{ positions, colors }, speeds, angles, radii];
  }, []);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const sp = scrollProgress ? scrollProgress.current : 0.0;
    
    // Calculate fracture progress based on scrollProgress
    // 0.15 to 0.25 maps to 0.0 to 1.0
    let fractureProg = 0.0;
    if (sp >= 0.15 && sp <= 0.25) {
      fractureProg = (sp - 0.15) / 0.10;
    } else if (sp > 0.25) {
      fractureProg = 1.0;
    }

    // Smoothly interpolate hover state
    const targetCtaHover = isCtaHovered ? 1.0 : 0.0;
    ctaHover.current = THREE.MathUtils.lerp(ctaHover.current, targetCtaHover, 0.08);

    // Update corona shader uniforms
    if (coronaRef.current) {
      coronaRef.current.material.uniforms.uTime.value = time;
      coronaRef.current.material.uniforms.uIntensity.value = 
        (1.0 + ctaHover.current * 0.6) * (1.0 + Math.sin(time * 2.5) * 0.08);
      coronaRef.current.material.uniforms.uPortalOpen.value = portalOpenVal.current;
    }

    // Update core cracks shader uniforms
    if (coreRef.current && coreRef.current.material.uniforms) {
      coreRef.current.material.uniforms.uTime.value = time;
      coreRef.current.material.uniforms.uFractureProgress.value = fractureProg;
    }

    // Slowly rotate core sphere and apply subtle breathing scale
    if (coreRef.current) {
      coreRef.current.rotation.y = time * 0.08;
      coreRef.current.rotation.z = time * 0.03;
      
      const scaleBase = 2.0;
      const targetScale = scaleBase * (1.0 - portalOpenVal.current * 0.85);
      coreRef.current.scale.setScalar(targetScale);
    }

    // Orbiting Rings rotation speed-up and glow-up on hover
    const ringRotSpeed = 1.0 + ctaHover.current * 5.0;
    if (ring1Ref.current) {
      ring1Ref.current.rotation.z = time * 0.15 * ringRotSpeed;
      ring1Ref.current.rotation.x = Math.PI / 3.5 + Math.sin(time * 0.4) * 0.06;
      ring1Ref.current.scale.setScalar(3.2 + portalOpenVal.current * 1.5);
      ring1Ref.current.material.opacity = 0.4 + ctaHover.current * 0.45;
    }

    if (ring2Ref.current) {
      ring2Ref.current.rotation.z = -time * 0.20 * ringRotSpeed;
      ring2Ref.current.rotation.y = Math.PI / 4 + Math.cos(time * 0.3) * 0.06;
      ring2Ref.current.scale.setScalar(4.0 + portalOpenVal.current * 2.0);
      ring2Ref.current.material.opacity = 0.55 + ctaHover.current * 0.35;
    }

    // Swirl Accretion Disk particles (Speed up and converge on hover)
    if (diskRef.current) {
      const posAttr = diskRef.current.geometry.attributes.position;
      
      const particleSwirlSpeed = 0.008 + ctaHover.current * 0.04;
      const contractionFactor = 1.0 - ctaHover.current * 0.22;

      for (let i = 0; i < numDiskParticles; i++) {
        particleAngles[i] += particleSpeeds[i] * particleSwirlSpeed;
        const r = particleRadii[i] * contractionFactor;
        const wavyZ = Math.sin(time * 2.0 + r * 4.0 + particleAngles[i]) * 0.08;

        posAttr.setXYZ(
          i,
          Math.cos(particleAngles[i]) * r,
          Math.sin(particleAngles[i]) * r,
          wavyZ
        );
      }
      posAttr.needsUpdate = true;
      diskRef.current.rotation.z = time * (0.02 + ctaHover.current * 0.15);
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* 1. ECLIPSE CORONA SHADER PLANE (Faceward) */}
      <mesh ref={coronaRef} position={[0, 0, 0.02]} scale={[6.8, 6.8, 1]}>
        <planeGeometry args={[1, 1]} />
        <primitive object={material} attach="material" />
      </mesh>

      {/* 2. ECLIPSE DARK CORE SPHERE WITH PROCEDURAL CRACKS */}
      <mesh ref={coreRef} position={[0, 0, 0]} scale={[2.0, 2.0, 2.0]}>
        <sphereGeometry args={[1, 64, 64]} />
        <primitive object={coreMaterial} attach="material" />
      </mesh>

      {/* 3. SWIRLING ACCRETION DISK PARTICLES */}
      <points ref={diskRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[diskData.positions, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[diskData.colors, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.07}
          vertexColors
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          sizeAttenuation={true}
        />
      </points>

      {/* 4. ORBITING CELESTIAL RINGS */}
      <mesh ref={ring1Ref} rotation={[Math.PI / 3.5, 0, 0]} scale={[3.2, 3.2, 3.2]}>
        <torusGeometry args={[1, 0.007, 16, 100]} />
        <meshBasicMaterial 
          color="#FFD700" 
          transparent 
          opacity={0.4} 
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      <mesh ref={ring2Ref} rotation={[-Math.PI / 4, Math.PI / 6, 0]} scale={[4.0, 4.0, 4.0]}>
        <torusGeometry args={[1, 0.004, 16, 100]} />
        <meshBasicMaterial 
          color="#4C1D95" 
          transparent 
          opacity={0.55} 
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}
