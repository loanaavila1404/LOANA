import { redirect } from 'next/navigation';

export default async function EstudianteRedirectPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  redirect(`/personas/${id}`);
}
