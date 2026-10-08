import { useEffect, useState } from "react";
import PageHeader from "../components/layout/main/header";
import { PostList } from "../components/custom/post/list";
import type Category from "../models/eshop/Category";
import type Post from "../models/eshop/Post";
import { getPosts } from "../services/postService";

export function HomePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<Category | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      const res = await getPosts({ categoryId: category?.id });
      if (cancelled) return;

      if (!res.success || !res.data) {
        setError(res.message || "Жагсаалт ачааллахад алдаа гарлаа.");
        setPosts([]);
      } else {
        setPosts(res.data.rows ?? []);
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [category?.id]);

  return (
    <>
      <PageHeader
        title={category?.name ?? "Нүүр"}
        showMenu
        selectedCategoryId={category?.id}
        onCategorySelect={setCategory}
      />

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-surface">
        <div className="min-h-0 flex-1 overflow-y-auto px-3 pt-3 pb-4">
          <PostList posts={posts} loading={loading} error={error} />
        </div>
      </div>
    </>
  );
}
