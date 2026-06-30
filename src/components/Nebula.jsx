import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Colorful Gaseous Nebula Shader
const NebulaCloudShader = {
  uniforms: {
    uTime: { value: 0 },
    uOpacity: { value: 0.28 },
    uBaseColor: { value: new THREE.Color('#03001e') }, // Very dark violet/navy
    uAccentColor: { value: new THREE.Color('#7303c0') }, // Magenta/Purple
    uCyanColor: { value: new THREE.Color('#03001e').set('#00f2fe') }, // Electric Cyan
    uHighlightColor: { value: new THREE.Color('#ffd89b') } // Soft Gold
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
    uniform float uOpacity;
    uniform vec3 uBaseColor;
    uniform vec3 uAccentColor;
    uniform vec3 uCyanColor;
    uniform vec3 uHighlightColor;

    varying vec2 vUv;
    varying vec3 vPosition;

    // Fractional noise helpers
    float rand(vec2 n) { 
      return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
    }

    float noise(vec2 p) {
      vec2 ip = floor(p);
      vec2 u = fract(p);
      u = u*u*(3.0-2.0*u);
      
      float res = mix(
        mix(rand(ip), rand(ip+vec2(1.0,0.0)), u.x),
        mix(rand(ip+vec2(0.0,1.0)), rand(ip+vec2(1.0,1.0)), u.x), u.y);
      return res*res;
    }

    float fbm(vec2 p) {
      float v = 0.0;
      float a = 0.5;
      vec2 shift = vec2(100.0);
      mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.50));
      for (int i = 0; i < 4; ++i) {
        v += a * noise(p);
        p = rot * p * 2.0 + shift;
        a *= 0.5;
      }
      return v;
    }

    void main() {
      vec2 center = vec2(0.5);
      vec2 uv = vUv - center;
      float dist = length(uv);

      // Smooth radial cutoff so boundaries fade completely to transparent
      float radialMask = smoothstep(0.5, 0.08, dist);

      // Layered noise coordinates with slow temporal drift
      vec2 p1 = vUv * 3.0 + vec2(uTime * 0.02, -uTime * 0.01);
      vec2 p2 = vUv * 1.8 - vec2(-uTime * 0.008, uTime * 0.015);

      // Evaluate dual-octave fBm gaseous textures
      float n1 = fbm(p1 + fbm(p2));
      float n2 = fbm(p2 * 1.4 - n1);

      float gasDensity = n1 * n2 * 1.9;

      // Mix purple and deep dark space base
      vec3 colorMix = mix(uBaseColor, uAccentColor, gasDensity * 1.3);
      
      // Inject cyan streams into low-to-medium density slots
      float cyanFactor = smoothstep(0.12, 0.48, n2 * n1);
      colorMix = mix(colorMix, uCyanColor, cyanFactor * 0.5);
      
      // Inject golden highlights in maximum-density pockets
      float goldFactor = pow(gasDensity, 2.5);
      colorMix = mix(colorMix, uHighlightColor, goldFactor * 0.4);

      // Final alpha calculation
      float alpha = gasDensity * radialMask * uOpacity;

      gl_FragColor = vec4(colorMix, alpha);
    }
  `
};

export default function Nebula({ scrollProgress }) {
  const meshGroupRef = useRef();

  // Create memoized shader materials to avoid recompiles
  const materials = useMemo(() => {
    const list = [];
    for (let i = 0; i < 5; i++) {
      list.push(
        new THREE.ShaderMaterial({
          uniforms: THREE.UniformsUtils.clone(NebulaCloudShader.uniforms),
          vertexShader: NebulaCloudShader.vertexShader,
          fragmentShader: NebulaCloudShader.fragmentShader,
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending
        })
      );
    }
    return list;
  }, []);

  // Preset offsets and sizes for the 5 clouds to create a deep volumetric parallax
  const clouds = useMemo(() => {
    return [
      { pos: [0, 0, -8], scale: [24, 18, 1], rot: 0.1 },
      { pos: [-7, 4, -13], scale: [30, 22, 1], rot: -0.3 },
      { pos: [7, -5, -15], scale: [34, 24, 1], rot: 0.5 },
      { pos: [-5, -6, -6], scale: [20, 16, 1], rot: 1.2 },
      { pos: [6, 6, -19], scale: [38, 28, 1], rot: -0.8 }
    ];
  }, []);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    
    // Update individual shader uniforms for slow rotations and temporal shifts
    materials.forEach((mat, idx) => {
      mat.uniforms.uTime.value = time;
      
      // Nebula opacity increases from 0.28 to 0.55 as user scrolls down
      const currentScroll = scrollProgress.current;
      const baseOpacity = 0.28 + currentScroll * 0.27;
      mat.uniforms.uOpacity.value = baseOpacity;
    });

    if (meshGroupRef.current) {
      // Parallax rotation of the entire cluster
      meshGroupRef.current.rotation.z = time * 0.0025;
    }
  });

  return (
    <group ref={meshGroupRef}>
      {clouds.map((cloud, idx) => (
        <mesh 
          key={idx} 
          position={cloud.pos} 
          scale={cloud.scale} 
          rotation={[0, 0, cloud.rot]}
        >
          <planeGeometry args={[1, 1]} />
          <primitive object={materials[idx]} attach="material" />
        </mesh>
      ))}
    </group>
  );
}
