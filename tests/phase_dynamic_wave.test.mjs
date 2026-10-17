import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

// INV-WAVE-1: DynamicResourceWave component must exist with SVG wave rendering
test("INV-WAVE-1: DynamicResourceWave component must render pulsating SVG waves", () => {
  const content = fs.readFileSync("src/components/DynamicResourceWave.tsx", "utf8");
  assert.ok(
    content.includes("export function DynamicResourceWave") || content.includes("export const DynamicResourceWave"),
    "DynamicResourceWave component must be exported"
  );
  assert.ok(
    content.includes("<svg") && content.includes("<path") && (content.includes("linePath") || content.includes("d=")),
    "DynamicResourceWave must render SVG wave paths"
  );
  assert.ok(
    content.includes("requestAnimationFrame") || content.includes("setInterval"),
    "DynamicResourceWave must animate dynamically"
  );
});

// INV-WAVE-2: Infrastructure page must integrate DynamicResourceWave for CPU and Memory
test("INV-WAVE-2: src/app/infrastructure/page.tsx must integrate DynamicResourceWave for CPU and Memory", () => {
  const content = fs.readFileSync("src/app/infrastructure/page.tsx", "utf8");
  assert.ok(
    content.includes("DynamicResourceWave"),
    "Infrastructure page must import and render DynamicResourceWave"
  );
  assert.ok(
    content.includes('label="CPU"') || content.includes("label='CPU'"),
    "Infrastructure page must render CPU dynamic wave"
  );
  assert.ok(
    content.includes('label="Memory"') || content.includes("label='Memory'"),
    "Infrastructure page must render Memory dynamic wave"
  );
});

// INV-WAVE-3: ManagedInfrastructure must also integrate dynamic wave
test("INV-WAVE-3: ManagedInfrastructure.tsx must integrate DynamicResourceWave", () => {
  const content = fs.readFileSync("src/components/ManagedInfrastructure.tsx", "utf8");
  assert.ok(
    content.includes("DynamicResourceWave"),
    "ManagedInfrastructure must import and render DynamicResourceWave"
  );
});
