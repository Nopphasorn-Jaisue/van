import type { LucideIcon } from 'lucide-react';
import {
  BookOpen,
  BriefcaseBusiness,
  Building2,
  Cog,
  Cpu,
  Cross,
  DraftingCompass,
  Flame,
  FlaskConical,
  GraduationCap,
  HandHelping,
  HeartPulse,
  Landmark,
  Leaf,
  Microscope,
  Pill,
  Scale,
  ShieldPlus,
  Sparkles,
} from 'lucide-react';

export type FacultyIconKey =
  | 'leaf'
  | 'cpu'
  | 'sparkles'
  | 'scale'
  | 'briefcase'
  | 'heart'
  | 'flame'
  | 'cross'
  | 'pill'
  | 'landmark'
  | 'flask'
  | 'microscope'
  | 'cog'
  | 'drafting'
  | 'helping'
  | 'shield'
  | 'book'
  | 'graduation';

const facultyIcons: Record<FacultyIconKey, LucideIcon> = {
  leaf: Leaf,
  cpu: Cpu,
  sparkles: Sparkles,
  scale: Scale,
  briefcase: BriefcaseBusiness,
  heart: HeartPulse,
  flame: Flame,
  cross: Cross,
  pill: Pill,
  landmark: Landmark,
  flask: FlaskConical,
  microscope: Microscope,
  cog: Cog,
  drafting: DraftingCompass,
  helping: HandHelping,
  shield: ShieldPlus,
  book: BookOpen,
  graduation: GraduationCap,
};

type FacultyGlyphProps = {
  iconKey: FacultyIconKey;
  className?: string;
};

export function FacultyGlyph({ iconKey, className }: FacultyGlyphProps) {
  const Icon = facultyIcons[iconKey] ?? Building2;
  return <Icon className={className} strokeWidth={1.8} />;
}