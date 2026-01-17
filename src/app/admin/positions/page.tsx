"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import {
    Company,
    JobPosition,
    Benefit,
    TaxSetting,
    BenefitCalculationType,
    SalaryInputType,
    calculateGrossSalary,
    calculateNetSalary,
    getBaseMonthlySalary,
    getBaseHourlyRate,
    defaultUserDeductions
} from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Pencil, Trash2, Briefcase, X, Clock, Banknote } from "lucide-react";

interface PositionForm {
    company_id: string;
    position_name: string;
    department: string;
    shift_type: string;
    evaluation_level: string;
    salary_input_type: SalaryInputType;
    base_salary: number;
    base_hourly_rate: number;
    housing_allowance: number;
    working_hours_fund: number;
    benefits: Benefit[];
}

const defaultForm: PositionForm = {
    company_id: "",
    position_name: "",
    department: "",
    shift_type: "",
    evaluation_level: "",
    salary_input_type: "monthly",
    base_salary: 0,
    base_hourly_rate: 0,
    housing_allowance: 3000,
    working_hours_fund: 157.5,
    benefits: [],
};

interface NewBenefitForm {
    key: string;
    name: string;
    calculation_type: BenefitCalculationType;
    is_range: boolean;
    value: number;
    min_value: number;
    max_value: number;
}

const defaultNewBenefit: NewBenefitForm = {
    key: "",
    name: "",
    calculation_type: "fixed_amount",
    is_range: false,
    value: 0,
    min_value: 0,
    max_value: 0,
};

