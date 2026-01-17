-- =====================================================
-- Job Comparator - Database Schema v4
-- SIMPLIFIED: Dynamic salary calculation on frontend
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- Table: companies (Firmy)
-- =====================================================
DROP TABLE IF EXISTS job_positions CASCADE;
DROP TABLE IF EXISTS benefit_fields CASCADE;
DROP TABLE IF EXISTS companies CASCADE;
DROP TABLE IF EXISTS tax_settings CASCADE;

CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    logo_url TEXT,
    description TEXT,
    address TEXT,
    city TEXT,
    maps_url TEXT,
    web_url TEXT,
    latitude DECIMAL,
    longitude DECIMAL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Table: job_positions (Pracovní pozice)
-- =====================================================
CREATE TABLE job_positions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    position_name TEXT NOT NULL,
    department TEXT,
    shift_type TEXT,
    evaluation_level TEXT,
    -- Salary input: user can enter either monthly OR hourly base
    salary_input_type TEXT DEFAULT 'monthly' CHECK (salary_input_type IN ('monthly', 'hourly')),
    base_salary INTEGER DEFAULT 0,          -- Monthly base salary (if input_type = 'monthly')
    base_hourly_rate DECIMAL(10,2) DEFAULT 0, -- Hourly base rate (if input_type = 'hourly')
    housing_allowance INTEGER DEFAULT 0,
    working_hours_fund DECIMAL(10,2) DEFAULT 157.5,
    benefits JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Table: tax_settings (Daňové nastavení)
-- =====================================================
CREATE TABLE tax_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    value DECIMAL(10,4) NOT NULL,
    type TEXT DEFAULT 'percent',
    category TEXT DEFAULT 'tax',
    description TEXT,
    valid_from DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Row Level Security
-- =====================================================
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow public read on companies" ON companies;
DROP POLICY IF EXISTS "Allow public read on job_positions" ON job_positions;
DROP POLICY IF EXISTS "Allow public read on tax_settings" ON tax_settings;
DROP POLICY IF EXISTS "Allow public insert on companies" ON companies;
DROP POLICY IF EXISTS "Allow public update on companies" ON companies;
DROP POLICY IF EXISTS "Allow public delete on companies" ON companies;
DROP POLICY IF EXISTS "Allow public insert on job_positions" ON job_positions;
DROP POLICY IF EXISTS "Allow public update on job_positions" ON job_positions;
DROP POLICY IF EXISTS "Allow public delete on job_positions" ON job_positions;
DROP POLICY IF EXISTS "Allow public insert on tax_settings" ON tax_settings;
DROP POLICY IF EXISTS "Allow public update on tax_settings" ON tax_settings;
DROP POLICY IF EXISTS "Allow public delete on tax_settings" ON tax_settings;

-- Create policies
CREATE POLICY "Allow public read on companies" ON companies FOR SELECT USING (true);
CREATE POLICY "Allow public read on job_positions" ON job_positions FOR SELECT USING (true);
CREATE POLICY "Allow public read on tax_settings" ON tax_settings FOR SELECT USING (true);
CREATE POLICY "Allow public insert on companies" ON companies FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on companies" ON companies FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on companies" ON companies FOR DELETE USING (true);
CREATE POLICY "Allow public insert on job_positions" ON job_positions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on job_positions" ON job_positions FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on job_positions" ON job_positions FOR DELETE USING (true);
CREATE POLICY "Allow public insert on tax_settings" ON tax_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on tax_settings" ON tax_settings FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on tax_settings" ON tax_settings FOR DELETE USING (true);

-- Indexes
CREATE INDEX idx_job_positions_company_id ON job_positions(company_id);
CREATE INDEX idx_job_positions_benefits ON job_positions USING GIN (benefits);

