import { Pool } from "pg";
import { resumeContent } from "@/data/resume";
import type {
  BadgeItem,
  Hero,
  LinkItem,
  Locale,
  ResumeContentByLocale,
  ResumeSection,
} from "@/data/resume";

const LOCALES: Locale[] = ["ko", "en"];
const RESUME_ROW_ID = "active";

declare global {
  var resumeDbPool: Pool | undefined;
}

type GithubContentResponse = {
  content?: string;
  encoding?: string;
  sha?: string;
  message?: string;
};

type GithubCommitResponse = {
  content?: {
    sha?: string;
  };
  commit?: {
    sha?: string;
  };
};

export type ResumeReadResult = {
  content: ResumeContentByLocale;
  source: "database" | "github" | "fallback";
  error?: string;
};

export function getDatabaseUrl() {
  return (
    process.env.DATABASE_URL ??
    process.env.POSTGRES_URL ??
    process.env.POSTGRES_PRISMA_URL ??
    ""
  );
}

export function getGithubConfig() {
  return {
    token: process.env.GITHUB_TOKEN ?? "",
    repo: process.env.GITHUB_REPO ?? "",
    branch: process.env.GITHUB_BRANCH ?? "main",
    path: process.env.GITHUB_RESUME_PATH ?? "kevin_CV/data/resume-content.json",
  };
}

export function isAdminTokenValid(token: string | null | undefined) {
  const configuredToken = process.env.ADMIN_TOKEN;
  return Boolean(configuredToken) && token === configuredToken;
}

export function validateResumeContent(
  candidate: unknown,
): candidate is ResumeContentByLocale {
  return validateResumeContentErrors(candidate).length === 0;
}

export function validateResumeContentErrors(candidate: unknown) {
  const errors: string[] = [];

  if (!isRecord(candidate)) {
    return ["Resume payload must be an object."];
  }

  for (const locale of LOCALES) {
    const content = candidate[locale];
    if (!isRecord(content)) {
      errors.push(`${locale} content must be an object.`);
      continue;
    }

    if (!isString(content.languageLabel)) {
      errors.push(`${locale}.languageLabel must be a string.`);
    }

    validateHero(content.hero, `${locale}.hero`, errors);
    validateSections(content.sections, `${locale}.sections`, errors);
    validateLinks(content.links, `${locale}.links`, errors);
  }

  if (isRecord(candidate.ko) && isRecord(candidate.en)) {
    const koSectionIds = sectionIds(candidate.ko.sections);
    const enSectionIds = sectionIds(candidate.en.sections);
    if (
      koSectionIds.length > 0 &&
      enSectionIds.length > 0 &&
      koSectionIds.join("|") !== enSectionIds.join("|")
    ) {
      errors.push("ko.sections and en.sections must use the same ids in order.");
    }
  }

  return errors;
}

export async function readResumeContent(): Promise<ResumeReadResult> {
  const errors: string[] = [];

  if (getDatabaseUrl()) {
    try {
      const databaseContent = await readDatabaseResumeContent();
      if (databaseContent && validateResumeContent(databaseContent)) {
        return {
          content: databaseContent,
          source: "database",
        };
      }

      if (databaseContent) {
        errors.push("Database resume JSON failed validation.");
      }
    } catch (error) {
      errors.push(
        error instanceof Error ? error.message : "Unknown database read error.",
      );
    }
  } else {
    errors.push("DATABASE_URL is not configured.");
  }

  try {
    const githubContent = await readGithubResumeContent();
    if (!validateResumeContent(githubContent)) {
      errors.push("GitHub resume JSON failed validation.");
    } else {
      return {
        content: githubContent,
        source: "github",
      };
    }
  } catch (error) {
    errors.push(
      error instanceof Error ? error.message : "Unknown GitHub read error.",
    );
  }

  return {
    content: resumeContent,
    source: "fallback",
    error: errors.join(" | "),
  };
}

