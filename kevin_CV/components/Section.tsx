import { Fragment } from "react";
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

/** Renders a bullet string, turning **lead** segments into bold text. */
function renderBullet(bullet: string) {
  const parts = bullet.split(/\*\*([^*]+)\*\*/g);
  return parts.map((part, index) =>
    index % 2 === 1 ? (
      <strong key={index}>{part}</strong>
    ) : (
      <Fragment key={index}>{part}</Fragment>
    ),
  );
}

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
    <section id={id} className={`section-card section-card--${variant}`}>
      {title && !hideTitle ? (
        <header className="section-header">
          <h2>{title}</h2>
          {subtitle ? <p>{subtitle}</p> : null}
        </header>
      ) : null}
      {subtitle && hideTitle ? (
        <p className="section-subtitle">{subtitle}</p>
      ) : null}
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
            <li key={bullet}>{renderBullet(bullet)}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

export type { Badge, BadgeItem };
