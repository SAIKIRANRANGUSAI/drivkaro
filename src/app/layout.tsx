import "./globals.css";
// Remove: import ClientAuthLoader from "@/components/ClientAuthLoader";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full antialiased text-gray-800">
        {/* Remove: <ClientAuthLoader /> */}
        {children}
      </body>
    </html>
  );
}