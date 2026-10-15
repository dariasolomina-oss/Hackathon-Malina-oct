import type { CalendarProvider } from "./types";

// Backend track: replace with a verified cached calendar. No fabricated events.
export const calendarProvider: CalendarProvider = {
  async getEvents() {
    return { status: "unavailable", events: [] };
  },
};
