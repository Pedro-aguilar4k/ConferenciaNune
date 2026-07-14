import { useRef, useState, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useTexture, MeshDistortMaterial, RoundedBox, Environment } from '@react-three/drei';
import * as THREE from 'three';

function LogoMesh({ spinning, onSpinEnd }) {
  const meshRef = useRef();
  const diskRef = useRef();
  const [hovered, setHovered] = useState(false);
  const texture = useTexture('/logo-icon.png');

  // Make the texture transparent (it has white bg)
  texture.colorSpace = THREE.SRGBColorSpace;

  const spinSpeed = useRef(0);
  const targetSpeed = useRef(0.008);

  useFrame((_, delta) => {
    if (!meshRef.current || !diskRef.current) return;

    if (spinning) {
      spinSpeed.current = Math.min(spinSpeed.current + delta * 8, 12);
    } else {
      spinSpeed.current = Math.max(spinSpeed.current - delta * 4, 0.6);
      if (spinSpeed.current <= 0.61 && spinning === false) {
        onSpinEnd?.();
      }
    }

    meshRef.current.rotation.y += delta * spinSpeed.current * 0.5;
    diskRef.current.rotation.y = meshRef.current.rotation.y * 0.3;

    // Gentle bob
    meshRef.current.position.y = Math.sin(Date.now() * 0.001) * 0.04;

    // Scale on hover
    const targetScale = hovered ? 1.07 : 1;
    meshRef.current.scale.lerp(
      new THREE.Vector3(targetScale, targetScale, targetScale),
      delta * 6
    );
  });

  return (
    <group>
      {/* Glow disk behind logo */}
      <mesh ref={diskRef} position={[0, 0, -0.3]}>
        <cylinderGeometry args={[1.1, 1.1, 0.06, 64]} />
        <meshStandardMaterial
          color="#2D3090"
          emissive="#1E2070"
          emissiveIntensity={0.6}
          transparent
          opacity={0.35}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>

      {/* Main logo card */}
      <group
        ref={meshRef}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
      >
        {/* Card body */}
        <RoundedBox args={[2.2, 2.2, 0.22]} radius={0.12} smoothness={4}>
          <meshStandardMaterial
            color="#0f1035"
            roughness={0.15}
            metalness={0.85}
            envMapIntensity={1.2}
          />
        </RoundedBox>

        {/* Logo face */}
        <mesh position={[0, 0, 0.12]}>
          <planeGeometry args={[1.9, 1.9]} />
          <meshStandardMaterial
            map={texture}
            transparent
            alphaTest={0.05}
            roughness={0.1}
            metalness={0.3}
            envMapIntensity={0.8}
          />
        </mesh>

        {/* Edge rim highlight */}
        <RoundedBox args={[2.26, 2.26, 0.24]} radius={0.13} smoothness={4}>
          <meshStandardMaterial
            color="#4B52C4"
            roughness={0.05}
            metalness={1}
            side={THREE.BackSide}
            envMapIntensity={2}
          />
        </RoundedBox>
      </group>
    </group>
  );
}

export default function NdLogo3D({ size = 160 }) {
  const [spinning, setSpinning] = useState(false);

  const handleClick = () => {
    setSpinning(true);
    setTimeout(() => setSpinning(false), 1200);
  };

  return (
    <div
      onClick={handleClick}
      style={{ width: size, height: size, cursor: 'pointer' }}
      title="Clique para girar"
    >
      <Canvas
        camera={{ position: [0, 0, 3.5], fov: 40 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[3, 4, 5]} intensity={1.5} color="#ffffff" />
        <directionalLight position={[-3, -2, -3]} intensity={0.4} color="#4B52C4" />
        <pointLight position={[0, 0, 4]} intensity={0.8} color="#6B75D8" />
        <Environment preset="city" />
        <Suspense fallback={null}>
          <LogoMesh spinning={spinning} onSpinEnd={() => {}} />
        </Suspense>
      </Canvas>
    </div>
  );
}
