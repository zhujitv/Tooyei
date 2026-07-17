import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Database, KeyRound, ShieldCheck, UserPlus, Users } from "lucide-react";
import { AdminRole } from "@/generated/prisma/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireAdminSession } from "@/lib/admin-auth";
import { isDatabaseConfigured } from "@/lib/db";
import { getAdminUsers, getCurrentAdminUser } from "@/lib/repositories/admin-users";
import {
  createAdminUserAction,
  updateAdminUserPasswordAction,
  updateAdminUserProfileAction,
} from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "用户管理",
  robots: { index: false, follow: false },
};

const roleLabel: Record<AdminRole, string> = {
  OWNER: "所有者",
  EDITOR: "编辑",
  TRANSLATOR: "翻译",
  SALES: "销售",
  VIEWER: "只读",
};

const roleHelp: Record<AdminRole, string> = {
  OWNER: "可管理用户、内容和询盘",
  EDITOR: "可编辑内容和产品",
  TRANSLATOR: "用于翻译和内容校对",
  SALES: "用于询盘跟进和负责人分配",
  VIEWER: "只读查看后台数据",
};

const savedMessageMap: Record<string, { title: string; description: string; tone: "success" }> = {
  created: { title: "用户已创建", description: "新账号可以使用设置的邮箱和密码登录。", tone: "success" },
  profile: { title: "用户资料已保存", description: "角色、名称或启用状态已更新。", tone: "success" },
  password: { title: "密码已更新", description: "新密码会在下一次登录时生效。", tone: "success" },
};

const errorMessageMap: Record<string, { title: string; description: string; tone: "error" }> = {
  database: { title: "数据库未连接", description: "用户管理需要 PostgreSQL 数据库。", tone: "error" },
  create: { title: "创建失败", description: "请检查邮箱是否重复、密码长度和当前账号权限。", tone: "error" },
  profile: { title: "资料保存失败", description: "请确认至少保留一个启用的所有者账号。", tone: "error" },
  password: { title: "密码修改失败", description: "请确认两次密码一致、长度不少于 12 位，并且你有权限修改该账号。", tone: "error" },
};

