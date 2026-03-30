import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import ThemeProvider from "@/components/ThemeProvider";
import { createServerSupabaseClient } from "@/lib/supabase";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
});

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["400", "500"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "PeerPods — Focused conversations with curious strangers",
  description:
    "Join time-limited group conversations around topics you care about. No followers, no likes, just real discussion.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let username: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .single();
    username = profile?.username ?? null;
  }

  return (
    <html
      lang="en"
      className={`${plusJakartaSans.variable} ${playfairDisplay.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col antialiased">
        <ThemeProvider>
          <Nav userId={user?.id ?? null} username={username} />
          <main className="flex-1">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
