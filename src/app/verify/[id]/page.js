import { redirect } from "next/navigation";

export default function VerifyIdPage({ params }) {
  const { id } = params;
  redirect(`/verify?q=${id}`);
}
