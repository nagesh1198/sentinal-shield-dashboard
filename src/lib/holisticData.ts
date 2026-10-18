import type { NodeInventory, ServerResponse } from "@/lib/types";
import type { IncidentSignal, TelemetryEvent } from './incidentBrief';
import type { SeededAlertType } from './incidentRules';
import { MOCK_INCIDENTS } from './incidentMockData';

export interface FacilityFloor {
  id: string;
  level: number;
  label: string;
  tierDescription: string;
  color?: string;
}

export interface Facility {
  id: string;
  name: string;
  type: "datacenter" | "hq" | "edge-pop";
  footprint: { width: number; length: number };
  heightMeters: number;
  floors: FacilityFloor[];
}

export interface NodePlacement {
  floor: number;
  floorName: string;
  row: string;
  rack: string;
  unit: string;
}

export interface AttackOrigin {
  lat: number;
  lng: number;
  country: string;
  countryCode: string;
  city: string;
  ip: string;
}

export interface NodeIncident {
  id?: string;
  nodeId?: string;
  alertType?: SeededAlertType;
  state?: 'active' | 'contained' | 'resolved';
  observedAt?: string;
  signals?: IncidentSignal[];
  events?: TelemetryEvent[];
  vector: string;
  detectedAt: string;
  attackOrigin?: AttackOrigin;
}

export interface NodeGeo {
  lat: number;
  lng: number;
  city: string;
  country: string;
  countryCode: string;
  cloudRegion: string;
  timezone: string;
  compliance: string;
}

export interface TopologyNode {
  tenantId?: string;
  vpcId?: string;
  isolatedAt?: string;
  id: string;
  name: string;
  ip: string;
  region: string;
  cluster: string;
  type: "server" | "database" | "gateway" | "canary" | "agent";
  status: "healthy" | "warning" | "tampered" | "offline";
  tampered: boolean;
  tamperReason?: string;
  tamperVector?: string;
  tamperTime?: string;
  cpu: number;
  memory: number;
  threats: number;
  meshPosition?: [number, number, number];
  // Physical and Geographic dimensions
  geo: NodeGeo;
  facility: Facility;
  placement: NodePlacement;
  incident?: NodeIncident;
}

// Canonical Shared Facilities
const STANDARD_FLOORS: FacilityFloor[] = [
  { id: "roof", level: 5, label: "Roof: Network Uplink & Satellite Array", tierDescription: "Multi-Gigabit Microwave Uplink" },
  { id: "f4", level: 4, label: "Floor 4: Edge / WAF / Load Balancers", tierDescription: "Ingress Filtering & DDoS Scrubbing" },
  { id: "f3", level: 3, label: "Floor 3: App & API Compute Tier", tierDescription: "Kubernetes Microservices Mesh" },
  { id: "f2", level: 2, label: "Floor 2: Ledger & Database Tier", tierDescription: "Encrypted High-IOPS NVMe Array" },
  { id: "f1", level: 1, label: "Floor 1: Backup & Deception Vault", tierDescription: "Air-Gapped Cold Storage & Canaries" },
];

export const CANONICAL_FACILITIES: Record<string, Facility> = {
  "FAC-IAD-01": {
    id: "FAC-IAD-01",
    name: "IAD-DC1 (Virginia Cloud Vault)",
    type: "datacenter",
    footprint: { width: 60, length: 80 },
    heightMeters: 24,
    floors: STANDARD_FLOORS,
  },
  "FAC-FRA-01": {
    id: "FAC-FRA-01",
    name: "FRA-DC1 - EU Banking VPC",
    type: "datacenter",
    footprint: { width: 50, length: 70 },
    heightMeters: 22,
    floors: STANDARD_FLOORS,
  },
  "FAC-BOM-01": {
    id: "FAC-BOM-01",
    name: "BOM-HQ1 - Sentinel Cyber Citadel",
    type: "hq",
    footprint: { width: 45, length: 45 },
    heightMeters: 65,
    floors: STANDARD_FLOORS,
  },
  "FAC-LON-01": {
    id: "FAC-LON-01",
    name: "LON-POP1 - Thames Deception Vault",
    type: "edge-pop",
    footprint: { width: 35, length: 40 },
    heightMeters: 14,
    floors: STANDARD_FLOORS,
  },
  "FAC-TYO-01": {
    id: "FAC-TYO-01",
    name: "TYO-DC2 - Shibuya Shadow Cluster",
    type: "datacenter",
    footprint: { width: 40, length: 55 },
    heightMeters: 18,
    floors: STANDARD_FLOORS,
  },
  "FAC-GRU-01": {
    id: "FAC-GRU-01",
    name: "GRU-POP2 - Latin America Sentinel Hub",
    type: "edge-pop",
    footprint: { width: 30, length: 35 },
    heightMeters: 12,
    floors: STANDARD_FLOORS,
  },
};