export async function writeResumeContent(content: ResumeContentByLocale) {
  const validationErrors = validateResumeContentErrors(content);
  if (validationErrors.length > 0) {
    return {
      ok: false as const,
      status: 400,
      errors: validationErrors,
    };
  }

  const databaseConfigured = Boolean(getDatabaseUrl());
  const githubConfigured = hasGithubConfig();

  if (!databaseConfigured && !githubConfigured) {
    throw new Error(
      "DATABASE_URL or GitHub env vars must be configured before saving.",
    );
  }

  const database = databaseConfigured
    ? await writeDatabaseResumeContent(content)
    : {
        enabled: false,
        ok: false,
        error: "DATABASE_URL is not configured.",
        updatedAt: null,
      };

  const github = githubConfigured
    ? await writeGithubResumeContent(content)
    : {
        enabled: false,
        ok: false,
        error: "GitHub env vars are not fully configured.",
        contentSha: null,
        commitSha: null,
      };

  return {
    ok: true as const,
    content,
    database,
    github,
    updatedAt: new Date().toISOString(),
  };
}

function validateHero(hero: unknown, path: string, errors: string[]) {
  if (!isRecord(hero)) {
    errors.push(`${path} must be an object.`);
    return;
  }

  for (const key of ["name", "role", "summary", "ctaLabel"] satisfies Array<
    keyof Hero
  >) {
    if (!isString(hero[key])) {
      errors.push(`${path}.${key} must be a string.`);
    }
  }
}

function validateSections(
  sections: unknown,
  path: string,
  errors: string[],
) {
  if (!Array.isArray(sections)) {
    errors.push(`${path} must be an array.`);
    return;
  }

  const ids = new Set<string>();
  sections.forEach((section, index) => {
    const sectionPath = `${path}[${index}]`;
    if (!isRecord(section)) {
      errors.push(`${sectionPath} must be an object.`);
      return;
    }

    for (const key of ["id", "title", "navLabel"] satisfies Array<
      keyof ResumeSection
    >) {
      if (!isString(section[key])) {
        errors.push(`${sectionPath}.${key} must be a string.`);
      }
    }

    if (isString(section.id)) {
      if (ids.has(section.id)) {
        errors.push(`${sectionPath}.id must be unique within the locale.`);
      }
      ids.add(section.id);
    }

    if (
      section.subtitle !== undefined &&
      !isString(section.subtitle)
    ) {
      errors.push(`${sectionPath}.subtitle must be a string when provided.`);
    }

    if (typeof section.showInNav !== "boolean") {
      errors.push(`${sectionPath}.showInNav must be a boolean.`);
    }

    if (!Array.isArray(section.bullets)) {
      errors.push(`${sectionPath}.bullets must be an array.`);
    } else {
      section.bullets.forEach((bullet, bulletIndex) => {
        if (!isString(bullet)) {
          errors.push(`${sectionPath}.bullets[${bulletIndex}] must be a string.`);
        }
      });
    }

    if (section.badges !== undefined) {
      validateBadges(section.badges, `${sectionPath}.badges`, errors);
    }
  });
}

function validateBadges(badges: unknown, path: string, errors: string[]) {
  if (!Array.isArray(badges)) {
    errors.push(`${path} must be an array when provided.`);
    return;
  }

  badges.forEach((badge, index) => {
    const badgePath = `${path}[${index}]`;
    if (!isRecord(badge)) {
      errors.push(`${badgePath} must be an object.`);
      return;
    }

    for (const key of ["label", "value"] satisfies Array<keyof BadgeItem>) {
      if (!isString(badge[key])) {
        errors.push(`${badgePath}.${key} must be a string.`);
      }
    }

    if (badge.pending !== undefined && typeof badge.pending !== "boolean") {
      errors.push(`${badgePath}.pending must be a boolean when provided.`);
    }
  });
}

function validateLinks(links: unknown, path: string, errors: string[]) {
  if (!Array.isArray(links)) {
    errors.push(`${path} must be an array.`);
    return;
  }

  links.forEach((link, index) => {
    const linkPath = `${path}[${index}]`;
    if (!isRecord(link)) {
      errors.push(`${linkPath} must be an object.`);
      return;
    }

    for (const key of ["label", "href"] satisfies Array<keyof LinkItem>) {
      if (!isString(link[key])) {
        errors.push(`${linkPath}.${key} must be a string.`);
      }
    }
  });
}

async function readGithubResumeContent() {
  const currentFile = await readGithubFileMetadata();
  if (!currentFile.content) {
    throw new Error("GitHub resume file did not include content.");
  }

  return JSON.parse(currentFile.content) as unknown;
}

async function readDatabaseResumeContent() {
  const pool = getDatabasePool();
  await ensureResumeTable(pool);

  const result = await pool.query<{ content: unknown }>(
    "SELECT content FROM resume_content WHERE id = $1",
    [RESUME_ROW_ID],
  );

  return result.rows[0]?.content ?? null;
}

