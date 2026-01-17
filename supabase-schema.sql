-- =====================================================
-- Job Comparator - Database Schema v5
-- Benefits Schema v2 with enhanced calculation support
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
    is_active BOOLEAN DEFAULT true,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Table: job_positions (Pracovní pozice)
-- Benefits JSONB uses v2 schema (see BENEFITS_SCHEMA_V2.md)
-- =====================================================
CREATE TABLE job_positions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    position_name TEXT NOT NULL,
    department TEXT,
    shift_type TEXT,
    evaluation_level TEXT,
    salary_input_type TEXT DEFAULT 'monthly' CHECK (salary_input_type IN ('monthly', 'hourly')),
    base_salary INTEGER DEFAULT 0,
    base_hourly_rate DECIMAL(10,2) DEFAULT 0,
    housing_allowance INTEGER DEFAULT 0,
    working_hours_fund DECIMAL(10,2) DEFAULT 157.5,
    -- Benefits v2 JSONB structure:
    -- [{
    --   "key": "string",
    --   "name": "string", 
    --   "category": "bonus|allowance|premium|shift|other",
    --   "calculation": {
    --     "type": "fixed_amount|percentage|rate",
    --     "value": number,
    --     "unit": "month|hour|shift|day",
    --     "base": "base_salary|hourly_base|custom_amount",
    --     "units_source": "working_hours_fund|night_hours|afternoon_hours|custom_units",
    --     "units_value": number,
    --     "floor_per_unit": number,
    --     "cap_amount": number
    --   },
    --   "range": { "is_range": bool, "min": num, "max": num, "expected": num },
    --   "applies_when": { "shift_type": string, "probation_only": bool, "note": string },
    --   "meta": { "source": string, "comment": string }
    -- }]
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
('sleva_ztpp', 'Sleva ZTP/P', 1345, 'currency', 'deduction', 'Sleva na dani'),
('sleva_student', 'Sleva student', 335, 'currency', 'deduction', 'Sleva na dani');

-- =====================================================
-- SAMPLE COMPANIES
-- =====================================================
INSERT INTO companies (id, name, city, is_active) VALUES
('11111111-1111-1111-1111-111111111111', 'ABL Lights', 'Pardubice', true),
('22222222-2222-2222-2222-222222222222', 'Composite Components', 'Choceň', true),
('33333333-3333-3333-3333-333333333333', 'CKD Kutná Hora', 'Kutná Hora', true),
('44444444-4444-4444-4444-444444444444', 'Viessmann', 'Allendorf', true);

-- =====================================================
-- JOB POSITIONS with Benefits v2 Schema
-- =====================================================

-- ABL Lights - Operátor 2 směny
INSERT INTO job_positions (company_id, position_name, department, shift_type, base_salary, housing_allowance, working_hours_fund, benefits) VALUES
('11111111-1111-1111-1111-111111111111', 'Operátor výroby', 'Výroba', '2 směny', 22091, 3000, 157.5, 
'[
  {
    "key": "os_hodnoceni",
    "name": "Osobní hodnocení",
    "category": "bonus",
    "calculation": { "type": "percentage", "value": 25, "unit": "month", "base": "base_salary" },
    "range": { "is_range": true, "min": 0, "max": 50, "expected": 25 }
  },
  {
    "key": "odmena_norma",
    "name": "Odměna za plnění normy",
    "category": "bonus",
    "calculation": { "type": "percentage", "value": 50, "unit": "month", "base": "base_salary" },
    "range": { "is_range": true, "min": 0, "max": 100, "expected": 50 }
  },
  {
    "key": "dochazkovy_bonus",
    "name": "Docházkový bonus",
    "category": "bonus",
    "calculation": { "type": "fixed_amount", "value": 1500, "unit": "month" },
    "range": { "is_range": false }
  },
  {
    "key": "odpoledni",
    "name": "Příplatek za odpolední",
    "category": "shift",
    "calculation": { "type": "rate", "value": 5, "unit": "hour", "units_source": "afternoon_hours" },
    "range": { "is_range": false }
  }
]'::jsonb);

