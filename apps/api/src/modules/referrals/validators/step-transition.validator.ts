import { BadRequestException, Injectable } from "@nestjs/common";
import {
  ADVANCE_GUARDS,
  VALID_TRANSITIONS,
  TERMINAL_STATUSES,
  ReferralStatus,
} from "@referrals/shared";
import { Referral } from "../entities/referral.entity";

@Injectable()
export class StepTransitionValidator {
  /**
   * Validates that moving `referral` to `targetStatus` is allowed.
   * Throws `BadRequestException` with a descriptive message on failure.
   */
  validate(referral: Referral, targetStatus: ReferralStatus): void {
    this.assertNotTerminal(referral.status);
    this.assertValidTarget(referral.status, targetStatus);
    this.assertFieldGuards(referral, referral.status);
  }

  // helpers

  private assertNotTerminal(current: ReferralStatus): void {
    if (TERMINAL_STATUSES.has(current)) {
      throw new BadRequestException(
        `Referral is in a terminal state (${current}) and cannot be advanced.`,
      );
    }
  }

  private assertValidTarget(
    current: ReferralStatus,
    target: ReferralStatus,
  ): void {
    const allowed = VALID_TRANSITIONS[current] ?? [];
    if (!allowed.includes(target)) {
      throw new BadRequestException(
        `Invalid status transition: ${current} → ${target}. ` +
          `Allowed targets: [${allowed.join(", ")}].`,
      );
    }
  }

  /**
   * Checks that the referral has all required fields populated
   * before it can leave `currentStatus`.
   */
  private assertFieldGuards(
    referral: Referral,
    currentStatus: ReferralStatus,
  ): void {
    const requiredFields = ADVANCE_GUARDS[currentStatus] ?? [];
    const missing: string[] = [];

    for (const field of requiredFields) {
      const value = (referral as unknown as Record<string, unknown>)[field];
      if (value === null || value === undefined || value === "") {
        missing.push(field);
      }
    }

    if (missing.length > 0) {
      throw new BadRequestException(
        `Cannot advance from ${currentStatus}. Missing required fields: [${missing.join(", ")}].`,
      );
    }
  }
}
