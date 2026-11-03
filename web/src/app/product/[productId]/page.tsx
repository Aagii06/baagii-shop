import ProductPage from "./ProductPage";

// Static export: one page is built for "_", nginx serves it for every id.
export function generateStaticParams() {
  return [{ productId: "_" }];
}

export default function Page() {
  return <ProductPage />;
}
