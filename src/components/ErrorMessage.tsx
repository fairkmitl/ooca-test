"use client";

interface ErrorMessageProps {
  message: string;
}

export default function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <div className="alert-error">
      <div className="text-sm font-medium text-red-700">{message}</div>
    </div>
  );
}