// Security Command Headquarters (Mumbai, India)
export const SECURITY_COMMAND_CENTER = {
  name: "Sentinel Shield Global Command",
  lat: 19.0760,
  lng: 72.8777,
  city: "Mumbai",
  country: "India",
  countryCode: "IN",
};

// Canonical 10-node organizational dataset spanning 6 countries
const BASE_TOPOLOGY_NODES: TopologyNode[] = [
  // 1. Ingress Gateway (Ashburn, US)
  {
    id: "srv-us-east-core",
    name: "us-east-ingress-01",
    ip: "10.0.1.12",
    region: "US-East (N. Virginia)",
    cluster: "Cloud VPC - Production",
    type: "gateway",
    status: "healthy",
    tampered: false,
    cpu: 48,
    memory: 62,
    threats: 0,
    geo: {
      lat: 39.0438,
      lng: -77.4874,
      city: "Ashburn",
      country: "United States of America",
      countryCode: "US",
      cloudRegion: "us-east-1a",
      timezone: "America/New_York",
      compliance: "US SOC 2 / FedRAMP Moderate",
    },
    facility: CANONICAL_FACILITIES["FAC-IAD-01"],
    placement: {
      floor: 4,
      floorName: "Floor 4: Edge / WAF / Load Balancers",
      row: "Row A",
      rack: "Rack 02",
      unit: "U10",
    },
  },

  // 2. Database Tier (Ashburn, US)
  {
    id: "srv-us-east-db",
    name: "rds-postgres-primary",
    ip: "10.0.2.88",
    region: "US-East (N. Virginia)",
    cluster: "Cloud VPC - Production",
    type: "database",
    status: "healthy",
    tampered: false,
    cpu: 55,
    memory: 74,
    threats: 0,
    geo: {
      lat: 39.0438,
      lng: -77.4874,
      city: "Ashburn",
      country: "United States of America",
      countryCode: "US",
      cloudRegion: "us-east-1b",
      timezone: "America/New_York",
      compliance: "US SOC 2 / HIPAA",
    },
    facility: CANONICAL_FACILITIES["FAC-IAD-01"],
    placement: {
      floor: 2,
      floorName: "Floor 2: Ledger & Database Tier",
      row: "Row C",
      rack: "Rack 05",
      unit: "U14",
    },
  },

  // 3. Worker Node - ACTIVE TAMPERING (Ashburn, US)
  {
    id: "srv-us-east-worker",
    name: "k8s-worker-alpha-04",
    ip: "10.0.3.104",
    region: "US-East (N. Virginia)",
    cluster: "Cloud VPC - Production",
    type: "server",
    status: "tampered",
    tampered: true,
    tamperReason: "PAM module modified & unauthorized /etc/shadow read detected",
    tamperVector: "Privilege Escalation via CVE-2024-SYS (Local Root Exploit)",
    tamperTime: "2m ago (Active)",
    cpu: 91,
    memory: 88,
    threats: 2,
    geo: {
      lat: 39.0438,
      lng: -77.4874,
      city: "Ashburn",
      country: "United States of America",
      countryCode: "US",
      cloudRegion: "us-east-1c",
      timezone: "America/New_York",
      compliance: "US SOC 2 / ISO 27001",
    },
    facility: CANONICAL_FACILITIES["FAC-IAD-01"],
    placement: {
      floor: 3,
      floorName: "Floor 3: App & API Compute Tier",
      row: "Row B",
      rack: "Rack 07",
      unit: "U12",
    },
    incident: {
      vector: "PAM module modified & unauthorized /etc/shadow read detected (CVE-2024-SYS)",
      detectedAt: "2m ago",
      attackOrigin: {
        lat: 55.7558,
        lng: 37.6173,
        country: "Russia",
        countryCode: "RU",
        city: "Moscow",
        ip: "185.220.101.5",
      },
    },
  },

  // 4. Banking Gateway (Frankfurt, DE)
  {
    id: "srv-eu-fintech-gw",
    name: "eu-fintech-gateway",
    ip: "172.16.0.4",
    region: "EU-Central (Frankfurt)",
    cluster: "EU Banking VPC",
    type: "gateway",
    status: "healthy",
    tampered: false,
    cpu: 32,
    memory: 45,
    threats: 0,
    geo: {
      lat: 50.1109,
      lng: 8.6821,
      city: "Frankfurt",
      country: "Germany",
      countryCode: "DE",
      cloudRegion: "eu-central-1a",
      timezone: "Europe/Berlin",
      compliance: "EU GDPR / BaFin MaRisk",
    },
    facility: CANONICAL_FACILITIES["FAC-FRA-01"],
    placement: {
      floor: 4,
      floorName: "Floor 4: Edge / WAF / Load Balancers",
      row: "Row A",
      rack: "Rack 01",
      unit: "U08",
    },
  },

  // 5. Banking Ledger (Frankfurt, DE)
  {
    id: "srv-eu-fintech-ledger",
    name: "ledger-validator-02",
    ip: "172.16.2.19",
    region: "EU-Central (Frankfurt)",
    cluster: "EU Banking VPC",
    type: "server",
    status: "healthy",
    tampered: false,
    cpu: 64,
    memory: 59,
    threats: 0,
    geo: {
      lat: 50.1109,
      lng: 8.6821,
      city: "Frankfurt",
      country: "Germany",
      countryCode: "DE",
      cloudRegion: "eu-central-1b",
      timezone: "Europe/Berlin",
      compliance: "EU GDPR / BaFin MaRisk",
    },
    facility: CANONICAL_FACILITIES["FAC-FRA-01"],
    placement: {
      floor: 2,
      floorName: "Floor 2: Ledger & Database Tier",
      row: "Row B",
      rack: "Rack 04",
      unit: "U16",
    },
  },

  // 6. Edge WAF Proxy & Sentinel Citadel (Mumbai, IN)
  {
    id: "srv-ap-edge-waf",
    name: "edge-waf-proxy-01",
    ip: "192.168.10.5",
    region: "AP-South (Mumbai)",
    cluster: "Edge Ingress Tier",
    type: "gateway",
    status: "warning",
    tampered: false,
    cpu: 79,
    memory: 71,
    threats: 1,
    geo: {
      lat: 19.0760,
      lng: 72.8777,
      city: "Mumbai",
      country: "India",
      countryCode: "IN",
      cloudRegion: "ap-south-1a",
      timezone: "Asia/Kolkata",
      compliance: "India DPDP Act / CERT-In",
    },
    facility: CANONICAL_FACILITIES["FAC-BOM-01"],
    placement: {
      floor: 4,
      floorName: "Floor 4: Edge / WAF / Load Balancers",
      row: "Row A",
      rack: "Rack 03",
      unit: "U04",
    },
  },

  // 7. Edge Redis Cache (Mumbai, IN)
  {
    id: "srv-ap-edge-cache",
    name: "edge-redis-cache-cluster",
    ip: "192.168.10.8",
    region: "AP-South (Mumbai)",
    cluster: "Edge Ingress Tier",
    type: "server",
    status: "healthy",
    tampered: false,
    cpu: 41,
    memory: 52,
    threats: 0,
    geo: {
      lat: 19.0760,
      lng: 72.8777,
      city: "Mumbai",
      country: "India",
      countryCode: "IN",
      cloudRegion: "ap-south-1b",
      timezone: "Asia/Kolkata",
      compliance: "India DPDP Act",
    },
    facility: CANONICAL_FACILITIES["FAC-BOM-01"],
    placement: {
      floor: 3,
      floorName: "Floor 3: App & API Compute Tier",
      row: "Row B",
      rack: "Rack 01",
      unit: "U18",
    },
  },

  // 8. Canary Secret Database - ACTIVE TAMPERING (London, GB)
  {
    id: "srv-canary-db-01",
    name: "decoy-customer-secrets-pg",
    ip: "10.99.1.5",
    region: "Deception Mesh",
    cluster: "Tripwire Canaries Tier",
    type: "canary",
    status: "tampered",
    tampered: true,
    tamperReason: "Canary token 'pg_admin_legacy' queried from unwhitelisted IP",
    tamperVector: "Credential Spraying & Honeytoken Access",
    tamperTime: "4m ago (Containment Pending)",
    cpu: 18,
    memory: 24,
    threats: 1,
    geo: {
      lat: 51.5074,
      lng: -0.1278,
      city: "London",
      country: "United Kingdom",
      countryCode: "GB",
      cloudRegion: "eu-west-2a",
      timezone: "Europe/London",
      compliance: "UK DPA 2018 / ISO 27001",
    },
    facility: CANONICAL_FACILITIES["FAC-LON-01"],
    placement: {
      floor: 1,
      floorName: "Floor 1: Backup & Deception Vault",
      row: "Row D",
      rack: "Rack 09",
      unit: "U04",
    },
    incident: {
      vector: "Canary token 'pg_admin_legacy' queried from unwhitelisted IP",
      detectedAt: "4m ago",
      attackOrigin: {
        lat: 44.4268,
        lng: 26.1025,
        country: "Romania",
        countryCode: "RO",
        city: "Bucharest",
        ip: "194.26.29.112",
      },
    },
  },

  // 9. Canary Cache Cluster (Tokyo, JP)
  {
    id: "srv-canary-redis",
    name: "decoy-session-cache-redis",
    ip: "10.99.2.11",
    region: "Deception Mesh",
    cluster: "Tripwire Canaries Tier",
    type: "canary",
    status: "healthy",
    tampered: false,
    cpu: 12,
    memory: 20,
    threats: 0,
    geo: {
      lat: 35.6762,
      lng: 139.6503,
      city: "Tokyo",
      country: "Japan",
      countryCode: "JP",
      cloudRegion: "ap-northeast-1a",
      timezone: "Asia/Tokyo",
      compliance: "Japan APPI / ISMAP",
    },
    facility: CANONICAL_FACILITIES["FAC-TYO-01"],
    placement: {
      floor: 2,
      floorName: "Floor 2: Ledger & Database Tier",
      row: "Row B",
      rack: "Rack 03",
      unit: "U06",
    },
  },

  // 10. Sentinel Agent Fleet (Sao Paulo, BR)
  {
    id: "srv-agent-sentinel-01",
    name: "sentinel-shield-daemon-01",
    ip: "10.0.10.1",
    region: "Global Control Plane",
    cluster: "Sentinel Agent Fleet",
    type: "agent",
    status: "healthy",
    tampered: false,
    cpu: 28,
    memory: 35,
    threats: 0,
    geo: {
      lat: -23.5505,
      lng: -46.6333,
      city: "Sao Paulo",
      country: "Brazil",
      countryCode: "BR",
      cloudRegion: "sa-east-1a",
      timezone: "America/Sao_Paulo",
      compliance: "Brazil LGPD",
    },
    facility: CANONICAL_FACILITIES["FAC-GRU-01"],
    placement: {
      floor: 3,
      floorName: "Floor 3: App & API Compute Tier",
      row: "Row A",
      rack: "Rack 05",
      unit: "U10",
    },
  },
];

