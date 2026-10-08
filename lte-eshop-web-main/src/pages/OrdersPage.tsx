import PageHeader from "../components/layout/main/header";

export function OrdersPage() {
  return (
    <>
      <PageHeader title="Захиалга" />
      <div className="flex-1 overflow-y-auto p-4">
        <p className="text-sm text-gray-500">Захиалгын жагсаалт — удахгүй</p>
      </div>
    </>
  );
}
