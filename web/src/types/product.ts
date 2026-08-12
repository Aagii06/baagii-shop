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
  description?: string;
  category: string;
  brand?: string;
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
}
