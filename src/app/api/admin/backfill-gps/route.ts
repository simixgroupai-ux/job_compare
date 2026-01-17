import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { parseGoogleMapsUrl } from "@/app/actions/parse-google-maps";

export async function GET(req: NextRequest) {
    try {
        // 1. Fetch all companies with maps_url but missing latitude
        const { data: companies, error } = await supabase
            .from("companies")
            .select("id, name, maps_url")
            .not("maps_url", "is", null)
            .is("latitude", null);

        if (error) throw error;
        if (!companies || companies.length === 0) {
            return NextResponse.json({ message: "No companies to update." });
        }

        const stats = {
            total: companies.length,
            updated: 0,
            failed: 0,
            details: [] as any[]
        };

        // 2. Process each company
        // Process in parallel with limit to avoid timeout, or sequential
        for (const company of companies) {
            if (!company.maps_url) continue;

            console.log(`Processing ${company.name}...`);
            const coords = await parseGoogleMapsUrl(company.maps_url);

            if (coords) {
                const { error: updateError } = await supabase
                    .from("companies")
                    .update({
                        latitude: coords.lat,
                        longitude: coords.lng
                    })
                    .eq("id", company.id);

                if (updateError) {
                    stats.failed++;
                    stats.details.push({ name: company.name, error: updateError.message });
                } else {
                    stats.updated++;
                    stats.details.push({ name: company.name, status: "Updated", coords });
                }
            } else {
                stats.failed++;
                stats.details.push({ name: company.name, error: "Count not parse coords" });
            }
        }

        return NextResponse.json(stats);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
