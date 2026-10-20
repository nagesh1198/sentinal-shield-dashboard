# Initial live topology loading

D-01: Both shared views start empty and remain behind a loading state until the inventory request completes. No API or AI requests are added.
D-02: Failed refreshes retain the last successful snapshot with an error banner; initial failure shows Retry. Successful empty inventory shows an empty state. Overlapping refreshes are suppressed.

- INV-L1: Successful empty inventory never becomes demo data. Enforcement: resolveLiveFleet guards buildHolisticNodes fallback; initial page state is empty; SSE requires initialized inventory. Test: empty snapshot.
- INV-L2: Failed inventory reads never become successful snapshots. Enforcement: resolveLiveFleet throws on either failed inventory read; page catch sets error, finally exits loading. Test: total and partial failures.
- INV-L3: Alert failure preserves prior evidence. Enforcement: resolver uses previousAlerts. Test: rejected alert read.

Risk: low, read-only UI state. Existing authenticated calls, tenant scoping and backend contracts are unchanged. No security write path. Validation: offline resolver tests, existing topology tests, TypeScript, browser reload. No AI requests.