export const INITIAL_TOPOLOGY_NODES: TopologyNode[] = BASE_TOPOLOGY_NODES.map(node => {
  const incident = MOCK_INCIDENTS[node.id];
  return {
    ...node, tenantId: 'sentinel-lab', vpcId: 'vpc-' + node.facility.id.toLowerCase(),
    ...(incident ? {
      incident: { ...incident, attackOrigin: node.incident?.attackOrigin },
      status: incident.alertType === 'heartbeat_lost' ? 'offline' as const : 'tampered' as const,
      tampered: incident.alertType !== 'heartbeat_lost', threats: 1,
      tamperReason: incident.vector, tamperVector: incident.vector, tamperTime: incident.detectedAt,
    } : {}),
  };
});

// Architectural data-flow connections between facilities
export const ARCHITECTURAL_DATA_FLOWS = [
  { fromFacility: "FAC-BOM-01", toFacility: "FAC-IAD-01", label: "Edge Ingress ➔ Cloud Production" },
  { fromFacility: "FAC-IAD-01", toFacility: "FAC-FRA-01", label: "Cloud Production ➔ EU Banking Core" },
  { fromFacility: "FAC-LON-01", toFacility: "FAC-BOM-01", label: "Deception Vault ➔ Security Command" },
  { fromFacility: "FAC-GRU-01", toFacility: "FAC-BOM-01", label: "Agent Fleet ➔ Global Sync" },
  { fromFacility: "FAC-TYO-01", toFacility: "FAC-IAD-01", label: "Shadow Canaries ➔ Sync Bus" },
];

