// =====================================================
// Database Types for Job Comparator v5
// Benefits Schema v2 with enhanced calculation support
// =====================================================

// =====================================================
// BENEFITS v2 - New flexible schema
// =====================================================

// Calculation types
export type BenefitCalcType = 'fixed_amount' | 'percentage' | 'rate';
export type BenefitUnit = 'month' | 'hour' | 'shift' | 'day';
export type BenefitBase = 'base_salary' | 'hourly_base' | 'custom_amount';
export type BenefitUnitsSource = 'working_hours_fund' | 'night_hours' | 'afternoon_hours' | 'custom_units';
export type BenefitCategory = 'bonus' | 'allowance' | 'premium' | 'shift' | 'other';
export type BenefitRounding = 'none' | 'ceil' | 'floor' | 'nearest';

export interface BenefitCalculation {
    type: BenefitCalcType;
    value: number;
    unit?: BenefitUnit;
    base?: BenefitBase;
    base_value?: number;
    units_source?: BenefitUnitsSource;
    units_value?: number;
    floor_per_unit?: number;
    cap_amount?: number;
    rounding?: BenefitRounding;
}

export interface BenefitRange {
    is_range: boolean;
    min?: number;
    max?: number;
    expected?: number;
}

export interface BenefitAppliesWhen {
    shift_type?: string | null;
    probation_only?: boolean;
    note?: string;
}

export interface BenefitMeta {
    source?: string;
    comment?: string;
}

// New Benefit v2 interface
export interface BenefitV2 {
    key: string;
    name: string;
    category?: BenefitCategory;
    calculation: BenefitCalculation;
    range?: BenefitRange;
    applies_when?: BenefitAppliesWhen;
    meta?: BenefitMeta;
}

// Inputs for calculation
export interface CalculationInputs {
    base_salary: number;
    working_hours_fund: number;
    hourly_base?: number;
    hours?: {
        night?: number;
        afternoon?: number;
        weekend?: number;
    };
    units?: {
        shifts_per_month?: number;
        days_per_month?: number;
    };
    performancePercent?: number; // 0-100 scale for range benefits
}

// =====================================================
// Legacy Benefit v1 (for backward compatibility)
// =====================================================
export type BenefitCalculationType = 'fixed_amount' | 'hourly_rate' | 'percentage';

export interface Benefit {
    key: string;
    name: string;
    calculation_type: BenefitCalculationType;
    is_range?: boolean;
    value?: number;
    min_value?: number;
    max_value?: number;
}

// =====================================================
// Other Types
// =====================================================

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

export type SalaryInputType = 'monthly' | 'hourly';

export interface JobPosition {
    id: string;
    company_id: string;
    position_name: string;
    department?: string;
    shift_type?: string;
    salary_input_type: SalaryInputType;
    base_salary: number;
    base_hourly_rate: number;
    housing_allowance: number;
    working_hours_fund: number;
    benefits: BenefitV2[];  // Now uses v2!
    created_at: string;
}

export interface JobPositionWithCompany extends JobPosition {
    company?: Company;
}

// =====================================================
// Calculated Salary Types
// =====================================================

export interface CalculatedSalary {
    grossMin: number;
    grossMax: number;
    grossExpected: number;
    netMin: number;
    netMax: number;
    netExpected: number;
    hourlyGrossMin: number;
    hourlyGrossMax: number;
    hourlyGrossExpected: number;
    hourlyNetMin: number;
    hourlyNetMax: number;
    hourlyNetExpected: number;
    socialInsurance: number;
    healthInsurance: number;
    taxBeforeCredits: number;
    taxCredits: number;
    taxAfterCredits: number;
}

export type InvaliditaTyp = 'none' | 'inv1' | 'inv2' | 'inv3';

export interface UserDeductions {
    poplatnik: boolean;
    pocetDeti: number;
    invaliditaTyp: InvaliditaTyp;
    ztpp: boolean;
    student: boolean;
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
    benefits: BenefitV2[];
}

// =====================================================
// BENEFITS v2 - Calculation Functions
// =====================================================

/**
 * Calculate single benefit value (v2)
 */
