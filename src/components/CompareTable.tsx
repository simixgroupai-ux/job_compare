"use client";

import { motion } from "framer-motion";
import {
    JobPositionWithCompany,
    BenefitV2,
    TaxSetting,
    UserDeductions,
    defaultUserDeductions,
    calculateGrossSalaryV2,
    calculateNetSalary,
    getBenefitCalculationLabel
} from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Trophy } from "lucide-react";

interface CompareTableProps {
    positions: JobPositionWithCompany[];
    onRemove: (id: string) => void;
    taxSettings?: TaxSetting[];
    userDeductions?: UserDeductions;
    salaryMode?: 'min' | 'max' | 'expected';
}

// Format value
function formatValue(value: number | null, type: string = 'currency'): string {
    if (value === null) return "—";
    if (type === 'percent') return `${value} %`;
    if (type === 'currency') return `${value.toLocaleString("cs-CZ")} Kč`;
    return value.toString();
}

// Get benefit display value
function getBenefitDisplay(benefit: BenefitV2): string {
    return getBenefitCalculationLabel(benefit);
}

// Get all unique benefit keys
function getAllBenefitKeys(positions: JobPositionWithCompany[]): { key: string; name: string }[] {
    const benefitMap = new Map<string, string>();
    positions.forEach(p => {
        if (p.benefits && Array.isArray(p.benefits)) {
            p.benefits.forEach(b => {
                if (!benefitMap.has(b.key)) {
                    benefitMap.set(b.key, b.name);
                }
            });
        }
    });
    return Array.from(benefitMap.entries()).map(([key, name]) => ({ key, name }));
}

// Get benefit for position
function getBenefit(position: JobPositionWithCompany, key: string): BenefitV2 | undefined {
    if (!position.benefits || !Array.isArray(position.benefits)) return undefined;
    return position.benefits.find(b => b.key === key);
}

