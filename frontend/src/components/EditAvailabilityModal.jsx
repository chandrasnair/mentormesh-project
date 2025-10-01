import React, { useState } from "react";

const EditAvailabilityModal = ({ initialSlots = [], onClose, onSave }) => {
  const [slots, setSlots] = useState(initialSlots);
  const [form, setForm] = useState({ day: "Monday", start: "09:00", end: "10:00" });

  const addSlot = () => {
    const newSlot = { id: crypto.randomUUID(), ...form };
    setSlots([...slots, newSlot]);
  };

  const removeSlot = (id) => {
    setSlots(slots.filter((s) => s.id !== id));
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-xl bg-white rounded-xl shadow border">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Edit Availability</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-3 gap-2">
            <select className="rounded-md border px-3 py-2" value={form.day} onChange={(e) => setForm({ ...form, day: e.target.value })}>
              {["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <input type="time" className="rounded-md border px-3 py-2" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} />
            <input type="time" className="rounded-md border px-3 py-2" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} />
            <div className="col-span-3 flex justify-end">
              <button onClick={addSlot} className="px-3 py-2 rounded-md bg-primaryGreen text-white hover:bg-darkGreen">Add Slot</button>
            </div>
          </div>

          <div className="space-y-2">
            {slots.map((s) => (
              <div key={s.id} className="flex items-center justify-between border rounded-md px-3 py-2">
                <span className="text-sm text-gray-700">{s.day} • {s.start} - {s.end}</span>
                <button onClick={() => removeSlot(s.id)} className="text-sm text-red-600 hover:text-red-700">Remove</button>
              </div>
            ))}
            {slots.length === 0 && <p className="text-sm text-gray-500">No slots added yet.</p>}
          </div>
        </div>
        <div className="p-4 border-t flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-2 rounded-md border">Cancel</button>
          <button onClick={() => onSave(slots)} className="px-3 py-2 rounded-md bg-primaryGreen text-white hover:bg-darkGreen">Save</button>
        </div>
      </div>
    </div>
  );
};

export default EditAvailabilityModal;