export function calculateBenefitValueV2(
    benefit: BenefitV2,
    inputs: CalculationInputs,
    mode: 'min' | 'max' | 'expected' = 'expected'
): number {
    const calc = benefit.calculation;
    const range = benefit.range;

    // Determine the value to use (single value or from range)
    let inputValue = calc.value;
    if (range?.is_range) {
        if (inputs.performancePercent !== undefined) {
            // Numeric percentage mapping: min + (max - min) * (percent / 100)
            const min = range.min ?? 0;
            const max = range.max ?? calc.value;
            inputValue = min + (max - min) * (inputs.performancePercent / 100);
        } else {
            switch (mode) {
                case 'min':
                    inputValue = range.min ?? 0;
                    break;
                case 'max':
                    inputValue = range.max ?? calc.value;
                    break;
                case 'expected':
                    inputValue = range.expected ?? range.min ?? calc.value;
                    break;
            }
        }
    }

    let amount = 0;

    switch (calc.type) {
        case 'fixed_amount':
            amount = inputValue;
            break;

        case 'percentage': {
            let baseAmount = 0;
            switch (calc.base) {
                case 'base_salary':
                    baseAmount = inputs.base_salary;
                    break;
                case 'hourly_base':
                    baseAmount = inputs.hourly_base ?? (inputs.base_salary / inputs.working_hours_fund);
                    break;
                case 'custom_amount':
                    baseAmount = calc.base_value ?? 0;
                    break;
                default:
                    baseAmount = inputs.base_salary;
            }

            // If unit is hour, percentage applies per hour
            if (calc.unit === 'hour') {
                const hourlyBase = inputs.hourly_base ?? (inputs.base_salary / inputs.working_hours_fund);
                let perHour = hourlyBase * (inputValue / 100);

                // Apply floor
                if (calc.floor_per_unit && perHour < calc.floor_per_unit) {
                    perHour = calc.floor_per_unit;
                }

                // Get hours based on units_source
                let hours = inputs.working_hours_fund;
                if (calc.units_source === 'night_hours') {
                    hours = inputs.hours?.night ?? 0;
                } else if (calc.units_source === 'afternoon_hours') {
                    hours = inputs.hours?.afternoon ?? 0;
                }

                amount = perHour * hours;
            } else {
                amount = baseAmount * (inputValue / 100);
            }
            break;
        }

        case 'rate': {
            let units = 0;
            switch (calc.units_source) {
                case 'working_hours_fund':
                    units = inputs.working_hours_fund;
                    break;
                case 'night_hours':
                    units = inputs.hours?.night ?? 0;
                    break;
                case 'afternoon_hours':
                    units = inputs.hours?.afternoon ?? 0;
                    break;
                case 'custom_units':
                    units = calc.units_value ?? 0;
                    break;
                default:
                    // Default based on unit type
                    if (calc.unit === 'shift') {
                        units = inputs.units?.shifts_per_month ?? 16;
                    } else if (calc.unit === 'day') {
                        units = inputs.units?.days_per_month ?? 20;
                    } else {
                        units = inputs.working_hours_fund;
                    }
            }
            amount = inputValue * units;
            break;
        }
    }

    // Apply cap
    if (calc.cap_amount && calc.cap_amount > 0 && amount > calc.cap_amount) {
        amount = calc.cap_amount;
    }

    // Apply rounding
    switch (calc.rounding) {
        case 'ceil': amount = Math.ceil(amount); break;
        case 'floor': amount = Math.floor(amount); break;
        case 'nearest': amount = Math.round(amount); break;
        default: amount = Math.round(amount); break;
    }

    return amount;
}

/**
 * Migrate v1 benefit to v2 format
 */
export function migrateV1BenefitToV2(v1: Benefit): BenefitV2 {
    const v2: BenefitV2 = {
        key: v1.key,
        name: v1.name,
        category: 'other',
        calculation: {
            type: v1.calculation_type === 'hourly_rate' ? 'rate' : v1.calculation_type as BenefitCalcType,
            value: v1.value ?? 0,
            unit: v1.calculation_type === 'hourly_rate' ? 'hour' : 'month',
            units_source: v1.calculation_type === 'hourly_rate' ? 'working_hours_fund' : undefined,
            base: v1.calculation_type === 'percentage' ? 'base_salary' : undefined,
        },
        range: v1.is_range ? {
            is_range: true,
            min: v1.min_value ?? 0,
            max: v1.max_value ?? 0,
            expected: v1.min_value ?? 0,
        } : { is_range: false },
    };
    return v2;
}

/**
 * Check if benefit is v2 format
 */
export function isBenefitV2(benefit: unknown): benefit is BenefitV2 {
    return typeof benefit === 'object' && benefit !== null && 'calculation' in benefit;
}

/**
 * Get base monthly salary from position
 */
