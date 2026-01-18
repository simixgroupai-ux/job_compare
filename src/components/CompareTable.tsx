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
    calculateBenefitValueV2,
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
    performancePercent?: number; // 0-100 scale
}

// Format value
function formatValue(value: number | null, type: string = 'currency'): string {
    if (value === null) return "—";
    if (type === 'percent') return `${value} %`;
    if (type === 'currency') return `${value.toLocaleString("cs-CZ")} Kč`;
    return value.toString();
}

// Get benefit display value
function getBenefitDisplay(benefit: BenefitV2, position: JobPositionWithCompany, performancePercent?: number): string {
    const fund = position.working_hours_fund || 157.5;
    const baseMonthlySalary = position.salary_input_type === 'hourly'
        ? Math.round((position.base_hourly_rate || 0) * fund)
        : (position.base_salary || 0);

    const val = calculateBenefitValueV2(benefit, {
        base_salary: baseMonthlySalary,
        working_hours_fund: fund,
        hourly_base: baseMonthlySalary / fund,
        performancePercent
    });

    return formatValue(val, 'currency');
}

// Get all unique benefit names
function getAllBenefitKeys(positions: JobPositionWithCompany[]): { key: string; name: string }[] {
    const benefitNames = new Set<string>();
    positions.forEach(p => {
        if (p.benefits && Array.isArray(p.benefits)) {
            p.benefits.forEach(b => {
                if (b.name) {
                    benefitNames.add(b.name.trim());
                }
            });
        }
    });
    return Array.from(benefitNames).map(name => ({ key: name, name }));
}

// Get benefit for position by name
function getBenefit(position: JobPositionWithCompany, name: string): BenefitV2 | undefined {
    if (!position.benefits || !Array.isArray(position.benefits)) return undefined;
    return position.benefits.find(b => b.name?.trim() === name);
}

