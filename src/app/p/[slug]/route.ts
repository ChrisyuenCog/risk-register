import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/server/db";
import { canAccessProject } from "@/server/access";
import { slugify } from "@/lib/slug";

export const dynamic = "force-dynamic";

/**
 * Project deep link: /p/<slug-or-id> switches the browser to that project
 * and lands on its dashboard — for Zoho project links, SharePoint pages,
 * and board bookmarks. Unknown or inaccessible projects redirect to the
 * projects page without revealing whether they exist.
 */
export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const slug = params.slug.toLowerCase();
  const projects = await db.project.findMany();
  const project =
    projects.find((p) => p.id === params.slug) ??
    projects.find((p) => slugify(p.name) === slug);

  if (project && (await canAccessProject(project.id))) {
    cookies().set("projectId", project.id, { path: "/", maxAge: 60 * 60 * 24 * 365 });
    redirect("/");
  }
  redirect("/projects");
}
