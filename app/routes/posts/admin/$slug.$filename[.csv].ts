import type { LoaderFunction } from "@remix-run/server-runtime";
import invariant from "tiny-invariant";
import { getPost } from "~/models/post.server";

export const generateCsv = (data: any[]) => {
  const header = Object.keys(data[0]).join(",");
  const bodys = data.map((item) => Object.values(item).join(","));
  return [header, ...bodys].join("\n");
};

export const loader: LoaderFunction = async ({ params }) => {
  invariant(params.slug, `params.slug is required`);

  const post = await getPost(params.slug);
  invariant(post, `Post not found: ${params.slug}`);
  console.log(params.filename);
  const csv = generateCsv([post]);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
    },
  });
};
