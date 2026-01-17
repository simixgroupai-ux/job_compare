// =====================================================
// Database Types for Job Comparator v4
// Dynamic salary calculation with Czech tax rules
// =====================================================

// Benefit calculation types
export type BenefitCalculationType = 'fixed_amount' | 'hourly_rate' | 'percentage';

// Single benefit definition in JSONB
export interface Benefit {
    key: string;
    name: string;
    calculation_type: BenefitCalculationType;
    is_range?: boolean;
    value?: number;
    min_value?: number;
    max_value?: number;
}

// Tax setting for salary calculation
export interface TaxSetting {
    id: string;
    key: string;
    name: string;
    value: number;
    type: 'percent' | 'currency';
    category: 'insurance' | 'tax' | 'deduction';
    description?: string;
    valid_from: string;
    created_at: string;
}

// Company
export interface Company {
    id: string;
    name: string;
    logo_url?: string;
    description?: string;
    address?: string;
    city?: string;
    maps_url?: string;
    web_url?: string;
    latitude?: number;
    longitude?: number;
    is_active?: boolean;
    updated_at: string;
    created_at: string;
}

// Salary input type
export type SalaryInputType = 'monthly' | 'hourly';

// Job Position
export interface JobPosition {
    id: string;
    company_id: string;
    position_name: string;
    department?: string;
    shift_type?: string;
    evaluation_level?: string;
    salary_input_type: SalaryInputType;  // 'monthly' or 'hourly'
    base_salary: number;                  // Monthly base (used if input_type = 'monthly')
    base_hourly_rate: number;             // Hourly rate (used if input_type = 'hourly')
    housing_allowance: number;
    working_hours_fund: number;
    benefits: Benefit[];
    created_at: string;
}

// Position with company
export interface JobPositionWithCompany extends JobPosition {
    company?: Company;
}

// =====================================================
// Calculated Salary Types
// =====================================================

export interface CalculatedSalary {
    grossMin: number;
    grossMax: number;
    netMin: number;
    netMax: number;
    hourlyGrossMin: number;
    hourlyGrossMax: number;
    hourlyNetMin: number;
    hourlyNetMax: number;
    // Breakdown for display
    socialInsurance: number;
    healthInsurance: number;
    taxBeforeCredits: number;
    taxCredits: number;
    taxAfterCredits: number;
}

// Type for invalidita selection (only one can be active)
export type InvaliditaTyp = 'none' | 'inv1' | 'inv2' | 'inv3';

// User selected deductions (in comparator)
export interface UserDeductions {
    poplatnik: boolean;        // Sleva na poplatníka
    pocetDeti: number;         // Počet dětí (0-10+)
    invaliditaTyp: InvaliditaTyp;  // Typ invalidity (pouze jedna možná)
    ztpp: boolean;             // ZTP/P - držitel průkazu
    student: boolean;          // Student
}

// =====================================================
// Form Types
// =====================================================

export interface CompanyFormData {
    name: string;
    logo_url: string;
    description: string;
    address: string;
    city: string;
    maps_url: string;
}

export interface JobPositionFormData {
    company_id: string;
    position_name: string;
    department: string;
    shift_type: string;
    evaluation_level: string;
    base_salary: number;
    housing_allowance: number;
    working_hours_fund: number;
    benefits: Benefit[];
}

// =====================================================
// Salary Calculation Functions
// Czech tax rules 2024/2025
// =====================================================

/**
 * Calculate single benefit value based on its type
 */
export function calculateBenefitValue(
    benefit: Benefit,
    baseSalary: number,
    workingHoursFund: number,
    useMax: boolean = false
): number {
    const value = benefit.is_range
        ? (useMax ? (benefit.max_value ?? 0) : (benefit.min_value ?? 0))
        : (benefit.value ?? 0);

    switch (benefit.calculation_type) {
        case 'fixed_amount':
            return value;
        case 'hourly_rate':
            return value * workingHoursFund;
        case 'percentage':
            return (baseSalary * value) / 100;
        default:
            return 0;
    }
}

