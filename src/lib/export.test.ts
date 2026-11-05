import { describe, it, expect } from "vitest";
import { csvCell } from "./export";
describe("csvCell", () => {
  it("quotes commas and escapes quotes", () => expect(csvCell('Rent, "flat"')).toBe('"Rent, ""flat"""'));
  it("blanks null", () => expect(csvCell(null)).toBe(""));
});
