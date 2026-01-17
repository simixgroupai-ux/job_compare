"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Briefcase, ArrowRight, Settings, Calculator } from "lucide-react";
import Link from "next/link";

export default function AdminPage() {
    const adminSections = [
        {
            title: "Správa firem",
            description: "Přidávejte, upravujte a mažte firmy v databázi",
            icon: Building2,
            href: "/admin/companies",
            color: "from-blue-500 to-blue-600",
        },
        {
            title: "Správa pozic",
            description: "Spravujte pracovní pozice a jejich parametry",
            icon: Briefcase,
            href: "/admin/positions",
            color: "from-purple-500 to-purple-600",
        },
        {
            title: "Výpočet mzdy",
            description: "Upravte sazby daní, pojištění a slevy na dani",
            icon: Calculator,
            href: "/admin/tax-settings",
            color: "from-emerald-500 to-emerald-600",
        },
    ];

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <h1 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-3">
                    <Settings className="w-8 h-8 text-slate-600" />
                    Správa
                </h1>
                <p className="text-slate-600">
                    Spravujte firmy a pracovní pozice
                </p>
            </motion.div>

            {/* Admin Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {adminSections.map((section, index) => {
                    const Icon = section.icon;
                    return (
                        <motion.div
                            key={section.href}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Link href={section.href}>
                                <Card className="h-full hover:shadow-lg transition-all duration-300 cursor-pointer group">
                                    <CardHeader>
                                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${section.color} flex items-center justify-center mb-4`}>
                                            <Icon className="w-7 h-7 text-white" />
                                        </div>
                                        <CardTitle className="text-xl">
                                            {section.title}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-slate-600 mb-4">
                                            {section.description}
                                        </p>
                                        <Button variant="ghost" className="group-hover:translate-x-1 transition-transform">
                                            Přejít
                                            <ArrowRight className="w-4 h-4 ml-2" />
                                        </Button>
                                    </CardContent>
                                </Card>
                            </Link>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
