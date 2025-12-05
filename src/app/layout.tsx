import "./globals.css";
import ClientAuthLoader from "@/components/ClientAuthLoader";

export default function RootLayout({ children }) {
  return (
    // 1. Ensure the document uses the full height (h-full)
    <html lang="en" className="h-full">
      {/* 2. Apply modern defaults to the body:
           - h-full: Ensures the body takes full height of the viewport/html.
           - antialiased: Makes fonts render smoother on most operating systems.
           - text-gray-800: Sets a good default text color for non-admin content.
      */}
      <body className="h-full antialiased text-gray-800">
        <ClientAuthLoader />
        {children}
      </body>
    </html>
  );
}