export function CompareTable({
    positions,
    onRemove,
    taxSettings = [],
    userDeductions = defaultUserDeductions,
    salaryMode = 'expected'
}: CompareTableProps) {
    if (positions.length === 0) {
        return (
            <Card className="border-dashed border-2 border-gray-300">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <Trophy className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                        Zatím žádné pozice k porovnání
                    </h3>
                    <p className="text-gray-500 max-w-sm">
                        Vyberte 2–4 pozice ze seznamu pro detailní srovnání všech parametrů
                    </p>
                </CardContent>
            </Card>
        );
    }

    // Calculate salaries for each position
    const calculatedData = positions.map(p => {
        const grossMin = calculateGrossSalaryV2(p, 'min');
        const grossMax = calculateGrossSalaryV2(p, 'max');
        const grossExp = calculateGrossSalaryV2(p, 'expected');
        const { net: netMin, social, health, taxAfterCredits } = calculateNetSalary(grossMin, taxSettings, userDeductions);
        const { net: netMax } = calculateNetSalary(grossMax, taxSettings, userDeductions);
        const { net: netExp } = calculateNetSalary(grossExp, taxSettings, userDeductions);
        return { grossMin, grossMax, grossExp, netMin, netMax, netExp, social, health, tax: taxAfterCredits };
    });

    // Find best values
    const bestNetMax = Math.max(...calculatedData.map(d => d.netMax));
    const bestGrossMax = Math.max(...calculatedData.map(d => d.grossMax));
    const bestBaseSalary = Math.max(...positions.map(p => p.base_salary));
    const bestHousing = Math.max(...positions.map(p => p.housing_allowance || 0));

    // Get all unique benefits
    const benefitKeys = getAllBenefitKeys(positions);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="overflow-x-auto"
        >
            <Card className="bg-white border-gray-100">
                <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Trophy className="w-5 h-5 text-[#E21E36]" />
                        Porovnání vybraných pozic
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b bg-gray-50">
                                <th className="text-left p-3 text-sm font-medium text-gray-600 min-w-[180px]">
                                    Parametr
                                </th>
                                {positions.map((position) => (
                                    <th key={position.id} className="p-3 min-w-[200px]">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="text-left">
                                                <div className="font-semibold text-gray-900 text-sm">
                                                    {position.position_name}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {position.company?.name}
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6"
                                                onClick={() => onRemove(position.id)}
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {/* Základní info */}
                            <tr className="bg-[#E21E36]/5">
                                <td colSpan={positions.length + 1} className="p-2 text-xs font-semibold text-[#E21E36] uppercase tracking-wide">
                                    Základní informace
                                </td>
                            </tr>
                            <tr className="border-b hover:bg-gray-50/50">
                                <td className="p-3 text-sm text-gray-600 font-medium">Směny</td>
                                {positions.map((p) => (
                                    <td key={p.id} className="p-3 text-sm text-gray-700">
                                        {p.shift_type || "—"}
                                    </td>
                                ))}
                            </tr>
                            <tr className="border-b hover:bg-gray-50/50">
                                <td className="p-3 text-sm text-gray-600 font-medium">Základní mzda</td>
                                {positions.map((p) => {
                                    const isBest = p.base_salary === bestBaseSalary && bestBaseSalary > 0;
                                    return (
                                        <td key={p.id} className={`p-3 text-sm ${isBest ? 'text-[#E21E36] font-bold bg-[#E21E36]/5' : 'text-gray-700'}`}>
                                            {formatValue(p.base_salary, 'currency')}
                                            {isBest && <Badge className="ml-2 bg-[#E21E36]/10 text-[#E21E36] text-xs">Nejlepší</Badge>}
                                        </td>
                                    );
                                })}
                            </tr>
                            <tr className="border-b hover:bg-gray-50/50">
                                <td className="p-3 text-sm text-gray-600 font-medium">Fond hodin</td>
                                {positions.map((p) => (
                                    <td key={p.id} className="p-3 text-sm text-gray-700">
                                        {p.working_hours_fund || 157.5} h/měsíc
                                    </td>
                                ))}
                            </tr>

                            {/* Benefity */}
                            {benefitKeys.length > 0 && (
                                <>
                                    <tr className="bg-purple-50/50">
                                        <td colSpan={positions.length + 1} className="p-2 text-xs font-semibold text-purple-700 uppercase tracking-wide">
                                            Příplatky a bonusy
                                        </td>
                                    </tr>
                                    {benefitKeys.map(({ key, name }) => (
                                        <tr key={key} className="border-b hover:bg-gray-50/50">
                                            <td className="p-3 text-sm text-gray-600 font-medium">
                                                {name}
                                            </td>
                                            {positions.map((p) => {
                                                const benefit = getBenefit(p, key);
                                                return (
                                                    <td key={p.id} className={`p-3 text-sm ${benefit ? 'text-gray-700' : 'text-gray-400'}`}>
                                                        {benefit ? getBenefitDisplay(benefit) : "—"}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </>
                            )}

                            {/* Mzdové shrnutí */}
                            <tr className="bg-green-50/50">
                                <td colSpan={positions.length + 1} className="p-2 text-xs font-semibold text-green-700 uppercase tracking-wide">
                                    Výpočet mzdy
                                </td>
                            </tr>
                            <tr className="border-b hover:bg-gray-50/50">
                                <td className="p-3 text-sm text-gray-600 font-medium">Hrubá mzda</td>
                                {calculatedData.map((data, idx) => {
                                    const isBest = data.grossMax === bestGrossMax && bestGrossMax > 0;
                                    return (
                                        <td key={idx} className={`p-3 text-sm ${isBest ? 'text-[#E21E36] font-bold bg-[#E21E36]/5' : 'text-gray-700'}`}>
                                            {data.grossMin === data.grossMax
                                                ? formatValue(data.grossMax, 'currency')
                                                : `${formatValue(data.grossMin, 'currency')} – ${formatValue(data.grossMax, 'currency')}`
                                            }
                                        </td>
                                    );
                                })}
                            </tr>
                            <tr className="border-b hover:bg-gray-50/50">
                                <td className="p-3 text-sm text-gray-600 font-medium">Sociální + Zdravotní</td>
                                {calculatedData.map((data, idx) => (
                                    <td key={idx} className="p-3 text-sm text-gray-500">
                                        -{formatValue(data.social + data.health, 'currency')}
                                    </td>
                                ))}
                            </tr>
                            <tr className="border-b hover:bg-gray-50/50">
                                <td className="p-3 text-sm text-gray-600 font-medium">Daň z příjmu</td>
                                {calculatedData.map((data, idx) => (
                                    <td key={idx} className="p-3 text-sm text-gray-500">
                                        -{formatValue(data.tax, 'currency')}
                                    </td>
                                ))}
                            </tr>
                            <tr className="border-b bg-[#E21E36]/5">
                                <td className="p-3 text-sm text-[#E21E36] font-bold">Čistá mzda</td>
                                {calculatedData.map((data, idx) => {
                                    const isBest = data.netMax === bestNetMax && bestNetMax > 0;
                                    return (
                                        <td key={idx} className={`p-3 text-sm font-bold ${isBest ? 'text-[#E21E36] bg-[#E21E36]/10' : 'text-gray-900'}`}>
                                            {data.netMin === data.netMax
                                                ? formatValue(data.netMax, 'currency')
                                                : `${formatValue(data.netMin, 'currency')} – ${formatValue(data.netMax, 'currency')}`
                                            }
                                            {isBest && <Badge className="ml-2 bg-[#E21E36] text-white text-xs">Nejlepší</Badge>}
                                        </td>
                                    );
                                })}
                            </tr>

                            {/* Ubytování */}
                            <tr className="bg-amber-50/50">
                                <td colSpan={positions.length + 1} className="p-2 text-xs font-semibold text-amber-700 uppercase tracking-wide">
                                    Příspěvky
                                </td>
                            </tr>
                            <tr className="border-b hover:bg-gray-50/50">
                                <td className="p-3 text-sm text-gray-600 font-medium">Příspěvek na ubytování</td>
                                {positions.map((p) => {
                                    const value = p.housing_allowance || 0;
                                    const isBest = value === bestHousing && bestHousing > 0;
                                    return (
                                        <td key={p.id} className={`p-3 text-sm ${isBest ? 'text-[#E21E36] font-bold bg-[#E21E36]/5' : value === 0 ? 'text-gray-400' : 'text-gray-700'}`}>
                                            {value > 0 ? formatValue(value, 'currency') : 'Není'}
                                            {isBest && value > 0 && <Badge className="ml-2 bg-[#E21E36]/10 text-[#E21E36] text-xs">Nejlepší</Badge>}
                                        </td>
                                    );
                                })}
                            </tr>
                        </tbody>
                    </table>
                </CardContent>
            </Card>
        </motion.div>
    );
}