export function getBaseMonthlySalary(position: JobPosition): number {
    if (position.salary_input_type === 'hourly') {
        return Math.round((position.base_hourly_rate || 0) * (position.working_hours_fund || 157.5));
    }
    return position.base_salary || 0;
}

/**
 * Get base hourly rate from position
 */
export function getBaseHourlyRate(position: JobPosition): number {
    const fund = position.working_hours_fund || 157.5;
    if (position.salary_input_type === 'hourly') {
        return position.base_hourly_rate || 0;
    }
    return Math.round(((position.base_salary || 0) / fund) * 100) / 100;
}

/**
 * Calculate gross salary v2
 */
export function calculateGrossSalaryV2(
    position: JobPosition,
    mode: 'min' | 'max' | 'expected' = 'expected',
    customInputs?: Partial<CalculationInputs>
): number {
    const baseMonthlySalary = getBaseMonthlySalary(position);
    const fund = position.working_hours_fund || 157.5;

    const inputs: CalculationInputs = {
        base_salary: baseMonthlySalary,
        working_hours_fund: fund,
        hourly_base: baseMonthlySalary / fund,
        performancePercent: mode === 'min' ? 0 : mode === 'max' ? 100 : undefined,
        ...customInputs,
    };

    // If mode is expected and we have customInputs.performancePercent, it takes precedence
    if (mode === 'expected' && customInputs?.performancePercent !== undefined) {
        inputs.performancePercent = customInputs.performancePercent;
    }

    let total = baseMonthlySalary + (position.housing_allowance || 0);

    for (const benefit of position.benefits || []) {
        if (isBenefitV2(benefit)) {
            total += calculateBenefitValueV2(benefit, inputs, mode);
        }
    }

    return Math.round(total);
}

/**
 * Round UP to nearest 100 CZK
 */
export function roundUpTo100(value: number): number {
    return Math.ceil(value / 100) * 100;
}

/**
 * Get tax credits separated by type (personal vs children)
 */
export function getTaxCredits(
    taxSettings: TaxSetting[],
    userDeductions: UserDeductions
): { personal: number; children: number } {
    let personal = 0;
    let children = 0;

    // 1. Personal credits (can only reduce tax to 0)
    if (userDeductions.poplatnik) {
        const setting = taxSettings.find(t => t.key === 'sleva_poplatnik');
        personal += setting?.value ?? 2570;
    }

    switch (userDeductions.invaliditaTyp) {
        case 'inv1': {
            const setting = taxSettings.find(t => t.key === 'sleva_inv_1');
            personal += setting?.value ?? 210;
            break;
        }
        case 'inv2': {
            const setting = taxSettings.find(t => t.key === 'sleva_inv_2');
            personal += setting?.value ?? 210;
            break;
        }
        case 'inv3': {
            const setting = taxSettings.find(t => t.key === 'sleva_inv_3');
            personal += setting?.value ?? 420;
            break;
        }
    }

    if (userDeductions.ztpp) {
        const setting = taxSettings.find(t => t.key === 'sleva_ztpp');
        personal += setting?.value ?? 1345;
    }

    if (userDeductions.student) {
        const setting = taxSettings.find(t => t.key === 'sleva_student');
        personal += setting?.value ?? 335;
    }

    // 2. Child credits (can result in tax bonus)
    const pocetDeti = userDeductions.pocetDeti;
    if (pocetDeti >= 1) {
        const d1 = taxSettings.find(t => t.key === 'sleva_dite_1');
        children += d1?.value ?? 1267;
    }
    if (pocetDeti >= 2) {
        const d2 = taxSettings.find(t => t.key === 'sleva_dite_2');
        children += d2?.value ?? 1860;
    }
    if (pocetDeti >= 3) {
        const d3 = taxSettings.find(t => t.key === 'sleva_dite_3');
        children += (d3?.value ?? 2320) * (pocetDeti - 2);
    }

    return { personal, children };
}

/**
 * Calculate net salary from gross
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
    const socialRate = taxSettings.find(t => t.key === 'social_insurance')?.value ?? 7.1;
    const healthRate = taxSettings.find(t => t.key === 'health_insurance')?.value ?? 4.5;
    const taxRate = taxSettings.find(t => t.key === 'income_tax')?.value ?? 15;

    const socialDeduction = Math.round(grossSalary * (socialRate / 100));
    const healthDeduction = Math.round(grossSalary * (healthRate / 100));
    const taxBase = roundUpTo100(grossSalary);
    const taxBeforeCredits = Math.round(taxBase * (taxRate / 100));
    const { personal, children } = getTaxCredits(taxSettings, userDeductions);

    // Apply personal credits (capped at tax amount)
    const taxAfterPersonal = Math.max(0, taxBeforeCredits - personal);

    // Apply child credits (can result in tax bonus / negative tax)
    const taxFinal = taxAfterPersonal - children;

    const netSalary = grossSalary - socialDeduction - healthDeduction - taxFinal;

    return {
        net: Math.round(netSalary),
        social: socialDeduction,
        health: healthDeduction,
        taxBeforeCredits,
        taxCredits: personal + children,
        taxAfterCredits: taxFinal,
    };
}

/**
 * Calculate full salary breakdown (v2)
 */
