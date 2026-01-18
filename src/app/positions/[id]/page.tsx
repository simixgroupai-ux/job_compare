"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import {
    JobPositionWithCompany,
    TaxSetting,
    UserDeductions,
    InvaliditaTyp,
    defaultUserDeductions,
    calculateGrossSalaryV2,
    calculateNetSalary,
    calculateBenefitValueV2,
    getBaseHourlyRate
} from "@/types";
import { CompareTable } from "@/components/CompareTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    ArrowLeft,
    Calculator,
    Settings2,
    Plus,
    Minus,
    Baby,
    UserCheck,
    Gauge,
    Trophy,
    Building2,
    MapPin,
    Clock,
    Briefcase
} from "lucide-react";
import { Slider } from "@/components/ui/slider";

export default function PositionDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [position, setPosition] = useState<JobPositionWithCompany | null>(null);
    const [taxSettings, setTaxSettings] = useState<TaxSetting[]>([]);
    const [loading, setLoading] = useState(true);
    const [showDeductions, setShowDeductions] = useState(false);
    const [salaryExpectation, setSalaryExpectation] = useState<number | null>(null);
    const [userDeductions, setUserDeductions] = useState<UserDeductions>(defaultUserDeductions);

    useEffect(() => {
        async function fetchData() {
            if (!params.id) return;

            try {
                const { data: taxData } = await supabase
                    .from("tax_settings")
                    .select("*");
                setTaxSettings(taxData || []);

                const { data: posData, error } = await supabase
                    .from("job_positions")
                    .select("*, company:companies(*)")
                    .eq("id", params.id)
                    .single();

                if (error) throw error;
                setPosition(posData);
            } catch (error) {
                console.error("Error fetching position:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [params.id]);

    const deductionSettings = useMemo(() => {
        return taxSettings.filter(t => t.category === 'deduction');
    }, [taxSettings]);

    const getDeductionValue = (key: string): number => {
        return taxSettings.find(t => t.key === key)?.value ?? 0;
    };

    const formatKc = (val: number) => `${val.toLocaleString('cs-CZ')} Kč`;

    const calculateChildrenDeduction = (count: number): number => {
        let total = 0;
        if (count >= 1) total += getDeductionValue('sleva_dite_1');
        if (count >= 2) total += getDeductionValue('sleva_dite_2');
        if (count >= 3) total += getDeductionValue('sleva_dite_3') * (count - 2);
        return total;
    };

    const invaliditaKeyToType = (key: string): InvaliditaTyp => {
        if (key === 'sleva_inv_1') return 'inv1';
        if (key === 'sleva_inv_2') return 'inv2';
        if (key === 'sleva_inv_3') return 'inv3';
        return 'none';
    };

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

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-[50vh]">
                <div className="w-12 h-12 border-4 border-[#E21E36] border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-gray-500">Načítám detail pozice...</p>
            </div>
        );
    }

    if (!position) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-12 text-center">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Pozice nebyla nalezena</h1>
                <Button onClick={() => router.push("/positions")}>Zpět na seznam</Button>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Button
                variant="ghost"
                className="mb-6 -ml-2 text-gray-500 hover:text-[#E21E36]"
                onClick={() => router.back()}
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Zpět
            </Button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Context & Stats */}
                <div className="lg:col-span-1 space-y-6">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <Card className="overflow-hidden border-gray-100">
                            <div className="h-2 bg-[#E21E36]" />
                            <CardHeader className="pb-4">
                                <div className="space-y-1">
                                    <CardTitle className="text-2xl font-bold">{position.position_name}</CardTitle>
                                    <div className="flex items-center gap-3 text-gray-600">
                                        {position.company?.logo_url ? (
                                            <img
                                                src={position.company.logo_url}
                                                alt={position.company.name}
                                                className="w-8 h-8 rounded-lg object-contain bg-white border border-gray-100"
                                            />
                                        ) : (
                                            <Building2 className="w-5 h-5 text-[#E21E36]" />
                                        )}
                                        <span className="font-bold text-lg">{position.company?.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <MapPin className="w-4 h-4" />
                                        <span>{position.company?.city}</span>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
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

                                {position.company?.description && (
                                    <p className="text-sm text-gray-600 leading-relaxed italic">
                                        "{position.company.description}"
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Tax Settings for this position view */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <Card className="bg-white border-gray-100">
                            <CardHeader className="py-3">
                                <CardTitle className="text-sm flex items-center justify-between">
                                    <span className="flex items-center gap-2">
                                        <Calculator className="w-4 h-4 text-[#E21E36]" />
                                        Nastavení výpočtu
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0"
                                        onClick={() => setShowDeductions(!showDeductions)}
                                    >
                                        <Settings2 className="w-3 h-3" />
                                    </Button>
                                </CardTitle>
                            </CardHeader>
                            <AnimatePresence>
                                {showDeductions && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <CardContent className="pt-0 space-y-4 pb-4">
                                            <div className="space-y-3">
                                                {basicDeductions.map(setting => (
                                                    <div key={setting.key} className="flex items-center space-x-2">
                                                        <Checkbox
                                                            id={`det-${setting.key}`}
                                                            checked={
                                                                setting.key === 'sleva_poplatnik' ? userDeductions.poplatnik :
                                                                    setting.key === 'sleva_student' ? userDeductions.student :
                                                                        setting.key === 'sleva_ztpp' ? userDeductions.ztpp : false
                                                            }
                                                            onCheckedChange={(checked: boolean) => {
                                                                const key = setting.key;
                                                                setUserDeductions(prev => ({
                                                                    ...prev,
                                                                    poplatnik: key === 'sleva_poplatnik' ? checked : prev.poplatnik,
                                                                    student: key === 'sleva_student' ? checked : prev.student,
                                                                    ztpp: key === 'sleva_ztpp' ? checked : prev.ztpp,
                                                                }));
                                                            }}
                                                        />
                                                        <Label htmlFor={`det-${setting.key}`} className="text-xs cursor-pointer text-gray-600">
                                                            {setting.name}
                                                        </Label>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="border-t pt-3">
                                                <Label className="text-[10px] uppercase font-bold text-gray-400 mb-2 block">Děti</Label>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        className="h-6 w-6"
                                                        onClick={() => setUserDeductions(prev => ({ ...prev, pocetDeti: Math.max(0, prev.pocetDeti - 1) }))}
                                                    >
                                                        <Minus className="w-3 h-3" />
                                                    </Button>
                                                    <span className="text-sm font-bold w-6 text-center">{userDeductions.pocetDeti}</span>
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        className="h-6 w-6"
                                                        onClick={() => setUserDeductions(prev => ({ ...prev, pocetDeti: prev.pocetDeti + 1 }))}
                                                    >
                                                        <Plus className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="border-t pt-3">
                                                <Label className="text-[10px] uppercase font-bold text-gray-400 mb-2 block">Invalidita</Label>
                                                <div className="flex flex-col gap-1">
                                                    {['none', ...invaliditaDeductions.map(d => invaliditaKeyToType(d.key))].map((type) => (
                                                        <button
                                                            key={type}
                                                            onClick={() => setUserDeductions(prev => ({ ...prev, invaliditaTyp: type as InvaliditaTyp }))}
                                                            className={cn(
                                                                "text-left px-2 py-1.5 rounded text-[11px] border transition-colors",
                                                                userDeductions.invaliditaTyp === type
                                                                    ? "bg-[#E21E36] text-white border-[#E21E36]"
                                                                    : "bg-white text-gray-600 border-gray-100 hover:border-gray-300"
                                                            )}
                                                        >
                                                            {type === 'none' ? 'Žádná' : taxSettings.find(s => invaliditaKeyToType(s.key) === type)?.name.replace('Invalidita ', '')}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </Card>
                    </motion.div>
                </div>

                {/* Right Column - Detail Table & Simulation */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Simulator Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <Card className="bg-white border-gray-100 shadow-sm">
                            <CardContent className="pt-6">
                                <div className="flex flex-col md:flex-row md:items-center gap-6 mb-4">
                                    <div className="flex items-center gap-2 min-w-[140px]">
                                        <Gauge className="w-5 h-5 text-[#E21E36]" />
                                        <span className="font-bold text-gray-900">Můj výkon</span>
                                    </div>

                                    <div className={cn("flex-1 px-2 transition-opacity duration-200", salaryExpectation === null && "opacity-50 grayscale pointer-events-none")}>
                                        <Slider
                                            value={[salaryExpectation ?? 75]}
                                            onValueChange={([val]) => setSalaryExpectation(val)}
                                            min={0}
                                            max={100}
                                            step={1}
                                            className="w-full"
                                            disabled={salaryExpectation === null}
                                        />
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant={salaryExpectation === 0 ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => setSalaryExpectation(0)}
                                            className={cn("h-8 px-3 text-xs", salaryExpectation === 0 ? "bg-[#E21E36] hover:bg-[#c91a2e]" : "text-gray-500")}
                                        >
                                            Min
                                        </Button>
                                        <Button
                                            variant={salaryExpectation === null ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => setSalaryExpectation(null)}
                                            className={cn("h-8 px-3 text-xs", salaryExpectation === null ? "bg-[#E21E36] hover:bg-[#c91a2e]" : "text-gray-500")}
                                        >
                                            Opt
                                        </Button>
                                        <Button
                                            variant={salaryExpectation === 100 ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => setSalaryExpectation(100)}
                                            className={cn("h-8 px-3 text-xs", salaryExpectation === 100 ? "bg-[#E21E36] hover:bg-[#c91a2e]" : "text-gray-500")}
                                        >
                                            Max
                                        </Button>
                                        <div className="ml-2 px-2 py-1 bg-[#E21E36]/10 text-[#E21E36] rounded text-sm font-black min-w-[48px] text-center">
                                            {salaryExpectation !== null ? `${salaryExpectation}%` : 'EXP'}
                                        </div>
                                    </div>
                                </div>
                                <p className="text-[10px] text-gray-400 italic">
                                    Natažením posuvníku simulujete odhadovaný výkon a vliv na variabilní složky mzdy.
                                    <strong> Optimum</strong> využívá očekávané hodnoty zadané zaměstnavatelem.
                                </p>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Breakdown Table - Reusing CompareTable logic in a single position mode */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <CompareTable
                            positions={[position]}
                            taxSettings={taxSettings}
                            userDeductions={userDeductions}
                            performancePercent={salaryExpectation ?? undefined}
                            onRemove={() => { }}
                        />
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
