"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
    JobPositionWithCompany,
    BenefitV2,
    TaxSetting,
    calculateGrossSalaryV2,
    calculateNetSalary,
    defaultUserDeductions,
    getBenefitCalculationLabel
} from "@/types";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Building2,
    TrendingUp,
    Clock,
    Briefcase,
    Plus,
    Check,
    Gift,
    Home,
    ExternalLink,
} from "lucide-react";

interface PositionCardProps {
    position: JobPositionWithCompany;
    index?: number;
    isSelected?: boolean;
    onToggleCompare?: (position: JobPositionWithCompany) => void;
    taxSettings?: TaxSetting[];
    performancePercent?: number;
}

export function PositionCard({
    position,
    index = 0,
    isSelected = false,
    onToggleCompare,
    taxSettings: externalTaxSettings,
    performancePercent
}: PositionCardProps) {
    const [taxSettings, setTaxSettings] = useState<TaxSetting[]>(externalTaxSettings || []);

    useEffect(() => {
        if (!externalTaxSettings) {
            supabase.from("tax_settings").select("*").then(({ data }) => {
                setTaxSettings(data || []);
            });
        }
    }, [externalTaxSettings]);

    const formatCurrency = (value: number) => {
        return value.toLocaleString("cs-CZ") + " Kč";
    };

    // Calculate salaries dynamically using v2
    const grossMin = calculateGrossSalaryV2(position, 'min');
    const grossMax = calculateGrossSalaryV2(position, 'max');
    const grossExpected = calculateGrossSalaryV2(position, 'expected');

    // Use performancePercent if provided
    const grossCurrent = performancePercent !== undefined
        ? calculateGrossSalaryV2(position, 'expected', { performancePercent })
        : grossExpected;

    const { net: netMin } = calculateNetSalary(grossMin, taxSettings, defaultUserDeductions);
    const { net: netMax } = calculateNetSalary(grossMax, taxSettings, defaultUserDeductions);
    const { net: netCurrent } = calculateNetSalary(grossCurrent, taxSettings, defaultUserDeductions);

    const getHighlightedBenefits = (): BenefitV2[] => {
        if (!position.benefits || !Array.isArray(position.benefits)) return [];
        return position.benefits.slice(0, 3);
    };

    const highlightedBenefits = getHighlightedBenefits();

    const formatBenefitDisplay = (benefit: BenefitV2): string => {
        return getBenefitCalculationLabel(benefit);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            whileHover={{ scale: 1.01 }}
            layout
        >
            <Card className={`transition-all duration-300 bg-white ${isSelected
                ? "ring-2 ring-[#E21E36] bg-[#E21E36]/5"
                : "hover:shadow-lg border-gray-100"
                }`}>
                <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                            <Link href={`/positions/${position.id}`} className="hover:text-[#E21E36] transition-colors block">
                                <CardTitle className="text-lg font-bold">
                                    {position.position_name}
                                </CardTitle>
                            </Link>
                            <div className="flex items-center gap-2 mt-1">
                                {position.company?.logo_url ? (
                                    <img
                                        src={position.company.logo_url}
                                        alt={position.company.name}
                                        className="w-5 h-5 rounded object-contain bg-white border border-gray-100"
                                    />
                                ) : (
                                    <Building2 className="w-4 h-4 text-gray-600" />
                                )}
                                <span className="text-sm text-gray-600 font-medium">{position.company?.name || "Neznámá firma"}</span>
                            </div>
                        </div>
                        {onToggleCompare && (
                            <Button
                                size="sm"
                                variant={isSelected ? "default" : "outline"}
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onToggleCompare(position);
                                }}
                                className={isSelected ? "bg-[#E21E36] hover:bg-[#c91a2e]" : "border-[#E21E36] text-[#E21E36] hover:bg-[#E21E36]/10"}
                            >
                                {isSelected ? (
                                    <Check className="w-4 h-4" />
                                ) : (
                                    <Plus className="w-4 h-4" />
                                )}
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="space-y-3">
                    {/* Tags */}
                    <div className="flex flex-wrap gap-2">
                        {position.department && (
                            <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                                <Briefcase className="w-3 h-3 mr-1" />
                                {position.department}
                            </Badge>
                        )}
                        {position.shift_type && (
                            <Badge variant="secondary" className="bg-[#E21E36]/10 text-[#E21E36]">
                                <Clock className="w-3 h-3 mr-1" />
                                {position.shift_type}
                            </Badge>
                        )}
                    </div>

                    {/* Net Salary (calculated) */}
                    <div className="bg-gradient-to-r from-[#E21E36]/5 to-[#E21E36]/10 rounded-lg p-3 border border-[#E21E36]/20">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-[#E21E36]" />
                                <span className="text-sm font-medium text-[#E21E36]">Čistá mzda</span>
                            </div>
                            {performancePercent !== undefined && (
                                <Badge variant="outline" className="text-[10px] h-4 py-0 border-[#E21E36]/30 text-[#E21E36] bg-white">
                                    {performancePercent}% výkon
                                </Badge>
                            )}
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-[#E21E36]">
                                {formatCurrency(netCurrent)}
                            </span>
                        </div>
                        <div className="text-[10px] text-gray-500 mt-1">
                            Rozsah: {formatCurrency(netMin)} – {formatCurrency(netMax)}
                            <span className="ml-1 opacity-60">(se slevou na poplatníka)</span>
                        </div>
                    </div>

                    {/* Quick stats */}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="bg-gray-50 rounded-lg p-2">
                            <div className="text-gray-500">Základní mzda</div>
                            <div className="font-semibold text-gray-900">
                                {formatCurrency(position.base_salary)}
                            </div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-2">
                            <div className="text-gray-500">Hrubá mzda</div>
                            <div className="font-semibold text-gray-900">
                                {grossMin !== grossMax
                                    ? `${formatCurrency(grossMin)} - ${formatCurrency(grossMax)}`
                                    : formatCurrency(grossMax)
                                }
                            </div>
                        </div>
                    </div>

                    {/* Highlighted benefits */}
                    {highlightedBenefits.length > 0 && (
                        <div className="border-t border-gray-100 pt-3">
                            <div className="flex items-center gap-2 mb-2 text-sm text-gray-500">
                                <Gift className="w-3 h-3" />
                                <span>Bonusy a příplatky</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {highlightedBenefits.map((benefit, idx) => (
                                    <Badge
                                        key={idx}
                                        variant="outline"
                                        className="bg-[#E21E36]/5 text-[#E21E36] border-[#E21E36]/20"
                                    >
                                        {benefit.name}: {formatBenefitDisplay(benefit)}
                                    </Badge>
                                ))}
                                {position.benefits && position.benefits.length > 3 && (
                                    <Badge variant="outline" className="bg-gray-50 text-gray-500">
                                        +{position.benefits.length - 3} další
                                    </Badge>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Housing allowance */}
                    {position.housing_allowance > 0 && (
                        <div className="text-xs text-[#E21E36] flex items-center gap-1">
                            <Home className="w-3 h-3" />
                            <span>Ubytování: {formatCurrency(position.housing_allowance)}</span>
                        </div>
                    )}

                    <div className="pt-2">
                        <Link href={`/positions/${position.id}`}>
                            <Button variant="outline" size="sm" className="w-full text-xs gap-2 border-gray-200 hover:border-[#E21E36] hover:text-[#E21E36]">
                                <ExternalLink className="w-3 h-3" />
                                Zobrazit detail pozice
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </motion.div >
    );
}
