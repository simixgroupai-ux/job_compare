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
    MapPin,
    Menu,
    X,
    ChevronDown
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";

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
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setActiveDropdown(null);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Close dropdown when pathname changes
    useEffect(() => {
        setActiveDropdown(null);
        setIsMenuOpen(false);
    }, [pathname]);

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 h-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
                <div className="flex items-center justify-between h-full">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-3 relative z-[60]">
                        <img
                            src="/simix-logo.webp"
                            alt="SIMIX"
                            className="h-7 md:h-8 w-auto object-contain"
                        />
                    </Link>

                    {/* Desktop/Tablet Navigation */}
                    <div className="hidden md:flex items-center gap-1" ref={dropdownRef}>
                        {navItems.map((item) => {
                            const isActive = pathname === item.href ||
                                (item.href !== "/" && pathname.startsWith(item.href) && !pathname.startsWith("/admin"));
                            const Icon = item.icon;
                            const isDropdownOpen = activeDropdown === item.href;

                            return (
                                <div
                                    key={item.href}
                                    className="relative"
                                    onMouseEnter={() => item.subItems && setActiveDropdown(item.href)}
                                    onMouseLeave={() => item.subItems && setActiveDropdown(null)}
                                >
                                    <div className="flex items-center">
                                        <Link
                                            href={item.href}
                                            className={cn(
                                                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                                                isActive
                                                    ? "bg-[#E21E36]/10 text-[#E21E36]"
                                                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                                                isDropdownOpen && !isActive && "bg-gray-50"
                                            )}
                                        >
                                            <Icon className="w-4 h-4" />
                                            <span>{item.label}</span>
                                        </Link>

                                        {item.subItems && (
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    setActiveDropdown(isDropdownOpen ? null : item.href);
                                                }}
                                                className={cn(
                                                    "p-2 -ml-2 rounded-lg text-gray-400 hover:text-[#E21E36] transition-colors",
                                                    isDropdownOpen && "text-[#E21E36]"
                                                )}
                                            >
                                                <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", isDropdownOpen && "rotate-180")} />
                                            </button>
                                        )}
                                    </div>

                                    <AnimatePresence>
                                        {item.subItems && isDropdownOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 10 }}
                                                transition={{ duration: 0.15 }}
                                                className="absolute top-full left-0 pt-2 min-w-[180px]"
                                            >
                                                <div className="bg-white border border-gray-100 rounded-xl shadow-xl py-1.5 overflow-hidden">
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
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            );
                        })}
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors relative z-[60]"
                    >
                        {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </div>

            {/* Mobile Navigation Drawer */}
            <AnimatePresence>
                {isMenuOpen && (
                    <>
                        {/* Overlay */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMenuOpen(false)}
                            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[55] md:hidden"
                        />

                        {/* Drawer */}
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed top-0 right-0 bottom-0 w-[280px] bg-white z-[56] shadow-2xl md:hidden pt-20 px-4 overflow-y-auto"
                        >
                            <div className="space-y-2">
                                {navItems.map((item) => {
                                    const isActive = pathname === item.href ||
                                        (item.href !== "/" && pathname.startsWith(item.href) && !pathname.startsWith("/admin"));
                                    const Icon = item.icon;

                                    return (
                                        <div key={item.href} className="space-y-1">
                                            <Link
                                                href={item.href}
                                                onClick={() => !item.subItems && setIsMenuOpen(false)}
                                                className={cn(
                                                    "flex items-center justify-between px-4 py-3 rounded-xl text-base font-medium transition-all",
                                                    isActive
                                                        ? "bg-[#E21E36]/10 text-[#E21E36]"
                                                        : "text-gray-600 hover:bg-gray-50"
                                                )}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Icon className="w-5 h-5" />
                                                    {item.label}
                                                </div>
                                            </Link>

                                            {item.subItems && (
                                                <div className="ml-4 pl-4 border-l-2 border-gray-100 flex flex-col gap-1 py-1">
                                                    {item.subItems.map((sub) => {
                                                        const subActive = pathname === sub.href;
                                                        const SubIcon = sub.icon;
                                                        return (
                                                            <Link
                                                                key={sub.href}
                                                                href={sub.href}
                                                                onClick={() => setIsMenuOpen(false)}
                                                                className={cn(
                                                                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all",
                                                                    subActive
                                                                        ? "bg-[#E21E36]/5 text-[#E21E36] font-semibold"
                                                                        : "text-gray-500 hover:text-[#E21E36]"
                                                                )}
                                                            >
                                                                <SubIcon className="w-4 h-4" />
                                                                {sub.label}
                                                            </Link>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </nav>
    );
}
