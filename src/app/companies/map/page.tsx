import { supabase } from "@/lib/supabase";
import { Metadata } from "next";
import MapPageClient from "./client";

export const metadata: Metadata = {
    title: "Mapa firem | Job Comparator",
    description: "Interaktivní mapa firem a jejich poboček.",
};

export const dynamic = "force-dynamic";

export default async function MapPage() {
    const { data: companies } = await supabase
        .from("companies")
        .select("*")
        .eq("is_active", true)
        .order("name");

    return <MapPageClient initialCompanies={companies || []} />;
}
