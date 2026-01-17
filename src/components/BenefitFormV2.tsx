"use client";

import { useState } from "react";
import {
    BenefitV2,
    BenefitCalcType,
    BenefitUnit,
    BenefitBase,
    BenefitUnitsSource,
    BenefitCategory,
    createDefaultBenefitV2
} from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Slider, RangeSlider } from "@/components/ui/slider";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
    Trash2,
    ChevronDown,
    ChevronUp,
    GripVertical,
    Plus,
    Percent,
    DollarSign,
    Clock
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BenefitFormV2Props {
    benefits: BenefitV2[];
    onChange: (benefits: BenefitV2[]) => void;
    baseSalary?: number;
}

const CALC_TYPE_OPTIONS: { value: BenefitCalcType; label: string; icon: React.ReactNode }[] = [
    { value: 'fixed_amount', label: 'Fixní částka', icon: <DollarSign className="w-4 h-4" /> },
    { value: 'percentage', label: 'Procento', icon: <Percent className="w-4 h-4" /> },
    { value: 'rate', label: 'Sazba (Kč/jednotka)', icon: <Clock className="w-4 h-4" /> },
];

const UNIT_OPTIONS: { value: BenefitUnit; label: string }[] = [
    { value: 'month', label: 'měsíc' },
    { value: 'hour', label: 'hodina' },
    { value: 'shift', label: 'směna' },
    { value: 'day', label: 'den' },
];

const BASE_OPTIONS: { value: BenefitBase; label: string }[] = [
    { value: 'base_salary', label: 'Základní mzda' },
    { value: 'hourly_base', label: 'Hodinová sazba' },
    { value: 'custom_amount', label: 'Vlastní částka' },
];

const UNITS_SOURCE_OPTIONS: { value: BenefitUnitsSource; label: string }[] = [
    { value: 'working_hours_fund', label: 'Fond pracovních hodin' },
    { value: 'night_hours', label: 'Noční hodiny' },
    { value: 'afternoon_hours', label: 'Odpolední hodiny' },
    { value: 'custom_units', label: 'Vlastní počet' },
];

const CATEGORY_OPTIONS: { value: BenefitCategory; label: string; color: string }[] = [
    { value: 'bonus', label: 'Bonus', color: 'bg-green-100 text-green-800' },
    { value: 'allowance', label: 'Příspěvek', color: 'bg-blue-100 text-blue-800' },
    { value: 'premium', label: 'Prémie', color: 'bg-purple-100 text-purple-800' },
    { value: 'shift', label: 'Směnový', color: 'bg-orange-100 text-orange-800' },
    { value: 'other', label: 'Ostatní', color: 'bg-gray-100 text-gray-800' },
];

