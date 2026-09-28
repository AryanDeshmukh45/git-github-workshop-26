export interface Profile {
  name: string;
  github_username: string;
  bio: string;
  interests: string[];
  batch_year: number;
  language?: string;
  link?: string;
  fun_fact?: string;
  /** When the profile landed on the main branch. Added by the loader, not part of the JSON file. */
  joined_at?: string;
}
