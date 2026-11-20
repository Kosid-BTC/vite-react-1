import type { ContentCalendarEntry } from "./content-calendar";

export interface ApprovedCalendarEntry extends ContentCalendarEntry {
  humanApproval: "APPROVED";
}

export interface ScheduleRecord {
  id: string;
  calendarEntryId: string;
  workspaceId: string;
  campaignId: string;
  contentItemId: string;
  sourceAssetId: string;
  channel: ContentCalendarEntry["channel"];
  plannedAt: string;
  approvalRequired: true;
  publishable: false;
  executable: false;
}

export function createScheduleIdentity(entry: ContentCalendarEntry): string {
  return [
    entry.workspaceId,
    entry.channel,
    entry.plannedAt,
    entry.contentItemId,
    entry.id,
  ].join(":");
}

export function approveCalendarEntry(entry: ContentCalendarEntry): ApprovedCalendarEntry {
  return {
    ...entry,
    humanApproval: "APPROVED",
  };
}

export function createScheduleRecord(entry: ApprovedCalendarEntry): ScheduleRecord {
  if (entry.humanApproval !== "APPROVED") {
    throw new Error("Human approval is required before scheduling.");
  }

  return {
    id: createScheduleIdentity(entry),
    calendarEntryId: entry.id,
    workspaceId: entry.workspaceId,
    campaignId: entry.campaignId,
    contentItemId: entry.contentItemId,
    sourceAssetId: entry.sourceAssetId,
    channel: entry.channel,
    plannedAt: entry.plannedAt,
    approvalRequired: true,
    publishable: false,
    executable: false,
  };
}

export function assertNoDuplicateSchedules(records: ScheduleRecord[]): void {
  const seen = new Set<string>();

  for (const record of records) {
    if (seen.has(record.id)) {
      throw new Error("Duplicate schedule request detected.");
    }
    seen.add(record.id);
  }
}

export function planSchedules(entries: ApprovedCalendarEntry[]): ScheduleRecord[] {
  const records = entries.map(createScheduleRecord);
  assertNoDuplicateSchedules(records);
  return [...records].sort((a, b) => {
    const byTime = a.plannedAt.localeCompare(b.plannedAt);
    return byTime !== 0 ? byTime : a.id.localeCompare(b.id);
  });
}
