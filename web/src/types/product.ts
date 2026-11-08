export interface ProductColor {
  name: string;
  hex: string;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  thumbnail?: string;
  /** 600px image for product grid cards. */
  grid?: string;
  images?: string[];
  description?: string;
  category?: string;
  categoryId?: number;
  /** The seller store's name; `brandLogo` is its logo file id. */
  brand?: string;
  /** The seller store's id — its page is `/store?id=`. */
  storeId?: number;
  brandLogo?: string;
  rating?: number;
  reviewCount?: number;
  soldCount?: number;
  stock?: number;
  colors?: ProductColor[];
  material?: string;
  dimensions?: string;
  weight?: string;
  origin?: string;
  freeDelivery?: boolean;
  /** Last edited (or added) time, ISO; drives the "newest first" order. */
  updatedAt?: string;
}

export interface ProductVariant {
  id: number;
  code?: string;
  name: string;
  image?: string;
  price: number;
  originalPrice?: number;
  stock: number;
  branchId?: number;
  attrs: Record<number, string>;
}

export interface ProductAttrValue {
  id: number | null;
  value: string;
  color?: string | null;
  image?: string | null;
  images?: string[];
}

export interface ProductAttr {
  id: number;
  name: string;
  viewType: "image" | "text";
  values: ProductAttrValue[];
}

export interface ProductDetail extends Product {
  variants: ProductVariant[];
  attrs: ProductAttr[];
}
