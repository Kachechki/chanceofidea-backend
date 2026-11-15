export interface ISaveUser {
  id?: string;
  githubId?: number;
  login?: string;
  avatarUrl?: string;
  bio?: string;
  email?: string;
  githubVerified?: boolean;
  settingsId?: string;
  passedOnboarding?: string;
}
