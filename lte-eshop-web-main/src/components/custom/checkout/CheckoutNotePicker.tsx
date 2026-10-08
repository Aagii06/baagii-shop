import type DONote from "../../../models/delivery/DONote";
import { CheckOffIcon, CheckOnIcon } from "./icons";

type CheckoutNotePickerProps = {
  notes: DONote[];
  selectedIds: number[];
  loading: boolean;
  error: string | null;
  onToggle: (id: number) => void;
};

export default function CheckoutNotePicker({
  notes,
  selectedIds,
  loading,
  error,
  onToggle,
}: CheckoutNotePickerProps) {
  return (
    <section>
      <h2 className="mb-2 px-0.5 text-[15px] font-semibold text-gray-900">
        Хүргэлтийн тэмдэглэл
      </h2>
      {loading ? (
        <p className="rounded-2xl bg-white py-8 text-center text-sm text-gray-400 shadow-sm">
          Ачаалж байна…
        </p>
      ) : error ? (
        <p className="rounded-2xl bg-white px-3 py-8 text-center text-sm text-danger shadow-sm">
          {error}
        </p>
      ) : notes.length === 0 ? (
        <p className="rounded-2xl bg-white py-8 text-center text-sm text-gray-400 shadow-sm">
          Тэмдэглэл байхгүй
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <ul className="divide-y divide-gray-100">
            {notes.map((note) => {
              const selected = selectedIds.includes(note.id);
              return (
                <li key={note.id}>
                  <button
                    type="button"
                    onClick={() => onToggle(note.id)}
                    className={`flex w-full items-center gap-3 px-3 py-3 text-left ${
                      selected ? "bg-orange-50/70" : ""
                    }`}
                  >
                    {selected ? (
                      <CheckOnIcon className="h-5 w-5 shrink-0 text-brand" />
                    ) : (
                      <CheckOffIcon className="h-5 w-5 shrink-0 text-gray-300" />
                    )}
                    <span className="min-w-0 flex-1">
                      <span
                        className={`block text-sm font-semibold ${
                          selected ? "text-brand" : "text-gray-900"
                        }`}
                      >
                        {note.name}
                      </span>
                      {note.description ? (
                        <span className="mt-0.5 block text-xs text-gray-400">
                          {note.description}
                        </span>
                      ) : null}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