export function BenefitFormV2({ benefits, onChange, baseSalary = 0 }: BenefitFormV2Props) {
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

    const addBenefit = () => {
        const newBenefit = createDefaultBenefitV2();
        onChange([...benefits, newBenefit]);
        setExpandedIndex(benefits.length);
    };

    const removeBenefit = (index: number) => {
        onChange(benefits.filter((_, i) => i !== index));
        if (expandedIndex === index) setExpandedIndex(null);
    };

    const updateBenefit = (index: number, updates: Partial<BenefitV2>) => {
        const updated = benefits.map((b, i) =>
            i === index ? { ...b, ...updates } : b
        );
        onChange(updated);
    };

    const updateCalculation = (index: number, updates: Partial<BenefitV2['calculation']>) => {
        const benefit = benefits[index];
        updateBenefit(index, {
            calculation: { ...benefit.calculation, ...updates }
        });
    };

    const updateRange = (index: number, updates: Partial<NonNullable<BenefitV2['range']>>) => {
        const benefit = benefits[index];
        updateBenefit(index, {
            range: { ...(benefit.range || { is_range: false }), ...updates }
        });
    };

    return (
        <div className="space-y-3">
            {benefits.map((benefit, index) => {
                const isExpanded = expandedIndex === index;
                const calc = benefit.calculation;
                const range = benefit.range;
                const category = CATEGORY_OPTIONS.find(c => c.value === benefit.category);

                return (
                    <Card
                        key={benefit.key}
                        className={cn(
                            "transition-all duration-200 overflow-hidden",
                            isExpanded ? "ring-2 ring-[#E21E36]/20 shadow-lg" : "hover:shadow-md"
                        )}
                    >
                        {/* Header */}
                        <div
                            className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50/50"
                            onClick={() => setExpandedIndex(isExpanded ? null : index)}
                        >
                            <GripVertical className="w-4 h-4 text-gray-300" />

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-900 truncate">
                                        {benefit.name || 'Nový benefit'}
                                    </span>
                                    {category && (
                                        <span className={cn("text-xs px-2 py-0.5 rounded-full", category.color)}>
                                            {category.label}
                                        </span>
                                    )}
                                </div>
                                <div className="text-sm text-gray-500 mt-0.5">
                                    {calc.type === 'fixed_amount' && `${calc.value} Kč/měs`}
                                    {calc.type === 'percentage' && `${calc.value}%`}
                                    {calc.type === 'rate' && `${calc.value} Kč/${calc.unit === 'hour' ? 'h' : calc.unit === 'shift' ? 'směna' : 'den'}`}
                                    {range?.is_range && ` (${range.min}–${range.max})`}
                                </div>
                            </div>

                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => { e.stopPropagation(); removeBenefit(index); }}
                                className="text-gray-400 hover:text-red-500"
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>

                            {isExpanded ? (
                                <ChevronUp className="w-5 h-5 text-gray-400" />
                            ) : (
                                <ChevronDown className="w-5 h-5 text-gray-400" />
                            )}
                        </div>

                        {/* Expanded Content */}
                        {isExpanded && (
                            <div className="px-4 pb-4 space-y-4 border-t border-gray-100 pt-4">
                                {/* Row 1: Name & Category */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-xs text-gray-500">Název benefitu</Label>
                                        <Input
                                            value={benefit.name}
                                            onChange={(e) => updateBenefit(index, { name: e.target.value })}
                                            placeholder="Např. Docházkový bonus"
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-xs text-gray-500">Kategorie</Label>
                                        <Select
                                            value={benefit.category || 'other'}
                                            onValueChange={(v) => updateBenefit(index, { category: v as BenefitCategory })}
                                        >
                                            <SelectTrigger className="mt-1">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {CATEGORY_OPTIONS.map(opt => (
                                                    <SelectItem key={opt.value} value={opt.value}>
                                                        <span className={cn("inline-block w-2 h-2 rounded-full mr-2", opt.color.split(' ')[0])} />
                                                        {opt.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Row 2: Calculation Type */}
                                <div>
                                    <Label className="text-xs text-gray-500">Typ výpočtu</Label>
                                    <div className="grid grid-cols-3 gap-2 mt-1">
                                        {CALC_TYPE_OPTIONS.map(opt => (
                                            <Button
                                                key={opt.value}
                                                type="button"
                                                variant={calc.type === opt.value ? "default" : "outline"}
                                                className={cn(
                                                    "flex items-center gap-2 h-10",
                                                    calc.type === opt.value && "bg-[#E21E36] hover:bg-[#c91a2e]"
                                                )}
                                                onClick={() => updateCalculation(index, { type: opt.value })}
                                            >
                                                {opt.icon}
                                                <span className="text-sm">{opt.label}</span>
                                            </Button>
                                        ))}
                                    </div>
                                </div>

                                {/* Row 3: Value & Range Toggle */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-xs text-gray-500">
                                            Hodnota {calc.type === 'percentage' ? '(%)' : '(Kč)'}
                                        </Label>
                                        <Input
                                            type="number"
                                            value={calc.value}
                                            onChange={(e) => updateCalculation(index, { value: parseFloat(e.target.value) || 0 })}
                                            className="mt-1"
                                        />
                                    </div>
                                    <div className="flex items-end">
                                        <div className="flex items-center gap-3 h-10 px-3 rounded-lg border border-gray-200 bg-gray-50/50 w-full">
                                            <Switch
                                                checked={range?.is_range || false}
                                                onCheckedChange={(checked) => updateRange(index, { is_range: checked })}
                                            />
                                            <span className="text-sm text-gray-600">Rozsah (min–max)</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Range Slider */}
                                {range?.is_range && (
                                    <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-xl border border-gray-100">
                                        <div className="flex justify-between items-center mb-3">
                                            <Label className="text-xs text-gray-500">Rozsah hodnot</Label>
                                            <div className="flex items-center gap-2 text-sm">
                                                <span className="font-medium text-[#E21E36]">{range.min ?? 0}</span>
                                                <span className="text-gray-400">–</span>
                                                <span className="font-medium text-[#E21E36]">{range.max ?? 100}</span>
                                                <span className="text-gray-500">{calc.type === 'percentage' ? '%' : 'Kč'}</span>
                                            </div>
                                        </div>

                                        <RangeSlider
                                            value={[range.min ?? 0, range.max ?? 100]}
                                            min={0}
                                            max={calc.type === 'percentage' ? 100 : 10000}
                                            step={calc.type === 'percentage' ? 1 : 100}
                                            onValueChange={([min, max]) => updateRange(index, { min, max })}
                                            showValues={false}
                                        />

                                        <div className="grid grid-cols-3 gap-3 mt-4">
                                            <div>
                                                <Label className="text-xs text-gray-500">Min</Label>
                                                <Input
                                                    type="number"
                                                    value={range.min ?? 0}
                                                    onChange={(e) => updateRange(index, { min: parseFloat(e.target.value) || 0 })}
                                                    className="mt-1"
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-xs text-gray-500">Očekávaná</Label>
                                                <Input
                                                    type="number"
                                                    value={range.expected ?? 0}
                                                    onChange={(e) => updateRange(index, { expected: parseFloat(e.target.value) || 0 })}
                                                    className="mt-1"
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-xs text-gray-500">Max</Label>
                                                <Input
                                                    type="number"
                                                    value={range.max ?? 0}
                                                    onChange={(e) => updateRange(index, { max: parseFloat(e.target.value) || 0 })}
                                                    className="mt-1"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Percentage-specific options */}
                                {calc.type === 'percentage' && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label className="text-xs text-gray-500">Základ pro výpočet</Label>
                                            <Select
                                                value={calc.base || 'base_salary'}
                                                onValueChange={(v) => updateCalculation(index, { base: v as BenefitBase })}
                                            >
                                                <SelectTrigger className="mt-1">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {BASE_OPTIONS.map(opt => (
                                                        <SelectItem key={opt.value} value={opt.value}>
                                                            {opt.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        {calc.base === 'custom_amount' && (
                                            <div>
                                                <Label className="text-xs text-gray-500">Vlastní částka (Kč)</Label>
                                                <Input
                                                    type="number"
                                                    value={calc.base_value || 0}
                                                    onChange={(e) => updateCalculation(index, { base_value: parseFloat(e.target.value) || 0 })}
                                                    className="mt-1"
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Rate-specific options */}
                                {calc.type === 'rate' && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label className="text-xs text-gray-500">Jednotka</Label>
                                            <Select
                                                value={calc.unit || 'hour'}
                                                onValueChange={(v) => updateCalculation(index, { unit: v as BenefitUnit })}
                                            >
                                                <SelectTrigger className="mt-1">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {UNIT_OPTIONS.map(opt => (
                                                        <SelectItem key={opt.value} value={opt.value}>
                                                            Kč/{opt.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label className="text-xs text-gray-500">Zdroj jednotek</Label>
                                            <Select
                                                value={calc.units_source || 'working_hours_fund'}
                                                onValueChange={(v) => updateCalculation(index, { units_source: v as BenefitUnitsSource })}
                                            >
                                                <SelectTrigger className="mt-1">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {UNITS_SOURCE_OPTIONS.map(opt => (
                                                        <SelectItem key={opt.value} value={opt.value}>
                                                            {opt.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        {calc.units_source === 'custom_units' && (
                                            <div className="col-span-2">
                                                <Label className="text-xs text-gray-500">Počet jednotek za měsíc</Label>
                                                <Input
                                                    type="number"
                                                    value={calc.units_value || 0}
                                                    onChange={(e) => updateCalculation(index, { units_value: parseFloat(e.target.value) || 0 })}
                                                    className="mt-1"
                                                    placeholder="Např. 16 směn, 20 dnů..."
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Limits */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-xs text-gray-500">Min. hodnota/jednotku (Kč)</Label>
                                        <Input
                                            type="number"
                                            value={calc.floor_per_unit || ''}
                                            onChange={(e) => updateCalculation(index, { floor_per_unit: parseFloat(e.target.value) || 0 })}
                                            className="mt-1"
                                            placeholder="Např. 16 (noční min.)"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-xs text-gray-500">Strop celkem (Kč)</Label>
                                        <Input
                                            type="number"
                                            value={calc.cap_amount || ''}
                                            onChange={(e) => updateCalculation(index, { cap_amount: parseFloat(e.target.value) || 0 })}
                                            className="mt-1"
                                            placeholder="Max. měsíční částka"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </Card>
                );
            })}

            {/* Add Button */}
            <Button
                type="button"
                variant="outline"
                className="w-full border-dashed border-2 hover:border-[#E21E36] hover:text-[#E21E36] h-12"
                onClick={addBenefit}
            >
                <Plus className="w-4 h-4 mr-2" />
                Přidat benefit
            </Button>
        </div>
    );
}
