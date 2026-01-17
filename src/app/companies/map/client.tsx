"use client";

import { useState } from "react";
import { Company } from "@/types";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Building2, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";

const CompanyMap = dynamic(() => import("@/components/CompanyMap"), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <div className="text-gray-400">Načítám mapu...</div>
        </div>
    ),
});

interface MapPageClientProps {
    initialCompanies: Company[];
}

export default function MapPageClient({ initialCompanies }: MapPageClientProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

    const filteredCompanies = initialCompanies.filter(company =>
        company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        company.city?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Companies that actually have coordinates for map display
    const mappableCompanies = initialCompanies.filter(c => c.latitude && c.longitude);

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden">
            {/* Header / Filter Bar */}
            <div className="bg-white border-b px-4 py-3 flex items-center gap-4 z-10 shrink-0">
                <Link href="/companies">
                    <Button variant="ghost" size="icon" className="shrink-0">
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        placeholder="Hledat firmu nebo město..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <div className="text-sm text-gray-500 hidden sm:block">
                    Zobrazeno {mappableCompanies.length} z {initialCompanies.length} firem na mapě
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar List */}
                <div className="w-full sm:w-80 md:w-96 bg-gray-50 border-r overflow-y-auto shrink-0 z-10">
                    <div className="p-4 space-y-3">
                        {filteredCompanies.map((company) => {
                            const hasCoords = company.latitude && company.longitude;
                            const isSelected = selectedCompanyId === company.id;

                            return (
                                <Card
                                    key={company.id}
                                    className={`
                                        cursor-pointer transition-all hover:shadow-md
                                        ${isSelected ? 'ring-2 ring-[#E21E36] border-transparent' : 'border-gray-200'}
                                        ${!hasCoords ? 'opacity-60 bg-gray-100' : 'bg-white'}
                                    `}
                                    onClick={() => {
                                        if (hasCoords) {
                                            setSelectedCompanyId(company.id);
                                        }
                                    }}
                                >
                                    <div className="p-3">
                                        <div className="flex items-start gap-3">
                                            {company.logo_url ? (
                                                <img
                                                    src={company.logo_url}
                                                    alt={company.name}
                                                    className="w-10 h-10 object-contain rounded bg-white p-1 border"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center border">
                                                    <Building2 className="w-5 h-5 text-gray-400" />
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-gray-900 truncate">{company.name}</h3>
                                                <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                                                    <MapPin className="w-3 h-3" />
                                                    <span className="truncate">{company.city || "Neznámé město"}</span>
                                                </div>
                                                {!hasCoords && (
                                                    <div className="text-xs text-amber-600 mt-1 font-medium">
                                                        Chybí GPS data
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                        {filteredCompanies.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                                Žádná firma nenalezena
                            </div>
                        )}
                    </div>
                </div>

                {/* Map Area */}
                <div className="flex-1 relative bg-gray-100 hidden sm:block">
                    <CompanyMap
                        companies={initialCompanies}
                        selectedCompanyId={selectedCompanyId}
                        onMarkerClick={setSelectedCompanyId}
                    />
                </div>

                {/* Mobile Map Toggle could go here, for now simpler layout */}
            </div>
        </div>
    );
}
