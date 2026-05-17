"use client";

import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useGLTF, Html, useBounds } from "@react-three/drei";
import { useSpring } from "@react-spring/three";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import {
  type Part,
  type EngineBayHotspot,
  findPartId,
} from "./parts";

type Props = {
  url: string;
  parts: Part[];
  paintColor: string;
  hoveredId: string | null;
  pickedId: string | null;
  hoodOpen: boolean;
  openDoors: ReadonlySet<string>;
  engineBay: EngineBayHotspot[];
  onHover: (id: string | null) => void;
  onPick: (id: string) => void;
  onEngineBayPick: (id: string) => void;
  autoRotate: boolean;
};

function buildMaterials(paintColor: string) {
  const paint = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(paintColor),
    metalness: 0.95,
    roughness: 0.28,
    clearcoat: 1.0,
    clearcoatRoughness: 0.06,
    envMapIntensity: 1.35,
  });

  const chrome = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color("#f1f1f2"),
    metalness: 1.0,
    roughness: 0.04,
    envMapIntensity: 1.6,
  });

  const glass = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color("#0c1419"),
    metalness: 0.05,
    roughness: 0.05,
    transmission: 0.92,
    thickness: 0.4,
    ior: 1.5,
    transparent: true,
    opacity: 0.55,
    envMapIntensity: 1.2,
  });

  const tire = new THREE.MeshStandardMaterial({
    color: new THREE.Color("#0a0a0b"),
    roughness: 0.92,
    metalness: 0,
    envMapIntensity: 0.6,
  });

  const wheelRim = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color("#bcbec4"),
    metalness: 1.0,
    roughness: 0.18,
    envMapIntensity: 1.5,
  });

  const headlight = new THREE.MeshStandardMaterial({
    color: new THREE.Color("#f8f6e8"),
    roughness: 0.25,
    metalness: 0.1,
    emissive: new THREE.Color("#fff4d0"),
    emissiveIntensity: 0.45,
    envMapIntensity: 1.2,
  });

  const taillight = new THREE.MeshStandardMaterial({
    color: new THREE.Color("#5b0303"),
    roughness: 0.25,
    metalness: 0.2,
    emissive: new THREE.Color("#dc0d01"),
    emissiveIntensity: 0.7,
    envMapIntensity: 1.0,
  });

  const plastic = new THREE.MeshStandardMaterial({
    color: new THREE.Color("#16161a"),
    roughness: 0.85,
    metalness: 0,
    envMapIntensity: 0.7,
  });

  const interior = new THREE.MeshStandardMaterial({
    color: new THREE.Color("#1c1a1f"),
    roughness: 0.8,
    metalness: 0,
    envMapIntensity: 0.5,
  });

  return { paint, chrome, glass, tire, wheelRim, headlight, taillight, plastic, interior };
}

type MaterialSet = ReturnType<typeof buildMaterials>;

function pickMaterialForMesh(name: string, mats: MaterialSet): THREE.Material | null {
  const n = name.toLowerCase();
  if (
    n.startsWith("body_panel") ||
    n.startsWith("roof") ||
    n.startsWith("hood") ||
    n.startsWith("door_") ||
    n.startsWith("door.") ||
    n.startsWith("fender_") ||
    n.startsWith("bumper_") ||
    n.startsWith("tailgate")
  ) {
    return mats.paint;
  }
  if (n.startsWith("chrome") || n.startsWith("badge") || n.startsWith("license_plate")) {
    return mats.chrome;
  }
  if (
    n.startsWith("windshield") ||
    n.startsWith("rearwindow") ||
    n.startsWith("window") ||
    n.startsWith("lamp_glass")
  ) {
    return mats.glass;
  }
  if (n.startsWith("tire")) return mats.tire;
  if (n.startsWith("wheel") || n.startsWith("rim") || n.startsWith("brake")) return mats.wheelRim;
  if (n.startsWith("headlight") || n.startsWith("led") || n.startsWith("neon")) return mats.headlight;
  if (n.startsWith("taillight")) return mats.taillight;
  if (n.startsWith("plastic_")) return mats.plastic;
  if (n.startsWith("interior_") || n.startsWith("seat") || n.startsWith("dashboard")) {
    return mats.interior;
  }
  return null;
}

