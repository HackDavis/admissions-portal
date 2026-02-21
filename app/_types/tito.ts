import { Application } from './application';

export interface RsvpList {
  id: string;
  slug: string;
  title: string;
  release_ids?: number[];
  question_ids?: number[];
  activity_ids?: number[];
}

export interface Release {
  id: string;
  slug: string;
  title: string;
  quantity?: number;
}

export interface ReleaseInvitation {
  id: string;
  slug: string;
  email: string;
  first_name: string;
  last_name: string;
  url?: string;
  unique_url?: string;
  created_at: string;
}

export interface InvitationData {
  firstName: string;
  lastName: string;
  email: string;
  rsvpListSlug: string;
  releaseIds: string;
  discountCode?: string;
}

export interface BulkInvitationParams {
  applicants: Application[];
  rsvpListSlug: string;
  releaseIds: string;
  discountCode?: string;
}

export interface BulkInvitationResult {
  ok: boolean;
  inviteMap: Map<string, string>;
  errors: string[];
  autoFixedCount: number;
  autoFixedNotesMap: Record<string, string>;
}

export interface TitoResponse<T> {
  ok: boolean;
  body: T | null;
  error: string | null;
}

export interface DeleteRsvpInvitationByEmailParams {
  rsvpListSlug: string;
  email: string;
}

export interface DeleteRsvpInvitationByEmailResult {
  ok: boolean;
  deletedInvitationSlug: string | null;
  error: string | null;
}

export interface TitoReleaseInvitation {
  slug: string;
  email: string;
  url?: string;
  unique_url?: string;
  redeemed: boolean;
}
export interface GetRsvpInvitationByEmailParams {
  rsvpListSlug: string;
  email: string;
}

export interface GetRsvpInvitationByEmailResult {
  ok: boolean;
  invitation: TitoReleaseInvitation | null;
  error: string | null;
}
