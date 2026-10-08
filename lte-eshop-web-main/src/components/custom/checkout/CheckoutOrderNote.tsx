type CheckoutOrderNoteProps = {
  value: string;
  onChange: (value: string) => void;
};

export default function CheckoutOrderNote({
  value,
  onChange,
}: CheckoutOrderNoteProps) {
  return (
    <section>
      <h2 className="mb-2 px-0.5 text-[15px] font-semibold text-gray-900">
        Нэмэлт тэмдэглэл
      </h2>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        placeholder="Хүргэлтийн нэмэлт мэдээлэл бичнэ үү"
        className="w-full resize-none rounded-2xl bg-white px-3 py-3 text-sm text-gray-900 shadow-sm outline-none focus:ring-2 focus:ring-brand"
      />
    </section>
  );
}
