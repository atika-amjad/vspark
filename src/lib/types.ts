export type RegistrationStatus = "pending" | "approved" | "rejected";

export interface Competition {
  id: string;
  title: string;
  description: string;
  category: string;
  fee: number;
  prize: string;
  teamSize: string;
  venue: string;
  /** Maximum people per team, 1 = individual. */
  maxTeamSize: number;
}

export interface TeamMember {
  id: string;
  registrationId: string;
  userId: string;
  fullName: string;
  email: string;
  createdAt: string;
}

/** A registered user a participant can pick as a teammate. */
export interface DirectoryUser {
  id: string;
  fullName: string;
  email: string;
}

export interface EventItem {
  id: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  time: string;
  venue: string;
}

export interface BlogPost {
  id: string;
  title: string;
  category: "Achievement" | "Blog Post";
  excerpt: string;
  content: string;
  author: string;
  date: string; // YYYY-MM-DD
}

export interface ResultItem {
  id: string;
  competition: string;
  position: string;
  winner: string;
  university: string;
  year: string;
  /** Registration number of the winner, used to show a participant their own placement. */
  regNo: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  fullName: string;
  role: "participant";
  approved: boolean;
  createdAt: string;
}

export interface Registration {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  email: string;
  university: string;
  department: string;
  regNo: string;
  competitionIds: string[];
  competitionTitles: string[];
  totalAmount: number;
  transactionId: string;
  proofPath: string;
  proofName: string;
  status: RegistrationStatus;
  adminNote: string;
  createdAt: string;
  updatedAt: string;
}

export interface University {
  name: string;
  country: string;
  alphaTwoCode: string;
  stateProvince: string | null;
  webPages: string[];
  domains: string[];
}