export function calculateFullSalaryV2(
    position: JobPosition,
    taxSettings: TaxSetting[],
    userDeductions: UserDeductions = { poplatnik: true, pocetDeti: 0, invaliditaTyp: 'none', ztpp: false, student: false },
    customInputs?: Partial<CalculationInputs>
): CalculatedSalary {
    const grossMin = calculateGrossSalaryV2(position, 'min', customInputs);
    const grossMax = calculateGrossSalaryV2(position, 'max', customInputs);
    const grossExpected = calculateGrossSalaryV2(position, 'expected', customInputs);

    const netCalcMin = calculateNetSalary(grossMin, taxSettings, userDeductions);
    const netCalcMax = calculateNetSalary(grossMax, taxSettings, userDeductions);
    const netCalcExpected = calculateNetSalary(grossExpected, taxSettings, userDeductions);

    const fund = position.working_hours_fund || 157.5;

    return {
        grossMin,
        grossMax,
        grossExpected,
        netMin: netCalcMin.net,
        netMax: netCalcMax.net,
        netExpected: netCalcExpected.net,
        hourlyGrossMin: Math.round((grossMin / fund) * 100) / 100,
        hourlyGrossMax: Math.round((grossMax / fund) * 100) / 100,
        hourlyGrossExpected: Math.round((grossExpected / fund) * 100) / 100,
        hourlyNetMin: Math.round((netCalcMin.net / fund) * 100) / 100,
        hourlyNetMax: Math.round((netCalcMax.net / fund) * 100) / 100,
        hourlyNetExpected: Math.round((netCalcExpected.net / fund) * 100) / 100,
        socialInsurance: netCalcExpected.social,
        healthInsurance: netCalcExpected.health,
        taxBeforeCredits: netCalcExpected.taxBeforeCredits,
        taxCredits: netCalcExpected.taxCredits,
        taxAfterCredits: netCalcExpected.taxAfterCredits,
    };
}

// Legacy functions for backward compatibility
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

export function calculateGrossSalary(
    position: JobPosition,
    useMax: boolean = false
): number {
    return calculateGrossSalaryV2(position, useMax ? 'max' : 'min');
}

export function calculateFullSalary(
    position: JobPosition,
    taxSettings: TaxSetting[],
    userDeductions: UserDeductions = { poplatnik: true, pocetDeti: 0, invaliditaTyp: 'none', ztpp: false, student: false }
): CalculatedSalary {
    return calculateFullSalaryV2(position, taxSettings, userDeductions);
}

export const defaultUserDeductions: UserDeductions = {
    poplatnik: true,
    pocetDeti: 0,
    invaliditaTyp: 'none',
    ztpp: false,
    student: false,
};

/**
 * Create default empty benefit v2
 */
export function createDefaultBenefitV2(): BenefitV2 {
    return {
        key: `benefit_${Date.now()}`,
        name: '',
        category: 'bonus',
        calculation: {
            type: 'fixed_amount',
            value: 0,
            unit: 'month',
        },
        range: {
            is_range: false,
        },
    };
}

/**
 * Get human-readable label for benefit calculation
 */
export function getBenefitCalculationLabel(benefit: BenefitV2): string {
    const calc = benefit.calculation;
    const range = benefit.range;

    if (range?.is_range) {
        const unit = calc.type === 'percentage' ? '%' : 'Kč';
        return `${range.min ?? 0}–${range.max ?? 0} ${unit}`;
    }

    switch (calc.type) {
        case 'fixed_amount':
            return `${calc.value} Kč/měs`;
        case 'percentage':
            return `${calc.value}%`;
        case 'rate': {
            const unitLabel = {
                hour: 'Kč/h',
                shift: 'Kč/směna',
                day: 'Kč/den',
                month: 'Kč/měs',
            }[calc.unit ?? 'hour'];
            return `${calc.value} ${unitLabel}`;
        }
        default:
            return `${calc.value}`;
    }
}
