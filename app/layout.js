import "./globals.css";

export const metadata = {
  title: "White Glove | AI Event Planning",
  description:
    "White Glove is your AI-powered concierge for crafting unforgettable event experiences.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
