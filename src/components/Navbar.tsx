"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    Building2,
    Briefcase,
    BarChart3,
    Settings,
    GitCompare,
    MapPin
} from "lucide-react";

const navItems = [
    { href: "/", label: "Dashboard", icon: BarChart3 },
    {
        href: "/companies",
        label: "Firmy",
        icon: Building2,
        subItems: [
            { href: "/companies/map", label: "Mapa firem", icon: MapPin }
        ]
    },
    { href: "/positions", label: "Pozice", icon: Briefcase },
    { href: "/compare", label: "Porovnat", icon: GitCompare },
    { href: "/admin", label: "Správa", icon: Settings },
];

export function Navbar() {
    const pathname = usePathname();

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-3">
                        <img
                            src="/simix-logo.webp"
                            alt="SIMIX"
                            className="h-8 w-auto object-contain"
                        />
                    </Link>

                    {/* Navigation */}
                    <div className="flex items-center gap-1">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href ||
                                (item.href !== "/" && pathname.startsWith(item.href) && !pathname.startsWith("/admin"));
                            const Icon = item.icon;

                            return (
                                <div key={item.href} className="relative group">
                                    <Link
                                        href={item.href}
                                        className={cn(
                                            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                                            isActive
                                                ? "bg-[#E21E36]/10 text-[#E21E36]"
                                                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                        )}
                                    >
                                        <Icon className="w-4 h-4" />
                                        <span className="hidden sm:inline">{item.label}</span>
                                    </Link>

                                    {item.subItems && (
                                        <div className="absolute top-full left-0 pt-2 hidden group-hover:block min-w-[160px]">
                                            <div className="bg-white border border-gray-100 rounded-xl shadow-xl py-1.5 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                                {item.subItems.map((sub) => {
                                                    const subActive = pathname === sub.href;
                                                    const SubIcon = sub.icon;
                                                    return (
                                                        <Link
                                                            key={sub.href}
                                                            href={sub.href}
                                                            className={cn(
                                                                "flex items-center gap-2 px-4 py-2 text-sm transition-all duration-200",
                                                                subActive
                                                                    ? "bg-[#E21E36]/5 text-[#E21E36] font-semibold"
                                                                    : "text-gray-600 hover:bg-gray-50 hover:text-[#E21E36]"
                                                            )}
                                                        >
                                                            <SubIcon className="w-3.5 h-3.5" />
                                                            {sub.label}
                                                        </Link>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </nav>
    );
}
