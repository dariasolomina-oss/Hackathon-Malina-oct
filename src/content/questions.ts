import { PERIODS, QUESTIONS, type Audience } from "@/contracts/catalog";

// Compatibility exports for the current interface. The shared contract is authoritative.
export const questions = QUESTIONS;
export const periods = PERIODS;

export const audiences: { id: Audience; label: string }[] = [
  { id: "employee", label: "Employee" },
  { id: "leadership", label: "Leadership" },
];
