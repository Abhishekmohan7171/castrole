/**
 * Extended interfaces for the edit profile feature
 */

export interface LanguageProficiency {
  name: string;
  proficiency: number; // 1-5 stars
}

export interface SkillItem {
  name: string;
}

export interface SocialLink {
  platform: string;
  url: string;
}

export type EditSection =
  | 'basic-info'
  | 'education'
  | 'voice-intro'
  | 'languages-skills'
  | 'socials';

export interface NavigationItem {
  id: EditSection;
  label: string;
  icon: string;
  description: string;
  labelProducer?: string;
  descriptionProducer?: string;
}
