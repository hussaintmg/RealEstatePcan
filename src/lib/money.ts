/**
 * Centralized financial calculation and formatting utilities.
 * Ensures arithmetic avoids JavaScript IEEE-754 floating-point inaccuracies
 * by performing calculations in integer minor units (cents).
 */

export function toMinorUnits(amount: number): number {
  return Math.round((amount || 0) * 100);
}

export function fromMinorUnits(cents: number): number {
  return (cents || 0) / 100;
}

export function addMoney(a: number, b: number): number {
  return fromMinorUnits(toMinorUnits(a) + toMinorUnits(b));
}

export function subtractMoney(a: number, b: number): number {
  return fromMinorUnits(toMinorUnits(a) - toMinorUnits(b));
}

export function multiplyMoney(amount: number, multiplier: number): number {
  return fromMinorUnits(Math.round(toMinorUnits(amount) * multiplier));
}

export function formatMoney(amount: number, currency = 'USD', locale = 'en-US'): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency || 'USD',
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    }).format(amount || 0);
  } catch {
    return `${currency} ${(amount || 0).toLocaleString()}`;
  }
}

export interface MilestoneInput {
  title: string;
  percentage?: number;
  amount?: number;
  dueDate?: Date | string;
  sequence?: number;
}

export interface ValidatedMilestone {
  title: string;
  percentage: number;
  amount: number;
  dueDate?: Date;
  status: 'pending' | 'invoiced' | 'paid';
  sequence: number;
}

/**
 * Validates that milestones properly sum up to 100% or to the agreed total price.
 */
export function validateAndCalculateMilestones(
  agreedPrice: number,
  milestones: MilestoneInput[],
  isPercentageBased = true
): { valid: boolean; milestones: ValidatedMilestone[]; error?: string } {
  if (!milestones || milestones.length === 0) {
    return {
      valid: false,
      milestones: [],
      error: 'At least one milestone is required in the payment plan.',
    };
  }

  const validated: ValidatedMilestone[] = [];
  let totalPercent = 0;
  let totalAmount = 0;

  for (let i = 0; i < milestones.length; i++) {
    const m = milestones[i];
    const seq = m.sequence || i + 1;
    let pct = m.percentage || 0;
    let amt = m.amount || 0;

    if (isPercentageBased) {
      if (pct <= 0 || pct > 100) {
        return { valid: false, milestones: [], error: `Milestone "${m.title}" has an invalid percentage (${pct}%).` };
      }
      totalPercent += pct;
      amt = multiplyMoney(agreedPrice, pct / 100);
    } else {
      if (amt <= 0) {
        return { valid: false, milestones: [], error: `Milestone "${m.title}" has an invalid amount (${amt}).` };
      }
      totalAmount = addMoney(totalAmount, amt);
      pct = agreedPrice > 0 ? Math.round((amt / agreedPrice) * 100) : 0;
    }

    validated.push({
      title: m.title.trim(),
      percentage: pct,
      amount: amt,
      dueDate: m.dueDate ? new Date(m.dueDate) : undefined,
      status: 'pending',
      sequence: seq,
    });
  }

  if (isPercentageBased) {
    // Check total percent equals 100% with tolerance for tiny roundoff
    if (Math.abs(totalPercent - 100) > 0.01) {
      return {
        valid: false,
        milestones: [],
        error: `Milestone percentages must equal 100%. Current sum: ${totalPercent}%.`,
      };
    }
  } else {
    // Check total amount equals agreed price
    if (toMinorUnits(totalAmount) !== toMinorUnits(agreedPrice)) {
      return {
        valid: false,
        milestones: [],
        error: `Milestone amounts must equal agreed price (${agreedPrice}). Current sum: ${totalAmount}.`,
      };
    }
  }

  return { valid: true, milestones: validated };
}
