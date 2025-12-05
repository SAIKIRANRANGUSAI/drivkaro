import "./globals.css";
import ClientAuthLoader from "@/components/ClientAuthLoader";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full antialiased text-gray-800">
        <ClientAuthLoader />
        {children}
      </body>
    </html>
  );
}
