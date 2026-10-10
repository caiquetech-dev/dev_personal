import type { BadgeItem } from "@/data/resume";

type Badge = {
  label: string;
  value: string;
  pending?: boolean;
};

type SectionProps = {
  id?: string;
  title?: string;
  subtitle?: string;
  bullets?: string[];
  badges?: Badge[];
  variant?: "default" | "entry";
  hideTitle?: boolean;
};

export default function Section({
  id,
  title,
  subtitle,
  bullets = [],
  badges = [],
  variant = "default",
  hideTitle = false,
}: SectionProps) {
  return (
    <section
      id={id}
      className={`section-card section-card--${variant}`}
    >
      {title && !hideTitle ? (
        <header className="section-header">
          <h2>{title}</h2>
          {subtitle ? <p>{subtitle}</p> : null}
        </header>
      ) : null}
      {subtitle && hideTitle ? <p className="section-subtitle">{subtitle}</p> : null}
      {badges && badges.length > 0 ? (
        <div className="badge-list">
          {badges.map((badge) => (
            <span key={`${badge.label}-${badge.value}`} className="badge-item">
              <strong>{badge.label}</strong> {badge.value}
              {badge.pending ? <em> (TBD)</em> : null}
            </span>
          ))}
        </div>
      ) : null}
      {bullets.length > 0 ? (
        <ul>
          {bullets.map((bullet) => (
            <li key={bullet}>{bullet}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

export type { Badge, BadgeItem };