const formatDate = (date: Date | null) =>
  date
    ? new Intl.DateTimeFormat("zh-CN", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Shanghai",
      }).format(date)
    : "—";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const session = await requireAdminSession();
  const [currentUser, users, params] = await Promise.all([
    getCurrentAdminUser(session.email),
    getAdminUsers(),
    searchParams,
  ]);
  if (!currentUser) notFound();

  const databaseReady = isDatabaseConfigured();
  const canManageUsers = databaseReady && currentUser.active && currentUser.role === AdminRole.OWNER;
  const feedback = params.error ? errorMessageMap[params.error] : params.saved ? savedMessageMap[params.saved] : undefined;

  return (
    <main className="admin-page">
      <div className="flex flex-col justify-between gap-5 border-b border-white/[0.07] pb-6 md:flex-row md:items-end">
        <div>
          <p className="text-[11px] font-medium text-zinc-600">系统 / 团队与权限</p>
          <h1 className="mt-3 text-2xl font-semibold tracking-[-0.035em] text-zinc-50">用户管理</h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-zinc-500">
            管理后台账号、角色、启用状态和登录密码。只有所有者可以创建账号或修改他人账号。
          </p>
        </div>
        <Badge className={databaseReady ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-300" : "border border-amber-500/20 bg-amber-500/10 text-amber-300"}>
          <Database className="size-3.5" />
          {databaseReady ? "PostgreSQL 已连接" : "只读环境变量账号"}
        </Badge>
      </div>

      {feedback ? (
        <Alert
          className={
            feedback.tone === "success"
              ? "mt-8 border-emerald-500/30 bg-emerald-500/8 text-emerald-100"
              : "mt-8 border-amber-500/30 bg-amber-500/8 text-amber-100"
          }
        >
          <KeyRound className="size-4" />
          <AlertTitle>{feedback.title}</AlertTitle>
          <AlertDescription className={feedback.tone === "success" ? "text-emerald-100/65" : "text-amber-100/65"}>
            {feedback.description}
          </AlertDescription>
        </Alert>
      ) : null}

      {!databaseReady ? (
        <Alert className="mt-8 border-amber-500/30 bg-amber-500/8 text-amber-100">
          <Database className="size-4" />
          <AlertTitle>当前只能查看环境变量管理员</AlertTitle>
          <AlertDescription className="text-amber-100/65">
            修改密码需要数据库账号体系。生产环境连接 PostgreSQL 后，可以在此页面管理后台用户。
          </AlertDescription>
        </Alert>
      ) : null}

      <section className="mt-5 grid gap-5 lg:grid-cols-[1fr_360px]">
        <Card className="admin-card rounded-xl">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Users className="size-5 text-zinc-500" />
              <div>
                <CardTitle>后台用户</CardTitle>
                <p className="mt-1 text-sm text-zinc-600">当前登录：{session.email}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-white/[0.07] hover:bg-transparent">
                  <TableHead className="text-zinc-500">用户</TableHead>
                  <TableHead className="text-zinc-500">角色 / 状态</TableHead>
                  <TableHead className="text-zinc-500">更新时间</TableHead>
                  <TableHead className="min-w-[320px] text-zinc-500">修改资料</TableHead>
                  <TableHead className="min-w-[300px] text-zinc-500">重置密码</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => {
                  const canChangePassword = databaseReady && (canManageUsers || user.email === session.email) && user.active;
                  const saveProfileAction = updateAdminUserProfileAction.bind(null, user.id);
                  const savePasswordAction = updateAdminUserPasswordAction.bind(null, user.id);
                  return (
                    <TableRow key={user.id} className="align-top border-white/[0.07] hover:bg-white/[0.03]">
                      <TableCell>
                        <div className="font-medium">{user.name}</div>
                        <div className="mt-1 font-mono text-xs text-zinc-500">{user.email}</div>
                        {user.isBootstrapAdmin ? (
                          <Badge className="mt-3 border border-violet-500/20 bg-violet-500/10 text-violet-300">
                            <ShieldCheck className="size-3.5" />
                            Bootstrap Owner
                          </Badge>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-white/[0.1] text-zinc-400">{roleLabel[user.role]}</Badge>
                        <p className="mt-2 max-w-44 text-xs leading-5 text-zinc-700">{roleHelp[user.role]}</p>
                        <p className={user.active ? "mt-2 text-xs text-emerald-300" : "mt-2 text-xs text-zinc-700"}>
                          {user.active ? "已启用" : "已停用"}
                        </p>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-zinc-500">
                        <p>创建：{formatDate(user.createdAt)}</p>
                        <p className="mt-2">更新：{formatDate(user.updatedAt)}</p>
                      </TableCell>
                      <TableCell>
                        <form action={saveProfileAction} className="space-y-3">
                          {user.isBootstrapAdmin ? (
                            <>
                              <input type="hidden" name="role" value={user.role} />
                              <input type="hidden" name="active" value="on" />
                            </>
                          ) : null}
                          <Input
                            name="name"
                            defaultValue={user.name}
                            aria-label={`${user.email} 的姓名`}
                            minLength={2}
                            maxLength={80}
                            disabled={!canManageUsers}
                            className="admin-field disabled:opacity-60"
                          />
                          <div className="grid grid-cols-[1fr_auto] gap-3">
                            <select
                              name="role"
                              defaultValue={user.role}
                              aria-label={`${user.email} 的角色`}
                              disabled={!canManageUsers || user.isBootstrapAdmin}
                              className="h-9 rounded-md admin-field px-3 text-sm disabled:opacity-60"
                            >
                              {Object.values(AdminRole).map((role) => (
                                <option key={role} value={role}>{roleLabel[role]}</option>
                              ))}
                            </select>
                            <label className="inline-flex items-center gap-2 rounded-lg border border-white/[0.07] bg-white/[0.05] px-3 text-sm text-zinc-400">
                              <input
                                type="checkbox"
                                name="active"
                                aria-label={`${user.email} 的启用状态`}
                                defaultChecked={user.active}
                                disabled={!canManageUsers || user.isBootstrapAdmin}
                                className="admin-checkbox disabled:opacity-60"
                              />
                              启用
                            </label>
                          </div>
                          <Button
                            type="submit"
                            size="sm"
                            disabled={!canManageUsers}
                            className="bg-zinc-100 text-zinc-950 hover:bg-white"
                          >
                            保存资料
                          </Button>
                        </form>
                      </TableCell>
                      <TableCell>
                        <form action={savePasswordAction} className="space-y-3">
                          <Input
                            name="password"
                            type="password"
                            aria-label={`${user.email} 的新密码`}
                            minLength={12}
                            maxLength={128}
                            autoComplete="new-password"
                            placeholder="新密码，至少 12 位"
                            disabled={!canChangePassword}
                            className="admin-field placeholder:text-zinc-100/25 disabled:opacity-60"
                          />
                          <Input
                            name="confirmPassword"
                            type="password"
                            aria-label={`${user.email} 的确认密码`}
                            minLength={12}
                            maxLength={128}
                            autoComplete="new-password"
                            placeholder="再次输入新密码"
                            disabled={!canChangePassword}
                            className="admin-field placeholder:text-zinc-100/25 disabled:opacity-60"
                          />
                          <Button
                            type="submit"
                            size="sm"
                            disabled={!canChangePassword}
                            className="bg-zinc-100 text-zinc-950 hover:bg-white"
                          >
                            <KeyRound />
                            修改密码
                          </Button>
                          {!canChangePassword ? (
                            <p className="text-xs text-zinc-100/30">只有所有者或账号本人可以修改密码。</p>
                          ) : null}
                        </form>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="h-fit admin-card rounded-xl">
          <CardHeader>
            <div className="flex items-center gap-3">
              <UserPlus className="size-5 text-zinc-500" />
              <div>
                <CardTitle>新增用户</CardTitle>
                <p className="mt-1 text-sm text-zinc-600">创建后用户即可用邮箱和密码登录后台。</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form action={createAdminUserAction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-name">姓名</Label>
                <Input
                  id="new-name"
                  name="name"
                  minLength={2}
                  maxLength={80}
                  required
                  disabled={!canManageUsers}
                  className="admin-field disabled:opacity-60"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-email">邮箱</Label>
                <Input
                  id="new-email"
                  name="email"
                  type="email"
                  maxLength={180}
                  required
                  disabled={!canManageUsers}
                  className="admin-field disabled:opacity-60"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-role">角色</Label>
                <select
                  id="new-role"
                  name="role"
                  defaultValue={AdminRole.EDITOR}
                  disabled={!canManageUsers}
                  className="h-9 w-full rounded-md admin-field px-3 text-sm disabled:opacity-60"
                >
                  {Object.values(AdminRole).map((role) => (
                    <option key={role} value={role}>{roleLabel[role]}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">初始密码</Label>
                <Input
                  id="new-password"
                  name="password"
                  type="password"
                  minLength={12}
                  maxLength={128}
                  autoComplete="new-password"
                  required
                  disabled={!canManageUsers}
                  className="admin-field disabled:opacity-60"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-confirm-password">确认密码</Label>
                <Input
                  id="new-confirm-password"
                  name="confirmPassword"
                  type="password"
                  minLength={12}
                  maxLength={128}
                  autoComplete="new-password"
                  required
                  disabled={!canManageUsers}
                  className="admin-field disabled:opacity-60"
                />
              </div>
              <Button
                type="submit"
                disabled={!canManageUsers}
                className="w-full bg-zinc-100 text-zinc-950 hover:bg-white"
              >
                <UserPlus />
                创建用户
              </Button>
              {!canManageUsers ? (
                <p className="text-xs leading-5 text-zinc-700">只有所有者账号可以新增后台用户。</p>
              ) : null}
            </form>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
