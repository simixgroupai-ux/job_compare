"use client";

import { useState } from "react";
import { Company } from "@/types";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Building2, ChevronLeft, ChevronRight, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";

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
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

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

            <div className="flex-1 flex overflow-hidden relative">
                {/* Sidebar List */}
                <motion.div
                    initial={false}
                    animate={{
                        x: isSidebarOpen ? 0 : -400,
                        opacity: isSidebarOpen ? 1 : 0
                    }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className={cn(
                        "absolute inset-y-0 left-0 w-[280px] sm:w-80 md:w-96 bg-white shrink-0 z-30 shadow-2xl flex flex-col border-r",
                        !isSidebarOpen && "pointer-events-none"
                    )}
                >
                    <div className="flex items-center justify-between p-4 border-b bg-gray-50/50">
                        <h2 className="font-bold text-gray-900">Seznam firem</h2>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsSidebarOpen(false)}
                        >
                            <PanelLeftClose className="w-5 h-5" />
                        </Button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                        {filteredCompanies.map((company) => {
                            const hasCoords = company.latitude && company.longitude;
                            const isSelected = selectedCompanyId === company.id;

                            return (
                                <Card
                                    key={company.id}
                                    className={cn(
                                        "cursor-pointer transition-all hover:shadow-md",
                                        isSelected ? 'ring-2 ring-[#E21E36] border-transparent scale-[1.02]' : 'border-gray-200',
                                        !hasCoords ? 'opacity-60 bg-gray-100' : 'bg-white'
                                    )}
                                    onClick={() => {
                                        if (hasCoords) {
                                            setSelectedCompanyId(company.id);
                                            // Auto-close on very small screens when selecting
                                            if (window.innerWidth < 768) setIsSidebarOpen(false);
                                        }
                                    }}
                                >
                                    <div className="p-3">
                                        <div className="flex items-start gap-3">
                                            {company.logo_url ? (
                                                <img
                                                    src={company.logo_url}
                                                    alt={company.name}
                                                    className="w-10 h-10 object-contain rounded bg-white p-1 border shadow-sm"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center border">
                                                    <Building2 className="w-5 h-5 text-gray-400" />
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-gray-900 truncate text-sm">{company.name}</h3>
                                                <div className="flex items-center gap-1 text-[11px] text-gray-500 mt-1">
                                                    <MapPin className="w-3 h-3 text-[#E21E36]" />
                                                    <span className="truncate">{company.city || "Neznámé město"}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                        {filteredCompanies.length === 0 && (
                            <div className="text-center py-12 text-gray-400">
                                <Building2 className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                <p>Žádná firma nenalezena</p>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Map Area */}
                <div className="flex-1 relative bg-gray-100">
                    <CompanyMap
                        companies={initialCompanies}
                        selectedCompanyId={selectedCompanyId}
                        onMarkerClick={setSelectedCompanyId}
                    />

                    {/* Toggle Sidebar Button (Floating) */}
                    <AnimatePresence>
                        {!isSidebarOpen && (
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="absolute left-4 top-8 md:top-4 z-40"
                            >
                                <Button
                                    onClick={() => setIsSidebarOpen(true)}
                                    className="bg-white text-gray-900 hover:bg-gray-50 shadow-xl border border-gray-100 p-3 h-auto rounded-xl flex items-center gap-2"
                                >
                                    <PanelLeftOpen className="w-5 h-5 text-[#E21E36]" />
                                    <span className="font-bold text-sm pr-1">Zobrazit firmy</span>
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
