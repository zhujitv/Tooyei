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
    <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top_left,rgba(182,138,76,0.18),transparent_34%),linear-gradient(135deg,#070b14,#0b1020_52%,#111827)] px-5 py-12 text-white">
      <Card className="w-full max-w-md rounded-3xl border-white/10 bg-white/[0.07] text-white shadow-[0_30px_90px_rgba(0,0,0,0.35)] backdrop-blur">
        <CardHeader>
          <span className="brand-mark mb-5 size-11 text-sm">TY</span>
          <CardTitle className="text-2xl tracking-[-0.03em]">Tooyei 后台管理</CardTitle>
          <CardDescription className="text-white/50">登录后可管理产品、翻译、发布状态、询盘和用户权限。</CardDescription>
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
              <Label htmlFor="email">邮箱</Label>
              <Input id="email" name="email" type="email" autoComplete="username" required className="admin-field" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input id="password" name="password" type="password" minLength={12} autoComplete="current-password" required className="admin-field" />
            </div>
            <Button type="submit" className="w-full bg-[#b68a4c] text-[#0b1220] hover:bg-[#c59b5c]">登录</Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
