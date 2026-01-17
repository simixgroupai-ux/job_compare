"use client";

import { motion } from "framer-motion";
import { Company } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin } from "lucide-react";
import Link from "next/link";

interface CompanyCardProps {
    company: Company;
    positionCount?: number;
    index?: number;
}

export function CompanyCard({ company, positionCount = 0, index = 0 }: CompanyCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            className="h-full"
        >
            <Link href={`/companies/${company.id}`}>
                <Card className="h-full cursor-pointer hover:shadow-lg transition-shadow duration-300 border-gray-100 bg-white">
                    <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                            {company.logo_url ? (
                                <img
                                    src={company.logo_url}
                                    alt={company.name}
                                    className="w-12 h-12 rounded-xl object-contain bg-white border border-gray-100"
                                />
                            ) : (
                                <div className="w-12 h-12 bg-gradient-to-br from-[#E21E36] to-[#c91a2e] rounded-xl flex items-center justify-center">
                                    <Building2 className="w-6 h-6 text-white" />
                                </div>
                            )}
                            {positionCount > 0 && (
                                <Badge variant="secondary" className="bg-[#E21E36]/10 text-[#E21E36]">
                                    {positionCount} pozic
                                </Badge>
                            )}
                        </div>
                        <CardTitle className="text-lg mt-3 text-gray-900">
                            {company.name}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {company.city && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <MapPin className="w-4 h-4" />
                                <span>{company.city}{company.address ? `, ${company.address}` : ''}</span>
                            </div>
                        )}
                        {company.description && (
                            <p className="text-sm text-gray-500 line-clamp-2">
                                {company.description}
                            </p>
                        )}
                    </CardContent>
                </Card>
            </Link>
        </motion.div>
    );
}
