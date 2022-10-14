import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Form,
  useActionData,
  useLoaderData,
  useTransition,
} from "@remix-run/react";
import { deletePost, getPost, updatePost } from "~/models/post.server";
import type { Post } from "~/models/post.server";
import invariant from "tiny-invariant";
import { useEffect, useState } from "react";

// TODO 是否可以在load时刷新input, 当前是使用useState实现
type LoaderData = { post: Post };

export const loader: LoaderFunction = async ({ params }) => {
  invariant(params.slug, `params.slug is required`);

  const post = await getPost(params.slug);
  invariant(post, `Post not found: ${params.slug}`);

  return json<LoaderData>({ post });
};

const inputClassName = `w-full rounded border border-gray-500 px-2 py-1 text-lg`;

type ActionData =
  | {
      title: null | string;
      slug: null | string;
      markdown: null | string;
    }
  | undefined;

export const action: ActionFunction = async ({ request, params }) => {
  invariant(params.slug, `params.slug is required`);
  const slug = params.slug;

  // TODO: remove me
  await new Promise((res) => setTimeout(res, 1000));

  const formData = await request.formData();

  if (formData.get("_method") === "delete") {
    await deletePost({ slug });
    return redirect("/posts/admin");
  }

  const title = formData.get("title");
  const markdown = formData.get("markdown");

  const errors: ActionData = {
    title: title ? null : "Title is required",
    slug: slug ? null : "Slug is required",
    markdown: markdown ? null : "Markdown is required",
  };

  const hasErrors = Object.values(errors).some((errorMessage) => errorMessage);

  if (hasErrors) {
    return json<ActionData>(errors);
  }

  invariant(typeof title === "string", "title must be a string");
  invariant(typeof slug === "string", "slug must be a string");
  invariant(typeof markdown === "string", "markdown must be a string");

  await updatePost({ title, slug, markdown });

  return redirect("/posts/admin");
};

export default function PostSlug() {
  const { post } = useLoaderData<LoaderData>();
  const errors = useActionData();
  const transition = useTransition();
  const isUpdating = Boolean(transition.submission);
  const [title, setTitle] = useState(post.title);
  const [markdown, setMarkdown] = useState(post.markdown);

  useEffect(() => {
    setTitle(post.title);
    setMarkdown(post.markdown);
  }, [post]);

  return (
    <main className="mx-auto max-w-4xl">
      <Form method="post">
        <p>
          <label>
            Post Title:{" "}
            <input
              type="text"
              name="title"
              className={inputClassName}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
          {errors?.title ? (
            <em className="text-red-600">{errors.title}</em>
          ) : null}
        </p>
        <p>
          <label htmlFor="markdown">
            Markdown:{" "}
            {errors?.markdown ? (
              <em className="text-red-600">{errors.markdown}</em>
            ) : null}
          </label>
          <br />
          <textarea
            id="markdown"
            rows={20}
            name="markdown"
            className={`${inputClassName} font-mono`}
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
          />
        </p>
        <p className="text-right">
          <button
            type="submit"
            className="rounded bg-blue-500 py-2 px-4 text-white hover:bg-blue-600 focus:bg-blue-400 disabled:bg-blue-300"
            disabled={isUpdating}
          >
            {isUpdating ? "Updating..." : "Update Post"}
          </button>
        </p>
      </Form>
      {/* TODO 优化删除按钮的位置 */}
      <Form method="post">
        <input type="hidden" name="_method" value="delete" />
        <button
          type="submit"
          className="rounded bg-blue-500 py-2 px-4 text-white hover:bg-blue-600 focus:bg-blue-400 disabled:bg-blue-300"
          disabled={isUpdating}
        >
          {isUpdating ? "Deleting..." : "Delete Post"}
        </button>
      </Form>
    </main>
  );
}