-- =====================================================
-- TAX SETTINGS DATA
-- =====================================================
INSERT INTO tax_settings (key, name, value, type, category, description) VALUES
('social_insurance', 'Sociální pojištění', 7.1, 'percent', 'insurance', 'Odvod zaměstnance'),
('health_insurance', 'Zdravotní pojištění', 4.5, 'percent', 'insurance', 'Odvod zaměstnance'),
('income_tax', 'Daň z příjmů', 15.0, 'percent', 'tax', 'Záloha na daň'),
('sleva_poplatnik', 'Sleva na poplatníka', 2570, 'currency', 'deduction', 'Měsíční sleva'),
('sleva_dite_1', 'Sleva na 1. dítě', 1267, 'currency', 'deduction', 'Daňové zvýhodnění'),
('sleva_dite_2', 'Sleva na 2. dítě', 1860, 'currency', 'deduction', 'Daňové zvýhodnění'),
('sleva_dite_3', 'Sleva na 3.+ dítě', 2320, 'currency', 'deduction', 'Daňové zvýhodnění'),
('sleva_inv_1', 'Invalidita 1. stupně', 210, 'currency', 'deduction', 'Sleva na dani'),
('sleva_inv_2', 'Invalidita 2. stupně', 210, 'currency', 'deduction', 'Sleva na dani'),
('sleva_inv_3', 'Invalidita 3. stupně', 420, 'currency', 'deduction', 'Sleva na dani'),
('sleva_ztpp', 'Sleva ZTP/P', 1345, 'currency', 'deduction', 'Sleva na dani');

