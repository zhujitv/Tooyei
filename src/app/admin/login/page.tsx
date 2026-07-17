import type { Metadata } from "next";
import Image from "next/image";
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
  title: "后台登录",
  robots: { index: false, follow: false },
};

const messages: Record<string, { title: string; description: string }> = {
  invalid: { title: "登录失败", description: "请检查邮箱和密码后重试。" },
  unconfigured: { title: "后台登录未配置", description: "请先补齐 ADMIN 相关环境变量，再登录后台。" },
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
    <main className="grid min-h-screen place-items-center bg-[#0a0a0b] px-5 py-12 text-white [color-scheme:dark]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(139,92,246,0.08),transparent_28rem)]" />
      <Card className="relative w-full max-w-sm rounded-xl border border-white/[0.08] bg-[#111113] text-white shadow-[0_30px_100px_rgba(0,0,0,0.4)] ring-0">
        <CardHeader>
          <span className="mb-5 grid size-9 place-items-center overflow-hidden rounded-md bg-[#df2029]">
            <Image src="/brand/tooyei-symbol.png" width={28} height={29} alt="" className="h-auto brightness-0 invert" priority />
          </span>
          <CardTitle className="text-xl tracking-[-0.03em] text-zinc-50">登录 Tooyei</CardTitle>
          <CardDescription className="text-zinc-600">进入内容与销售运营工作区。</CardDescription>
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
            <div className="space-y-1.5">
              <Label htmlFor="email" className="admin-label">邮箱</Label>
              <Input id="email" name="email" type="email" autoComplete="username" required className="admin-field" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="admin-label">密码</Label>
              <Input id="password" name="password" type="password" minLength={12} autoComplete="current-password" required className="admin-field" />
            </div>
            <Button type="submit" className="w-full bg-zinc-100 text-zinc-950 hover:bg-white">登录</Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
