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
      <label htmlFor="member-card" className="input-label">
        Member Card Number
      </label>
      <input
        id="member-card"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g. MEMBER001"
        className="input-field"
      />
    </div>
  );
}
