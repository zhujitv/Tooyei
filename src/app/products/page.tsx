import type { Metadata } from "next";
import { ProductsPage } from "@/components/products-page";
export const metadata: Metadata = { title: "Wholesale Flooring Products", description: "Explore Tooyei SPC, WPC and LVT flooring for wholesale, commercial and OEM projects." };
export default function Page() { return <ProductsPage locale="en"/>; }