export function CompareTable({
    positions,
    onRemove,
    taxSettings = [],
    userDeductions = defaultUserDeductions,
    salaryMode = 'expected',
    performancePercent
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

        // Use performancePercent if provided for the "current" view
        const grossCurrent = performancePercent !== undefined
            ? calculateGrossSalaryV2(p, 'expected', { performancePercent })
            : grossExp;

        const { net: netMin } = calculateNetSalary(grossMin, taxSettings, userDeductions);
        const { net: netMax } = calculateNetSalary(grossMax, taxSettings, userDeductions);
        const { net: netExp } = calculateNetSalary(grossExp, taxSettings, userDeductions);
        const { net: netCurrent, social, health, taxAfterCredits: tax } = calculateNetSalary(grossCurrent, taxSettings, userDeductions);

        const fund = p.working_hours_fund || 157.5;
        const baseMonthlySalary = p.salary_input_type === 'hourly'
            ? Math.round((p.base_hourly_rate || 0) * fund)
            : (p.base_salary || 0);

        const totalBonuses = grossCurrent - baseMonthlySalary + (p.housing_allowance || 0);

        return { grossMin, grossMax, grossExp, grossCurrent, netMin, netMax, netExp, netCurrent, social, health, tax, totalBonuses };
    });

    // Find best values based on current performance
    const allNetCurrentSame = calculatedData.every(d => d.netCurrent === calculatedData[0].netCurrent);
    const allGrossCurrentSame = calculatedData.every(d => d.grossCurrent === calculatedData[0].grossCurrent);
    const allBaseSalarySame = positions.every(p => p.base_salary === positions[0].base_salary);
    const allHousingSame = positions.every(p => (p.housing_allowance || 0) === (positions[0].housing_allowance || 0));
    const allTotalBonusesSame = calculatedData.every(d => d.totalBonuses === calculatedData[0].totalBonuses);
    const allSocialSame = calculatedData.every(d => d.social === calculatedData[0].social);
    const allHealthSame = calculatedData.every(d => d.health === calculatedData[0].health);

    const bestNetCurrent = Math.max(...calculatedData.map(d => d.netCurrent));
    const bestGrossCurrent = Math.max(...calculatedData.map(d => d.grossCurrent));
    const bestBaseSalary = Math.max(...positions.map(p => p.base_salary));
    const bestHousing = Math.max(...positions.map(p => p.housing_allowance || 0));
    const bestTotalBonuses = Math.max(...calculatedData.map(d => d.totalBonuses));
    const bestSocial = Math.min(...calculatedData.map(d => d.social)); // Lower is "best" for deductions (less taken)
    const bestHealth = Math.min(...calculatedData.map(d => d.health));

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
                                    const isBest = !allBaseSalarySame && p.base_salary === bestBaseSalary && bestBaseSalary > 0;
                                    return (
                                        <td key={p.id} className={`p-3 text-sm ${isBest ? 'text-[#E21E36] font-bold bg-[#E21E36]/5' : 'text-gray-700'}`}>
                                            {formatValue(p.base_salary, 'currency')}
                                            {isBest && <Badge className="ml-2 bg-[#E21E36]/10 text-[#E21E36] text-[10px]">Nejlepší</Badge>}
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
                                    {benefitKeys.map(({ key, name }) => {
                                        // Find best value for this benefit row
                                        const values = positions.map(p => {
                                            const benefit = getBenefit(p, key);
                                            if (!benefit) return -1;
                                            const fund = p.working_hours_fund || 157.5;
                                            const baseMonthlySalary = p.salary_input_type === 'hourly'
                                                ? Math.round((p.base_hourly_rate || 0) * fund)
                                                : (p.base_salary || 0);
                                            return calculateBenefitValueV2(benefit, {
                                                base_salary: baseMonthlySalary,
                                                working_hours_fund: fund,
                                                hourly_base: baseMonthlySalary / fund,
                                                performancePercent
                                            });
                                        });
                                        const maxValue = Math.max(...values);
                                        const allValuesSame = values.length > 0 && values.every(v => v === values[0]);

                                        return (
                                            <tr key={key} className="border-b hover:bg-gray-50/50">
                                                <td className="p-3 text-sm text-gray-600 font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]" title={name}>
                                                    {name}
                                                </td>
                                                {positions.map((p, idx) => {
                                                    const benefit = getBenefit(p, key);
                                                    const currentVal = values[idx];
                                                    const isBest = !allValuesSame && currentVal === maxValue && maxValue > 0;

                                                    return (
                                                        <td key={p.id} className={`p-3 text-sm ${benefit ? (isBest ? 'text-[#E21E36] font-bold bg-[#E21E36]/5' : 'text-gray-700') : 'text-gray-400'}`}>
                                                            {benefit ? getBenefitDisplay(benefit, p, performancePercent) : "—"}
                                                            {isBest && <Badge className="ml-2 bg-[#E21E36]/10 text-[#E21E36] text-[10px]">Nejlepší</Badge>}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        );
                                    })}

                                    {/* Housing Allowance integrated into Bonuses section - only if at least one position has it */}
                                    {bestHousing > 0 && (
                                        <tr className="border-b hover:bg-gray-50/50">
                                            <td className="p-3 text-sm text-gray-600 font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]">
                                                Příspěvek na ubytování
                                            </td>
                                            {positions.map((p) => {
                                                const value = p.housing_allowance || 0;
                                                const isBest = !allHousingSame && value === bestHousing && bestHousing > 0;
                                                return (
                                                    <td key={p.id} className={`p-3 text-sm ${isBest ? 'text-[#E21E36] font-bold bg-[#E21E36]/5' : value === 0 ? 'text-gray-400' : 'text-gray-700'}`}>
                                                        {value > 0 ? formatValue(value, 'currency') : '—'}
                                                        {isBest && value > 0 && <Badge className="ml-2 bg-[#E21E36]/10 text-[#E21E36] text-[10px]">Nejlepší</Badge>}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    )}

                                    {/* Total Bonuses Sum */}
                                    <tr className="border-b bg-purple-50/30">
                                        <td className="p-3 text-sm text-purple-700 font-bold whitespace-nowrap">
                                            Celkem bonusy
                                        </td>
                                        {calculatedData.map((data, idx) => {
                                            const isBest = !allTotalBonusesSame && data.totalBonuses === bestTotalBonuses && bestTotalBonuses > 0;
                                            return (
                                                <td key={idx} className={`p-3 text-sm font-bold ${isBest ? 'text-[#E21E36] bg-[#E21E36]/5' : 'text-purple-900'}`}>
                                                    {formatValue(data.totalBonuses, 'currency')}
                                                    {isBest && <Badge className="ml-2 bg-[#E21E36]/10 text-[#E21E36] text-[10px]">Nejlepší</Badge>}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                </>
                            )}

                            {/* Mzdové shrnutí */}
                            <tr className="bg-green-50/50">
                                <td colSpan={positions.length + 1} className="p-2 text-xs font-semibold text-green-700 uppercase tracking-wide">
                                    Výpočet mzdy
                                </td>
                            </tr>
                            <tr className="border-b hover:bg-gray-50/50">
                                <td className="p-3 text-sm text-gray-600 font-medium whitespace-nowrap">
                                    Hrubá mzda
                                    <div className="text-[10px] text-gray-400 font-normal">
                                        {performancePercent !== undefined ? `při ${performancePercent}% výkonu` : 'očekávaný výkon'}
                                    </div>
                                </td>
                                {calculatedData.map((data, idx) => {
                                    const isBest = !allGrossCurrentSame && data.grossCurrent === bestGrossCurrent && bestGrossCurrent > 0;
                                    return (
                                        <td key={idx} className={`p-3 text-sm ${isBest ? 'text-[#E21E36] font-bold bg-[#E21E36]/5' : 'text-gray-700'}`}>
                                            {formatValue(data.grossCurrent, 'currency')}
                                            {isBest && <Badge className="ml-2 bg-[#E21E36]/10 text-[#E21E36] text-[10px]">Nejlepší</Badge>}
                                        </td>
                                    );
                                })}
                            </tr>
                            <tr className="border-b hover:bg-gray-50/50">
                                <td className="p-3 text-sm text-gray-600 font-medium">Sociální pojištění</td>
                                {calculatedData.map((data, idx) => {
                                    const isBest = !allSocialSame && data.social === bestSocial && data.social > 0;
                                    return (
                                        <td key={idx} className={`p-3 text-sm ${isBest ? 'text-[#E21E36] font-bold bg-[#E21E36]/5' : 'text-gray-500'}`}>
                                            -{formatValue(data.social, 'currency')}
                                        </td>
                                    );
                                })}
                            </tr>
                            <tr className="border-b hover:bg-gray-50/50">
                                <td className="p-3 text-sm text-gray-600 font-medium">Zdravotní pojištění</td>
                                {calculatedData.map((data, idx) => {
                                    const isBest = !allHealthSame && data.health === bestHealth && data.health > 0;
                                    return (
                                        <td key={idx} className={`p-3 text-sm ${isBest ? 'text-[#E21E36] font-bold bg-[#E21E36]/5' : 'text-gray-500'}`}>
                                            -{formatValue(data.health, 'currency')}
                                        </td>
                                    );
                                })}
                            </tr>
                            <tr className="border-b hover:bg-gray-50/50">
                                <td className="p-3 text-sm text-gray-600 font-medium">Daň z příjmu</td>
                                {calculatedData.map((data, idx) => {
                                    const isBonus = data.tax < 0;
                                    return (
                                        <td key={idx} className={`p-3 text-sm ${isBonus ? 'text-green-600 font-medium' : 'text-gray-500'}`}>
                                            {isBonus ? '+' : '-'}{formatValue(Math.abs(data.tax), 'currency')}
                                            {isBonus && <span className="ml-1 text-[10px] uppercase font-bold">Bonus</span>}
                                        </td>
                                    );
                                })}
                            </tr>
                            <tr className="border-b bg-[#E21E36]/5">
                                <td className="p-3 text-sm text-[#E21E36] font-bold">Čistá mzda</td>
                                {calculatedData.map((data, idx) => {
                                    const isBest = !allNetCurrentSame && data.netCurrent === bestNetCurrent && bestNetCurrent > 0;
                                    return (
                                        <td key={idx} className={`p-3 text-sm font-bold ${isBest ? 'text-[#E21E36] bg-[#E21E36]/10' : 'text-gray-900'}`}>
                                            {formatValue(data.netCurrent, 'currency')}
                                            {isBest && <Badge className="ml-2 bg-[#E21E36] text-white text-[10px]">Nejlepší</Badge>}
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
