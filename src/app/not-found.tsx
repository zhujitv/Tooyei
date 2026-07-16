import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function NotFound(){return <main className="grid min-h-screen place-items-center bg-[#1c201d] px-5 text-center text-white"><div><p className="text-sm font-bold tracking-[0.2em] text-[#d56a5d]">404</p><h1 className="mt-5 text-5xl font-semibold">Page not found</h1><p className="mt-5 text-white/60">The requested page may have moved during the migration.</p><Button asChild className="mt-8 bg-[#a63429] hover:bg-[#8d2b23]"><Link href="/">Return home</Link></Button></div></main>;}
