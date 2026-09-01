import EditorPage from "../page";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EditorPage initialBlogId={id} />;
}