export default function AdminPositionsPage() {
    const [positions, setPositions] = useState<(JobPosition & { company?: Company })[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [taxSettings, setTaxSettings] = useState<TaxSetting[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingPosition, setEditingPosition] = useState<JobPosition | null>(null);
    const [formData, setFormData] = useState<PositionForm>(defaultForm);
    const [filterCompany, setFilterCompany] = useState<string>("all");
    const [newBenefit, setNewBenefit] = useState<NewBenefitForm>(defaultNewBenefit);

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        try {
            const { data: companiesData } = await supabase
                .from("companies")
                .select("*")
                .order("name");
            setCompanies(companiesData || []);

            const { data: positionsData } = await supabase
                .from("job_positions")
                .select("*, company:companies(*)")
                .order("position_name");
            setPositions(positionsData || []);

            const { data: taxData } = await supabase
                .from("tax_settings")
                .select("*");
            setTaxSettings(taxData || []);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    }

    function openCreateDialog() {
        setEditingPosition(null);
        setFormData({
            ...defaultForm,
            company_id: companies[0]?.id || "",
        });
        setNewBenefit(defaultNewBenefit);
        setIsDialogOpen(true);
    }

    function openEditDialog(position: JobPosition) {
        setEditingPosition(position);
        setFormData({
            company_id: position.company_id,
            position_name: position.position_name,
            department: position.department || "",
            shift_type: position.shift_type || "",
            evaluation_level: position.evaluation_level || "",
            salary_input_type: position.salary_input_type || "monthly",
            base_salary: position.base_salary || 0,
            base_hourly_rate: position.base_hourly_rate || 0,
            housing_allowance: position.housing_allowance || 0,
            working_hours_fund: position.working_hours_fund || 157.5,
            benefits: position.benefits || [],
        });
        setNewBenefit(defaultNewBenefit);
        setIsDialogOpen(true);
    }

    // Přepočet při změně typu vstupu nebo hodnoty
    function handleSalaryInputTypeChange(type: SalaryInputType) {
        const fund = formData.working_hours_fund || 157.5;

        if (type === 'hourly' && formData.salary_input_type === 'monthly') {
            // Přepínám z měsíční na hodinovou - přepočti
            const hourly = Math.round((formData.base_salary / fund) * 100) / 100;
            setFormData(prev => ({ ...prev, salary_input_type: type, base_hourly_rate: hourly }));
        } else if (type === 'monthly' && formData.salary_input_type === 'hourly') {
            // Přepínám z hodinové na měsíční - přepočti
            const monthly = Math.round(formData.base_hourly_rate * fund);
            setFormData(prev => ({ ...prev, salary_input_type: type, base_salary: monthly }));
        } else {
            setFormData(prev => ({ ...prev, salary_input_type: type }));
        }
    }

    // Vypočítaná hodnota pro zobrazení
    const calculatedMonthly = formData.salary_input_type === 'hourly'
        ? Math.round(formData.base_hourly_rate * formData.working_hours_fund)
        : formData.base_salary;

    const calculatedHourly = formData.salary_input_type === 'monthly'
        ? Math.round((formData.base_salary / formData.working_hours_fund) * 100) / 100
        : formData.base_hourly_rate;

    function addBenefit() {
        if (!newBenefit.key || !newBenefit.name) return;

        const benefit: Benefit = {
            key: newBenefit.key,
            name: newBenefit.name,
            calculation_type: newBenefit.calculation_type,
            is_range: newBenefit.is_range,
        };

        if (newBenefit.is_range) {
            benefit.min_value = newBenefit.min_value;
            benefit.max_value = newBenefit.max_value;
        } else {
            benefit.value = newBenefit.value;
        }

        setFormData(prev => ({
            ...prev,
            benefits: [...prev.benefits, benefit]
        }));
        setNewBenefit(defaultNewBenefit);
    }

    function removeBenefit(key: string) {
        setFormData(prev => ({
            ...prev,
            benefits: prev.benefits.filter(b => b.key !== key)
        }));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        try {
            const data = {
                company_id: formData.company_id,
                position_name: formData.position_name,
                department: formData.department || null,
                shift_type: formData.shift_type || null,
                evaluation_level: formData.evaluation_level || null,
                salary_input_type: formData.salary_input_type,
                base_salary: formData.salary_input_type === 'monthly' ? formData.base_salary : calculatedMonthly,
                base_hourly_rate: formData.salary_input_type === 'hourly' ? formData.base_hourly_rate : calculatedHourly,
                housing_allowance: formData.housing_allowance,
                working_hours_fund: formData.working_hours_fund,
                benefits: formData.benefits,
            };

            if (editingPosition) {
                await supabase
                    .from("job_positions")
                    .update(data)
                    .eq("id", editingPosition.id);
            } else {
                await supabase.from("job_positions").insert(data);
            }

            setIsDialogOpen(false);
            fetchData();
        } catch (error) {
            console.error("Error saving position:", error);
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("Opravdu chcete smazat tuto pozici?")) return;

        try {
            await supabase.from("job_positions").delete().eq("id", id);
            fetchData();
        } catch (error) {
            console.error("Error deleting position:", error);
        }
    }

    const filteredPositions = filterCompany === "all"
        ? positions
        : positions.filter(p => p.company_id === filterCompany);

    const formatCurrency = (value: number) =>
        value > 0 ? `${value.toLocaleString("cs-CZ")} Kč` : "—";

    const getNetSalary = (position: JobPosition) => {
        const gross = calculateGrossSalary(position, true);
        const { net } = calculateNetSalary(gross, taxSettings, defaultUserDeductions);
        return net;
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between mb-8"
            >
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                        <Briefcase className="w-8 h-8 text-[#E21E36]" />
                        Správa pozic
                    </h1>
                    <p className="text-gray-600">
                        Přidávejte a upravujte pracovní pozice
                    </p>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={openCreateDialog} disabled={companies.length === 0} className="bg-[#E21E36] hover:bg-[#c91a2e]">
                            <Plus className="w-4 h-4 mr-2" />
                            Přidat pozici
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>
                                {editingPosition ? "Upravit pozici" : "Nová pozice"}
                            </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Základní info */}
                            <div className="space-y-4">
                                <h3 className="font-semibold text-gray-900">Základní informace</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Firma *</Label>
                                        <Select
                                            value={formData.company_id}
                                            onValueChange={(v) => setFormData({ ...formData, company_id: v })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Vyberte firmu" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {companies.map((c) => (
                                                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label>Název pozice *</Label>
                                        <Input
                                            value={formData.position_name}
                                            onChange={(e) => setFormData({ ...formData, position_name: e.target.value })}
                                            placeholder="např. Operátor"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <Label>Oddělení</Label>
                                        <Input
                                            value={formData.department}
                                            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                            placeholder="např. Výroba"
                                        />
                                    </div>
                                    <div>
                                        <Label>Typ směny</Label>
                                        <Select
                                            value={formData.shift_type}
                                            onValueChange={(v) => setFormData({ ...formData, shift_type: v })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Vyberte" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="2 směny">2 směny</SelectItem>
                                                <SelectItem value="3 směny">3 směny</SelectItem>
                                                <SelectItem value="nepřetržitý">Nepřetržitý</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label>Úroveň</Label>
                                        <Select
                                            value={formData.evaluation_level}
                                            onValueChange={(v) => setFormData({ ...formData, evaluation_level: v })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Vyberte" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="RNOR">RNOR (min)</SelectItem>
                                                <SelectItem value="NORN">NORN (max)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            {/* Mzda */}
                            <div className="space-y-4 border-t pt-4">
                                <h3 className="font-semibold text-gray-900">Základní mzda</h3>

                                {/* Přepínač měsíční / hodinová */}
                                <div className="flex gap-2 mb-4">
                                    <button
                                        type="button"
                                        onClick={() => handleSalaryInputTypeChange('monthly')}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${formData.salary_input_type === 'monthly'
                                                ? 'bg-[#E21E36] text-white border-[#E21E36]'
                                                : 'bg-white text-gray-700 border-gray-200 hover:border-[#E21E36]'
                                            }`}
                                    >
                                        <Banknote className="w-4 h-4" />
                                        Měsíční mzda
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleSalaryInputTypeChange('hourly')}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${formData.salary_input_type === 'hourly'
                                                ? 'bg-[#E21E36] text-white border-[#E21E36]'
                                                : 'bg-white text-gray-700 border-gray-200 hover:border-[#E21E36]'
                                            }`}
                                    >
                                        <Clock className="w-4 h-4" />
                                        Hodinová sazba
                                    </button>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    {formData.salary_input_type === 'monthly' ? (
                                        <>
                                            <div>
                                                <Label>Základní mzda (Kč/měsíc)</Label>
                                                <Input
                                                    type="number"
                                                    value={formData.base_salary}
                                                    onChange={(e) => setFormData({ ...formData, base_salary: parseInt(e.target.value) || 0 })}
                                                    className="text-lg font-medium"
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-gray-400">= Hodinová sazba</Label>
                                                <div className="h-10 flex items-center px-3 bg-gray-50 border rounded-md text-gray-500">
                                                    {calculatedHourly.toFixed(2)} Kč/h
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div>
                                                <Label>Hodinová sazba (Kč/h)</Label>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    value={formData.base_hourly_rate}
                                                    onChange={(e) => setFormData({ ...formData, base_hourly_rate: parseFloat(e.target.value) || 0 })}
                                                    className="text-lg font-medium"
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-gray-400">= Měsíční mzda</Label>
                                                <div className="h-10 flex items-center px-3 bg-gray-50 border rounded-md text-gray-500">
                                                    {calculatedMonthly.toLocaleString('cs-CZ')} Kč
                                                </div>
                                            </div>
                                        </>
                                    )}
                                    <div>
                                        <Label>Fond hodin (h/měsíc)</Label>
                                        <Input
                                            type="number"
                                            step="0.5"
                                            value={formData.working_hours_fund}
                                            onChange={(e) => setFormData({ ...formData, working_hours_fund: parseFloat(e.target.value) || 157.5 })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-2">
                                    <div>
                                        <Label>Příspěvek na ubytování (Kč)</Label>
                                        <Input
                                            type="number"
                                            value={formData.housing_allowance}
                                            onChange={(e) => setFormData({ ...formData, housing_allowance: parseInt(e.target.value) || 0 })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Benefity */}
                            <div className="space-y-4 border-t pt-4">
                                <h3 className="font-semibold text-gray-900">Benefity a příplatky</h3>

                                {formData.benefits.length > 0 && (
                                    <div className="space-y-2">
                                        {formData.benefits.map((b) => (
                                            <div key={b.key} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
                                                <span className="flex-1 text-sm">
                                                    <strong>{b.name}</strong>: {
                                                        b.is_range
                                                            ? `${b.min_value}-${b.max_value}`
                                                            : b.value
                                                    }
                                                    {b.calculation_type === 'percentage' && '%'}
                                                    {b.calculation_type === 'hourly_rate' && ' Kč/h'}
                                                    {b.calculation_type === 'fixed_amount' && ' Kč'}
                                                </span>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 text-red-500"
                                                    onClick={() => removeBenefit(b.key)}
                                                >
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <Label>Klíč (unikátní ID)</Label>
                                            <Input
                                                value={newBenefit.key}
                                                onChange={(e) => setNewBenefit({ ...newBenefit, key: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                                                placeholder="např. kpi_bonus"
                                            />
                                        </div>
                                        <div>
                                            <Label>Název</Label>
                                            <Input
                                                value={newBenefit.name}
                                                onChange={(e) => setNewBenefit({ ...newBenefit, name: e.target.value })}
                                                placeholder="např. KPI bonus"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <Label>Typ výpočtu</Label>
                                            <Select
                                                value={newBenefit.calculation_type}
                                                onValueChange={(v: BenefitCalculationType) => setNewBenefit({ ...newBenefit, calculation_type: v })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="fixed_amount">Fixní částka (Kč)</SelectItem>
                                                    <SelectItem value="hourly_rate">Hodinová sazba (Kč/h)</SelectItem>
                                                    <SelectItem value="percentage">Procento ze základu (%)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="flex items-end gap-2">
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="is_range"
                                                    checked={newBenefit.is_range}
                                                    onCheckedChange={(checked) => setNewBenefit({ ...newBenefit, is_range: !!checked })}
                                                />
                                                <Label htmlFor="is_range">Rozsah (min-max)</Label>
                                            </div>
                                        </div>
                                    </div>
                                    {newBenefit.is_range ? (
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <Label>Min hodnota</Label>
                                                <Input
                                                    type="number"
                                                    value={newBenefit.min_value}
                                                    onChange={(e) => setNewBenefit({ ...newBenefit, min_value: parseFloat(e.target.value) || 0 })}
                                                />
                                            </div>
                                            <div>
                                                <Label>Max hodnota</Label>
                                                <Input
                                                    type="number"
                                                    value={newBenefit.max_value}
                                                    onChange={(e) => setNewBenefit({ ...newBenefit, max_value: parseFloat(e.target.value) || 0 })}
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            <Label>Hodnota</Label>
                                            <Input
                                                type="number"
                                                value={newBenefit.value}
                                                onChange={(e) => setNewBenefit({ ...newBenefit, value: parseFloat(e.target.value) || 0 })}
                                            />
                                        </div>
                                    )}
                                    <Button type="button" variant="outline" size="sm" onClick={addBenefit}>
                                        <Plus className="w-3 h-3 mr-1" />
                                        Přidat benefit
                                    </Button>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-4 border-t">
                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                    Zrušit
                                </Button>
                                <Button type="submit" className="bg-[#E21E36] hover:bg-[#c91a2e]">
                                    {editingPosition ? "Uložit změny" : "Vytvořit"}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </motion.div>

            {/* Filter */}
            <div className="mb-4">
                <Select value={filterCompany} onValueChange={setFilterCompany}>
                    <SelectTrigger className="w-[300px]">
                        <SelectValue placeholder="Filtrovat podle firmy" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Všechny firmy</SelectItem>
                        {companies.map((c) => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <Card className="bg-white border-gray-100">
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="p-8 text-center text-gray-500">Načítám...</div>
                        ) : companies.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                Nejdříve přidejte firmu v sekci Správa firem.
                            </div>
                        ) : filteredPositions.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                Zatím žádné pozice. Přidejte první pomocí tlačítka výše.
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Pozice</TableHead>
                                        <TableHead>Firma</TableHead>
                                        <TableHead>Směny</TableHead>
                                        <TableHead>Základ</TableHead>
                                        <TableHead>Hodinová</TableHead>
                                        <TableHead>Čistá mzda</TableHead>
                                        <TableHead className="text-right">Akce</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredPositions.map((position) => (
                                        <TableRow key={position.id}>
                                            <TableCell className="font-medium">{position.position_name}</TableCell>
                                            <TableCell>{position.company?.name || "—"}</TableCell>
                                            <TableCell>{position.shift_type || "—"}</TableCell>
                                            <TableCell>
                                                {formatCurrency(getBaseMonthlySalary(position))}
                                            </TableCell>
                                            <TableCell className="text-gray-500">
                                                {getBaseHourlyRate(position).toFixed(2)} Kč/h
                                            </TableCell>
                                            <TableCell className="text-[#E21E36] font-medium">
                                                {formatCurrency(getNetSalary(position))}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={() => openEditDialog(position)}
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="text-red-500 hover:text-red-700"
                                                        onClick={() => handleDelete(position.id)}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
