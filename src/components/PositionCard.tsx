"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
    JobPositionWithCompany,
    Benefit,
    TaxSetting,
    calculateGrossSalary,
    calculateNetSalary,
    defaultUserDeductions
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
} from "lucide-react";

interface PositionCardProps {
    position: JobPositionWithCompany;
    index?: number;
    isSelected?: boolean;
    onToggleCompare?: (position: JobPositionWithCompany) => void;
    taxSettings?: TaxSetting[];
}

export function PositionCard({
    position,
    index = 0,
    isSelected = false,
    onToggleCompare,
    taxSettings: externalTaxSettings
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

    // Calculate salaries dynamically
    const grossMin = calculateGrossSalary(position, false);
    const grossMax = calculateGrossSalary(position, true);
    const { net: netMin } = calculateNetSalary(grossMin, taxSettings, defaultUserDeductions);
    const { net: netMax } = calculateNetSalary(grossMax, taxSettings, defaultUserDeductions);

    const getHighlightedBenefits = (): Benefit[] => {
        if (!position.benefits || !Array.isArray(position.benefits)) return [];
        return position.benefits.slice(0, 3);
    };

    const highlightedBenefits = getHighlightedBenefits();

    const formatBenefitDisplay = (benefit: Benefit): string => {
        if (benefit.is_range) {
            const min = benefit.min_value ?? 0;
            const max = benefit.max_value ?? 0;
            if (benefit.calculation_type === 'percentage') {
                return `${min}-${max}%`;
            } else if (benefit.calculation_type === 'hourly_rate') {
                return `${min}-${max} Kč/h`;
            }
            return `${min.toLocaleString("cs-CZ")}-${max.toLocaleString("cs-CZ")} Kč`;
        }

        const value = benefit.value ?? 0;
        if (benefit.calculation_type === 'percentage') {
            return `${value}%`;
        } else if (benefit.calculation_type === 'hourly_rate') {
            return `${value} Kč/h`;
        }
        return `${value.toLocaleString("cs-CZ")} Kč`;
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
                    <div className="flex items-start justify-between">
                        <div>
                            <CardTitle className="text-lg text-gray-900">
                                {position.position_name}
                            </CardTitle>
                            <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                                <Building2 className="w-4 h-4" />
                                <span>{position.company?.name || "Neznámá firma"}</span>
                            </div>
                        </div>
                        {onToggleCompare && (
                            <Button
                                size="sm"
                                variant={isSelected ? "default" : "outline"}
                                onClick={() => onToggleCompare(position)}
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
                        {position.evaluation_level && (
                            <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                                {position.evaluation_level}
                            </Badge>
                        )}
                    </div>

                    {/* Net Salary (calculated) */}
                    <div className="bg-gradient-to-r from-[#E21E36]/5 to-[#E21E36]/10 rounded-lg p-3 border border-[#E21E36]/20">
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="w-4 h-4 text-[#E21E36]" />
                            <span className="text-sm font-medium text-[#E21E36]">Čistá mzda</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-xl font-bold text-[#E21E36]">
                                {formatCurrency(netMin)}
                            </span>
                            {netMax > netMin && (
                                <>
                                    <span className="text-gray-400">–</span>
                                    <span className="text-xl font-bold text-[#E21E36]">
                                        {formatCurrency(netMax)}
                                    </span>
                                </>
                            )}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                            (se slevou na poplatníka)
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
                </CardContent>
            </Card>
        </motion.div>
    );
}