/**
 * Get base monthly salary from position (handles both input types)
 */
export function getBaseMonthlySalary(position: JobPosition): number {
    if (position.salary_input_type === 'hourly') {
        // Calculate monthly from hourly rate
        return Math.round((position.base_hourly_rate || 0) * (position.working_hours_fund || 157.5));
    }
    // Monthly input
    return position.base_salary || 0;
}

/**
 * Get base hourly rate from position (handles both input types)
 */
export function getBaseHourlyRate(position: JobPosition): number {
    const fund = position.working_hours_fund || 157.5;
    if (position.salary_input_type === 'hourly') {
        return position.base_hourly_rate || 0;
    }
    // Calculate hourly from monthly
    return Math.round(((position.base_salary || 0) / fund) * 100) / 100;
}

/**
 * Calculate gross salary from base + benefits
 */
export function calculateGrossSalary(
    position: JobPosition,
    useMax: boolean = false
): number {
    // Get base monthly salary (handles both input types)
    const baseMonthlySalary = getBaseMonthlySalary(position);
    let total = baseMonthlySalary;

    for (const benefit of position.benefits || []) {
        total += calculateBenefitValue(
            benefit,
            baseMonthlySalary,
            position.working_hours_fund,
            useMax
        );
    }

    return Math.round(total);
}

/**
 * Round UP to nearest 100 CZK (for tax base calculation)
 */
export function roundUpTo100(value: number): number {
    return Math.ceil(value / 100) * 100;
}

/**
 * Get total tax credits based on user selections
 */
export function getTaxCredits(
    taxSettings: TaxSetting[],
    userDeductions: UserDeductions
): number {
    let credits = 0;

    // Sleva na poplatníka (2570 Kč)
    if (userDeductions.poplatnik) {
        const setting = taxSettings.find(t => t.key === 'sleva_poplatnik');
        credits += setting?.value ?? 2570;
    }

    // Děti (daňové zvühodnění)
    // Logika: 1 dítě = dite1, 2 děti = dite1 + dite2, 3+ dětí = dite1 + dite2 + (n-2)*dite3
    const pocetDeti = userDeductions.pocetDeti;
    if (pocetDeti >= 1) {
        const d1 = taxSettings.find(t => t.key === 'sleva_dite_1');
        credits += d1?.value ?? 1267;
    }
    if (pocetDeti >= 2) {
        const d2 = taxSettings.find(t => t.key === 'sleva_dite_2');
        credits += d2?.value ?? 1860;
    }
    if (pocetDeti >= 3) {
        const d3 = taxSettings.find(t => t.key === 'sleva_dite_3');
        credits += (d3?.value ?? 2320) * (pocetDeti - 2);
    }

    // Invalidita (pouze jedna možná)
    switch (userDeductions.invaliditaTyp) {
        case 'inv1': {
            const setting = taxSettings.find(t => t.key === 'sleva_inv_1');
            credits += setting?.value ?? 210;
            break;
        }
        case 'inv2': {
            const setting = taxSettings.find(t => t.key === 'sleva_inv_2');
            credits += setting?.value ?? 210;
            break;
        }
        case 'inv3': {
            const setting = taxSettings.find(t => t.key === 'sleva_inv_3');
            credits += setting?.value ?? 420;
            break;
        }
    }

    // ZTP/P
    if (userDeductions.ztpp) {
        const setting = taxSettings.find(t => t.key === 'sleva_ztpp');
        credits += setting?.value ?? 1345;
    }

    // Student
    if (userDeductions.student) {
        const setting = taxSettings.find(t => t.key === 'sleva_student');
        credits += setting?.value ?? 335;
    }

    return credits;
}

