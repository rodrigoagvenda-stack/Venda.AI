import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import { getServerBranding, generateCSSVariables } from "@/lib/branding-server";
import { BrandingProvider } from "@/components/providers/BrandingProvider";
import { DEFAULT_BRANDING } from "@/types/branding";

export async function generateMetadata(): Promise<Metadata> {
  let branding = DEFAULT_BRANDING;

  try {
    branding = await getServerBranding();
  } catch (error) {
    console.error('Error getting branding for metadata:', error);
  }

  return {
    title: `${branding.app_name} - CRM Inteligente com IA`,
    description: "Sistema completo de CRM com automação e inteligência artificial",
    icons: {
      icon: branding.favicon_url || DEFAULT_BRANDING.favicon_url!,
      shortcut: branding.favicon_url || DEFAULT_BRANDING.favicon_url!,
      apple: branding.favicon_url || DEFAULT_BRANDING.favicon_url!,
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let branding = DEFAULT_BRANDING;

  try {
    branding = await getServerBranding();
  } catch (error) {
    console.error('Error getting branding for layout:', error);
  }

  const cssVariables = generateCSSVariables(branding);

  return (
    <html lang="pt-BR" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        {cssVariables && (
          <style dangerouslySetInnerHTML={{ __html: `:root { ${cssVariables} }` }} />
        )}
      </head>
      <body className="font-poppins antialiased">
        <BrandingProvider branding={branding}>
          {children}
        </BrandingProvider>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
