import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getPublicCategoryTree } from "@/lib/repositories/categories";
import { siteConfig } from "@/lib/site";

type PolicyKind = "privacy" | "terms" | "cookies";

const policies: Record<PolicyKind, { eyebrow: string; title: string; intro: string; sections: Array<[string, string]> }> = {
  privacy: {
    eyebrow: "LEGAL / PRIVACY",
    title: "隐私政策",
    intro: "本政策说明 TOOYEI 官网在您提交业务咨询时如何处理相关信息。",
    sections: [
      ["我们收集的信息", "当您主动提交联系表单或发送邮件时，我们可能收到姓名、公司、邮箱、电话、目标市场、产品需求及您提供的项目资料。"],
      ["信息用途", "相关信息仅用于回复咨询、评估产品与项目需求、安排样品或报价，以及继续双方明确同意的业务沟通。"],
      ["信息保护", "我们会采取合理措施限制业务资料的访问范围。请勿通过公开表单提交不必要的敏感个人信息。"],
      ["联系与请求", `如需查询、更正或删除您提交的信息，请发送邮件至 ${siteConfig.email}。`],
    ],
  },
  terms: {
    eyebrow: "LEGAL / TERMS",
    title: "使用条款",
    intro: "访问和使用本网站，即表示您同意遵守以下基础使用规则。",
    sections: [
      ["网站内容", "网站中的产品说明、图片和技术信息用于一般介绍。具体规格、可用性、包装、认证与交付条件以双方最终确认的业务文件为准。"],
      ["知识产权", "除另有说明外，网站中的品牌标识、版式、文字与视觉内容由 TOOYEI 或相关权利方拥有。未经许可不得用于误导性商业宣传。"],
      ["外部链接", "网站可能提供第三方联系或社交平台入口。第三方服务由其各自条款和隐私政策约束。"],
      ["条款更新", "我们可能随网站与业务流程调整本页面。重大采购或项目决策应以双方书面确认的信息为依据。"],
    ],
  },
  cookies: {
    eyebrow: "LEGAL / COOKIES",
    title: "Cookies 说明",
    intro: "本页面说明网站可能使用的 Cookie 与类似本地存储技术。",
    sections: [
      ["必要功能", "网站可能使用必要 Cookie 维持安全登录、语言或基础交互状态。这些信息用于提供您主动请求的功能。"],
      ["分析与营销", "如未来增加分析或营销工具，我们会同步更新本说明，并根据适用要求提供相应控制选项。"],
      ["浏览器控制", "您可以通过浏览器设置查看、限制或删除 Cookie。禁用必要 Cookie 可能影响后台登录或部分网站功能。"],
      ["联系我们", `如对 Cookie 使用有疑问，请联系 ${siteConfig.email}。`],
    ],
  },
};

export async function PolicyPage({ kind }: { kind: PolicyKind }) {
  const policy = policies[kind];
  const categories = await getPublicCategoryTree("zh");

  return (
    <div className="site-shell">
      <SiteHeader locale="zh" initialCategories={categories} />
      <main>
        <section className="bg-[var(--navy)] text-white">
          <div className="mx-auto max-w-5xl px-5 py-20 lg:px-10 lg:py-28">
            <p className="brand-eyebrow-light"><span />{policy.eyebrow}</p>
            <h1 className="mt-6 text-4xl font-medium tracking-[-0.045em] sm:text-6xl">{policy.title}</h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-white/65">{policy.intro}</p>
          </div>
        </section>
        <section className="bg-[var(--paper)]">
          <div className="mx-auto max-w-5xl px-5 py-16 lg:px-10 lg:py-24">
            <Link href="/" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[var(--navy)] hover:text-[var(--gold)]">
              <ArrowLeft className="size-4" />返回首页
            </Link>
            <div className="mt-10 border-t border-[var(--border)]">
              {policy.sections.map(([title, body], index) => (
                <section key={title} className="grid gap-4 border-b border-[var(--border)] py-8 md:grid-cols-[5rem_0.8fr_1.2fr]">
                  <span className="font-mono text-xs tracking-[0.15em] text-[var(--gold)]">0{index + 1}</span>
                  <h2 className="text-xl font-medium tracking-[-0.02em] text-[var(--navy)]">{title}</h2>
                  <p className="text-sm leading-7 text-[var(--muted)]">{body}</p>
                </section>
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter locale="zh" />
    </div>
  );
}