/**
 * Calculate net salary from gross with Czech tax rules
 * 
 * Rules:
 * 1. Social insurance: 7.1% of gross
 * 2. Health insurance: 4.5% of gross
 * 3. Tax base: gross rounded UP to 100 CZK
 * 4. Income tax: 15% of rounded tax base
 * 5. Apply tax credits (slevy)
 * 6. Tax cannot go below 0 (credits capped at tax amount)
 * 7. Net = Gross - Social - Health - Tax
 */
export function calculateNetSalary(
    grossSalary: number,
    taxSettings: TaxSetting[],
    userDeductions: UserDeductions = { poplatnik: true, pocetDeti: 0, invaliditaTyp: 'none', ztpp: false, student: false }
): {
    net: number;
    social: number;
    health: number;
    taxBeforeCredits: number;
    taxCredits: number;
    taxAfterCredits: number;
} {
    // Get rates from settings (or use defaults)
    const socialRate = taxSettings.find(t => t.key === 'social_insurance')?.value ?? 7.1;
    const healthRate = taxSettings.find(t => t.key === 'health_insurance')?.value ?? 4.5;
    const taxRate = taxSettings.find(t => t.key === 'income_tax')?.value ?? 15;

    // 1. Calculate insurance deductions
    const socialDeduction = Math.round(grossSalary * (socialRate / 100));
    const healthDeduction = Math.round(grossSalary * (healthRate / 100));

    // 2. Round gross UP to 100 for tax base
    const taxBase = roundUpTo100(grossSalary);

    // 3. Calculate tax before credits
    const taxBeforeCredits = Math.round(taxBase * (taxRate / 100));

    // 4. Get total tax credits
    const taxCredits = getTaxCredits(taxSettings, userDeductions);

    // 5. Apply credits - tax cannot go below 0
    // (Credits are capped at tax amount - state doesn't pay you extra)
    const taxAfterCredits = Math.max(0, taxBeforeCredits - taxCredits);

    // 6. Calculate net salary
    const netSalary = grossSalary - socialDeduction - healthDeduction - taxAfterCredits;

    return {
        net: Math.round(netSalary),
        social: socialDeduction,
        health: healthDeduction,
        taxBeforeCredits,
        taxCredits: Math.min(taxCredits, taxBeforeCredits), // Effective credits
        taxAfterCredits,
    };
}

/**
 * Calculate full salary breakdown for a position
 */
export function calculateFullSalary(
    position: JobPosition,
    taxSettings: TaxSetting[],
    userDeductions: UserDeductions = { poplatnik: true, pocetDeti: 0, invaliditaTyp: 'none', ztpp: false, student: false }
): CalculatedSalary {
    // Calculate gross (min and max)
    const grossMin = calculateGrossSalary(position, false);
    const grossMax = calculateGrossSalary(position, true);

    // Calculate net (using max gross for breakdown display)
    const netCalcMin = calculateNetSalary(grossMin, taxSettings, userDeductions);
    const netCalcMax = calculateNetSalary(grossMax, taxSettings, userDeductions);

    // Calculate hourly rates
    const fund = position.working_hours_fund || 157.5;

    return {
        grossMin,
        grossMax,
        netMin: netCalcMin.net,
        netMax: netCalcMax.net,
        hourlyGrossMin: Math.round((grossMin / fund) * 100) / 100,
        hourlyGrossMax: Math.round((grossMax / fund) * 100) / 100,
        hourlyNetMin: Math.round((netCalcMin.net / fund) * 100) / 100,
        hourlyNetMax: Math.round((netCalcMax.net / fund) * 100) / 100,
        // Breakdown (using max values)
        socialInsurance: netCalcMax.social,
        healthInsurance: netCalcMax.health,
        taxBeforeCredits: netCalcMax.taxBeforeCredits,
        taxCredits: netCalcMax.taxCredits,
        taxAfterCredits: netCalcMax.taxAfterCredits,
    };
}

/**
 * Default user deductions (only poplatnik selected)
 */
export const defaultUserDeductions: UserDeductions = {
    poplatnik: true,
    pocetDeti: 0,
    invaliditaTyp: 'none',
    ztpp: false,
    student: false,
};
