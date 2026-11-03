import EditCategoryPage from "./EditCategoryPage";

// Static export: one page is built for "_", nginx serves it for every id.
export function generateStaticParams() {
  return [{ id: "_" }];
}

export default function Page() {
  return <EditCategoryPage />;
}
