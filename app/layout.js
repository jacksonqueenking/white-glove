import "./globals.css";
import { Toaster } from "sonner";

export const metadata = {
  title: "White Glove | AI Event Planning",
  description:
    "White Glove is your AI-powered concierge for crafting unforgettable event experiences.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="font-sans">
      <body>
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