function bboxOf(objects: THREE.Object3D[]): THREE.Box3 {
  const box = new THREE.Box3();
  for (const obj of objects) {
    box.expandByObject(obj);
  }
  return box;
}

type Axes = { fwd: "x" | "z"; side: "x" | "z"; fwdSign: number };

function detectAxes(sceneBox: THREE.Box3): Axes {
  const size = sceneBox.getSize(new THREE.Vector3());
  const fwd: "x" | "z" = size.x >= size.z ? "x" : "z";
  const side: "x" | "z" = fwd === "x" ? "z" : "x";
  return { fwd, side, fwdSign: 1 };
}

function repivot(
  meshes: THREE.Object3D[],
  pivotPos: THREE.Vector3,
  scene: THREE.Object3D,
): THREE.Group {
  const pivot = new THREE.Group();
  pivot.position.copy(pivotPos);
  scene.add(pivot);
  for (const m of meshes) {
    pivot.attach(m); // preserves world transform
  }
  return pivot;
}

export default function CarModel({
  url,
  parts,
  paintColor,
  hoveredId,
  pickedId,
  hoodOpen,
  openDoors,
  engineBay,
  onHover,
  onPick,
  onEngineBayPick,
  autoRotate,
}: Props) {
  const { scene } = useGLTF(url) as unknown as { scene: THREE.Group };
  const groupRef = useRef<THREE.Group>(null);
  const bounds = useBounds();

  const mats = useMemo(() => buildMaterials(paintColor), [paintColor]);

  const { meshToId, meshesByPartId } = useMemo(() => {
    const meshToId = new Map<THREE.Mesh, string>();
    const meshesByPartId = new Map<string, THREE.Mesh[]>();

    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      // Material override + part-id resolution share the same hierarchy walk:
      // walk up parents until we find a name that matches either a material
      // bucket or a known part prefix.
      let replacement: THREE.Material | null = null;
      let foundId: string | null = null;
      let cur: THREE.Object3D | null = obj;
      while (cur) {
        if (!replacement) {
          replacement = pickMaterialForMesh(cur.name, mats);
        }
        if (!foundId) {
          foundId = findPartId(cur.name, parts);
        }
        if (replacement && foundId) break;
        cur = cur.parent;
      }

      // Default fallback: any unclassified mesh becomes body paint.
      if (!replacement) replacement = mats.paint;
      mesh.material = replacement;

      if (foundId) {
        meshToId.set(mesh, foundId);
        const list = meshesByPartId.get(foundId) ?? [];
        list.push(mesh);
        meshesByPartId.set(foundId, list);
      }
    });
    return { meshToId, meshesByPartId };
  }, [scene, parts, mats]);

  const hoodPivotRef = useRef<THREE.Group | null>(null);
  const hoodAxisRef = useRef<"x" | "z">("z");
  const hoodSignRef = useRef<number>(1);
  const doorPivotsRef = useRef<
    Map<string, { pivot: THREE.Group; sign: number }>
  >(new Map());
  const [fit, setFit] = useState<{
    center: THREE.Vector3;
    scale: number;
    bboxHeight: number;
  } | null>(null);

  useEffect(() => {
    if (fit) return;

    const sceneBox = new THREE.Box3().setFromObject(scene);
    const sceneCenter = sceneBox.getCenter(new THREE.Vector3());
    const axes = detectAxes(sceneBox);

    const hoodMeshes = meshesByPartId.get("hood");
    if (hoodMeshes && hoodMeshes.length) {
      const hoodBox = bboxOf(hoodMeshes);
      const hoodCenter = hoodBox.getCenter(new THREE.Vector3());
      axes.fwdSign =
        Math.sign(hoodCenter[axes.fwd] - sceneCenter[axes.fwd]) || 1;

      const pivotPos = new THREE.Vector3();
      pivotPos.copy(hoodCenter);
      pivotPos[axes.fwd] =
        axes.fwdSign > 0 ? hoodBox.min[axes.fwd] : hoodBox.max[axes.fwd];
      pivotPos.y = hoodBox.max.y;

      const pivot = repivot(hoodMeshes, pivotPos, scene);
      hoodPivotRef.current = pivot;
      hoodAxisRef.current = axes.side;
      hoodSignRef.current = -axes.fwdSign;
    }

    for (const doorId of ["door-fl", "door-fr", "door-rl", "door-rr"]) {
      const doorMeshes = meshesByPartId.get(doorId);
      if (!doorMeshes || !doorMeshes.length) continue;

      const doorBox = bboxOf(doorMeshes);
      const doorCenter = doorBox.getCenter(new THREE.Vector3());
      const sideSign =
        Math.sign(doorCenter[axes.side] - sceneCenter[axes.side]) || 1;

      const pivotPos = new THREE.Vector3();
      pivotPos.copy(doorCenter);
      pivotPos[axes.fwd] =
        axes.fwdSign > 0 ? doorBox.max[axes.fwd] : doorBox.min[axes.fwd];
      pivotPos[axes.side] =
        sideSign > 0 ? doorBox.min[axes.side] : doorBox.max[axes.side];

      const pivot = repivot(doorMeshes, pivotPos, scene);

      let sign = sideSign;
      if (axes.fwd === "z") sign = -sideSign;
      sign *= axes.fwdSign;
      doorPivotsRef.current.set(doorId, { pivot, sign });
    }

    // Compute fit bbox from KNOWN car-part meshes only (body, wheels, doors,
    // glass, lights). Random helper / animation-rig nodes in the GLB can sit
    // far from the actual car body and would otherwise blow up the bbox.
    const fitTargets: THREE.Mesh[] = [];
    for (const meshes of meshesByPartId.values()) {
      fitTargets.push(...meshes);
    }
    const finalBox = fitTargets.length
      ? bboxOf(fitTargets)
      : new THREE.Box3().setFromObject(scene);
    const finalSize = finalBox.getSize(new THREE.Vector3());
    const finalCenter = finalBox.getCenter(new THREE.Vector3());
    const maxDim = Math.max(finalSize.x, finalSize.z) || 1; // car length, not height
    setFit({
      center: finalCenter.clone().negate(),
      scale: 5.2 / maxDim,
      bboxHeight: finalSize.y,
    });
  }, [scene, meshesByPartId, fit]);

  // Once the model is centered/grounded, ask Bounds to re-fit the camera.
  useEffect(() => {
    if (!fit) return;
    // Two-frame delay so the primitive position prop has applied.
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        bounds.refresh().clip().fit();
      });
    });
    return () => cancelAnimationFrame(id);
  }, [fit, bounds]);

  const hoodSpring = useSpring({
    rot: hoodOpen ? (Math.PI / 180) * 62 : 0,
    config: { mass: 1.2, tension: 110, friction: 22 },
  });

  const doorTargets = useMemo(() => {
    const m: Record<string, number> = {};
    for (const id of ["door-fl", "door-fr", "door-rl", "door-rr"]) {
      m[id] = openDoors.has(id) ? (Math.PI / 180) * 68 : 0;
    }
    return m;
  }, [openDoors]);

  const doorAnglesRef = useRef<Record<string, number>>({
    "door-fl": 0,
    "door-fr": 0,
    "door-rl": 0,
    "door-rr": 0,
  });

  useFrame((_, delta) => {
    const hoodPivot = hoodPivotRef.current;
    if (hoodPivot) {
      const v = hoodSpring.rot.get() * hoodSignRef.current;
      hoodPivot.rotation.set(0, 0, 0);
      hoodPivot.rotation[hoodAxisRef.current] = v;
    }

    const stiff = 1 - Math.pow(0.001, delta);
    for (const [id, target] of Object.entries(doorTargets)) {
      const cur = doorAnglesRef.current[id];
      const next = cur + (target - cur) * stiff;
      doorAnglesRef.current[id] = next;
      const entry = doorPivotsRef.current.get(id);
      if (entry) {
        entry.pivot.rotation.set(0, 0, 0);
        entry.pivot.rotation.y = next * entry.sign;
      }
    }

    if (groupRef.current && autoRotate) {
      groupRef.current.rotation.y += delta * 0.18;
    }
  });

  const originalEmissive = useMemo(() => {
    const m = new Map<THREE.Mesh, { color: THREE.Color; intensity: number }>();
    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (!mat) return;
      if (!mat.emissive) mat.emissive = new THREE.Color(0x000000);
      m.set(mesh, {
        color: mat.emissive.clone(),
        intensity: mat.emissiveIntensity ?? 1,
      });
    });
    return m;
  }, [scene]);

  useEffect(() => {
    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (!mat || !mat.emissive) return;
      const id = meshToId.get(mesh);
      const orig = originalEmissive.get(mesh);
      if (!orig) return;
      const isActive = id && (id === hoveredId || id === pickedId);
      if (isActive) {
        const strength = id === pickedId ? 0.4 : 0.22;
        mat.emissive.setRGB(strength, 0.025 * strength, 0.025 * strength);
        mat.emissiveIntensity = 1;
      } else {
        mat.emissive.copy(orig.color);
        mat.emissiveIntensity = orig.intensity;
      }
    });
  }, [hoveredId, pickedId, scene, meshToId, originalEmissive]);

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const id = meshToId.get(e.object as THREE.Mesh);
    if (id) {
      onHover(id);
      document.body.style.cursor = "pointer";
    }
  };
  const handlePointerOut = () => {
    onHover(null);
    document.body.style.cursor = "";
  };
  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    const id = meshToId.get(e.object as THREE.Mesh);
    if (id) onPick(id);
  };

  const showEngineBay = hoodOpen && hoodPivotRef.current !== null;

  // Bounds (in the parent) handles auto-fitting the camera. We translate
  // the scene so its bbox center sits at origin (so auto-rotate spins around
  // the right point) AND its bbox bottom touches y=0 (so contact shadows hit).
  let groundedY = 0;
  if (fit) {
    // fit.center already holds the NEGATED bbox center. Add half the bbox
    // height so we shift up by half-height → bbox bottom at y=0.
    groundedY = fit.center.y + (fit.bboxHeight ?? 0) / 2;
  }
  const safeCenter: [number, number, number] = fit
    ? [fit.center.x, groundedY, fit.center.z]
    : [0, 0, 0];

  return (
    <group ref={groupRef}>
      <primitive
        object={scene}
        position={safeCenter}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      />
      {showEngineBay &&
        engineBay.map((bay) => (
          <EngineBayMarker
            key={bay.id}
            position={bay.position}
            label={bay.name}
            onClick={() => onEngineBayPick(bay.id)}
          />
        ))}
    </group>
  );
}

function EngineBayMarker({
  position,
  label,
  onClick,
}: {
  position: [number, number, number];
  label: string;
  onClick: () => void;
}) {
  return (
    <group position={position}>
      <Html center distanceFactor={6} zIndexRange={[20, 0]} occlude={false}>
        <button
          type="button"
          onClick={onClick}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "4px 10px 4px 4px",
            background: "rgba(20, 8, 8, 0.92)",
            border: "1px solid rgba(220, 13, 1, 0.85)",
            color: "#FBC5C1",
            fontSize: "10px",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            fontFamily: "var(--font-sans), system-ui, sans-serif",
            cursor: "pointer",
            whiteSpace: "nowrap",
            boxShadow:
              "0 0 0 1px rgba(220, 13, 1, 0.25), 0 12px 24px -8px rgba(220, 13, 1, 0.35)",
            backdropFilter: "blur(4px)",
            transform: "translate(0, -8px)",
          }}
        >
          <span
            style={{
              width: 18,
              height: 18,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#DC0D01",
              color: "#fff",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 0,
            }}
          >
            +
          </span>
          {label}
        </button>
      </Html>
    </group>
  );
}
