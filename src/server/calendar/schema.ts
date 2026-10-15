import { z } from "zod";

const isoInstantSchema = z.string().datetime({ offset: true })
  .refine((value) => new Date(value).toISOString() === value, "Use canonical ISO UTC timestamps.");
const coverageSchema = z.object({ from: isoInstantSchema, to: isoInstantSchema }).strict()
  .refine((range) => Date.parse(range.from) < Date.parse(range.to), "Coverage must have a positive duration.");

const sourceMetadataSchema = z.object({
  schema: z.string(), year: z.number().int(), generatedAt: isoInstantSchema, coverage: coverageSchema,
  attribution: z.literal("Data: Zodiacs.org — https://zodiacs.org"), license: z.literal("CC BY 4.0"),
}).passthrough();

export const retrogradeSourceSchema = sourceMetadataSchema.extend({
  schema: z.literal("zodiacs.sky-api.retrogrades.v1"),
  retrogrades: z.array(z.object({
    planet: z.string().min(1), from: isoInstantSchema, to: isoInstantSchema,
    clippedStart: z.boolean(), clippedEnd: z.boolean(),
    stationRetrograde: isoInstantSchema.nullable(), stationDirect: isoInstantSchema.nullable(),
  }).passthrough()),
});

export const moonPhaseSourceSchema = sourceMetadataSchema.extend({
  schema: z.literal("zodiacs.sky-api.moon-phases.v1"),
  lunations: z.array(z.object({ type: z.enum(["new", "full"]), at: isoInstantSchema }).passthrough()),
});

export const calendarSnapshotSchema = z.object({
  version: z.literal(1), retrievedAt: isoInstantSchema,
  coverage: z.array(coverageSchema).min(1),
  source: z.object({
    name: z.literal("Zodiacs.org"), url: z.literal("https://zodiacs.org"),
    attribution: z.literal("Data: Zodiacs.org — https://zodiacs.org"), license: z.literal("CC BY 4.0"),
  }).strict(),
  sourceFiles: z.array(z.object({
    kind: z.enum(["retrogrades", "moon-phases"]), year: z.number().int(),
    url: z.string().url(), generatedAt: isoInstantSchema,
  }).strict()).min(2),
  events: z.array(z.object({
    id: z.string().min(1), name: z.string().min(1),
    kind: z.enum(["retrograde", "lunation", "eclipse", "aspect"]),
    start: isoInstantSchema, end: isoInstantSchema.nullable(), interpretation: z.string().min(1),
    source: z.object({ name: z.string().min(1), url: z.string().url() }).strict(),
  }).strict()),
}).strict().superRefine((snapshot, context) => {
  for (let index = 1; index < snapshot.coverage.length; index += 1) {
    if (Date.parse(snapshot.coverage[index - 1].to) > Date.parse(snapshot.coverage[index].from)) {
      context.addIssue({ code: "custom", path: ["coverage", index], message: "Coverage ranges must be ordered and non-overlapping." });
    }
  }
  const ids = new Set<string>();
  snapshot.events.forEach((event, index) => {
    if (ids.has(event.id)) context.addIssue({ code: "custom", path: ["events", index, "id"], message: "Event IDs must be unique." });
    ids.add(event.id);
    if (event.end !== null && Date.parse(event.end) <= Date.parse(event.start)) {
      context.addIssue({ code: "custom", path: ["events", index, "end"], message: "Event end must be later than its start." });
    }
  });
});

export type CalendarSnapshot = z.infer<typeof calendarSnapshotSchema>;
