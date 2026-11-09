import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PromptLab IT Del | Prompt Engineering Challenge",
  description: "Latihan menyusun, mengevaluasi, dan memperbaiki prompt untuk kebutuhan perkuliahan."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
