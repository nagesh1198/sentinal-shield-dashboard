import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createTopologyLayer, disposeTopologyObjects } from '../src/lib/topologyScene.ts';

const node = (changes = {}) => ({ id: 'live-1', name: 'Server A', cluster: 'primary', type: 'server', status: 'healthy', tampered: false, ...changes });
const tower = (layer, id = 'live-1') => layer.nodeMeshes.get(id).children[1];

test('INV-1: subsequent fleet snapshots render fresh telemetry and additions/removals', () => {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera();
  camera.position.set(11, 22, 33);
  const first = createTopologyLayer([node()]);
  scene.add(first.group);
  disposeTopologyObjects(first.group);
  const next = createTopologyLayer([node({ id: 'live-2', name: 'Updated server', cpu: 72 })]);
  scene.add(next.group);
  assert.equal(next.nodeMeshes.has('live-1'), false);
  assert.equal(next.nodeMeshes.get('live-2').userData.nodeData.cpu, 72);
  assert.equal(scene.children.length, 1);
  assert.deepEqual(camera.position.toArray(), [11, 22, 33]);
  disposeTopologyObjects(next.group);
});

test('INV-2: alert, recovery, warning and offline snapshots set the correct visuals', () => {
  for (const [changes, color, shocks] of [
    [{ tampered: true }, 0xef4444, 1],
    [{ status: 'warning' }, 0xf59e0b, 0],
    [{ status: 'offline' }, 0x64748b, 0],
    [{ status: 'healthy', tampered: false }, 0x10b981, 0],
  ]) {
    const layer = createTopologyLayer([node(changes)]);
    assert.equal(tower(layer).material.color.getHex(), color);
    assert.equal(layer.shockwaves.length, shocks);
    disposeTopologyObjects(layer.group);
  }
});

test('INV-3: explicit empty inventory creates no fallback servers or connections', () => {
  const layer = createTopologyLayer([]);
  assert.equal(layer.nodeMeshes.size, 0);
  assert.equal(layer.group.children.length, 0);
  assert.equal(layer.packetBeams.length, 0);
  disposeTopologyObjects(layer.group);
});

test('INV-4: teardown releases geometries and materials exactly once', () => {
  const layer = createTopologyLayer([node({ tampered: true })]);
  const resources = new Map();
  layer.group.traverse((object) => {
    for (const resource of [object.geometry, ...(Array.isArray(object.material) ? object.material : [object.material])]) {
      if (!resource || resources.has(resource)) continue;
      resources.set(resource, 0);
      resource.addEventListener('dispose', () => resources.set(resource, resources.get(resource) + 1));
    }
  });
  disposeTopologyObjects(layer.group);
  assert.ok(resources.size > 10);
  assert.ok([...resources.values()].every((count) => count === 1));
  assert.equal(layer.group.children.length, 0);
});

test('INV-5: shared map data is immutable and picking retains current node details', () => {
  const original = Object.freeze(node({ cpu: 9 }));
  const layer = createTopologyLayer([original], 'live-1');
  assert.equal(original.meshPosition, undefined);
  assert.equal(layer.nodeMeshes.get('live-1').userData.nodeData.cpu, 9);
  assert.equal(tower(layer).material.color.getHex(), 0xef4444);
  assert.equal(layer.shockwaves.length, 1);
  disposeTopologyObjects(layer.group);
});
