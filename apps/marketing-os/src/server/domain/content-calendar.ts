export type CalendarChannel = "FACEBOOK" | "INSTAGRAM" | "TIKTOK" | "YOUTUBE" | "LINE" | "LINKEDIN" | "OTHER";

export interface ContentCalendarLineage {
  workspaceId: string;
  campaignId: string;
  contentItemId: string;
  sourceAssetId: string;
}

export interface ContentCalendarInput extends ContentCalendarLineage {
  id: string;
  channel: CalendarChannel;
  plannedAt: string;
}

export interface ContentCalendarEntry extends ContentCalendarLineage {
  id: string;
  channel: CalendarChannel;
  plannedAt: string;
  approvalRequired: true;
  publishable: false;
}

function parseInstant(value: string): Date {
  const explicitTimezone = /(Z|[+-]\d{2}:\d{2})$/;
  if (!explicitTimezone.test(value)) {
    throw new Error("plannedAt must include an explicit timezone.");
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error("plannedAt must be a valid ISO-8601 instant.");
  }
  return date;
}

export function normalizePlannedAt(value: string): string {
  return parseInstant(value).toISOString();
}

export function createContentCalendarEntry(input: ContentCalendarInput): ContentCalendarEntry {
  return {
    id: input.id,
    workspaceId: input.workspaceId,
    campaignId: input.campaignId,
    contentItemId: input.contentItemId,
    sourceAssetId: input.sourceAssetId,
    channel: input.channel,
    plannedAt: normalizePlannedAt(input.plannedAt),
    approvalRequired: true,
    publishable: false,
  };
}

export function sortContentCalendar(entries: ContentCalendarEntry[]): ContentCalendarEntry[] {
  return [...entries].sort((a, b) => {
    const byTime = a.plannedAt.localeCompare(b.plannedAt);
    return byTime !== 0 ? byTime : a.id.localeCompare(b.id);
  });
}

export function assertNoCalendarConflicts(entries: ContentCalendarEntry[]): void {
  const seen = new Set<string>();

  for (const entry of entries) {
    const key = `${entry.workspaceId}:${entry.channel}:${entry.plannedAt}`;
    if (seen.has(key)) {
      throw new Error("Duplicate content calendar conflict for workspace/channel/plannedAt.");
    }
    seen.add(key);
  }
}

export function planContentCalendar(inputs: ContentCalendarInput[]): ContentCalendarEntry[] {
  const entries = inputs.map(createContentCalendarEntry);
  assertNoCalendarConflicts(entries);
  return sortContentCalendar(entries);
}
