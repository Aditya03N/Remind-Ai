import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import AppLayoutWrapper from "../components/AppLayoutWrapper";

export const metadata = {
  title: "Recall.ai - Knowledge Decay System",
  description: "AI-Powered Spaced Repetition & Knowledge Retention System",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com" rel="preconnect" />
        <link crossOrigin="anonymous" href="https://fonts.gstatic.com" rel="preconnect" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-surface text-on-background font-body-md h-full min-h-screen antialiased selection:bg-primary-container selection:text-on-primary-container">
        <AuthProvider>
          <AppLayoutWrapper>
            {children}
          </AppLayoutWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
