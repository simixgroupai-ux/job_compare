"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import {
  Company,
  JobPositionWithCompany,
  TaxSetting,
  calculateGrossSalary,
  calculateNetSalary,
  defaultUserDeductions
} from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Building2,
  Briefcase,
  TrendingUp,
  ArrowRight,
  BarChart3,
  Users
} from "lucide-react";
import Link from "next/link";

export default function Dashboard() {
  const [stats, setStats] = useState({
    companies: 0,
    positions: 0,
    avgSalary: 0,
    maxSalary: 0,
  });
  const [recentPositions, setRecentPositions] = useState<JobPositionWithCompany[]>([]);
  const [taxSettings, setTaxSettings] = useState<TaxSetting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch tax settings
        const { data: taxData } = await supabase
          .from("tax_settings")
          .select("*");
        setTaxSettings(taxData || []);

        // Fetch companies count
        const { count: companiesCount } = await supabase
          .from("companies")
          .select("*", { count: "exact", head: true });

        // Fetch positions with companies
        const { data: positions } = await supabase
          .from("job_positions")
          .select("*, company:companies(*)")
          .order("created_at", { ascending: false })
          .limit(5);

        // Calculate stats from all positions
        const { data: allPositions } = await supabase
          .from("job_positions")
          .select("*");

        // Calculate net salaries dynamically
        const settings = taxData || [];
        const netSalaries = (allPositions || []).map(p => {
          const gross = calculateGrossSalary(p, true);
          const { net } = calculateNetSalary(gross, settings, defaultUserDeductions);
          return net;
        }).filter(s => s > 0);

        const avgSalary = netSalaries.length > 0
          ? Math.round(netSalaries.reduce((a, b) => a + b, 0) / netSalaries.length)
          : 0;
        const maxSalary = netSalaries.length > 0 ? Math.max(...netSalaries) : 0;

        setStats({
          companies: companiesCount || 0,
          positions: allPositions?.length || 0,
          avgSalary,
          maxSalary,
        });

        setRecentPositions(positions || []);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const formatCurrency = (value: number | undefined | null) => {
    if (value === undefined || value === null) return "0 Kč";
    return value.toLocaleString("cs-CZ") + " Kč";
  };

  // Calculate net salary for a position
  const getNetSalary = (position: JobPositionWithCompany) => {
    const gross = calculateGrossSalary(position, true);
    const { net } = calculateNetSalary(gross, taxSettings, defaultUserDeductions);
    return net;
  };

  const statCards = [
    {
      title: "Firem",
      value: stats.companies,
      icon: Building2,
      color: "from-[#E21E36] to-[#c91a2e]",
      href: "/companies",
    },
    {
      title: "Pozic",
      value: stats.positions,
      icon: Briefcase,
      color: "from-[#E21E36] to-[#c91a2e]",
      href: "/positions",
    },
    {
      title: "Průměrná mzda",
      value: formatCurrency(stats.avgSalary),
      icon: BarChart3,
      color: "from-[#E21E36] to-[#c91a2e]",
      href: "/positions",
    },
    {
      title: "Nejvyšší mzda",
      value: formatCurrency(stats.maxSalary),
      icon: TrendingUp,
      color: "from-[#E21E36] to-[#c91a2e]",
      href: "/positions",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Dashboard
        </h1>
        <p className="text-gray-600">
          Přehled pracovních pozic a firem
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link href={stat.href}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-white border-gray-100">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">{stat.title}</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {loading ? "..." : stat.value}
                        </p>
                      </div>
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"
      >
        <Card className="bg-gradient-to-br from-[#E21E36] to-[#c91a2e] text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Porovnat pozice
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-100 mb-4">
              Vyberte až 4 pozice a porovnejte jejich mzdy a benefity side-by-side
            </p>
            <Link href="/compare">
              <Button variant="secondary" className="bg-white text-[#E21E36] hover:bg-red-50">
                Začít porovnávat
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-gray-700 to-gray-800 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Správa dat
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300 mb-4">
              Přidejte novou firmu a její pracovní pozice do databáze
            </p>
            <Link href="/admin">
              <Button variant="secondary" className="bg-white text-gray-800 hover:bg-gray-100">
                Správa
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Positions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="bg-white border-gray-100">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Nedávné pozice</CardTitle>
            <Link href="/positions">
              <Button variant="ghost" size="sm">
                Zobrazit vše
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-gray-500">Načítám...</div>
            ) : recentPositions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Zatím žádné pozice. Přidejte první v sekci Správa.
              </div>
            ) : (
              <div className="space-y-3">
                {recentPositions.map((position) => (
                  <div
                    key={position.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div>
                      <div className="font-medium text-gray-900">
                        {position.position_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {position.company?.name}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-[#E21E36]">
                        {formatCurrency(getNetSalary(position))}
                      </div>
                      <div className="text-xs text-gray-500">čistá mzda</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
