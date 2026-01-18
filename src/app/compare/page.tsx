"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import {
    Company,
    JobPositionWithCompany,
    TaxSetting,
    UserDeductions,
    InvaliditaTyp,
    defaultUserDeductions,
    calculateGrossSalaryV2,
    calculateNetSalary
} from "@/types";
import { PositionCard } from "@/components/PositionCard";
import { CompareTable } from "@/components/CompareTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { GitCompare, X, Calculator, Settings2, Plus, Minus, Baby, UserCheck, Gauge } from "lucide-react";
import { Slider } from "@/components/ui/slider";

export default function ComparePage() {
    const [positions, setPositions] = useState<JobPositionWithCompany[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [taxSettings, setTaxSettings] = useState<TaxSetting[]>([]);
    const [selectedPositions, setSelectedPositions] = useState<JobPositionWithCompany[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCompany, setSelectedCompany] = useState<string>("all");
    const [showDeductions, setShowDeductions] = useState(true);
    const [salaryExpectation, setSalaryExpectation] = useState<number | null>(null); // null means employer's expected values

    // User deductions state
    const [userDeductions, setUserDeductions] = useState<UserDeductions>(defaultUserDeductions);

    useEffect(() => {
        async function fetchData() {
            try {
                const { data: taxData } = await supabase
                    .from("tax_settings")
                    .select("*");
                setTaxSettings(taxData || []);

                const { data: companiesData } = await supabase
                    .from("companies")
                    .select("*")
                    .eq("is_active", true)
                    .order("name");

                setCompanies(companiesData || []);

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

    // Group tax settings by category
    const deductionSettings = useMemo(() => {
        return taxSettings.filter(t => t.category === 'deduction');
    }, [taxSettings]);

    // Get specific deduction values
    const getDeductionValue = (key: string): number => {
        return taxSettings.find(t => t.key === key)?.value ?? 0;
    };

    const getDeductionName = (key: string): string => {
        return taxSettings.find(t => t.key === key)?.name ?? key;
    };

    // Kategorize deductions
    const basicDeductions = useMemo(() => {
        return deductionSettings.filter(t =>
            t.key === 'sleva_poplatnik' ||
            t.key === 'sleva_student' ||
            t.key === 'sleva_ztpp'
        );
    }, [deductionSettings]);

    const childDeductions = useMemo(() => {
        return deductionSettings.filter(t => t.key.startsWith('sleva_dite'));
    }, [deductionSettings]);

    const invaliditaDeductions = useMemo(() => {
        return deductionSettings.filter(t => t.key.startsWith('sleva_inv'));
    }, [deductionSettings]);

    // Sort positions by calculated net salary
    const sortedPositions = [...positions].sort((a, b) => {
        const grossA = calculateGrossSalaryV2(a, 'max');
        const grossB = calculateGrossSalaryV2(b, 'max');
        const { net: netA } = calculateNetSalary(grossA, taxSettings, userDeductions);
        const { net: netB } = calculateNetSalary(grossB, taxSettings, userDeductions);
        return netB - netA;
    });

    const togglePosition = (position: JobPositionWithCompany) => {
        const isSelected = selectedPositions.some(p => p.id === position.id);

        if (isSelected) {
            setSelectedPositions(prev => prev.filter(p => p.id !== position.id));
        } else if (selectedPositions.length < 4) {
            setSelectedPositions(prev => [...prev, position]);
        }
    };

    const removeFromCompare = (id: string) => {
        setSelectedPositions(prev => prev.filter(p => p.id !== id));
    };

    const clearAll = () => {
        setSelectedPositions([]);
    };

    const filteredPositions = selectedCompany === "all"
        ? sortedPositions
        : sortedPositions.filter(p => p.company_id === selectedCompany);

    // Format currency
    const formatKc = (val: number) => `${val.toLocaleString('cs-CZ')} Kč`;

    // Calculate total children deduction
    const calculateChildrenDeduction = (count: number): number => {
        let total = 0;
        if (count >= 1) total += getDeductionValue('sleva_dite_1');
        if (count >= 2) total += getDeductionValue('sleva_dite_2');
        if (count >= 3) total += getDeductionValue('sleva_dite_3') * (count - 2);
        return total;
    };

    // Map invalidita key to type
    const invaliditaKeyToType = (key: string): InvaliditaTyp => {
        if (key === 'sleva_inv_1') return 'inv1';
        if (key === 'sleva_inv_2') return 'inv2';
        if (key === 'sleva_inv_3') return 'inv3';
        return 'none';
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                    <GitCompare className="w-8 h-8 text-[#E21E36]" />
                    Porovnat pozice
                </h1>
                <p className="text-gray-600">
                    Vyberte 2–4 pozice pro detailní srovnání všech parametrů
                </p>
            </motion.div>

            {/* Tax Deductions Panel - Dynamic from DB */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mb-6"
            >
                <Card className="bg-white border-gray-100">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Calculator className="w-5 h-5 text-[#E21E36]" />
                                Daňové slevy a zvýhodnění
                            </CardTitle>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowDeductions(!showDeductions)}
                            >
                                <Settings2 className="w-4 h-4 mr-1" />
                                {showDeductions ? 'Skrýt' : 'Zobrazit'}
                            </Button>
                        </div>
                    </CardHeader>

                    <AnimatePresence>
                        {showDeductions && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                            >
                                <CardContent className="pt-0 space-y-6">
                                    {/* Základní slevy - dynamicky z DB */}
                                    {basicDeductions.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-700 mb-3">Základní slevy</h4>
                                            <div className="flex flex-wrap gap-6">
                                                {basicDeductions.map(setting => {
                                                    // Mapování key na userDeductions property
                                                    const isChecked =
                                                        setting.key === 'sleva_poplatnik' ? userDeductions.poplatnik :
                                                            setting.key === 'sleva_student' ? userDeductions.student :
                                                                setting.key === 'sleva_ztpp' ? userDeductions.ztpp : false;

                                                    const handleChange = (checked: boolean) => {
                                                        if (setting.key === 'sleva_poplatnik') {
                                                            setUserDeductions(prev => ({ ...prev, poplatnik: checked }));
                                                        } else if (setting.key === 'sleva_student') {
                                                            setUserDeductions(prev => ({ ...prev, student: checked }));
                                                        } else if (setting.key === 'sleva_ztpp') {
                                                            setUserDeductions(prev => ({ ...prev, ztpp: checked }));
                                                        }
                                                    };

                                                    return (
                                                        <div key={setting.id} className="flex items-center space-x-2">
                                                            <Checkbox
                                                                id={setting.key}
                                                                checked={isChecked}
                                                                onCheckedChange={handleChange}
                                                            />
                                                            <Label htmlFor={setting.key} className="text-sm cursor-pointer">
                                                                {setting.name}
                                                                <span className="text-gray-500 ml-1">({formatKc(setting.value)})</span>
                                                            </Label>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Děti - dynamicky z DB */}
                                    {childDeductions.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                                                <Baby className="w-4 h-4" />
                                                Daňové zvýhodnění na děti
                                            </h4>
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={() => setUserDeductions(prev => ({
                                                            ...prev,
                                                            pocetDeti: Math.max(0, prev.pocetDeti - 1)
                                                        }))}
                                                        disabled={userDeductions.pocetDeti === 0}
                                                    >
                                                        <Minus className="w-4 h-4" />
                                                    </Button>
                                                    <div className="w-16 h-10 flex items-center justify-center bg-gray-50 rounded-lg border font-semibold text-lg">
                                                        {userDeductions.pocetDeti}
                                                    </div>
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={() => setUserDeductions(prev => ({
                                                            ...prev,
                                                            pocetDeti: Math.min(10, prev.pocetDeti + 1)
                                                        }))}
                                                        disabled={userDeductions.pocetDeti >= 10}
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {userDeductions.pocetDeti === 0 && "Žádné děti"}
                                                    {userDeductions.pocetDeti > 0 && (
                                                        <>Celkem: {formatKc(calculateChildrenDeduction(userDeductions.pocetDeti))}</>
                                                    )}
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-400 mt-2">
                                                Sazby: {childDeductions.sort((a, b) => a.key.localeCompare(b.key)).map(d => (
                                                    <span key={d.key}>
                                                        {d.name}: {formatKc(d.value)}
                                                        {d.key !== 'sleva_dite_3' ? ', ' : ''}
                                                    </span>
                                                ))}
                                            </p>
                                        </div>
                                    )}

                                    {/* Invalidita - dynamicky z DB */}
                                    {invaliditaDeductions.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                                                <UserCheck className="w-4 h-4" />
                                                Invalidita (pouze jedna možná)
                                            </h4>
                                            <div className="flex flex-wrap gap-3">
                                                <button
                                                    onClick={() => setUserDeductions(prev => ({ ...prev, invaliditaTyp: 'none' }))}
                                                    className={`px-4 py-2 rounded-lg border text-sm transition-all ${userDeductions.invaliditaTyp === 'none'
                                                        ? 'bg-[#E21E36] text-white border-[#E21E36]'
                                                        : 'bg-white text-gray-700 border-gray-200 hover:border-[#E21E36]'
                                                        }`}
                                                >
                                                    Žádná
                                                </button>
                                                {invaliditaDeductions.sort((a, b) => a.key.localeCompare(b.key)).map(setting => {
                                                    const invType = invaliditaKeyToType(setting.key);
                                                    const isSelected = userDeductions.invaliditaTyp === invType;

                                                    return (
                                                        <button
                                                            key={setting.id}
                                                            onClick={() => setUserDeductions(prev => ({ ...prev, invaliditaTyp: invType }))}
                                                            className={`px-4 py-2 rounded-lg border text-sm transition-all ${isSelected
                                                                ? 'bg-[#E21E36] text-white border-[#E21E36]'
                                                                : 'bg-white text-gray-700 border-gray-200 hover:border-[#E21E36]'
                                                                }`}
                                                        >
                                                            {setting.name.replace('Invalidita ', '')}
                                                            <span className={`ml-1 ${isSelected ? 'text-white/80' : 'text-gray-400'}`}>
                                                                ({formatKc(setting.value)})
                                                            </span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </Card>
            </motion.div>

            {/* Salary Expectation Slider */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="mb-6"
            >
                <Card className="bg-white border-gray-100">
                    <CardContent className="pt-6">
                        <div className="flex flex-col md:flex-row md:items-center gap-6 mb-4">
                            <div className="flex items-center gap-2 min-w-[160px]">
                                <Gauge className="w-5 h-5 text-[#E21E36]" />
                                <span className="font-semibold text-gray-900">Simulace výkonu</span>
                            </div>

                            <div className={cn("flex-1 flex flex-col gap-2 transition-opacity duration-200", salaryExpectation === null && "opacity-50 grayscale pointer-events-none")}>
                                <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
                                    <span className="w-12 text-right">RNOR (0%)</span>
                                    <Slider
                                        value={[salaryExpectation ?? 75]}
                                        onValueChange={([val]) => setSalaryExpectation(val)}
                                        min={0}
                                        max={100}
                                        step={1}
                                        className="flex-1"
                                        disabled={salaryExpectation === null}
                                    />
                                    <span className="w-12">NORN (100%)</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant={salaryExpectation === 0 ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setSalaryExpectation(0)}
                                    className={salaryExpectation === 0 ? "bg-[#E21E36] hover:bg-[#c91a2e] text-white" : "text-gray-600"}
                                >
                                    Minimum
                                </Button>
                                <Button
                                    variant={salaryExpectation === null ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setSalaryExpectation(null)}
                                    className={salaryExpectation === null ? "bg-[#E21E36] hover:bg-[#c91a2e] text-white" : "text-gray-600"}
                                >
                                    Optimum
                                </Button>
                                <Button
                                    variant={salaryExpectation === 100 ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setSalaryExpectation(100)}
                                    className={salaryExpectation === 100 ? "bg-[#E21E36] hover:bg-[#c91a2e] text-white" : "text-gray-600"}
                                >
                                    Maximum
                                </Button>
                                <div className="ml-2 px-3 py-1 bg-[#E21E36]/10 text-[#E21E36] rounded-md font-bold min-w-[50px] text-center">
                                    {salaryExpectation !== null ? `${salaryExpectation}%` : 'EXP'}
                                </div>
                            </div>
                        </div>
                        <p className="text-[11px] text-gray-500 bg-gray-50 p-2 rounded border border-gray-100 italic">
                            💡 Posuvníkem simulujete své očekávané pracovní nasazení. To ovlivňuje výpočet bonusů, které jsou v datech zadány jako rozsah (od–do).
                            <strong> Minimum (RNOR)</strong> je garantovaný základ, <strong>Maximum (NORN)</strong> je plný výkon.
                        </p>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Selection bar */}
            <AnimatePresence>
                {selectedPositions.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-[#E21E36]/5 border border-[#E21E36]/20 rounded-xl p-4 mb-6"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <span className="font-medium text-[#E21E36]">
                                    Vybrané pozice
                                </span>
                                <Badge className="bg-[#E21E36]">
                                    {selectedPositions.length}/4
                                </Badge>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearAll}
                                className="text-[#E21E36] hover:text-[#c91a2e]"
                            >
                                <X className="w-4 h-4 mr-1" />
                                Zrušit výběr
                            </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {selectedPositions.map((position) => (
                                <Badge
                                    key={position.id}
                                    variant="secondary"
                                    className="bg-white border border-[#E21E36]/20 text-gray-900 py-1 px-3"
                                >
                                    {position.position_name}
                                    <span className="text-gray-500 ml-1">
                                        ({position.company?.name})
                                    </span>
                                    <button
                                        onClick={() => removeFromCompare(position.id)}
                                        className="ml-2 hover:text-red-500"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Compare Table */}
            {selectedPositions.length >= 2 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <CompareTable
                        positions={selectedPositions}
                        onRemove={removeFromCompare}
                        taxSettings={taxSettings}
                        userDeductions={userDeductions}
                        performancePercent={salaryExpectation ?? undefined}
                    />
                </motion.div>
            )}

            {/* Position Selector */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">
                        Dostupné pozice
                    </h2>
                    <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                        <SelectTrigger className="w-[250px]">
                            <SelectValue placeholder="Filtrovat podle firmy" />
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
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[...Array(4)].map((_, i) => (
                            <div
                                key={i}
                                className="h-64 bg-gray-200 rounded-xl animate-pulse"
                            />
                        ))}
                    </div>
                ) : filteredPositions.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-xl">
                        <p className="text-gray-500">
                            Žádné pozice k zobrazení
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredPositions.map((position, index) => (
                            <PositionCard
                                key={position.id}
                                position={position}
                                index={index}
                                isSelected={selectedPositions.some(p => p.id === position.id)}
                                onToggleCompare={togglePosition}
                                taxSettings={taxSettings}
                                performancePercent={salaryExpectation ?? undefined}
                            />
                        ))}
                    </div>
                )}
            </motion.div>
        </div>
    );
}
