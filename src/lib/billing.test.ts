import { describe, expect, it } from "vitest";
import { canAddItem, convert, dueState, formatMoney, monthlyEquivalent, needsCardFunding, nextDueAfterPayment } from "./billing";

const today = new Date(2026, 10, 3); // 3 Nov 2026

describe("billing rules", () => {
  it("formats naira with ₦ and thousands separators", () => {
    expect(formatMoney(15000)).toBe("₦15,000");
  });
  it("free plan allows up to 8 tracked items", () => {
    expect(canAddItem("free", 7)).toBe(true);
    expect(canAddItem("free", 8)).toBe(false);
    expect(canAddItem("premium", 50)).toBe(true);
  });
  it("converts USD to naira with the user's rate", () => {
    expect(convert(10, "USD", "NGN", { USD: 1600, NGN: 1 })).toBe(16000);
  });
  it("yearly charges count as a twelfth per month", () => {
    expect(monthlyEquivalent(12000, "yearly")).toBe(1000);
  });
  it("flags USD cards 3 days before renewal, not 4", () => {
    expect(needsCardFunding({ is_usd_billed: true, status: "active", next_due_date: "2026-11-06" }, today)).toBe(true);
    expect(needsCardFunding({ is_usd_billed: true, status: "active", next_due_date: "2026-11-07" }, today)).toBe(false);
  });
  it("due states: overdue, due within 7 days, upcoming", () => {
    expect(dueState("2026-11-02", today)).toBe("overdue");
    expect(dueState("2026-11-10", today)).toBe("due_soon");
    expect(dueState("2026-11-11", today)).toBe("upcoming");
  });
  it("mark as paid rolls a monthly bill forward one month", () => {
    expect(nextDueAfterPayment({ billing_cycle: "monthly", next_due_date: "2026-11-05", is_variable: false, topup_every_days: null }, today)).toBe("2026-12-05");
  });
  it("prepaid top-ups roll forward X days from payment", () => {
    expect(nextDueAfterPayment({ billing_cycle: "monthly", next_due_date: null, is_variable: true, topup_every_days: 14 }, today)).toBe("2026-11-17");
  });
});
