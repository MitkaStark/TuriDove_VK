import { SetMetadata } from '@nestjs/common';

export const OWNERSHIP_KEY = 'checkOwnership';

export interface OwnershipMetadata {
  /** The Prisma model name to query (e.g. 'hospedaje', 'actividad') */
  model: string;
  /** The field on the model that holds the owner user ID */
  ownerField: string;
  /** The route param name that contains the resource ID (default: 'id') */
  paramKey?: string;
}

/**
 * Decorator that marks an endpoint for ownership verification.
 * Used together with OwnershipGuard to ensure users can only
 * modify their own resources (unless they are ADMIN).
 */
export const CheckOwnership = (metadata: OwnershipMetadata) =>
  SetMetadata(OWNERSHIP_KEY, metadata);
