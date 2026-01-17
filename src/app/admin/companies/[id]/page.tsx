"use client";

import { useEffect, useState, use } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import {
    Company,
    JobPosition,
    BenefitV2,
    TaxSetting,
    SalaryInputType,
    calculateGrossSalaryV2,
    calculateNetSalary,
    defaultUserDeductions,
    createDefaultBenefitV2
} from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Plus,
    Pencil,
    Trash2,
    Briefcase,
    Clock,
    Banknote,
    Building2,
    ArrowLeft,
    Save,
    MapPin,
    Loader2,
    TrendingUp,
    TrendingDown
} from "lucide-react";
import Link from "next/link";
import { parseGoogleMapsUrl } from "@/app/actions/parse-google-maps";
import { BenefitFormV2 } from "@/components/BenefitFormV2";

interface PositionForm {
    position_name: string;
    department: string;
    shift_type: string;
    salary_input_type: SalaryInputType;
    base_salary: number;
    base_hourly_rate: number;
    housing_allowance: number;
    working_hours_fund: number;
    benefits: BenefitV2[];
}

const defaultPositionForm: PositionForm = {
    position_name: "",
    department: "",
    shift_type: "2 směny",
    salary_input_type: "monthly",
    base_salary: 0,
    base_hourly_rate: 0,
    housing_allowance: 3000,
    working_hours_fund: 157.5,
    benefits: [],
};

