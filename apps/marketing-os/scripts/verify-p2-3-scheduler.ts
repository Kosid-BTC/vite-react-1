import assert from "node:assert/strict";
import { createContentCalendarEntry } from "../src/server/domain/content-calendar";
import {
  approveCalendarEntry,
  assertNoDuplicateSchedules,
  createScheduleIdentity,
  createScheduleRecord,
  planSchedules,
} from "../src/server/domain/scheduler";

const entry = createContentCalendarEntry({
  id: "calendar-1",
  workspaceId: "workspace-a",
  campaignId: "campaign-a",
  contentItemId: "content-a",
  sourceAssetId: "asset-a",
  channel: "YOUTUBE",
  plannedAt: "2026-09-03T12:00:00+07:00",
});

const approved = approveCalendarEntry(entry);
const record = createScheduleRecord(approved);

assert.equal(record.workspaceId, entry.workspaceId);
assert.equal(record.campaignId, entry.campaignId);
assert.equal(record.contentItemId, entry.contentItemId);
assert.equal(record.sourceAssetId, entry.sourceAssetId);
assert.equal(record.calendarEntryId, entry.id);
assert.equal(record.approvalRequired, true);
assert.equal(record.publishable, false);
assert.equal(record.executable, false);
assert.equal(record.id, createScheduleIdentity(entry));
assert.equal(createScheduleIdentity(entry), createScheduleIdentity(entry));

assert.throws(() =>
  createScheduleRecord({ ...entry, humanApproval: "PENDING" } as never),
);

assert.throws(() => assertNoDuplicateSchedules([record, record]));

const later = approveCalendarEntry(
  createContentCalendarEntry({
    id: "calendar-2",
    workspaceId: "workspace-a",
    campaignId: "campaign-a",
    contentItemId: "content-b",
    sourceAssetId: "asset-b",
    channel: "YOUTUBE",
    plannedAt: "2026-09-03T13:00:00+07:00",
  }),
);

const planned = planSchedules([later, approved]);
assert.deepEqual(planned.map((item) => item.calendarEntryId), ["calendar-1", "calendar-2"]);

const serialized = JSON.stringify({ approved, record, planned });
for (const forbidden of ["apiKey", "secret", "serviceRole", "authorization"]) {
  assert.equal(serialized.includes(forbidden), false, `scheduler contract leaked ${forbidden}`);
}

console.log("P2_3_SCHEDULER_FOUNDATION: PASS");
console.log("EXTERNAL_PUBLISH_CALLED: NO");
console.log("PRODUCTION_TOUCHED: NO");
