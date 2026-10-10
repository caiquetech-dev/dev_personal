import resumeContentJson from "./resume-content.json";

export type Locale = "ko" | "en";

export type LinkItem = {
  label: string;
  href: string;
};

export type BadgeItem = {
  label: string;
  value: string;
  pending?: boolean;
};

export type SectionGroup =
  | "education"
  | "experience"
  | "certification"
  | "award"
  | "program"
  | "exhibition"
  | "milestone"
  | "extra";

export type ResumeSection = {
  id: string;
  title: string;
  subtitle?: string;
  navLabel: string;
  showInNav: boolean;
  group?: SectionGroup;
  bullets: string[];
  badges?: BadgeItem[];
};

export type Hero = {
  name: string;
  role: string;
  summary: string;
  ctaLabel: string;
  email: string;
  phone: string;
  address: string;
};

export type ContactInfo = {
  email: string;
  phone: string;
  address: string;
};

export type ResumeContent = {
  languageLabel: string;
  hero: Hero;
  sections: ResumeSection[];
  links: LinkItem[];
};

export type ResumeContentByLocale = Record<Locale, ResumeContent>;

export const resumeContent = resumeContentJson as ResumeContentByLocale;
