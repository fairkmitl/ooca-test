import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Food Store Calculator",
  description: "Calculate your food store order with discounts",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
