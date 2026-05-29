import AdminResumeEditor from "@/components/AdminResumeEditor";
import { isAdminTokenValid, readResumeContent } from "@/lib/resume-store";

export const dynamic = "force-dynamic";

type AdminPageProps = {
  searchParams: Promise<{
    token?: string | string[];
  }>;
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const params = await searchParams;
  const token = Array.isArray(params.token) ? params.token[0] : params.token ?? "";
  const canEdit = isAdminTokenValid(token);

  if (!canEdit) {
    return (
      <main className="admin-canvas">
        <section className="admin-shell admin-access-denied">
          <p className="eyebrow">Resume Admin</p>
          <h1>접근 권한이 없습니다</h1>
          <p>
            관리자 페이지는 <code>/admin?token=ADMIN_TOKEN값</code> 형식으로
            접근해야 합니다.
          </p>
          <p>
            Vercel 환경변수 <code>ADMIN_TOKEN</code>이 설정되어 있어야 합니다.
          </p>
        </section>
      </main>
    );
  }

  const resume = await readResumeContent();

  return (
    <AdminResumeEditor
      initialContent={resume.content}
      token={token}
      source={resume.source}
      readError={resume.error}
    />
  );
}
