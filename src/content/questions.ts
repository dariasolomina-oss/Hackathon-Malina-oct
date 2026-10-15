import type { Audience } from "@/contracts/catalog";

export const audiences: { id: Audience; label: string }[] = [
  { id: "employee", label: "Employee" },
  { id: "leadership", label: "Leadership" },
];