async function writeDatabaseResumeContent(content: ResumeContentByLocale) {
  const pool = getDatabasePool();
  await ensureResumeTable(pool);

  const result = await pool.query<{ updated_at: Date }>(
    `INSERT INTO resume_content (id, content, updated_at)
     VALUES ($1, $2::jsonb, now())
     ON CONFLICT (id)
     DO UPDATE SET content = EXCLUDED.content, updated_at = now()
     RETURNING updated_at`,
    [RESUME_ROW_ID, JSON.stringify(content)],
  );

  return {
    enabled: true,
    ok: true,
    updatedAt: result.rows[0]?.updated_at?.toISOString() ?? null,
  };
}

async function ensureResumeTable(pool: Pool) {
  await pool.query(
    `CREATE TABLE IF NOT EXISTS resume_content (
      id text PRIMARY KEY,
      content jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    )`,
  );
}

function getDatabasePool() {
  const connectionString = getDatabaseUrl();
  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured.");
  }

  if (!globalThis.resumeDbPool) {
    globalThis.resumeDbPool = new Pool({
      connectionString,
      ssl:
        process.env.NODE_ENV === "production"
          ? { rejectUnauthorized: false }
          : undefined,
    });
  }

  return globalThis.resumeDbPool;
}

async function writeGithubResumeContent(content: ResumeContentByLocale) {
  const { token, repo, branch, path } = getGithubConfig();
  assertGithubConfig({ token, repo, path });

  const currentFile = await readGithubFileMetadata();
  const encodedContent = Buffer.from(
    `${JSON.stringify(content, null, 2)}\n`,
    "utf8",
  ).toString("base64");

  const response = await fetch(githubContentsUrl(repo, path), {
    method: "PUT",
    headers: githubHeaders(token),
    body: JSON.stringify({
      message: `Update resume content ${new Date().toISOString()}`,
      content: encodedContent,
      sha: currentFile.sha,
      branch,
    }),
  });

  if (!response.ok) {
    const responseBody = (await response.json().catch(() => null)) as
      | GithubContentResponse
      | null;
    throw new Error(
      responseBody?.message ??
        `GitHub write failed with status ${response.status}.`,
    );
  }

  const result = (await response.json()) as GithubCommitResponse;

  return {
    enabled: true,
    ok: true,
    contentSha: result.content?.sha ?? null,
    commitSha: result.commit?.sha ?? null,
  };
}

async function readGithubFileMetadata() {
  const { token, repo, branch, path } = getGithubConfig();
  assertGithubConfig({ token, repo, path });

  const response = await fetch(`${githubContentsUrl(repo, path)}?ref=${branch}`, {
    cache: "no-store",
    headers: githubHeaders(token),
  });

  if (!response.ok) {
    const responseBody = (await response.json().catch(() => null)) as
      | GithubContentResponse
      | null;
    throw new Error(
      responseBody?.message ?? `GitHub read failed with status ${response.status}.`,
    );
  }

  const result = (await response.json()) as GithubContentResponse;
  if (result.encoding !== "base64" || !result.content) {
    throw new Error("GitHub resume file is not a base64 file response.");
  }

  return {
    sha: result.sha,
    content: Buffer.from(result.content.replace(/\n/g, ""), "base64").toString(
      "utf8",
    ),
  };
}

function githubContentsUrl(repo: string, path: string) {
  const encodedPath = path.split("/").map(encodeURIComponent).join("/");
  return `https://api.github.com/repos/${repo}/contents/${encodedPath}`;
}

function githubHeaders(token: string) {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

function assertGithubConfig({
  token,
  repo,
  path,
}: {
  token: string;
  repo: string;
  path: string;
}) {
  if (!token || !repo || !path) {
    throw new Error(
      "GITHUB_TOKEN, GITHUB_REPO, and GITHUB_RESUME_PATH must be configured.",
    );
  }
}

function hasGithubConfig() {
  const { token, repo, path } = getGithubConfig();
  return Boolean(token && repo && path);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function sectionIds(sections: unknown) {
  if (!Array.isArray(sections)) {
    return [];
  }

  return sections
    .map((section) => (isRecord(section) ? section.id : null))
    .filter((id): id is string => typeof id === "string");
}
