"use client";

import { useMemo, useState } from "react";
import type {
  BadgeItem,
  LinkItem,
  Locale,
  ResumeContentByLocale,
  ResumeSection,
  SectionGroup,
} from "@/data/resume";

const GROUP_OPTIONS: { value: SectionGroup; label: string }[] = [
  { value: "education", label: "학력사항" },
  { value: "experience", label: "경력사항" },
  { value: "certification", label: "자격증" },
  { value: "award", label: "수상경력" },
  { value: "program", label: "사업화지원 실적" },
  { value: "exhibition", label: "사업관련활동" },
  { value: "milestone", label: "주요 마일스톤" },
  { value: "extra", label: "추가 섹션" },
];

type SaveState =
  | { status: "idle"; message: string }
  | { status: "saving"; message: string }
  | { status: "saved"; message: string }
  | { status: "error"; message: string };

type AdminResumeEditorProps = {
  initialContent: ResumeContentByLocale;
  token: string;
  source: string;
  readError?: string;
};

const LOCALES: Locale[] = ["ko", "en"];

export default function AdminResumeEditor({
  initialContent,
  token,
  source,
  readError,
}: AdminResumeEditorProps) {
  const [locale, setLocale] = useState<Locale>("ko");
  const [draft, setDraft] = useState(() => cloneResume(initialContent));
  const [isDirty, setIsDirty] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>({
    status: "idle",
    message: "변경사항 없음",
  });

  const content = draft[locale];
  const jsonPreview = useMemo(() => JSON.stringify(draft, null, 2), [draft]);

  function editDraft(mutator: (nextDraft: ResumeContentByLocale) => void) {
    setDraft((current) => {
      const nextDraft = cloneResume(current);
      mutator(nextDraft);
      return nextDraft;
    });
    setIsDirty(true);
    setSaveState({ status: "idle", message: "저장되지 않은 변경사항 있음" });
  }

  function updateLanguageLabel(value: string) {
    editDraft((nextDraft) => {
      nextDraft[locale].languageLabel = value;
    });
  }

  function updateHero(
    field: "name" | "role" | "summary" | "ctaLabel" | "email" | "phone" | "address",
    value: string,
  ) {
    editDraft((nextDraft) => {
      nextDraft[locale].hero[field] = value;
    });
  }

  function addSection() {
    const id = `section-${Date.now()}`;
    editDraft((nextDraft) => {
      for (const targetLocale of LOCALES) {
        nextDraft[targetLocale].sections.push({
          id,
          title: targetLocale === "ko" ? "새 섹션" : "New Section",
          navLabel: targetLocale === "ko" ? "새 항목" : "New Item",
          showInNav: false,
          bullets: [],
        });
      }
    });
  }

  function updateSection(
    sectionIndex: number,
    field: "title" | "subtitle" | "navLabel" | "showInNav" | "group",
    value: string | boolean,
  ) {
    editDraft((nextDraft) => {
      const section = nextDraft[locale].sections[sectionIndex];
      if (!section) {
        return;
      }

      if (field === "showInNav") {
        section.showInNav = Boolean(value);
        return;
      }

      if (field === "subtitle" && value === "") {
        delete section.subtitle;
        return;
      }

      if (field === "group") {
        const groupValue = String(value) as SectionGroup;
        section.group = groupValue;
        return;
      }

      section[field] = String(value);
    });
  }

  function deleteSection(sectionId: string) {
    const confirmed = window.confirm(
      "이 섹션을 한국어/영어 양쪽에서 삭제할까요?",
    );
    if (!confirmed) {
      return;
    }

    editDraft((nextDraft) => {
      for (const targetLocale of LOCALES) {
        nextDraft[targetLocale].sections = nextDraft[
          targetLocale
        ].sections.filter((section) => section.id !== sectionId);
      }
    });
  }

  function moveSection(sectionId: string, direction: -1 | 1) {
    editDraft((nextDraft) => {
      for (const targetLocale of LOCALES) {
        nextDraft[targetLocale].sections = moveById(
          nextDraft[targetLocale].sections,
          sectionId,
          direction,
        );
      }
    });
  }

  function addBullet(sectionIndex: number) {
    editDraft((nextDraft) => {
      nextDraft[locale].sections[sectionIndex]?.bullets.push("");
    });
  }

  function updateBullet(
    sectionIndex: number,
    bulletIndex: number,
    value: string,
  ) {
    editDraft((nextDraft) => {
      const bullets = nextDraft[locale].sections[sectionIndex]?.bullets;
      if (!bullets) {
        return;
      }
      bullets[bulletIndex] = value;
    });
  }

  function deleteBullet(sectionIndex: number, bulletIndex: number) {
    const confirmed = window.confirm("이 bullet을 삭제할까요?");
    if (!confirmed) {
      return;
    }

    editDraft((nextDraft) => {
      nextDraft[locale].sections[sectionIndex]?.bullets.splice(bulletIndex, 1);
    });
  }

  function moveBullet(
    sectionIndex: number,
    bulletIndex: number,
    direction: -1 | 1,
  ) {
    editDraft((nextDraft) => {
      const section = nextDraft[locale].sections[sectionIndex];
      if (!section) {
        return;
      }
      section.bullets = moveByIndex(section.bullets, bulletIndex, direction);
    });
  }

  function addBadge(sectionIndex: number) {
    editDraft((nextDraft) => {
      const section = nextDraft[locale].sections[sectionIndex];
      if (!section) {
        return;
      }
      section.badges = section.badges ?? [];
      section.badges.push({ label: "", value: "", pending: false });
    });
  }

  function updateBadge(
    sectionIndex: number,
    badgeIndex: number,
    field: keyof BadgeItem,
    value: string | boolean,
  ) {
    editDraft((nextDraft) => {
      const badge = nextDraft[locale].sections[sectionIndex]?.badges?.[badgeIndex];
      if (!badge) {
        return;
      }

      if (field === "pending") {
        badge.pending = Boolean(value);
        return;
      }

      badge[field] = String(value);
    });
  }

  function deleteBadge(sectionIndex: number, badgeIndex: number) {
    const confirmed = window.confirm("이 badge를 삭제할까요?");
    if (!confirmed) {
      return;
    }

    editDraft((nextDraft) => {
      const section = nextDraft[locale].sections[sectionIndex];
      section?.badges?.splice(badgeIndex, 1);
      if (section?.badges?.length === 0) {
        delete section.badges;
      }
    });
  }

  function addLink() {
    editDraft((nextDraft) => {
      nextDraft[locale].links.push({ label: "", href: "" });
    });
  }

  function updateLink(
    linkIndex: number,
    field: keyof LinkItem,
    value: string,
  ) {
    editDraft((nextDraft) => {
      const link = nextDraft[locale].links[linkIndex];
      if (!link) {
        return;
      }
      link[field] = value;
    });
  }

  function deleteLink(linkIndex: number) {
    const confirmed = window.confirm("이 링크를 삭제할까요?");
    if (!confirmed) {
      return;
    }

    editDraft((nextDraft) => {
      nextDraft[locale].links.splice(linkIndex, 1);
    });
  }

  function resetDraft() {
    if (isDirty && !window.confirm("저장하지 않은 변경사항을 버릴까요?")) {
      return;
    }

    setDraft(cloneResume(initialContent));
    setIsDirty(false);
    setSaveState({ status: "idle", message: "초기 데이터로 되돌림" });
  }

  async function saveDraft() {
    setSaveState({ status: "saving", message: "GitHub JSON 저장 중" });

    try {
      const response = await fetch(`/api/resume?token=${encodeURIComponent(token)}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(draft),
      });
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
        updatedAt?: string;
        commitSha?: string | null;
      } | null;

      if (!response.ok) {
        throw new Error(payload?.error ?? "Resume save failed.");
      }

      setIsDirty(false);
      setSaveState({
        status: "saved",
        message: `저장 완료: ${payload?.updatedAt ?? "timestamp unavailable"}`,
      });
    } catch (error) {
      setSaveState({
        status: "error",
        message:
          error instanceof Error ? error.message : "Resume save failed.",
      });
    }
  }

  return (
    <main className="admin-canvas">
      <header className="admin-shell admin-header">
        <div>
          <p className="eyebrow">Resume Admin</p>
          <h1>CV 관리자</h1>
          <p>
            현재 데이터 소스: <strong>{source}</strong>
            {readError ? ` · fallback 사유: ${readError}` : ""}
          </p>
        </div>
        <div className="admin-actions">
          <button type="button" onClick={resetDraft}>
            되돌리기
          </button>
          <button type="button" className="primary-action" onClick={saveDraft}>
            저장
          </button>
        </div>
      </header>

      <section className="admin-shell admin-status" data-status={saveState.status}>
        {saveState.message}
      </section>

      <section className="admin-shell admin-tabs" aria-label="Language tabs">
        {LOCALES.map((targetLocale) => (
          <button
            key={targetLocale}
            type="button"
            className={targetLocale === locale ? "active" : ""}
            onClick={() => setLocale(targetLocale)}
          >
            {targetLocale === "ko" ? "한국어" : "English"}
          </button>
        ))}
      </section>

      <div className="admin-grid">
        <section className="admin-shell admin-panel">
          <div className="admin-panel-heading">
            <h2>기본 정보</h2>
          </div>
          <label>
            언어 표시
            <input
              value={content.languageLabel}
              onChange={(event) => updateLanguageLabel(event.target.value)}
            />
          </label>
          <label>
            이름
            <input
              value={content.hero.name}
              onChange={(event) => updateHero("name", event.target.value)}
            />
          </label>
          <label>
            역할
            <input
              value={content.hero.role}
              onChange={(event) => updateHero("role", event.target.value)}
            />
          </label>
          <label>
            요약
            <textarea
              value={content.hero.summary}
              onChange={(event) => updateHero("summary", event.target.value)}
            />
          </label>
          <label>
            CTA 라벨
            <input
              value={content.hero.ctaLabel}
              onChange={(event) => updateHero("ctaLabel", event.target.value)}
            />
          </label>
          <label>
            이메일
            <input
              type="email"
              value={content.hero.email}
              onChange={(event) => updateHero("email", event.target.value)}
              placeholder="info@example.com"
            />
          </label>
          <label>
            전화번호
            <input
              value={content.hero.phone}
              onChange={(event) => updateHero("phone", event.target.value)}
              placeholder="010-0000-0000"
            />
          </label>
          <label>
            주소
            <input
              value={content.hero.address}
              onChange={(event) => updateHero("address", event.target.value)}
              placeholder="도시/동 까지만 입력해도 OK"
            />
          </label>
        </section>

        <section className="admin-shell admin-panel">
          <div className="admin-panel-heading">
            <h2>Footer links</h2>
            <button type="button" onClick={addLink}>
              링크 추가
            </button>
          </div>
          {content.links.map((link, linkIndex) => (
            <div className="admin-link-row" key={`${link.href}-${linkIndex}`}>
              <input
                aria-label="Link label"
                value={link.label}
                placeholder="Label"
                onChange={(event) =>
                  updateLink(linkIndex, "label", event.target.value)
                }
              />
              <input
                aria-label="Link href"
                value={link.href}
                placeholder="https://"
                onChange={(event) =>
                  updateLink(linkIndex, "href", event.target.value)
                }
              />
              <button type="button" onClick={() => deleteLink(linkIndex)}>
                삭제
              </button>
            </div>
          ))}
        </section>
      </div>

      <section className="admin-shell admin-panel">
        <div className="admin-panel-heading">
          <h2>섹션 관리</h2>
          <button type="button" onClick={addSection}>
            섹션 추가
          </button>
        </div>

        <div className="admin-section-list">
          {content.sections.map((section, sectionIndex) => (
            <SectionEditor
              key={section.id}
              section={section}
              sectionIndex={sectionIndex}
              onMoveSection={moveSection}
              onDeleteSection={deleteSection}
              onUpdateSection={updateSection}
              onAddBullet={addBullet}
              onUpdateBullet={updateBullet}
              onDeleteBullet={deleteBullet}
              onMoveBullet={moveBullet}
              onAddBadge={addBadge}
              onUpdateBadge={updateBadge}
              onDeleteBadge={deleteBadge}
            />
          ))}
        </div>
      </section>

      <section className="admin-shell admin-panel">
        <div className="admin-panel-heading">
          <h2>JSON preview</h2>
        </div>
        <textarea className="json-preview" readOnly value={jsonPreview} />
      </section>
    </main>
  );
}

type SectionEditorProps = {
  section: ResumeSection;
  sectionIndex: number;
  onMoveSection: (sectionId: string, direction: -1 | 1) => void;
  onDeleteSection: (sectionId: string) => void;
  onUpdateSection: (
    sectionIndex: number,
    field: "title" | "subtitle" | "navLabel" | "showInNav" | "group",
    value: string | boolean,
  ) => void;
  onAddBullet: (sectionIndex: number) => void;
  onUpdateBullet: (
    sectionIndex: number,
    bulletIndex: number,
    value: string,
  ) => void;
  onDeleteBullet: (sectionIndex: number, bulletIndex: number) => void;
  onMoveBullet: (
    sectionIndex: number,
    bulletIndex: number,
    direction: -1 | 1,
  ) => void;
  onAddBadge: (sectionIndex: number) => void;
  onUpdateBadge: (
    sectionIndex: number,
    badgeIndex: number,
    field: keyof BadgeItem,
    value: string | boolean,
  ) => void;
  onDeleteBadge: (sectionIndex: number, badgeIndex: number) => void;
};

function SectionEditor({
  section,
  sectionIndex,
  onMoveSection,
  onDeleteSection,
  onUpdateSection,
  onAddBullet,
  onUpdateBullet,
  onDeleteBullet,
  onMoveBullet,
  onAddBadge,
  onUpdateBadge,
  onDeleteBadge,
}: SectionEditorProps) {
  return (
    <article className="admin-section-editor">
      <div className="section-editor-toolbar">
        <strong>{section.id}</strong>
        <div>
          <button type="button" onClick={() => onMoveSection(section.id, -1)}>
            위
          </button>
          <button type="button" onClick={() => onMoveSection(section.id, 1)}>
            아래
          </button>
          <button type="button" onClick={() => onDeleteSection(section.id)}>
            섹션 삭제
          </button>
        </div>
      </div>

      <div className="admin-field-grid">
        <label>
          제목
          <input
            value={section.title}
            onChange={(event) =>
              onUpdateSection(sectionIndex, "title", event.target.value)
            }
          />
        </label>
        <label>
          내비게이션 라벨
          <input
            value={section.navLabel}
            onChange={(event) =>
              onUpdateSection(sectionIndex, "navLabel", event.target.value)
            }
          />
        </label>
        <label>
          부제목
          <input
            value={section.subtitle ?? ""}
            onChange={(event) =>
              onUpdateSection(sectionIndex, "subtitle", event.target.value)
            }
          />
        </label>
        <label>
          카테고리 그룹
          <select
            value={section.group ?? "extra"}
            onChange={(event) =>
              onUpdateSection(sectionIndex, "group", event.target.value)
            }
          >
            {GROUP_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="checkbox-field">
          <input
            type="checkbox"
            checked={section.showInNav}
            onChange={(event) =>
              onUpdateSection(sectionIndex, "showInNav", event.target.checked)
            }
          />
          상단 내비게이션에 표시
        </label>
      </div>

      <div className="admin-subsection-heading">
        <h3>Bullets</h3>
        <button type="button" onClick={() => onAddBullet(sectionIndex)}>
          Bullet 추가
        </button>
      </div>
      <div className="admin-repeat-list">
        {section.bullets.map((bullet, bulletIndex) => (
          <div className="admin-repeat-row" key={`${section.id}-bullet-${bulletIndex}`}>
            <textarea
              aria-label={`Bullet ${bulletIndex + 1}`}
              value={bullet}
              onChange={(event) =>
                onUpdateBullet(sectionIndex, bulletIndex, event.target.value)
              }
            />
            <div className="row-actions">
              <button
                type="button"
                onClick={() => onMoveBullet(sectionIndex, bulletIndex, -1)}
              >
                위
              </button>
              <button
                type="button"
                onClick={() => onMoveBullet(sectionIndex, bulletIndex, 1)}
              >
                아래
              </button>
              <button
                type="button"
                onClick={() => onDeleteBullet(sectionIndex, bulletIndex)}
              >
                삭제
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="admin-subsection-heading">
        <h3>Badges</h3>
        <button type="button" onClick={() => onAddBadge(sectionIndex)}>
          Badge 추가
        </button>
      </div>
      <div className="admin-repeat-list">
        {(section.badges ?? []).map((badge, badgeIndex) => (
          <div className="admin-badge-row" key={`${section.id}-badge-${badgeIndex}`}>
            <input
              aria-label="Badge label"
              value={badge.label}
              placeholder="Label"
              onChange={(event) =>
                onUpdateBadge(sectionIndex, badgeIndex, "label", event.target.value)
              }
            />
            <input
              aria-label="Badge value"
              value={badge.value}
              placeholder="Value"
              onChange={(event) =>
                onUpdateBadge(sectionIndex, badgeIndex, "value", event.target.value)
              }
            />
            <label className="checkbox-field compact">
              <input
                type="checkbox"
                checked={badge.pending ?? false}
                onChange={(event) =>
                  onUpdateBadge(
                    sectionIndex,
                    badgeIndex,
                    "pending",
                    event.target.checked,
                  )
                }
              />
              pending
            </label>
            <button type="button" onClick={() => onDeleteBadge(sectionIndex, badgeIndex)}>
              삭제
            </button>
          </div>
        ))}
      </div>
    </article>
  );
}

function cloneResume(content: ResumeContentByLocale): ResumeContentByLocale {
  return JSON.parse(JSON.stringify(content)) as ResumeContentByLocale;
}

function moveById<T extends { id: string }>(
  items: T[],
  id: string,
  direction: -1 | 1,
) {
  const index = items.findIndex((item) => item.id === id);
  return moveByIndex(items, index, direction);
}

function moveByIndex<T>(items: T[], index: number, direction: -1 | 1) {
  const nextIndex = index + direction;
  if (index < 0 || nextIndex < 0 || nextIndex >= items.length) {
    return items;
  }

  const nextItems = [...items];
  const [item] = nextItems.splice(index, 1);
  nextItems.splice(nextIndex, 0, item);
  return nextItems;
}
