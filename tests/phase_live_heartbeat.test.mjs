import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

// INV-LIVE-1: LiveHeartbeatLog must not contain hardcoded EVENT_POOL mock data
test("INV-LIVE-1: LiveHeartbeatLog must not use hardcoded EVENT_POOL mock data", () => {
  const content = fs.readFileSync("src/components/LiveHeartbeatLog.tsx", "utf8");
  assert.ok(
    !content.includes("EVENT_POOL"),
    "LiveHeartbeatLog must not define or use a static EVENT_POOL array"
  );
  assert.ok(
    !content.includes("Honeyfile /etc/shadow.bak checked"),
    "LiveHeartbeatLog must not contain hardcoded fake event messages"
  );
});

// INV-LIVE-2: LiveHeartbeatLog must consume live backend telemetry or SSE
test("INV-LIVE-2: LiveHeartbeatLog must integrate with live backend services", () => {
  const content = fs.readFileSync("src/components/LiveHeartbeatLog.tsx", "utf8");
  assert.ok(
    content.includes("nodeService") || content.includes("dashboardService"),
    "LiveHeartbeatLog must import and query live telemetry services (nodeService or dashboardService)"
  );
});

// INV-LIVE-3: LiveHeartbeatLog must dynamically reflect stream / connection health
test("INV-LIVE-3: LiveHeartbeatLog must dynamically reflect live connection state", () => {
  const content = fs.readFileSync("src/components/LiveHeartbeatLog.tsx", "utf8");
  assert.ok(
    content.includes("connected") || content.includes("isLive"),
    "LiveHeartbeatLog must track live connection state dynamically"
  );
  assert.ok(
    content.includes("DISCONNECTED") || content.includes("OFFLINE") || content.includes("CONNECTING"),
    "LiveHeartbeatLog must support disconnected/offline state indicator"
  );
});
