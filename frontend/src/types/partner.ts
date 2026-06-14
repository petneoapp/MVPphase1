import { PartnerAppointment } from "@/utils/commonTypes";

/**
 * Shared types for the Partner section.
 * Kept separate from layout.tsx to avoid Next.js type-checking issues
 * with non-default exports from layout files.
 */

export enum PartnerMenuItemType {
  MANAGE_TIME_SLOTS = "manageTimeSlots",
  WORK_STATUS = "workStatus",
  MY_BIO = "myBio",
  PRIVACY = "privacy",
  HELP = "help",
  ABOUT = "about",
  PET_ARCHIVE = "petArchive",
}

export type PartnerDetails = {
  vet_name?: string;
  clinic_location?: string;
  date?: string;
  profile_picture_url?: string;
  emergency?: boolean;
  total_appointments?: number;
  completed?: number;
  upcoming?: PartnerAppointment[];
};
