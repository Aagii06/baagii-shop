import ProductForm from "@/components/products/ProductForm";

// Static export: one page is built for "_", nginx serves it for every id.
export function generateStaticParams() {
  return [{ id: "_" }];
}

export default function EditProductPage() {
  return <ProductForm />;
}
