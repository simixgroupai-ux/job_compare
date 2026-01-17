"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { TaxSetting } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Calculator, Pencil, Check, X, Percent, Banknote } from "lucide-react";

export default function AdminTaxSettingsPage() {
    const [settings, setSettings] = useState<TaxSetting[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState<number>(0);

    useEffect(() => {
        fetchSettings();
    }, []);

    async function fetchSettings() {
        try {
            const { data } = await supabase
                .from("tax_settings")
                .select("*")
                .order("category, key");
            setSettings(data || []);
        } catch (error) {
            console.error("Error fetching tax settings:", error);
        } finally {
            setLoading(false);
        }
    }

    function startEdit(setting: TaxSetting) {
        setEditingId(setting.id);
        setEditValue(setting.value);
    }

    function cancelEdit() {
        setEditingId(null);
        setEditValue(0);
    }

    async function saveEdit(id: string) {
        try {
            await supabase
                .from("tax_settings")
                .update({ value: editValue })
                .eq("id", id);
            setEditingId(null);
            fetchSettings();
        } catch (error) {
            console.error("Error updating setting:", error);
        }
    }

    const formatValue = (setting: TaxSetting) => {
        if (setting.type === 'percent') {
            return `${setting.value} %`;
        }
        return `${setting.value.toLocaleString("cs-CZ")} Kč`;
    };

    const getCategoryBadge = (category: string) => {
        switch (category) {
            case 'insurance':
                return <Badge className="bg-blue-100 text-blue-700">Pojištění</Badge>;
            case 'tax':
                return <Badge className="bg-amber-100 text-amber-700">Daň</Badge>;
            case 'deduction':
                return <Badge className="bg-emerald-100 text-emerald-700">Sleva</Badge>;
            default:
                return <Badge variant="secondary">{category}</Badge>;
        }
    };

    const insuranceSettings = settings.filter(s => s.category === 'insurance' || s.category === 'tax');
    const deductionSettings = settings.filter(s => s.category === 'deduction');

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <h1 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-3">
                    <Calculator className="w-8 h-8 text-purple-600" />
                    Nastavení daní a odvodů
                </h1>
                <p className="text-slate-600">
                    Upravte sazby pojištění, daně a slevy na dani pro výpočet čisté mzdy
                </p>
            </motion.div>

            {loading ? (
                <div className="text-center py-8 text-slate-500">Načítám...</div>
            ) : (
                <div className="space-y-8">
                    {/* Insurance & Tax */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Percent className="w-5 h-5 text-blue-600" />
                                    Pojištění a daňové sazby
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Název</TableHead>
                                            <TableHead>Kategorie</TableHead>
                                            <TableHead>Hodnota</TableHead>
                                            <TableHead>Popis</TableHead>
                                            <TableHead className="w-20">Akce</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {insuranceSettings.map((setting) => (
                                            <TableRow key={setting.id}>
                                                <TableCell className="font-medium">{setting.name}</TableCell>
                                                <TableCell>{getCategoryBadge(setting.category)}</TableCell>
                                                <TableCell>
                                                    {editingId === setting.id ? (
                                                        <div className="flex items-center gap-2">
                                                            <Input
                                                                type="number"
                                                                step="0.1"
                                                                value={editValue}
                                                                onChange={(e) => setEditValue(parseFloat(e.target.value))}
                                                                className="w-24 h-8"
                                                            />
                                                            <span className="text-sm text-slate-500">
                                                                {setting.type === 'percent' ? '%' : 'Kč'}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="font-mono text-blue-700">
                                                            {formatValue(setting)}
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-sm text-slate-500">
                                                    {setting.description}
                                                </TableCell>
                                                <TableCell>
                                                    {editingId === setting.id ? (
                                                        <div className="flex gap-1">
                                                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => saveEdit(setting.id)}>
                                                                <Check className="w-4 h-4 text-emerald-600" />
                                                            </Button>
                                                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={cancelEdit}>
                                                                <X className="w-4 h-4 text-red-500" />
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(setting)}>
                                                            <Pencil className="w-4 h-4" />
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Deductions */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Banknote className="w-5 h-5 text-emerald-600" />
                                    Slevy na dani (měsíční)
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Název</TableHead>
                                            <TableHead>Hodnota</TableHead>
                                            <TableHead>Popis</TableHead>
                                            <TableHead className="w-20">Akce</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {deductionSettings.map((setting) => (
                                            <TableRow key={setting.id}>
                                                <TableCell className="font-medium">{setting.name}</TableCell>
                                                <TableCell>
                                                    {editingId === setting.id ? (
                                                        <div className="flex items-center gap-2">
                                                            <Input
                                                                type="number"
                                                                value={editValue}
                                                                onChange={(e) => setEditValue(parseFloat(e.target.value))}
                                                                className="w-24 h-8"
                                                            />
                                                            <span className="text-sm text-slate-500">Kč</span>
                                                        </div>
                                                    ) : (
                                                        <span className="font-mono text-emerald-700">
                                                            {formatValue(setting)}
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-sm text-slate-500">
                                                    {setting.description}
                                                </TableCell>
                                                <TableCell>
                                                    {editingId === setting.id ? (
                                                        <div className="flex gap-1">
                                                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => saveEdit(setting.id)}>
                                                                <Check className="w-4 h-4 text-emerald-600" />
                                                            </Button>
                                                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={cancelEdit}>
                                                                <X className="w-4 h-4 text-red-500" />
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(setting)}>
                                                            <Pencil className="w-4 h-4" />
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Info */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
                        <strong>Tip:</strong> Tyto hodnoty se používají pro výpočet čisté mzdy z hrubé mzdy.
                        Při změně legislativy aktualizujte příslušné hodnoty.
                    </div>
                </div>
            )}
        </div>
    );
}
