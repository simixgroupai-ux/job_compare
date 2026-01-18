"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import {
    Company,
    JobPositionWithCompany,
    TaxSetting,
    calculateGrossSalary,
    calculateNetSalary,
    defaultUserDeductions
} from "@/types";
import { PositionCard } from "@/components/PositionCard";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, SlidersHorizontal, X } from "lucide-react";

export default function PositionsPage() {
    const [positions, setPositions] = useState<JobPositionWithCompany[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [taxSettings, setTaxSettings] = useState<TaxSetting[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCompany, setSelectedCompany] = useState<string>("all");
    const [selectedShift, setSelectedShift] = useState<string>("all");
    const [sortBy, setSortBy] = useState<string>("salary_desc");

    useEffect(() => {
        async function fetchData() {
            try {
                // Fetch tax settings for salary calculation
                const { data: taxData } = await supabase
                    .from("tax_settings")
                    .select("*");
                setTaxSettings(taxData || []);

                // Fetch companies for filter
                const { data: companiesData } = await supabase
                    .from("companies")
                    .select("*")
                    .order("name");

                setCompanies(companiesData || []);

                // Fetch all positions with companies (sorted by created_at, we'll sort by salary client-side)
                const { data: positionsData } = await supabase
                    .from("job_positions")
                    .select("*, company:companies(*)")
                    .order("created_at", { ascending: false });

                setPositions(positionsData || []);
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, []);

    // Calculate net salary for sorting
    const getNetSalary = (position: JobPositionWithCompany): number => {
        const gross = calculateGrossSalary(position, true);
        const { net } = calculateNetSalary(gross, taxSettings, defaultUserDeductions);
        return net;
    };

    // Filter and sort positions
    const filteredPositions = positions
        .filter((position) => {
            // Search filter
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const matchesName = position.position_name.toLowerCase().includes(query);
                const matchesCompany = position.company?.name.toLowerCase().includes(query);
                if (!matchesName && !matchesCompany) return false;
            }

            // Company filter
            if (selectedCompany !== "all" && position.company_id !== selectedCompany) {
                return false;
            }

            // Shift filter
            if (selectedShift !== "all" && position.shift_type !== selectedShift) {
                return false;
            }

            return true;
        })
        .sort((a, b) => {
            switch (sortBy) {
                case "salary_desc":
                    return getNetSalary(b) - getNetSalary(a);
                case "salary_asc":
                    return getNetSalary(a) - getNetSalary(b);
                case "name":
                    return a.position_name.localeCompare(b.position_name);
                case "company":
                    return (a.company?.name || "").localeCompare(b.company?.name || "");
                default:
                    return 0;
            }
        });

    const uniqueShiftTypes = [...new Set(positions.map(p => p.shift_type).filter(Boolean))];

    const clearFilters = () => {
        setSearchQuery("");
        setSelectedCompany("all");
        setSelectedShift("all");
        setSortBy("salary_desc");
    };

    const hasActiveFilters = searchQuery || selectedCompany !== "all" || selectedShift !== "all";

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Pracovní pozice
                </h1>
                <p className="text-gray-600">
                    Prohlédněte a filtrujte všechny dostupné pozice
                </p>
            </motion.div>

            {/* Filters */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6"
            >
                <div className="flex items-center gap-2 mb-4">
                    <SlidersHorizontal className="w-5 h-5 text-gray-500" />
                    <span className="font-medium text-gray-700">Filtry</span>
                    {hasActiveFilters && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearFilters}
                            className="ml-auto text-gray-500"
                        >
                            <X className="w-4 h-4 mr-1" />
                            Vymazat filtry
                        </Button>
                    )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            placeholder="Hledat pozici..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>

                    {/* Company filter */}
                    <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                        <SelectTrigger>
                            <SelectValue placeholder="Všechny firmy" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Všechny firmy</SelectItem>
                            {companies.map((company) => (
                                <SelectItem key={company.id} value={company.id}>
                                    {company.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Shift filter */}
                    <Select value={selectedShift} onValueChange={setSelectedShift}>
                        <SelectTrigger>
                            <SelectValue placeholder="Všechny směny" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Všechny směny</SelectItem>
                            {uniqueShiftTypes.map((shift) => (
                                <SelectItem key={shift} value={shift || ""}>
                                    {shift}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Sort */}
                    <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger>
                            <SelectValue placeholder="Řadit podle" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="salary_desc">Mzda (nejvyšší)</SelectItem>
                            <SelectItem value="salary_asc">Mzda (nejnižší)</SelectItem>
                            <SelectItem value="name">Název pozice</SelectItem>
                            <SelectItem value="company">Firma</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </motion.div>

            {/* Results count */}
            <div className="mb-4 text-sm text-gray-500">
                {loading ? "Načítám..." : `${filteredPositions.length} pozic`}
            </div>

            {/* Positions Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <div
                            key={i}
                            className="h-64 bg-gray-200 rounded-xl animate-pulse"
                        />
                    ))}
                </div>
            ) : filteredPositions.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-16 bg-gray-50 rounded-xl"
                >
                    <p className="text-gray-500 mb-2">
                        Žádné pozice neodpovídají vašim filtrům
                    </p>
                    <Button variant="link" onClick={clearFilters}>
                        Vymazat filtry
                    </Button>
                </motion.div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredPositions.map((position, index) => (
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
