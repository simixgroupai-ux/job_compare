"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { Company } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
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
import { Plus, Pencil, Trash2, Building2, MapPin, Loader2, Eye, Search, Globe } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { parseGoogleMapsUrl } from "@/app/actions/parse-google-maps";

interface CompanyForm {
    name: string;
    logo_url: string;
    description: string;
    address: string;
    city: string;
    maps_url: string;
    web_url: string;
    latitude: number;
    longitude: number;
}

const defaultForm: CompanyForm = {
    name: "",
    logo_url: "",
    description: "",
    address: "",
    city: "",
    maps_url: "",
    web_url: "",
    latitude: 0,
    longitude: 0,
};

export default function AdminCompaniesPage() {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCompany, setEditingCompany] = useState<Company | null>(null);
    const [formData, setFormData] = useState<CompanyForm>(defaultForm);
    const [gpsLoading, setGpsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        fetchCompanies();
    }, []);

    async function fetchCompanies() {
        try {
            const { data } = await supabase
                .from("companies")
                .select("*")
                .order("name");
            setCompanies(data || []);
        } catch (error) {
            console.error("Error fetching companies:", error);
        } finally {
            setLoading(false);
        }
    }

    async function handleParseGps() {
        if (!formData.maps_url) return;
        setGpsLoading(true);
        try {
            const result = await parseGoogleMapsUrl(formData.maps_url);
            if (result) {
                setFormData(prev => ({ ...prev, latitude: result.lat, longitude: result.lng }));
            }
        } catch (error) {
            console.error("GPS parse error:", error);
        } finally {
            setGpsLoading(false);
        }
    }

    function openCreateDialog() {
        setEditingCompany(null);
        setFormData(defaultForm);
        setIsDialogOpen(true);
    }

    function openEditDialog(company: Company) {
        setEditingCompany(company);
        setFormData({
            ...defaultForm,
            name: company.name,
            logo_url: company.logo_url || "",
            description: company.description || "",
            address: company.address || "",
            city: company.city || "",
            maps_url: company.maps_url || "",
            web_url: company.web_url || "",
            latitude: company.latitude || 0,
            longitude: company.longitude || 0,
        });
        setIsDialogOpen(true);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        try {
            if (editingCompany) {
                await supabase
                    .from("companies")
                    .update({
                        ...formData,
                        updated_at: new Date().toISOString(),
                    })
                    .eq("id", editingCompany.id);
            } else {
                await supabase.from("companies").insert(formData);
            }
            setIsDialogOpen(false);
            fetchCompanies();
        } catch (error) {
            console.error("Error saving company:", error);
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("Opravdu chcete smazat tuto firmu?")) return;
        try {
            await supabase.from("companies").delete().eq("id", id);
            fetchCompanies();
        } catch (error) {
            console.error("Error deleting company:", error);
        }
    }

    const filteredCompanies = companies.filter(company =>
        company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (company.city && company.city.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            {/* Header Area */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row md:items-end justify-between gap-4"
            >
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                        <Building2 className="w-8 h-8 text-[#E21E36]" />
                        Správa firem
                    </h1>
                    <p className="text-gray-600">
                        Správa detailů firem a jejich viditelnosti v katalogu ({companies.length})
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#E21E36] transition-colors" />
                        <Input
                            placeholder="Hledat firmu nebo město..."
                            className="pl-10 w-full md:w-72 border-gray-200 focus:border-[#E21E36] focus:ring-[#E21E36]/20 transition-all bg-white"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={openCreateDialog} className="bg-[#E21E36] hover:bg-[#c91a2e] shadow-lg shadow-[#E21E36]/20 transition-all">
                                <Plus className="w-5 h-5 mr-1" />
                                Přidat firmu
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg">
                            <DialogHeader>
                                <DialogTitle>{editingCompany ? "Upravit firmu" : "Nová firma"}</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <Label>Název firmy *</Label>
                                    <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                                </div>
                                <div>
                                    <Label>Logo URL</Label>
                                    <Input value={formData.logo_url} onChange={e => setFormData({ ...formData, logo_url: e.target.value })} placeholder="https://..." />
                                </div>
                                <div>
                                    <Label>Popis</Label>
                                    <Textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={3} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Město</Label>
                                        <Input value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} />
                                    </div>
                                    <div>
                                        <Label>Adresa</Label>
                                        <Input value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                                    </div>
                                </div>
                                <div>
                                    <Label>Google Maps URL</Label>
                                    <div className="flex gap-2">
                                        <Input value={formData.maps_url} onChange={e => setFormData({ ...formData, maps_url: e.target.value })} />
                                        <Button type="button" variant="outline" size="icon" onClick={handleParseGps} disabled={gpsLoading || !formData.maps_url}>
                                            {gpsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                                        </Button>
                                    </div>
                                </div>
                                <div>
                                    <Label>Webová stránka</Label>
                                    <Input value={formData.web_url} onChange={e => setFormData({ ...formData, web_url: e.target.value })} placeholder="https://..." />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><Label>Lat</Label><Input type="number" step="0.000001" value={formData.latitude} onChange={e => setFormData({ ...formData, latitude: parseFloat(e.target.value) || 0 })} /></div>
                                    <div><Label>Lon</Label><Input type="number" step="0.000001" value={formData.longitude} onChange={e => setFormData({ ...formData, longitude: parseFloat(e.target.value) || 0 })} /></div>
                                </div>
                                <div className="flex justify-end gap-2 pt-4">
                                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Zrušit</Button>
                                    <Button type="submit" className="bg-[#E21E36] hover:bg-[#c91a2e]">Uložit</Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </motion.div>

            {/* List Area */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <Card className="bg-white border-gray-100 overflow-hidden shadow-sm">
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="p-12 text-center text-gray-400">Načítám firmy...</div>
                        ) : filteredCompanies.length === 0 ? (
                            <div className="p-12 text-center text-gray-500 bg-slate-50/50">
                                <Building2 className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                                <p className="font-medium">Nebyly nalezeny žádné firmy.</p>
                                <p className="text-sm text-gray-400">Zkuste upravit hledaný výraz.</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader className="bg-slate-50/50">
                                    <TableRow className="hover:bg-transparent border-b">
                                        <TableHead className="py-4 font-semibold text-gray-900 px-6">Firma</TableHead>
                                        <TableHead className="py-4 font-semibold text-gray-900">Město</TableHead>
                                        <TableHead className="py-4 font-semibold text-gray-900">Web</TableHead>
                                        <TableHead className="py-4 font-semibold text-gray-900 text-center">Aktivní</TableHead>
                                        <TableHead className="py-4 font-semibold text-gray-900 text-right px-6">Akce</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredCompanies.map((company) => (
                                        <TableRow key={company.id} className="group hover:bg-slate-50/80 transition-all border-b border-gray-100 last:border-0">
                                            <TableCell className="py-4 px-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="relative flex-shrink-0">
                                                        {company.logo_url ? (
                                                            <div className="w-11 h-11 rounded-xl bg-white border border-gray-100 flex items-center justify-center p-1.5 shadow-sm group-hover:shadow-md transition-all overflow-hidden bg-white">
                                                                <img src={company.logo_url} alt="" className="w-full h-full object-contain" />
                                                            </div>
                                                        ) : (
                                                            <div className="w-11 h-11 bg-[#E21E36]/5 rounded-xl border border-dashed border-gray-200 flex items-center justify-center group-hover:bg-[#E21E36]/10 transition-colors">
                                                                <Building2 className="w-5 h-5 text-[#E21E36]/40" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <Link
                                                            href={`/admin/companies/${company.id}`}
                                                            className="font-bold text-gray-900 group-hover:text-[#E21E36] transition-colors truncate text-[15px]"
                                                        >
                                                            {company.name}
                                                        </Link>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <MapPin className="w-3 h-3 text-gray-400" />
                                                            <span className="text-[12px] text-gray-400 truncate max-w-[200px]">
                                                                {company.address || "Bez adresy"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <span className="text-sm font-medium text-gray-600">{company.city || "—"}</span>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                {company.web_url ? (
                                                    <a href={company.web_url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#E21E36] transition-colors">
                                                        <Globe className="w-4 h-4" />
                                                    </a>
                                                ) : <span className="text-gray-200">—</span>}
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <div className="flex items-center justify-center gap-2.5">
                                                    <span className={`text-[10px] font-bold uppercase tracking-wider ${company.is_active !== false ? 'text-emerald-500' : 'text-gray-300'}`}>
                                                        {company.is_active !== false ? 'Aktivní' : 'Neaktivní'}
                                                    </span>
                                                    <Switch
                                                        checked={company.is_active !== false}
                                                        className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-gray-200 scale-90"
                                                        onCheckedChange={async (checked: boolean) => {
                                                            await supabase
                                                                .from("companies")
                                                                .update({ is_active: checked })
                                                                .eq("id", company.id);
                                                            fetchCompanies();
                                                        }}
                                                    />
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4 text-right px-6">
                                                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                                    <Link href={`/admin/companies/${company.id}`}>
                                                        <Button size="icon" variant="ghost" className="h-9 w-9 text-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="DETAIL A POZICE">
                                                            <Eye className="w-4.5 h-4.5" />
                                                        </Button>
                                                    </Link>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-9 w-9 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                                                        onClick={() => openEditDialog(company)}
                                                        title="RYCHLÁ ÚPRAVA"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-9 w-9 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                                        onClick={() => handleDelete(company.id)}
                                                        title="SMAZAT"
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
