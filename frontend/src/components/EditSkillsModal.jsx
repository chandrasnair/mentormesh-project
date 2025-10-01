import React, { useState } from "react";

const EditSkillsModal = ({ initialSkills = [], onClose, onSave }) => {
  const [skills, setSkills] = useState(initialSkills);
  const [input, setInput] = useState("");

  const addSkill = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    if (skills.includes(trimmed)) return;
    setSkills([...skills, trimmed]);
    setInput("");
  };

  const removeSkill = (skill) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addSkill();
    }
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-lg bg-white rounded-xl shadow border">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Edit Skills</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Add a skill</label>
            <div className="flex gap-2">
              <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="e.g., React" className="flex-1 rounded-md border px-3 py-2" />
              <button onClick={addSkill} className="px-3 py-2 rounded-md bg-primaryGreen text-white hover:bg-darkGreen">Add</button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <span key={skill} className="inline-flex items-center gap-2 bg-lightGreen text-primaryGreen px-3 py-1 rounded-full text-sm">
                {skill}
                <button onClick={() => removeSkill(skill)} className="text-primaryGreen/70 hover:text-primaryGreen">×</button>
              </span>
            ))}
            {skills.length === 0 && <p className="text-sm text-gray-500">No skills yet. Add one above.</p>}
          </div>
        </div>
        <div className="p-4 border-t flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-2 rounded-md border">Cancel</button>
          <button onClick={() => onSave(skills)} className="px-3 py-2 rounded-md bg-primaryGreen text-white hover:bg-darkGreen">Save</button>
        </div>
      </div>
    </div>
  );
};

export default EditSkillsModal;


