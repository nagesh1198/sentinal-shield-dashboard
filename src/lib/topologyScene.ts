import * as THREE from "three";
import type { TopologyNode } from "./holisticData";

export interface TopologyLayer {
  group: THREE.Group;
  nodeMeshes: Map<string, THREE.Object3D>;
  shockwaves: THREE.Mesh[];
  packetBeams: { mesh: THREE.Mesh; curve: THREE.QuadraticBezierCurve3; progress: number; speed: number }[];
}

/** Builds only the fleet layer; the renderer, camera and command core stay alive. */
export function createTopologyLayer(topology: TopologyNode[], simulatedTamperNodeId: string | null = null): TopologyLayer {
  const group = new THREE.Group();
  const nodeMeshes = new Map<string, THREE.Object3D>();
  const shockwaves: THREE.Mesh[] = [];
  const packetBeams: TopologyLayer["packetBeams"] = [];
    const clusters = Array.from(new Set(topology.map((n) => n.cluster)));
    const clusterAngles: Record<string, number> = {};
    clusters.forEach((cl, i) => {
      clusterAngles[cl] = (i / clusters.length) * (Math.PI * 2);
    });

    const shockwaveGeo = new THREE.RingGeometry(1.2, 2.2, 32);
    const shockwaveMat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    });

    topology.forEach((node, idx) => {
      const clusterAngle = clusterAngles[node.cluster] ?? (idx * 0.7);
      const clusterRadius = 22;
      const subOffsetRadius = 5.5;
      const subAngle = (idx % 4) * (Math.PI / 2) + clusterAngle;

      const cx = Math.cos(clusterAngle) * clusterRadius;
      const cz = Math.sin(clusterAngle) * clusterRadius;
      const cy = Math.sin(idx * 1.3) * 2.0;

      const px = cx + Math.cos(subAngle) * subOffsetRadius;
      const pz = cz + Math.sin(subAngle) * subOffsetRadius;
      const py = cy + Math.sin(idx * 0.8) * 1.0;

      const positionedNode = { ...node, meshPosition: [px, py, pz] as [number, number, number] };

      const buildingGroup = new THREE.Group();
      buildingGroup.position.set(px, py, pz);
      buildingGroup.userData = { nodeId: node.id, nodeData: positionedNode };

      const isTampered = node.tampered || simulatedTamperNodeId === node.id;
      const baseColor = isTampered ? 0xef4444 : node.status === "offline" ? 0x64748b : node.status === "warning" ? 0xf59e0b : 0x10b981;

      // Real-World Building Architecture: Pedestal Foundation
      const pedestalGeo = new THREE.BoxGeometry(2.6, 0.4, 2.6);
      const pedestalMat = new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        roughness: 0.4,
        metalness: 0.8,
      });
      const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
      pedestal.position.y = -1.2;
      buildingGroup.add(pedestal);

      // Building Structure: Skyscraper / Tower / Data Vault
      let towerHeight = 3.6;
      let towerWidth = 1.8;
      if (node.type === "gateway") {
        towerHeight = 4.8;
        towerWidth = 1.6;
      } else if (node.type === "database" || node.type === "canary") {
        towerHeight = 3.2;
        towerWidth = 2.2;
      }

      const buildingGeo = new THREE.BoxGeometry(towerWidth, towerHeight, towerWidth);
      const buildingMat = new THREE.MeshStandardMaterial({
        color: baseColor,
        emissive: baseColor,
        emissiveIntensity: isTampered ? 0.85 : 0.4,
        roughness: 0.2,
        metalness: 0.85,
      });
      const buildingTower = new THREE.Mesh(buildingGeo, buildingMat);
      buildingTower.position.y = towerHeight / 2 - 1.0;
      buildingGroup.add(buildingTower);

      // Multi-tier floor lines / Server rack window bands
      const floorBands = 3;
      for (let f = 1; f <= floorBands; f++) {
        const bandGeo = new THREE.BoxGeometry(towerWidth + 0.08, 0.08, towerWidth + 0.08);
        const bandMat = new THREE.MeshBasicMaterial({
          color: isTampered ? 0xff4d4f : 0x38bdf8,
          transparent: true,
          opacity: 0.8,
        });
        const band = new THREE.Mesh(bandGeo, bandMat);
        band.position.y = -1.0 + (towerHeight / (floorBands + 1)) * f;
        buildingGroup.add(band);
      }

      // Rooftop Structure & Antenna Spire
      const roofDeckGeo = new THREE.BoxGeometry(towerWidth * 0.85, 0.3, towerWidth * 0.85);
      const roofDeckMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9 });
      const roofDeck = new THREE.Mesh(roofDeckGeo, roofDeckMat);
      roofDeck.position.y = towerHeight - 1.0 + 0.15;
      buildingGroup.add(roofDeck);

      // Rooftop Antenna Spire
      const antennaGeo = new THREE.CylinderGeometry(0.04, 0.08, 1.8, 8);
      const antennaMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9 });
      const antenna = new THREE.Mesh(antennaGeo, antennaMat);
      antenna.position.y = towerHeight - 1.0 + 1.05;
      buildingGroup.add(antenna);

      // Antenna Tip Blinking Beacon
      const tipGeo = new THREE.SphereGeometry(0.12, 8, 8);
      const tipMat = new THREE.MeshBasicMaterial({
        color: isTampered ? 0xef4444 : 0x38bdf8,
      });
      const beaconTip = new THREE.Mesh(tipGeo, tipMat);
      beaconTip.position.y = towerHeight - 1.0 + 1.95;
      buildingGroup.add(beaconTip);

      // Expanding 3D Shockwave Rings on Tampered Buildings
      if (isTampered) {
        const shockwave = new THREE.Mesh(shockwaveGeo.clone(), shockwaveMat.clone());
        shockwave.rotation.x = Math.PI / 2;
        shockwave.position.y = -0.9;
        buildingGroup.add(shockwave);
        shockwaves.push(shockwave);

        // Vertical Incident Laser Beam
        const beamGeo = new THREE.CylinderGeometry(0.08, 0.2, 8, 8);
        const beamMat = new THREE.MeshBasicMaterial({
          color: 0xef4444,
          transparent: true,
          opacity: 0.75,
        });
        const beam = new THREE.Mesh(beamGeo, beamMat);
        beam.position.y = towerHeight + 2.5;
        buildingGroup.add(beam);
      }

      group.add(buildingGroup);
      nodeMeshes.set(node.id, buildingGroup);

      // Telemetry Connection Line to Core
      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(px * 0.45, (py + 4) * 0.5, pz * 0.45),
        new THREE.Vector3(px, py, pz)
      );

      const points = curve.getPoints(24);
      const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
      const lineMat = new THREE.LineBasicMaterial({
        color: isTampered ? 0xef4444 : 0x0284c7,
        transparent: true,
        opacity: isTampered ? 0.7 : 0.3,
      });
      const line = new THREE.Line(lineGeo, lineMat);
      group.add(line);

      // Traveling Packet Beam
      const packetGeo = new THREE.SphereGeometry(0.22, 8, 8);
      const packetMat = new THREE.MeshBasicMaterial({
        color: isTampered ? 0xff4d4f : 0x38bdf8,
      });
      const packet = new THREE.Mesh(packetGeo, packetMat);
      group.add(packet);
      packetBeams.push({
        mesh: packet,
        curve,
        progress: Math.random(),
        speed: 0.004 + Math.random() * 0.003,
      });
    });


    shockwaveGeo.dispose();
    shockwaveMat.dispose();

  return { group, nodeMeshes, shockwaves, packetBeams };
}

/** Releases each shared GPU resource once, including removed nodes and links. */
export function disposeTopologyObjects(root: THREE.Object3D): void {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  root.traverse((object) => {
    const renderable = object as THREE.Mesh;
    if (renderable.geometry) geometries.add(renderable.geometry);
    if (renderable.material) {
      const list = Array.isArray(renderable.material) ? renderable.material : [renderable.material];
      list.forEach((material) => materials.add(material));
    }
  });
  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => material.dispose());
  root.removeFromParent();
  root.clear();
}
