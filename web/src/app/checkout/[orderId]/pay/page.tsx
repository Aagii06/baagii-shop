import PayOrderPage from "./PayOrderPage";

// Static export: one page is built for "_", nginx serves it for every id.
export function generateStaticParams() {
  return [{ orderId: "_" }];
}

export default function Page() {
  return <PayOrderPage />;
}
