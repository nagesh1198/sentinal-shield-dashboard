# Node project details

Low-risk read-only display change in the shared node inspection panel (topology and map).

- INV-P1: A selected server displays the project matched by server.id -> server.project_id -> project.id. Enforcement: resolveNodeProject. Test: two different servers/projects.
- INV-P2: Missing metadata cannot display another project's name. Enforcement: exact-ID lookup with explicit unavailable state; preserve known project ID. Test: missing names, unknown and null selection.

D-01: Use the existing authenticated project list once per page mount. Existing backend tenant and permission checks remain authoritative. Failure does not block live topology; no additional AI calls or write operations.
D-02: Show both project name and full project ID. Inventory-only nodes without a backend server relationship show Project not available.

Validation: offline resolver tests, TypeScript check, browser node-selection verification. Review limited to INV-P1/P2 and no inferred ownership or new access grants.
