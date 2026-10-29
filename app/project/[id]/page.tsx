import { Metadata } from "next";
import WorkspaceClient from "./_components/WorkspaceClient";

export const metadata: Metadata = {
  title: "Project — Tryvio",
};

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <WorkspaceClient projectId={id} />;
}
