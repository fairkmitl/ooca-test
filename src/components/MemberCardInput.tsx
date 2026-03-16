"use client";

interface MemberCardInputProps {
  value: string;
  onChange: (value: string) => void;
}

export default function MemberCardInput({
  value,
  onChange,
}: MemberCardInputProps) {
  return (
    <div className="mt-4">
      <label htmlFor="member-card" className="block text-sm font-medium text-gray-700 mb-1">
        Member Card Number
      </label>
      <input
        id="member-card"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g. MEMBER001"
        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
      />
    </div>
  );
}