export default function CompanyDetailAdminPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [company, setCompany] = useState<Company | null>(null);
    const [positions, setPositions] = useState<JobPosition[]>([]);
    const [taxSettings, setTaxSettings] = useState<TaxSetting[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [gpsLoading, setGpsLoading] = useState(false);

    // Company Form State
    const [companyForm, setCompanyForm] = useState({
        name: "",
        logo_url: "",
        description: "",
        address: "",
        city: "",
        maps_url: "",
        web_url: "",
        latitude: 0,
        longitude: 0,
    });

    // Position Form State
    const [isPositionDialogOpen, setIsPositionDialogOpen] = useState(false);
    const [editingPosition, setEditingPosition] = useState<JobPosition | null>(null);
    const [positionForm, setPositionForm] = useState<PositionForm>(defaultPositionForm);

    useEffect(() => {
        fetchData();
    }, [id]);

    async function fetchData() {
        try {
            const { data: companyData } = await supabase
                .from("companies")
                .select("*")
                .eq("id", id)
                .single();

            if (companyData) {
                setCompany(companyData);
                setCompanyForm({
                    name: companyData.name,
                    logo_url: companyData.logo_url || "",
                    description: companyData.description || "",
                    address: companyData.address || "",
                    city: companyData.city || "",
                    maps_url: companyData.maps_url || "",
                    web_url: companyData.web_url || "",
                    latitude: companyData.latitude || 0,
                    longitude: companyData.longitude || 0,
                });
            }

            const { data: positionsData } = await supabase
                .from("job_positions")
                .select("*")
                .eq("company_id", id)
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

    async function handleParseGps() {
        if (!companyForm.maps_url) return;
        setGpsLoading(true);
        try {
            const result = await parseGoogleMapsUrl(companyForm.maps_url);
            if (result) {
                setCompanyForm(prev => ({ ...prev, latitude: result.lat, longitude: result.lng }));
            }
        } catch (error) {
            console.error("GPS parse error:", error);
        } finally {
            setGpsLoading(false);
        }
    }

    async function handleUpdateCompany(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        try {
            await supabase
                .from("companies")
                .update({
                    ...companyForm,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", id);

            const { data } = await supabase.from("companies").select("*").eq("id", id).single();
            if (data) setCompany(data);

            alert("Údaje firmy byly uloženy.");
        } catch (error) {
            console.error("Error updating company:", error);
            alert("Nepodařilo se uložit změny.");
        } finally {
            setSaving(false);
        }
    }

    function openCreatePosition() {
        setEditingPosition(null);
        setPositionForm(defaultPositionForm);
        setIsPositionDialogOpen(true);
    }

    function openEditPosition(position: JobPosition) {
        setEditingPosition(position);
        setPositionForm({
            position_name: position.position_name,
            department: position.department || "",
            shift_type: position.shift_type || "",
            salary_input_type: position.salary_input_type || "monthly",
            base_salary: position.base_salary || 0,
            base_hourly_rate: position.base_hourly_rate || 0,
            housing_allowance: position.housing_allowance || 0,
            working_hours_fund: position.working_hours_fund || 157.5,
            benefits: position.benefits || [],
        });
        setIsPositionDialogOpen(true);
    }

    const calculatedMonthly = positionForm.salary_input_type === 'hourly'
        ? Math.round(positionForm.base_hourly_rate * positionForm.working_hours_fund)
        : positionForm.base_salary;

    const calculatedHourly = positionForm.salary_input_type === 'monthly'
        ? Math.round((positionForm.base_salary / positionForm.working_hours_fund) * 100) / 100
        : positionForm.base_hourly_rate;

    function handleSalaryInputTypeChange(type: SalaryInputType) {
        const fund = positionForm.working_hours_fund || 157.5;
        if (type === 'hourly' && positionForm.salary_input_type === 'monthly') {
            const hourly = Math.round((positionForm.base_salary / fund) * 100) / 100;
            setPositionForm(prev => ({ ...prev, salary_input_type: type, base_hourly_rate: hourly }));
        } else if (type === 'monthly' && positionForm.salary_input_type === 'hourly') {
            const monthly = Math.round(positionForm.base_hourly_rate * fund);
            setPositionForm(prev => ({ ...prev, salary_input_type: type, base_salary: monthly }));
        } else {
            setPositionForm(prev => ({ ...prev, salary_input_type: type }));
        }
    }

    async function handleSavePosition(e: React.FormEvent) {
        e.preventDefault();
        try {
            const data = {
                company_id: id,
                position_name: positionForm.position_name,
                department: positionForm.department || null,
                shift_type: positionForm.shift_type || null,
                salary_input_type: positionForm.salary_input_type,
                base_salary: positionForm.salary_input_type === 'monthly' ? positionForm.base_salary : calculatedMonthly,
                base_hourly_rate: positionForm.salary_input_type === 'hourly' ? positionForm.base_hourly_rate : calculatedHourly,
                housing_allowance: positionForm.housing_allowance,
                working_hours_fund: positionForm.working_hours_fund,
                benefits: positionForm.benefits,
            };

            if (editingPosition) {
                await supabase.from("job_positions").update(data).eq("id", editingPosition.id);
            } else {
                await supabase.from("job_positions").insert(data);
            }

            setIsPositionDialogOpen(false);
            fetchData();
        } catch (error) {
            console.error("Error saving position:", error);
        }
    }

    async function handleDeletePosition(posId: string) {
        if (!confirm("Opravdu chcete smazat tuto pozici?")) return;
        try {
            await supabase.from("job_positions").delete().eq("id", posId);
            fetchData();
        } catch (error) {
            console.error("Error deleting position:", error);
        }
    }

    const formatCurrency = (value: number) => value > 0 ? `${value.toLocaleString("cs-CZ")} Kč` : "—";

    const getSalaryRange = (pos: JobPosition) => {
        const grossMin = calculateGrossSalaryV2(pos, 'min');
        const grossMax = calculateGrossSalaryV2(pos, 'max');
        const grossExp = calculateGrossSalaryV2(pos, 'expected');
        const netMin = calculateNetSalary(grossMin, taxSettings, defaultUserDeductions).net;
        const netMax = calculateNetSalary(grossMax, taxSettings, defaultUserDeductions).net;
        const netExp = calculateNetSalary(grossExp, taxSettings, defaultUserDeductions).net;
        return { grossMin, grossMax, grossExp, netMin, netMax, netExp };
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Načítám...</div>;
    if (!company) return <div className="p-8 text-center text-red-500">Firma nebyla nalezena.</div>;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin/companies">
                        <Button variant="outline" size="icon">
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <Building2 className="w-8 h-8 text-[#E21E36]" />
                            {company.name}
                        </h1>
                        <p className="text-gray-500">ID: {id}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        onClick={handleUpdateCompany}
                        className="bg-[#E21E36] hover:bg-[#c91a2e]"
                        disabled={saving}
                    >
                        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        Uložit změny
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Col: Company Settings */}
                <Card className="lg:col-span-1 h-fit">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-slate-400" />
                            Parametry firmy
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form className="space-y-4">
                            <div>
                                <Label>Název firmy *</Label>
                                <Input
                                    value={companyForm.name}
                                    onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <Label>Logo URL</Label>
                                <Input
                                    value={companyForm.logo_url}
                                    onChange={(e) => setCompanyForm({ ...companyForm, logo_url: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label>Popis</Label>
                                <Textarea
                                    value={companyForm.description}
                                    onChange={(e) => setCompanyForm({ ...companyForm, description: e.target.value })}
                                    rows={4}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Město</Label>
                                    <Input
                                        value={companyForm.city}
                                        onChange={(e) => setCompanyForm({ ...companyForm, city: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <Label>Adresa</Label>
                                    <Input
                                        value={companyForm.address}
                                        onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <Label>Google Maps URL</Label>
                                <div className="flex gap-2">
                                    <Input
                                        value={companyForm.maps_url}
                                        onChange={(e) => setCompanyForm({ ...companyForm, maps_url: e.target.value })}
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        onClick={handleParseGps}
                                        disabled={gpsLoading || !companyForm.maps_url}
                                    >
                                        {gpsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                                    </Button>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Lat</Label>
                                    <Input
                                        type="number"
                                        step="0.000001"
                                        value={companyForm.latitude}
                                        onChange={(e) => setCompanyForm({ ...companyForm, latitude: parseFloat(e.target.value) || 0 })}
                                    />
                                </div>
                                <div>
                                    <Label>Lon</Label>
                                    <Input
                                        type="number"
                                        step="0.000001"
                                        value={companyForm.longitude}
                                        onChange={(e) => setCompanyForm({ ...companyForm, longitude: parseFloat(e.target.value) || 0 })}
                                    />
                                </div>
                            </div>
                            <div>
                                <Label>Webová stránka</Label>
                                <Input
                                    value={companyForm.web_url}
                                    onChange={(e) => setCompanyForm({ ...companyForm, web_url: e.target.value })}
                                />
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Right Col: Positions Management */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            <Briefcase className="w-6 h-6 text-[#E21E36]" />
                            Pracovní pozice ({positions.length})
                        </h2>
                        <Button onClick={openCreatePosition} className="bg-[#E21E36] hover:bg-[#c91a2e]">
                            <Plus className="w-4 h-4 mr-2" />
                            Přidat pozici
                        </Button>
                    </div>

                    <Card className="bg-white border-gray-100">
                        <CardContent className="p-0">
                            {positions.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">
                                    Tato firma zatím nemá žádné pozice.
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Pozice</TableHead>
                                            <TableHead>Oddělení</TableHead>
                                            <TableHead>Směny</TableHead>
                                            <TableHead>Hrubá mzda</TableHead>
                                            <TableHead>Čistá mzda</TableHead>
                                            <TableHead className="text-right">Akce</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {positions.map((pos) => {
                                            const range = getSalaryRange(pos);
                                            return (
                                                <TableRow key={pos.id}>
                                                    <TableCell className="font-medium">{pos.position_name}</TableCell>
                                                    <TableCell>{pos.department || "—"}</TableCell>
                                                    <TableCell>{pos.shift_type || "—"}</TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-1">
                                                            <span className="text-gray-500 text-xs">{formatCurrency(range.grossMin)}</span>
                                                            <span className="text-gray-400">–</span>
                                                            <span className="font-medium">{formatCurrency(range.grossMax)}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-1">
                                                            <span className="text-gray-500 text-xs">{formatCurrency(range.netMin)}</span>
                                                            <span className="text-gray-400">–</span>
                                                            <span className="font-medium text-[#E21E36]">{formatCurrency(range.netMax)}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Button size="icon" variant="ghost" onClick={() => openEditPosition(pos)}>
                                                                <Pencil className="w-4 h-4" />
                                                            </Button>
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                className="text-red-500 hover:text-red-700"
                                                                onClick={() => handleDeletePosition(pos.id)}
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Position Dialog with BenefitFormV2 */}
            <Dialog open={isPositionDialogOpen} onOpenChange={setIsPositionDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto font-sans">
                    <DialogHeader>
                        <DialogTitle className="text-xl">
                            {editingPosition ? "Upravit pozici" : "Nová pozice"}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSavePosition} className="space-y-6">
                        {/* Basic Info */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Název pozice *</Label>
                                <Input
                                    value={positionForm.position_name}
                                    onChange={(e) => setPositionForm({ ...positionForm, position_name: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <Label>Oddělení</Label>
                                <Input
                                    value={positionForm.department}
                                    onChange={(e) => setPositionForm({ ...positionForm, department: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Typ směny</Label>
                                <Select value={positionForm.shift_type} onValueChange={(v) => setPositionForm({ ...positionForm, shift_type: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="2 směny">2 směny</SelectItem>
                                        <SelectItem value="3 směny">3 směny</SelectItem>
                                        <SelectItem value="nepřetržitý">Nepřetržitý</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Salary Section */}
                        <div className="space-y-4 border-t pt-4">
                            <h3 className="font-semibold flex items-center gap-2">
                                <Banknote className="w-5 h-5 text-green-600" />
                                Mzdové podmínky
                            </h3>
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    onClick={() => handleSalaryInputTypeChange('monthly')}
                                    variant={positionForm.salary_input_type === 'monthly' ? "default" : "outline"}
                                    className={positionForm.salary_input_type === 'monthly' ? "bg-[#E21E36] hover:bg-[#c91a2e]" : ""}
                                >
                                    <Banknote className="w-4 h-4 mr-2" /> Měsíční
                                </Button>
                                <Button
                                    type="button"
                                    onClick={() => handleSalaryInputTypeChange('hourly')}
                                    variant={positionForm.salary_input_type === 'hourly' ? "default" : "outline"}
                                    className={positionForm.salary_input_type === 'hourly' ? "bg-[#E21E36] hover:bg-[#c91a2e]" : ""}
                                >
                                    <Clock className="w-4 h-4 mr-2" /> Hodinová
                                </Button>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                {positionForm.salary_input_type === 'monthly' ? (
                                    <>
                                        <div>
                                            <Label>Základ (Kč/měs)</Label>
                                            <Input
                                                type="number"
                                                value={positionForm.base_salary}
                                                onChange={(e) => setPositionForm({ ...positionForm, base_salary: parseInt(e.target.value) || 0 })}
                                            />
                                        </div>
                                        <div>
                                            <Label className="opacity-50">Hodinová sazba</Label>
                                            <div className="h-10 border rounded bg-slate-50 flex items-center px-3 text-slate-500">{calculatedHourly} Kč/h</div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div>
                                            <Label>Základ (Kč/hod)</Label>
                                            <Input
                                                type="number" step="0.01"
                                                value={positionForm.base_hourly_rate}
                                                onChange={(e) => setPositionForm({ ...positionForm, base_hourly_rate: parseFloat(e.target.value) || 0 })}
                                            />
                                        </div>
                                        <div>
                                            <Label className="opacity-50">Měsíční základ</Label>
                                            <div className="h-10 border rounded bg-slate-50 flex items-center px-3 text-slate-500">{calculatedMonthly.toLocaleString()} Kč</div>
                                        </div>
                                    </>
                                )}
                                <div>
                                    <Label>Fond hodin</Label>
                                    <Input
                                        type="number" step="0.5"
                                        value={positionForm.working_hours_fund}
                                        onChange={(e) => setPositionForm({ ...positionForm, working_hours_fund: parseFloat(e.target.value) || 157.5 })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Příspěvek na ubytování (Kč)</Label>
                                    <Input
                                        type="number"
                                        value={positionForm.housing_allowance}
                                        onChange={(e) => setPositionForm({ ...positionForm, housing_allowance: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Benefits v2 Section */}
                        <div className="space-y-4 border-t pt-4">
                            <h3 className="font-semibold flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-purple-600" />
                                Benefity a variabilní složky
                            </h3>
                            <BenefitFormV2
                                benefits={positionForm.benefits}
                                onChange={(benefits) => setPositionForm({ ...positionForm, benefits })}
                                baseSalary={calculatedMonthly}
                            />
                        </div>

                        <div className="flex justify-end gap-2 p-4 border-t sticky bottom-0 bg-white">
                            <Button type="button" variant="outline" onClick={() => setIsPositionDialogOpen(false)}>Zrušit</Button>
                            <Button type="submit" className="bg-[#E21E36] hover:bg-[#c91a2e]">Uložit pozici</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
