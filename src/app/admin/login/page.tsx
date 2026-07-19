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
  session: { title: "登录状态已失效", description: "账号已停用或登录状态已过期，请重新登录。" },
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
    <main className="admin-root grid min-h-screen place-items-center bg-[#F8FAFC] px-5 py-12 text-[#111827] [color-scheme:light]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(37,99,235,0.08),transparent_30rem)]" />
      <Card className="relative w-full max-w-sm rounded-xl border border-[#E5E7EB] bg-white text-[#111827] shadow-[0_24px_70px_rgba(15,23,42,0.10)] ring-0">
        <CardHeader>
          <span className="mb-5 grid size-9 place-items-center overflow-hidden rounded-md bg-[#df2029]">
            <Image src="/brand/tooyei-symbol.png" width={28} height={29} alt="" className="h-[29px] w-7 brightness-0 invert" priority />
          </span>
          <CardTitle className="text-xl tracking-[-0.03em] text-[#111827]">登录 Tooyei</CardTitle>
          <CardDescription className="text-[#475569]">进入内容与销售运营工作区。</CardDescription>
        </CardHeader>
        <CardContent>
          {message && (
            <Alert className="mb-6 border-red-200 bg-red-50 text-red-900">
              <LockKeyhole className="size-4" />
              <AlertTitle>{message.title}</AlertTitle>
              <AlertDescription className="text-red-700">{message.description}</AlertDescription>
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
            <Button type="submit" className="admin-button-primary h-10 w-full">登录</Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
