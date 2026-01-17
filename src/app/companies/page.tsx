"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { Company } from "@/types";
import { CompanyCard } from "@/components/CompanyCard";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

interface CompanyWithCount extends Company {
    position_count: number;
}

export default function CompaniesPage() {
    const [companies, setCompanies] = useState<CompanyWithCount[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchCompanies() {
            try {
                const { data: companiesData } = await supabase
                    .from("companies")
                    .select("*")
                    .eq("is_active", true)
                    .order("name");

                if (companiesData) {
                    // Get position counts for each company
                    const companiesWithCounts = await Promise.all(
                        companiesData.map(async (company) => {
                            const { count } = await supabase
                                .from("job_positions")
                                .select("*", { count: "exact", head: true })
                                .eq("company_id", company.id);

                            return {
                                ...company,
                                position_count: count || 0,
                            };
                        })
                    );
                    setCompanies(companiesWithCounts);
                }
            } catch (error) {
                console.error("Error fetching companies:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchCompanies();
    }, []);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between mb-8"
            >
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Firmy
                    </h1>
                    <p className="text-gray-600">
                        Přehled všech firem v databázi
                    </p>
                </div>
                <Link href="/admin/companies">
                    <Button className="bg-[#E21E36] hover:bg-[#c91a2e]">
                        <Plus className="w-4 h-4 mr-2" />
                        Přidat firmu
                    </Button>
                </Link>
            </motion.div>

            {/* Companies Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                        <div
                            key={i}
                            className="h-48 bg-gray-200 rounded-xl animate-pulse"
                        />
                    ))}
                </div>
            ) : companies.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-16"
                >
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Plus className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                        Zatím žádné firmy
                    </h3>
                    <p className="text-gray-500 mb-4">
                        Přidejte první firmu do databáze
                    </p>
                    <Link href="/admin/companies">
                        <Button className="bg-[#E21E36] hover:bg-[#c91a2e]">
                            <Plus className="w-4 h-4 mr-2" />
                            Přidat firmu
                        </Button>
                    </Link>
                </motion.div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {companies.map((company, index) => (
                        <CompanyCard
                            key={company.id}
                            company={company}
                            positionCount={company.position_count}
                            index={index}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
