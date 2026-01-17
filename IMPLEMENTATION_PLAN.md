# Job Position Comparator - Porovnávač pracovních pozic

Webová aplikace pro personální agenturu umožňující správu firem, jejich pracovních nabídek a srovnání pozic pro kandidáty.

## Technologie

- **Framework**: Next.js 14 (App Router) + TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui (Button, Card, Table, Dialog, Select...)
- **Animations**: Framer Motion (page transitions, hover effects, comparisons)
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel (volitelně)

---

## Databázové schéma (Supabase)

### Tabulka: `companies` (Firmy)
| Sloupec | Typ | Popis |
|---------|-----|-------|
| id | uuid | Primární klíč |
| name | text | Název firmy (např. "Faurecia Mladá Boleslav") |
| logo_url | text | URL loga firmy |
| description | text | Popis firmy |
| **address** | text | Celá adresa (ulice, číslo) |
| **city** | text | Město |
| **maps_url** | text | Odkaz na Google Maps (embed/link) |
| web_url | text | Website URL |
| updated_at | timestamp | Datum aktualizace |
| created_at | timestamp | Datum vytvoření |

### **Company Map Implementation**
- **DB Schema**: Add `latitude` (DECIMAL) and `longitude` (DECIMAL) to `companies` table.
- **Dependencies**: `leaflet`, `react-leaflet`, `@types/leaflet`.
- **GPS Parsing**:
  - Implement Server Action to handle Google Maps URLs (including `maps.app.goo.gl` short links).
  - Logic: Expand URL -> Parse `!3d` (lat) and `!4d` (lon) or `@lat,lon` from the resolved URL.
  - Admin UI: Button "Načíst GPS z URL" next to `maps_url` input.
- **Map Page (`/companies/map`)**:
  - Full-height layout.
  - Left sidebar: List of companies.
  - Main area: Interactive map with markers.
  - Interaction: Click on list item -> FlyTo marker & Open Popup.

### Tabulka: `job_positions` (Pracovní pozice)
| Sloupec | Typ | Popis |
|---------|-----|-------|
| id | uuid | Primární klíč |
| company_id | uuid | FK na companies |
| position_name | text | Název pozice (např. "T1 Operátor") |
| department | text | Oddělení (výroba, logistika, sklad...) |
| shift_type | text | Typ směny (2 směny, 3 směny) |
| evaluation_level | text | Úroveň hodnocení (RNOR, NORN) |
| base_salary | integer | **Základní mzda** (fixní částka v Kč) |
| **housing_allowance** | integer | **Příspěvek na ubytování** (Kč) |
| **working_hours_fund** | decimal | **Průměrný měsíční fond hodin** (např. 157.5) |
| benefits | jsonb | **Variabilní složky mzdy** (viz struktura níže) |
| created_at | timestamp | Datum vytvoření |

#### Struktura JSONB `benefits` (Pokročilá definice)
Benefit může být definován jako fixní částka, procento ze základu, hodinová sazba, nebo rozsah (min-max).

**Typy výpočtu (`calculation_type`):**
1. **`fixed_amount`**: Fixní měsíční částka (např. "Docházkový bonus 1500 Kč")
2. **`hourly_rate`**: Hodinová sazba × `working_hours_fund` (např. "Odpolední 5 Kč/h", "Ztížené podmínky 13 Kč/h")
3. **`percentage`**: Procento z `base_salary` (např. "Noční směna 10%", "KPI 0-33%")

**Atributy objektu benefitu:**
```json
{
  "key": "night_shift_bonus",
  "name": "Příplatek za noční",
  "calculation_type": "percentage", // 'fixed_amount' | 'hourly_rate' | 'percentage'
  "is_range": false,                // true pokud jde o rozsah (0-4000)
  "value": 10,                      // Hodnota pro fixní výpočet (např. 10%)
  "min_value": 0,                   // Min hodnota pro rozsah
  "max_value": 33                   // Max hodnota pro rozsah (např. 33%)
}
```

**Logika výpočtu mezd (Frontend/Runtime):**
Aplikace bude dynamicky počítat výsledné hodnoty při zobrazení (client-side calculation).
To zajistí, že při změně daní (tax_settings) se automaticky přepočítají všechny čisté mzdy bez nutnosti aktualiovat databázi.

1. **Hrubá mzda** = `base_salary` + SUM(vypočtené benefity)
2. **Čistá mzda** = Výpočet dle `tax_settings` (daň 15%, soc/zdrav, slevy)

---

## Hlavní funkce aplikace

### 1. Dashboard (Přehled)
- Statistiky: počet firem, počet pozic, průměrná mzda
- Rychlé odkazy na sekce

### 2. Seznam firem
- Karty firem s logem a základními údaji
- Kliknutím na firmu → detail s pozicemi

### 3. Seznam pozic
- Tabulka všech pozic se základními údaji
- Filtrování podle firmy, typu směny, mzdy
- Řazení podle různých kritérií

### 4. Porovnávač pozic (hlavní funkce)
- Výběr 2-4 pozic k porovnání
- Side-by-side zobrazení všech parametrů
- Barevné zvýraznění nejlepších hodnot

### 5. Admin panel
- CRUD pro firmy
- CRUD pro pozice
