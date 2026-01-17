"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import {
    Company,
    JobPositionWithCompany,
    TaxSetting
} from "@/types";
import { PositionCard } from "@/components/PositionCard";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Building2,
    MapPin,
    ArrowLeft,
    Plus,
    Map,
    Globe
} from "lucide-react";
import Link from "next/link";

export default function CompanyDetailPage() {
    const params = useParams();
    const [company, setCompany] = useState<Company | null>(null);
    const [positions, setPositions] = useState<JobPositionWithCompany[]>([]);
    const [taxSettings, setTaxSettings] = useState<TaxSetting[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            if (!params.id) return;

            try {
                // Fetch tax settings
                const { data: taxData } = await supabase
                    .from("tax_settings")
                    .select("*");
                setTaxSettings(taxData || []);

                // Fetch company (only if active)
                const { data: companyData } = await supabase
                    .from("companies")
                    .select("*")
                    .eq("id", params.id)
                    .eq("is_active", true)
                    .single();

                if (companyData) {
                    setCompany(companyData);

                    // Fetch positions for this company (sorted by created_at since net_monthly_max is gone)
                    const { data: positionsData } = await supabase
                        .from("job_positions")
                        .select("*, company:companies(*)")
                        .eq("company_id", params.id)
                        .order("created_at", { ascending: false });

                    setPositions(positionsData || []);
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [params.id]);

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-200 rounded w-1/4" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                    <div className="h-48 bg-gray-200 rounded-xl" />
                </div>
            </div>
        );
    }

    if (!company) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="text-center py-16">
                    <h2 className="text-xl font-semibold text-gray-700">
                        Firma nenalezena
                    </h2>
                    <Link href="/companies">
                        <Button variant="link">Zpět na seznam firem</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Back button */}
            <Link href="/companies">
                <Button variant="ghost" className="mb-4">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Zpět na firmy
                </Button>
            </Link>

            {/* Company Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <Card className="mb-8 bg-white border-gray-100">
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-6">
                            {company.logo_url ? (
                                <img
                                    src={company.logo_url}
                                    alt={company.name}
                                    className="w-16 h-16 rounded-2xl object-contain bg-white border border-gray-100"
                                />
                            ) : (
                                <div className="w-16 h-16 bg-gradient-to-br from-[#E21E36] to-[#c91a2e] rounded-2xl flex items-center justify-center flex-shrink-0">
                                    <Building2 className="w-8 h-8 text-white" />
                                </div>
                            )}
                            <div className="flex-1">
                                <h1 className="text-2xl font-bold text-gray-900 mb-3">
                                    {company.name}
                                </h1>
                                {company.description && (
                                    <p className="text-gray-600 mb-3">{company.description}</p>
                                )}
                                <div className="flex flex-wrap gap-4">
                                    {company.city && (
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <MapPin className="w-4 h-4" />
                                            <span>{company.city}{company.address ? `, ${company.address}` : ''}</span>
                                        </div>
                                    )}
                                    {company.maps_url && (
                                        <a
                                            href={company.maps_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 text-[#E21E36] hover:underline"
                                        >
                                            <Map className="w-4 h-4" />
                                            <span>Zobrazit na mapě</span>
                                        </a>
                                    )}
                                    {company.web_url && (
                                        <a
                                            href={company.web_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 text-[#E21E36] hover:underline"
                                        >
                                            <Globe className="w-4 h-4" />
                                            <span>Web stránky</span>
                                        </a>
                                    )}
                                </div>
                            </div>
                            <Badge variant="secondary" className="bg-[#E21E36]/10 text-[#E21E36]">
                                {positions.length} pozic
                            </Badge>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Google Map Embed */}
            {(company.address || company.city) && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <Card className="bg-white border-gray-100 overflow-hidden">
                        <div className="w-full h-[300px] bg-gray-100 relative">
                            <iframe
                                width="100%"
                                height="100%"
                                id="gmap_canvas"
                                src={`https://maps.google.com/maps?q=${encodeURIComponent((company.name || "") + " " + (company.address || "") + " " + (company.city || ""))}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                                frameBorder="0"
                                scrolling="no"
                                marginHeight={0}
                                marginWidth={0}
                                title="Google Map"
                            />
                            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-gray-500 shadow-sm border border-gray-100 pointer-events-none">
                                {company.address}
                                {company.address && company.city && ", "}
                                {company.city}
                            </div>
                        </div>
                    </Card>
                </motion.div>
            )}

            {/* Positions Header */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                    Pracovní pozice
                </h2>
                <Link href={`/admin/positions?company=${company.id}`}>
                    <Button size="sm" className="bg-[#E21E36] hover:bg-[#c91a2e]">
                        <Plus className="w-4 h-4 mr-2" />
                        Přidat pozici
                    </Button>
                </Link>
            </div>

            {/* Positions Grid */}
            {positions.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <p className="text-gray-500">
                        Tato firma zatím nemá žádné pozice
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {positions.map((position, index) => (
                        <PositionCard
                            key={position.id}
                            position={position}
                            index={index}
                            taxSettings={taxSettings}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
