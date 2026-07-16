import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LockKeyhole } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAdminSession } from "@/lib/admin-auth";
import { loginAction } from "./actions";

export const metadata: Metadata = {
  title: "Admin sign in",
  robots: { index: false, follow: false },
};

const messages: Record<string, { title: string; description: string }> = {
  invalid: { title: "Sign-in failed", description: "Check the email and password, then try again." },
  unconfigured: { title: "Authentication is not configured", description: "Add the required ADMIN environment variables before signing in." },
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; returnTo?: string }>;
}) {
  if (await getAdminSession()) redirect("/admin/content");
  const params = await searchParams;
  const message = params.error ? messages[params.error] : undefined;

  return (
    <main className="grid min-h-screen place-items-center bg-[#111411] px-5 py-12 text-white">
      <Card className="w-full max-w-md border-white/10 bg-[#1a1e1a] text-white shadow-2xl">
        <CardHeader>
          <span className="mb-5 grid size-10 place-items-center rounded-sm bg-[#a63429] text-sm font-black">TY</span>
          <CardTitle className="text-2xl">Content administration</CardTitle>
          <CardDescription className="text-white/45">Sign in to manage products, translations and publishing.</CardDescription>
        </CardHeader>
        <CardContent>
          {message && (
            <Alert className="mb-6 border-red-500/30 bg-red-500/8 text-red-100">
              <LockKeyhole className="size-4" />
              <AlertTitle>{message.title}</AlertTitle>
              <AlertDescription className="text-red-100/65">{message.description}</AlertDescription>
            </Alert>
          )}
          <form action={loginAction} className="space-y-5">
            <input type="hidden" name="returnTo" value={params.returnTo ?? ""} />
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" autoComplete="username" required className="border-white/10 bg-black/20" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" minLength={12} autoComplete="current-password" required className="border-white/10 bg-black/20" />
            </div>
            <Button type="submit" className="w-full bg-[#a63429] text-white hover:bg-[#8d2b23]">Sign in</Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
