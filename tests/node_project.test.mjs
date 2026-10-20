import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveNodeProject } from '../src/lib/nodeProject.ts';
const servers = [{id: 's1', project_id: 'p1'}, {id: 's2', project_id: 'p2'}];
const projects = [{id: 'p1', name: 'Payments'}, {id: 'p2', name: 'Treasury'}];
test('INV-P1: clicking different nodes resolves their own project by exact IDs', () => {
  assert.deepEqual(resolveNodeProject('s1', servers, projects), {id: 'p1', name: 'Payments'});
  assert.deepEqual(resolveNodeProject('s2', servers, projects), {id: 'p2', name: 'Treasury'});
});
test('INV-P2: unavailable names retain project IDs; unknown nodes never inherit another project', () => {
  assert.deepEqual(resolveNodeProject('s1', servers, []), {id: 'p1', name: null});
  assert.deepEqual(resolveNodeProject('unknown', servers, projects), {id: null, name: null});
  assert.deepEqual(resolveNodeProject(null, servers, projects), {id: null, name: null});
});
