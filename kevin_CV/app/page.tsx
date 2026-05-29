import ResumeView from "@/components/ResumeView";
import { readResumeContent } from "@/lib/resume-store";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { content } = await readResumeContent();

  return <ResumeView initialContent={content} />;
}
