import { WorkspaceNav } from '@/components/WorkspaceNav';

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;
  return (
    <>
      <WorkspaceNav workspaceSlug={workspaceSlug} />
      {children}
    </>
  );
}
