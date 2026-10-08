import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  PostAttrPicker,
  PostBuyPanel,
  PostGallery,
  ChevronLeftIcon,
  availableValuesForAttr,
  buildDisplayName,
  findSelectedProduct,
  initialSelection,
  reconcileSelection,
  resolveGalleryImages,
  selectedAttrValueImages,
} from "../components/custom/post/detail";
import type Post from "../models/eshop/Post";
import { addProduct } from "../services/cartService";
import { getPost } from "../services/postService";
import { useCartStore } from "../store/cart";

export function PostPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const postId = Number(id);
  const fetchProductCnt = useCartStore((s) => s.fetchProductCnt);

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Record<number, string>>({});
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [cartMessage, setCartMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!postId) {
        setError("Буруу холбоос");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      const res = await getPost(postId);
      if (cancelled) return;

      if (!res.success || !res.data) {
        setError(res.message || "Зарлал олдсонгүй.");
        setPost(null);
      } else {
        const data = res.data;
        setPost(data);
        setSelected(
          initialSelection(data.postProducts ?? [], data.postAttrs ?? []),
        );
        setQty(1);
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [postId]);

  const attrs = useMemo(
    () =>
      [...(post?.postAttrs ?? [])].sort(
        (a, b) => (a.orderNumber ?? 0) - (b.orderNumber ?? 0),
      ),
    [post],
  );

  const products = post?.postProducts ?? [];

  const selectedProduct = useMemo(
    () => (post ? findSelectedProduct(products, attrs, selected) : undefined),
    [post, products, attrs, selected],
  );

  const selectedAttrImages = useMemo(
    () => selectedAttrValueImages(attrs, selected),
    [attrs, selected],
  );

  const galleryImages = post
    ? resolveGalleryImages(post, selectedProduct, selectedAttrImages)
    : [];

  const price = selectedProduct?.price ?? post?.price ?? 0;
  const remain = selectedProduct?.remain ?? post?.remain ?? 0;
  const title = post ? buildDisplayName(post, selectedProduct) : "";
  const headerTitle = post?.company?.name ?? post?.name ?? "";

  const selectAttr = (attrId: number, value: string) => {
    setSelected((prev) =>
      reconcileSelection(products, attrs, { ...prev, [attrId]: value }, attrId),
    );
    setQty(1);
    setCartMessage(null);
  };

  const handleAddToCart = async () => {
    if (!selectedProduct?.id) {
      setCartMessage("Хувилбар сонгоно уу.");
      return;
    }
    if (qty < 1 || qty > remain) {
      setCartMessage("Тоо ширхэг буруу байна.");
      return;
    }

    const branch =
      selectedProduct.postProductBranches?.find((b) => (b.remain ?? 0) > 0) ??
      selectedProduct.postProductBranches?.[0];

    setAdding(true);
    setCartMessage(null);
    const res = await addProduct({
      postProductId: String(selectedProduct.id),
      qty,
      branchId: branch?.branchId,
    });
    setAdding(false);

    if (!res.success) {
      setCartMessage(res.message || "Сагсанд нэмэхэд алдаа гарлаа.");
      return;
    }

    await fetchProductCnt();
    navigate("/cart");
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-surface">
      <header className="relative flex h-14 shrink-0 items-center justify-center border-b border-gray-100 bg-white px-4">
        <button
          type="button"
          aria-label="Буцах"
          onClick={() => navigate(-1)}
          className="absolute left-3 top-1/2 -translate-y-1/2 p-1 text-gray-800"
        >
          <ChevronLeftIcon className="h-6 w-6" />
        </button>
        <h1 className="max-w-[70%] truncate text-[17px] font-bold text-gray-900">
          {headerTitle}
        </h1>
      </header>

      {loading ? (
        <p className="py-12 text-center text-sm text-gray-400">Ачаалж байна…</p>
      ) : error || !post ? (
        <p className="py-12 text-center text-sm text-danger">
          {error || "Зарлал олдсонгүй"}
        </p>
      ) : (
        <>
          <div className="min-h-0 flex-1 overflow-y-auto pb-4">
            <div className="pt-3">
              <PostGallery images={galleryImages} />
            </div>

            <div className="mt-3 flex flex-col gap-2.5">
              {attrs.map((attr) =>
                attr.attrId != null ? (
                  <PostAttrPicker
                    key={attr.id ?? attr.attrId}
                    attr={attr}
                    selectedValue={selected[attr.attrId]}
                    availableValues={availableValuesForAttr(
                      products,
                      attrs,
                      attr,
                      selected,
                    )}
                    onSelect={(value) => selectAttr(attr.attrId!, value)}
                  />
                ) : null,
              )}
            </div>
          </div>

          {cartMessage ? (
            <p className="px-4 pb-1 text-center text-xs text-danger">
              {cartMessage}
            </p>
          ) : null}

          <PostBuyPanel
            title={title}
            category={post.category}
            price={price}
            remain={remain}
            qty={qty}
            onQtyChange={setQty}
            onAddToCart={handleAddToCart}
            loading={adding}
            disabled={!selectedProduct?.id || remain < 1}
          />
        </>
      )}
    </div>
  );
}
