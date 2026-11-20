import assert from "node:assert/strict";
import {
  createContentCalendarEntry,
  planContentCalendar,
} from "../src/server/domain/content-calendar";

const base = {
  workspaceId: "workspace-a",
  campaignId: "campaign-a",
  contentItemId: "content-a",
  sourceAssetId: "asset-a",
  channel: "FACEBOOK" as const,
};

const first = createContentCalendarEntry({
  ...base,
  id: "entry-b",
  plannedAt: "2026-09-02T03:00:00+07:00",
});

assert.equal(first.workspaceId, base.workspaceId);
assert.equal(first.campaignId, base.campaignId);
assert.equal(first.contentItemId, base.contentItemId);
assert.equal(first.sourceAssetId, base.sourceAssetId);
assert.equal(first.plannedAt, "2026-09-01T20:00:00.000Z");
assert.equal(first.approvalRequired, true);
assert.equal(first.publishable, false);

assert.throws(() => createContentCalendarEntry({
  ...base,
  id: "invalid-no-zone",
  plannedAt: "2026-09-02T03:00:00",
}));

assert.throws(() => createContentCalendarEntry({
  ...base,
  id: "invalid-date",
  plannedAt: "not-a-dateZ",
}));

const planned = planContentCalendar([
  { ...base, id: "entry-b", plannedAt: "2026-09-02T05:00:00+07:00" },
  { ...base, id: "entry-c", plannedAt: "2026-09-02T03:00:00+07:00" },
  { ...base, id: "entry-a", plannedAt: "2026-09-02T03:00:00+07:00", channel: "INSTAGRAM" as const },
]);

assert.deepEqual(planned.map((entry) => entry.id), ["entry-a", "entry-c", "entry-b"]);

assert.throws(() => planContentCalendar([
  { ...base, id: "duplicate-a", plannedAt: "2026-09-02T03:00:00+07:00" },
  { ...base, id: "duplicate-b", plannedAt: "2026-09-01T20:00:00Z" },
]));

const serialized = JSON.stringify(planned);
for (const forbidden of ["apiKey", "secret", "serviceRole", "authorization", "publishToken"]) {
  assert.equal(serialized.includes(forbidden), false, `calendar contract leaked ${forbidden}`);
}

console.log("P2_2_CONTENT_CALENDAR_FOUNDATION: PASS");
console.log("AUTONOMOUS_PUBLISHING: NO");
console.log("PRODUCTION_TOUCHED: NO");