-- =====================================================
-- COMPANIES DATA
-- =====================================================
INSERT INTO companies (id, name, city) VALUES
('11111111-1111-1111-1111-111111111111', 'ABL', 'Česká republika'),
('22222222-2222-2222-2222-222222222222', 'Composite Components', 'Česká republika'),
('33333333-3333-3333-3333-333333333333', 'CKD', 'Česká republika'),
('44444444-4444-4444-4444-444444444444', 'Elitex', 'Česká republika'),
('55555555-5555-5555-5555-555555555555', 'Fau-Pur', 'Česká republika'),
('66666666-6666-6666-6666-666666666666', 'Fau-Reichflix', 'Česká republika'),
('77777777-7777-7777-7777-777777777777', 'Fau-Bakol', 'Česká republika'),
('88888888-8888-8888-8888-888888888888', 'GCI', 'Česká republika'),
('99999999-9999-9999-9999-999999999999', 'Leeimfeld', 'Česká republika'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Swaco', 'Česká republika'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Nest', 'Česká republika'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Kartent', 'Česká republika'),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Krognet', 'Česká republika'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Kysel', 'Česká republika'),
('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Kyb', 'Česká republika'),
('11111111-2222-3333-4444-555555555555', 'Celní Praha', 'Česká republika'),
('22222222-3333-4444-5555-666666666666', 'Mauriti', 'Česká republika'),
('33333333-4444-5555-6666-777777777777', 'Motorp', 'Česká republika'),
('44444444-5555-6666-7777-888888888888', 'Viňaz (Uhorely)', 'Česká republika');

-- =====================================================
-- JOB POSITIONS DATA (Screenshot 16 - ABL)
-- =====================================================
-- ABL - Zák. Dvoudr. - Výroba, dovoz/retuš
INSERT INTO job_positions (company_id, position_name, department, shift_type, base_salary, housing_allowance, working_hours_fund, benefits) VALUES
('11111111-1111-1111-1111-111111111111', 'Operátor', 'Výroba, dovoz/retuš', '2 směny', 22091, 3000, 157.5, 
'[
  {"key": "variable", "name": "Základní mzda (měsíční výpočet)", "calculation_type": "fixed_amount", "value": 22091},
  {"key": "os_hodnoceni", "name": "Os. hodnocení za (0-100%) - 50%", "calculation_type": "percentage", "is_range": true, "min_value": 0, "max_value": 50},
  {"key": "odmena_norma", "name": "Odměna za normu (0-100%) - 100%", "calculation_type": "percentage", "is_range": true, "min_value": 0, "max_value": 100},
  {"key": "odmena_bonus", "name": "Odměna za dodržování fondu a bonusy", "calculation_type": "fixed_amount", "is_range": true, "min_value": 0, "max_value": 1500}
]'::jsonb),

-- ABL - Operátor - OD výroba (+ příplatek za ubytování 3000Kč)
('11111111-1111-1111-1111-111111111111', 'Operátor', 'OD výroba', '2 směny', 22091, 3000, 157.5, 
'[
  {"key": "os_hodnoceni", "name": "Os. hodnocení (0-50%)", "calculation_type": "percentage", "is_range": true, "min_value": 0, "max_value": 50},
  {"key": "odmena_norma", "name": "Odměna za normu (0-100%)", "calculation_type": "percentage", "is_range": true, "min_value": 0, "max_value": 100},
  {"key": "odmena_bonus", "name": "Bonusy za fond", "calculation_type": "fixed_amount", "is_range": true, "min_value": 0, "max_value": 1500}
]'::jsonb);

-- =====================================================
-- Composite Components (Screenshot 16-17)
-- =====================================================
INSERT INTO job_positions (company_id, position_name, department, shift_type, base_salary, housing_allowance, working_hours_fund, benefits) VALUES
-- Lamelovárek
('22222222-2222-2222-2222-222222222222', 'Lamelovárek', 'Výroba', '2 směny', 18505, 3000, 157.5,
'[
  {"key": "kpi_bonus", "name": "KPI bonus (0-33%)", "calculation_type": "percentage", "is_range": true, "min_value": 0, "max_value": 33},
  {"key": "osobni_hodnoceni", "name": "Osobní ohodnocení (0-60Kč/hod)", "calculation_type": "hourly_rate", "is_range": true, "min_value": 0, "max_value": 60},
  {"key": "zdravi", "name": "Bonus za zdraví (2000Kč)", "calculation_type": "fixed_amount", "value": 2000},
  {"key": "priplatek_prostredi", "name": "Příplatek za pracovní prostředí", "calculation_type": "fixed_amount", "value": 0},
  {"key": "nocni", "name": "Příplatek za noční směnu (10%)", "calculation_type": "percentage", "value": 10},
  {"key": "doprava", "name": "Doprava 35kč/směna", "calculation_type": "fixed_amount", "value": 770},
  {"key": "simix_motivace", "name": "SIMIX motivace", "calculation_type": "fixed_amount", "value": 0}
]'::jsonb),

-- Lamelovárek - plastikář
('22222222-2222-2222-2222-222222222222', 'Plastikář', 'Výroba', '2 směny', 19505, 3000, 157.5,
'[
  {"key": "kpi_bonus", "name": "KPI bonus (0-33%)", "calculation_type": "percentage", "is_range": true, "min_value": 0, "max_value": 33},
  {"key": "osobni_hodnoceni", "name": "Osobní ohodnocení (0-60Kč/hod)", "calculation_type": "hourly_rate", "is_range": true, "min_value": 0, "max_value": 60},
  {"key": "zdravi", "name": "Bonus za zdraví (2000Kč)", "calculation_type": "fixed_amount", "value": 2000},
  {"key": "nocni", "name": "Příplatek za noční (10%)", "calculation_type": "percentage", "value": 10},
  {"key": "doprava", "name": "Doprava 35kč/směna", "calculation_type": "fixed_amount", "value": 770}
]'::jsonb),

-- Döhler - dvousměnný
('22222222-2222-2222-2222-222222222222', 'Döhler 2směnný', 'Výroba', '2 směny', 14765, 3000, 157.5,
'[
  {"key": "kpi_bonus", "name": "KPI bonus (0-33%)", "calculation_type": "percentage", "is_range": true, "min_value": 0, "max_value": 33},
  {"key": "osobni_hodnoceni", "name": "Osobní ohodnocení (0-60Kč/hod)", "calculation_type": "hourly_rate", "is_range": true, "min_value": 0, "max_value": 60},
  {"key": "zdravi", "name": "Bonus za zdraví (2000Kč)", "calculation_type": "fixed_amount", "value": 2000},
  {"key": "nocni", "name": "Noční příplatek (10%)", "calculation_type": "percentage", "value": 10}
]'::jsonb),

-- Döhler - třísměnný
('22222222-2222-2222-2222-222222222222', 'Döhler 3směnný', 'Výroba', '3 směny', 16765, 3000, 157.5,
'[
  {"key": "kpi_bonus", "name": "KPI bonus (0-33%)", "calculation_type": "percentage", "is_range": true, "min_value": 0, "max_value": 33},
  {"key": "osobni_hodnoceni", "name": "Osobní ohodnocení (0-60Kč/hod)", "calculation_type": "hourly_rate", "is_range": true, "min_value": 0, "max_value": 60},
  {"key": "zdravi", "name": "Bonus za zdraví (2000Kč)", "calculation_type": "fixed_amount", "value": 2000},
  {"key": "nocni", "name": "Noční příplatek (10%)", "calculation_type": "percentage", "value": 10}
]'::jsonb),

-- Lakyma - příjímací
('22222222-2222-2222-2222-222222222222', 'Příjímací', 'Logistika', '2 směny', 18505, 3000, 157.5,
'[
  {"key": "kpi_bonus", "name": "KPI bonus (0-33%)", "calculation_type": "percentage", "is_range": true, "min_value": 0, "max_value": 33},
  {"key": "osobni_hodnoceni", "name": "Osobní ohodnocení (0-60Kč/hod)", "calculation_type": "hourly_rate", "is_range": true, "min_value": 0, "max_value": 60},
  {"key": "zdravi", "name": "Bonus za zdraví", "calculation_type": "fixed_amount", "value": 2000}
]'::jsonb);

-- =====================================================
-- CKD (Kutná Hora) - Screenshot 18
-- =====================================================
INSERT INTO job_positions (company_id, position_name, department, shift_type, base_salary, housing_allowance, working_hours_fund, benefits) VALUES
-- CKD - OP výroby, logistiky, sklady, obrobny
('33333333-3333-3333-3333-333333333333', 'Operátor výroby', 'OP výroby, logistiky, sklady, obrobny', '2 směny', 21293, 3000, 157.5,
'[
  {"key": "variabilni", "name": "Variabilní složka 14%", "calculation_type": "percentage", "value": 14},
  {"key": "nocni_smena", "name": "Noční směna 14%", "calculation_type": "percentage", "value": 14},
  {"key": "stavebni", "name": "Stavební sázka 6 tisíc", "calculation_type": "fixed_amount", "value": 6000},
  {"key": "ztizene", "name": "Ztížené podmínky 10%", "calculation_type": "percentage", "value": 10}
]'::jsonb),

-- CKD - Bonuskonze
('33333333-3333-3333-3333-333333333333', 'Bonuskonze', 'OP výroby, logistiky, sklady, obrobny', '2 směny', 21293, 3000, 157.5,
'[
  {"key": "variabilni", "name": "Variabilní složka 14%", "calculation_type": "percentage", "value": 14},
  {"key": "nocni_smena", "name": "Noční směna 14%", "calculation_type": "percentage", "value": 14},
  {"key": "ztizene", "name": "Ztížené podmínky 10%", "calculation_type": "percentage", "value": 10}
]'::jsonb);

-- =====================================================
-- Viňaz (Uhorely) - Screenshot 19
-- =====================================================
INSERT INTO job_positions (company_id, position_name, department, shift_type, base_salary, housing_allowance, working_hours_fund, benefits) VALUES
-- R (+Havasmann ze. hodnocení)
('44444444-5555-6666-7777-888888888888', 'Operátor R', 'Výroba', '2 směny', 21725, 3000, 157.5,
'[
  {"key": "variabilni_1kcs", "name": "Variabilní složka 1Kč/h", "calculation_type": "hourly_rate", "value": 1},
  {"key": "sochazkovÿ", "name": "Dochàzkový bonus 1500Kč", "calculation_type": "fixed_amount", "value": 1500},
  {"key": "os_hodnoceni", "name": "Os. Hodnocení (0-1000Kč)", "calculation_type": "fixed_amount", "is_range": true, "min_value": 0, "max_value": 1000},
  {"key": "priplatek_odp", "name": "Příplatek za odpolední směnu 30Kč/hod", "calculation_type": "hourly_rate", "value": 30}
]'::jsonb),

-- R (+Havasmann ze. hodnocení) - další varianta
('44444444-5555-6666-7777-888888888888', 'Operátor R (+Odběr)', '3 směny', '3 směny', 21725, 3000, 157.5,
'[
  {"key": "variabilni_1kcs", "name": "Variabilní složka 1Kč/h", "calculation_type": "hourly_rate", "value": 1},
  {"key": "sochazkovÿ", "name": "Dochàzkový bonus 1500Kč", "calculation_type": "fixed_amount", "value": 1500},
  {"key": "os_hodnoceni", "name": "Os. Hodnocení (0-1000Kč)", "calculation_type": "fixed_amount", "is_range": true, "min_value": 0, "max_value": 1000},
  {"key": "nocni_priplatek", "name": "Noční příplatek 0-3000Kč", "calculation_type": "fixed_amount", "is_range": true, "min_value": 0, "max_value": 3000},
  {"key": "priplatek_odp", "name": "Příplatek za odpolední 30Kč/hod", "calculation_type": "hourly_rate", "value": 30}
]'::jsonb);
