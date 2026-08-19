import type { Product, ProductAttr, ProductDetail, ProductVariant } from "@/types/product";
import { apiFetch } from "./client";

export interface GetProductsParams {
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
  cartTypeId?: number;
}

// Raw shape returned by the eshop-service backend. Only fields we
// consume are declared; the response carries more (createdById,
// isStock, deepLink, etc.) that we don't map.
interface ApiProduct {
  id: number;
  productId: number;
  productCode?: string;
  productName?: string;
  name?: string;
  note?: string | null;
  price: string;
  mainPrice: string;
  remain?: string;
  isActive?: boolean;
  company?: { id: number; name: string };
}

interface ApiListResponse<T> {
  success: boolean;
  message: string;
  data: {
    rows: T[];
    count: number;
    summary: unknown[];
  };
}

interface ApiItemResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface ApiPostProduct {
  variantId: number;
  variantCode?: string;
  variantName?: string;
  price: string;
  mainPrice: string;
  remain?: string;
  attr?: Record<string, string>;
}

interface ApiPostAttrValue {
  attrValueId: number | null;
  value: string;
  color?: string | null;
  image?: string | null;
}

interface ApiPostAttr {
  attrId: number;
  attrName: string;
  viewType: string;
  postAttrValues?: ApiPostAttrValue[];
}

interface ApiProductDetail extends ApiProduct {
  postProducts?: ApiPostProduct[];
  postAttrs?: ApiPostAttr[];
}

function mapApiProduct(p: ApiProduct): Product {
  const price = Number(p.price);
  const mainPrice = Number(p.mainPrice);

  return {
    id: p.productId,
    name: p.productName || p.name || "",
    price,
    originalPrice: mainPrice > price ? mainPrice : undefined,
    image: "",
    description: p.note ?? undefined,
    brand: p.company?.name,
    stock: p.remain !== undefined ? Number(p.remain) : undefined,
  };
}

export async function getProducts(params?: GetProductsParams) {
  const query = params
    ? "?" +
      new URLSearchParams(
        Object.entries(params).reduce<Record<string, string>>(
          (acc, [key, value]) => {
            if (value !== undefined) acc[key] = String(value);
            return acc;
          },
          {}
        )
      ).toString()
    : "";

  const res = await apiFetch<ApiListResponse<ApiProduct>>(
    `/post/product${query}`
  );

  return res.data.rows
    .filter((p) => p.isActive !== false)
    .map(mapApiProduct);
}

function mapApiProductDetail(p: ApiProductDetail): ProductDetail {
  const base = mapApiProduct(p);

  const variants: ProductVariant[] = (p.postProducts ?? []).map((v) => {
    const price = Number(v.price);
    const mainPrice = Number(v.mainPrice);

    return {
      id: v.variantId,
      code: v.variantCode,
      name: v.variantName || base.name,
      price,
      originalPrice: mainPrice > price ? mainPrice : undefined,
      stock: v.remain !== undefined ? Number(v.remain) : 0,
      attrs: Object.fromEntries(
        Object.entries(v.attr ?? {}).map(([attrId, value]) => [
          Number(attrId),
          value,
        ])
      ),
    };
  });

  const attrs: ProductAttr[] = (p.postAttrs ?? []).map((a) => ({
    id: a.attrId,
    name: a.attrName,
    viewType: a.viewType === "image" ? "image" : "text",
    values: (a.postAttrValues ?? []).map((v) => ({
      id: v.attrValueId,
      value: v.value,
      color: v.color,
      image: v.image,
    })),
  }));

  return { ...base, variants, attrs };
}

export async function getProduct(id: number) {
  const res = await apiFetch<ApiItemResponse<ApiProductDetail>>(
    `/post/product/${id}`
  );

  return mapApiProductDetail(res.data);
}