-- Composite Components - Plastikář
INSERT INTO job_positions (company_id, position_name, department, shift_type, base_salary, housing_allowance, working_hours_fund, benefits) VALUES
('22222222-2222-2222-2222-222222222222', 'Plastikář', 'Výroba', '2 směny', 19505, 3000, 157.5,
'[
  {
    "key": "kpi_bonus",
    "name": "KPI bonus",
    "category": "bonus",
    "calculation": { "type": "percentage", "value": 15, "unit": "month", "base": "base_salary" },
    "range": { "is_range": true, "min": 0, "max": 33, "expected": 15 }
  },
  {
    "key": "osobni_hodnoceni",
    "name": "Osobní ohodnocení",
    "category": "bonus",
    "calculation": { "type": "rate", "value": 30, "unit": "hour", "units_source": "working_hours_fund" },
    "range": { "is_range": true, "min": 0, "max": 60, "expected": 30 }
  },
  {
    "key": "zdravi",
    "name": "Bonus za zdraví",
    "category": "bonus",
    "calculation": { "type": "fixed_amount", "value": 2000, "unit": "month" },
    "range": { "is_range": false }
  },
  {
    "key": "nocni",
    "name": "Příplatek za noční",
    "category": "shift",
    "calculation": { 
      "type": "percentage", 
      "value": 10, 
      "unit": "hour", 
      "base": "hourly_base",
      "units_source": "night_hours",
      "floor_per_unit": 16
    },
    "range": { "is_range": false },
    "meta": { "comment": "Min 16 Kč/h dle zákona" }
  },
  {
    "key": "doprava",
    "name": "Příspěvek na dopravu",
    "category": "allowance",
    "calculation": { "type": "rate", "value": 35, "unit": "shift", "units_source": "custom_units", "units_value": 22 },
    "range": { "is_range": false }
  }
]'::jsonb);

-- CKD Kutná Hora - Operátor výroby
INSERT INTO job_positions (company_id, position_name, department, shift_type, base_salary, housing_allowance, working_hours_fund, benefits) VALUES
('33333333-3333-3333-3333-333333333333', 'Operátor výroby', 'Výroba, logistika', '2 směny', 21293, 3000, 157.5,
'[
  {
    "key": "variabilni",
    "name": "Variabilní složka",
    "category": "bonus",
    "calculation": { "type": "percentage", "value": 14, "unit": "month", "base": "base_salary" },
    "range": { "is_range": false }
  },
  {
    "key": "nocni_smena",
    "name": "Noční směna",
    "category": "shift",
    "calculation": { "type": "percentage", "value": 14, "unit": "hour", "base": "hourly_base", "units_source": "night_hours" },
    "range": { "is_range": false }
  },
  {
    "key": "stavebni",
    "name": "Stavební sázka",
    "category": "bonus",
    "calculation": { "type": "fixed_amount", "value": 6000, "unit": "month" },
    "range": { "is_range": false }
  },
  {
    "key": "ztizene",
    "name": "Ztížené pracovní podmínky",
    "category": "premium",
    "calculation": { "type": "percentage", "value": 10, "unit": "month", "base": "base_salary" },
    "range": { "is_range": false }
  }
]'::jsonb);

-- Viessmann - Montážní pracovník 3 směny
INSERT INTO job_positions (company_id, position_name, department, shift_type, base_salary, housing_allowance, working_hours_fund, benefits) VALUES
('44444444-4444-4444-4444-444444444444', 'Montážní pracovník', 'Montáž', '3 směny', 23000, 3500, 157.5,
'[
  {
    "key": "kpi",
    "name": "KPI prémie",
    "category": "bonus",
    "calculation": { "type": "percentage", "value": 10, "unit": "month", "base": "base_salary" },
    "range": { "is_range": true, "min": 0, "max": 20, "expected": 10 }
  },
  {
    "key": "stravenkovy_pausal",
    "name": "Stravenkový paušál",
    "category": "allowance",
    "calculation": { "type": "rate", "value": 77, "unit": "shift", "units_source": "custom_units", "units_value": 16 },
    "range": { "is_range": false }
  },
  {
    "key": "nocni",
    "name": "Noční příplatek",
    "category": "shift",
    "calculation": { 
      "type": "percentage", 
      "value": 10, 
      "unit": "hour", 
      "base": "hourly_base", 
      "units_source": "night_hours",
      "floor_per_unit": 16
    },
    "range": { "is_range": false }
  },
  {
    "key": "sobota_nedele",
    "name": "Víkendový příplatek",
    "category": "shift",
    "calculation": { "type": "rate", "value": 10, "unit": "hour", "units_source": "custom_units", "units_value": 16 },
    "range": { "is_range": false },
    "applies_when": { "note": "Platí pouze pro sobotu a neděli" }
  },
  {
    "key": "vernostni",
    "name": "Věrnostní bonus",
    "category": "bonus",
    "calculation": { "type": "fixed_amount", "value": 0, "unit": "month", "cap_amount": 5000 },
    "range": { "is_range": true, "min": 0, "max": 5000, "expected": 2500 },
    "applies_when": { "probation_only": false, "note": "Po zkušební době, narůstá podle odpracovaných let" }
  }
]'::jsonb);
