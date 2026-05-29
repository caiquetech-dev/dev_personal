type Badge = {
  label: string;
  value: string;
  pending?: boolean;
};

type SectionProps = {
  id: string;
  title: string;
  subtitle?: string;
  bullets: string[];
  badges?: Badge[];
};

export default function Section({
  id,
  title,
  subtitle,
  bullets,
  badges,
}: SectionProps) {
  return (
    <section id={id} className="section-card">
      <header className="section-header">
        <h2>{title}</h2>
        {subtitle ? <p>{subtitle}</p> : null}
      </header>
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
      <ul>
        {bullets.map((bullet) => (
          <li key={bullet}>{bullet}</li>
        ))}
      </ul>
    </section>
  );
}
