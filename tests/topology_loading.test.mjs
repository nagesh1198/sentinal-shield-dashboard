import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveLiveFleet } from '../src/lib/liveFleet.ts';
const ok = (value) => ({ status: 'fulfilled', value });
const failed = { status: 'rejected', reason: new Error('offline') };

test('INV-L1: empty successful inventory remains empty, without demo nodes', () => {
  assert.deepEqual(resolveLiveFleet(ok([]), ok([]), ok({data: []})).builtNodes, []);
});
test('INV-L2: failed or partial inventory is an error rather than an empty successful snapshot', () => {
  for (const [servers, nodes] of [[failed, failed], [failed, ok([])], [ok([]), failed]]) {
    assert.throws(() => resolveLiveFleet(servers, nodes, ok({data: []})), /unavailable/);
  }
});
test('INV-L3: alert outage preserves previous evidence without preventing inventory loading', () => {
  const previous = [{id: 'a'}];
  assert.deepEqual(resolveLiveFleet(ok([]), ok([]), failed, previous).liveAlerts, previous);
});
