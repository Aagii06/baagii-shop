import type Post from "../../../../models/eshop/Post";
import PostCard from "./PostCard";

type PostListProps = {
  posts: Post[];
  loading?: boolean;
  error?: string | null;
};

export default function PostList({ posts, loading, error }: PostListProps) {
  if (loading) {
    return (
      <p className="py-8 text-center text-sm text-gray-400">Ачаалж байна…</p>
    );
  }

  if (error) {
    return <p className="py-8 text-center text-sm text-danger">{error}</p>;
  }

  if (posts.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-gray-400">Зарлал олдсонгүй</p>
    );
  }

  return (
    <ul className="grid grid-cols-2 gap-2.5">
      {posts.map((post) => (
        <li key={post.id} className="min-w-0">
          <PostCard post={post} />
        </li>
      ))}
    </ul>
  );
}
