# Live topology rendering

Low-risk, read-only presentation change. Scope: fleet rendering only.

- INV-1: Fresh fleet snapshots replace nodes, connections and node details without recreating the renderer or camera. Enforcement: animation loop reconciles the fleet layer by snapshot identity. Test: additions/removals and updated telemetry.
- INV-2: Tamper, recovery, warning and offline snapshots update mesh colors and incident effects. Enforcement: createTopologyLayer. Test: status color and shockwave assertions.
- INV-3: An explicit empty topology remains empty. Enforcement: topologyNodes !== undefined and no renderer fallback. Test: empty layer.
- INV-4: Removed/replaced topology and unmounted scenes release GPU resources once. Enforcement: disposeTopologyObjects. Test: geometry/material dispose events.
- INV-5: Renderer leaves shared map data untouched and picking reads the latest snapshot. Enforcement: copied nodeData and current node mesh map. Test: frozen input and refreshed nodeData.

D-01: Reuse the global map's existing SSE and 15-second polling feed; add no API or AI requests.
D-02: Replace only the fleet layer when a new snapshot arrives; retain the command core, camera orbit, renderer and event handlers.
D-03: No authentication, authorization, tenancy, containment or backend data contracts change. Existing authenticated reads supply all data. No write path or security state transition added.

Applicable checklist: external-service failures retain the existing shared page behavior; resource cleanup is bounded by the current snapshot. Backend outage handling and SSE reconnection are outside this renderer change.

Validation: offline Three.js tests cover all invariants; typecheck and browser visual verification cover integration. No live incident simulation or AI calls needed.