/**
 * Merge live backend nodes with the rich canonical dataset
 */
export function buildHolisticNodes(nodes: NodeInventory[] = [], servers: ServerResponse[] = []): TopologyNode[] {
  const list = structuredClone(INITIAL_TOPOLOGY_NODES);

  nodes.forEach((n, idx) => {
    // Only append if not already in canonical list
    const existing = list.find((item) => item.id === n.id || item.name === n.hostname);
    if (existing) {
      existing.cpu = typeof n.cpu === "number" ? n.cpu : existing.cpu;
      existing.memory = typeof n.memoryUsed === "number" ? n.memoryUsed : existing.memory;
      return;
    }

    const matchServer = servers.find((s) => s.id === n.id || s.hostname === n.hostname);
    const isTampered = Boolean(n.threats > 0 || (n.status && ["critical", "error"].includes(n.status.toLowerCase())));

    list.push({
      id: n.id || `node-${idx}`,
      name: n.hostname || matchServer?.hostname || `node-${n.id.slice(0, 8)}`,
      ip: n.ip || matchServer?.ip_address || "10.0.4.x",
      region: n.location || "Managed Node",
      cluster: "Live Cluster Nodes",
      type: "server",
      status: isTampered ? "tampered" : n.status === "warning" ? "warning" : "healthy",
      tampered: isTampered,
      tamperReason: isTampered ? "Abnormal telemetry divergence & threat flag raised" : undefined,
      tamperVector: isTampered ? "Live Sensor Telemetry Anomaly" : undefined,
      tamperTime: isTampered ? "Active" : undefined,
      cpu: typeof n.cpu === "number" ? n.cpu : 35,
      memory: typeof n.memoryUsed === "number" ? n.memoryUsed : 45,
      threats: n.threats || 0,
      geo: {
        lat: 39.0438 + (idx * 0.05),
        lng: -77.4874 + (idx * 0.05),
        city: "Ashburn",
        country: "United States of America",
        countryCode: "US",
        cloudRegion: "us-east-1d",
        timezone: "America/New_York",
        compliance: "US SOC 2",
      },
      facility: CANONICAL_FACILITIES["FAC-IAD-01"],
      placement: {
        floor: 3,
        floorName: "Floor 3: App & API Compute Tier",
        row: "Row C",
        rack: `Rack ${String(idx + 1).padStart(2, "0")}`,
        unit: "U08",
      },
    });
  });

  return list;
}
