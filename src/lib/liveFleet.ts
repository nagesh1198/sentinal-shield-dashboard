import type { ServerResponse, NodeInventory, AlertPayload } from "./types";
import { buildHolisticNodes } from "./holisticData";

export function buildLiveTopology(nodes: NodeInventory[], servers: ServerResponse[], alerts: AlertPayload[]) {
  return servers.length || nodes.length ? buildHolisticNodes(nodes, servers, alerts) : [];
}

/** Require inventory reads to succeed; an empty fleet must never invoke the demo fallback. */
export function resolveLiveFleet(
  servers: PromiseSettledResult<ServerResponse[]>,
  nodes: PromiseSettledResult<NodeInventory[]>,
  alerts: PromiseSettledResult<{ data?: AlertPayload[] }>,
  previousAlerts: AlertPayload[] = [],
) {
  if (servers.status !== "fulfilled" || nodes.status !== "fulfilled") {
    throw new Error("Live inventory unavailable");
  }
  const liveServers = servers.value;
  const liveNodes = nodes.value;
  const liveAlerts = alerts.status === "fulfilled" ? alerts.value.data ?? [] : previousAlerts;
  const builtNodes = buildLiveTopology(liveNodes, liveServers, liveAlerts);
  return { liveServers, liveNodes, liveAlerts, builtNodes };
}
