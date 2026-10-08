import { Link } from "react-router-dom";
import type Post from "../../../../models/eshop/Post";
import { dateFormat, formatMoney } from "../../../../utils/helper";
import PostCategoryBadge from "../PostCategoryBadge";
import PostImages from "./PostImages";

type PostCardProps = {
  post: Post;
};

export default function PostCard({ post }: PostCardProps) {
  const hasDiscount = post.mainPrice > 0 && post.mainPrice !== post.price;

  return (
    <Link
      to={`/post/${post.id}`}
      className="flex h-full flex-col rounded-2xl bg-white p-2.5 shadow-sm"
    >
      <p className="truncate text-[11px] font-medium text-brand">
        {post.company?.name ?? "—"}
      </p>
      {post.category ? (
        <div className="mt-0.5">
          <PostCategoryBadge category={post.category} />
        </div>
      ) : null}
      <h2 className="mt-0.5 line-clamp-2 min-h-[2.5rem] text-sm font-semibold text-gray-900">
        {post.name}
      </h2>
      <time className="mt-0.5 text-[10px] text-gray-400">
        {dateFormat(post.date)?.slice(0, 10)}
      </time>

      <div className="mt-2">
        <PostImages images={post.images} />
      </div>

      {post.note ? (
        <p className="mt-1.5 line-clamp-2 text-[11px] text-gray-500">
          {post.note}
        </p>
      ) : null}

      <div className="mt-auto pt-2">
        <p className="text-sm font-bold text-gray-900">
          {formatMoney(post.price)}₮
        </p>
        {hasDiscount ? (
          <p className="text-[11px] text-gray-400 line-through">
            {formatMoney(post.mainPrice)}₮
          </p>
        ) : null}
        <p className="mt-0.5 text-[11px] text-gray-500">
          Үлдэгдэл:{" "}
          <span className="font-semibold text-gray-800">
            {formatMoney(post.remain)}
          </span>
        </p>
      </div>
    </Link>
  );
}
