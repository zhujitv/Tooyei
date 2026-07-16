import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#0b1220] px-5 text-center text-white">
      <div>
        <p className="brand-eyebrow">404</p>
        <h1 className="mt-5 text-5xl font-semibold tracking-[-0.04em]">Page not found</h1>
        <p className="mt-5 text-white/60">The requested page may have moved during the migration.</p>
        <Button asChild className="mt-8 site-accent-button">
          <Link href="/">Return home</Link>
        </Button>
      </div>
    </main>
  );
}
