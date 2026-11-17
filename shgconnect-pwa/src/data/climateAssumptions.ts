import { LoanClimateCategory, LoanSensitivityAssumption } from '../types/climate';

/**
 * Peer-Reviewed Agronomy & Meteorological Sensitivities
 * Literature Sources:
 * 1. Indian Meteorological Department (IMD) Meteorological Drought Categorization (-20% to -50%)
 * 2. Indian Council of Agricultural Research (ICAR) Rainfed Farming Yield Elasticity (2021)
 * 3. ICRISAT Semi-Arid Tropics Microcredit Sensitivity Papers (2022)
 * 4. National Dairy Development Board (NDDB) Thermal Humidity Index Impact on Crossbred Cattle (2020)
 * 5. NDMA / ILO Guidelines on Heatwaves & Unorganized Labor Productivity Loss (2019)
 */
export const CITED_AGRONOMY_SENSITIVITIES: LoanSensitivityAssumption[] = [
  {
    category: 'RAINFED_CROP',
    categoryLabelEn: 'Rainfed Agriculture (Kharif / Pulses / Cotton)',
    categoryLabelMr: 'जिरायती शेती (खरीप / कडधान्ये / कापूस)',
    baseMonthlyDefaultProb: 0.025,
    rainfallElasticity: 1.85,
    heatElasticity: 0.45,
    recoveryHaircut: 0.65,
    sourceCitation: 'IMD Met Drought Criteria & ICAR Rainfed Yield Elasticity Bulletin 2021'
  },
  {
    category: 'IRRIGATED_AGRI',
    categoryLabelEn: 'Irrigated Farming & Horticulture (Wells / Canals)',
    categoryLabelMr: 'बागायती शेती व फळबागा (विहीर / कालवा)',
    baseMonthlyDefaultProb: 0.015,
    rainfallElasticity: 0.95,
    heatElasticity: 0.30,
    recoveryHaircut: 0.50,
    sourceCitation: 'ICRISAT Ground Water Irrigated Microcredit Resilience Study 2022'
  },
  {
    category: 'DAIRY_LIVESTOCK',
    categoryLabelEn: 'Dairy & Livestock Rearing (Fodder & Heat Sensitive)',
    categoryLabelMr: 'दुग्धव्यवसाय व पशुपालन (चारा व उष्णता संवेदनशीलता)',
    baseMonthlyDefaultProb: 0.020,
    rainfallElasticity: 0.80,
    heatElasticity: 1.25,
    recoveryHaircut: 0.40,
    sourceCitation: 'NDDB Heat Stress Index on Crossbred Dairy Milk Yields & Fodder Deficit Report'
  },
  {
    category: 'NONFARM_MICROENTERPRISE',
    categoryLabelEn: 'Non-Farm Microenterprise (Tailoring / Kirana / Vending)',
    categoryLabelMr: 'बिगरशेती लघुव्यवसाय (शिलाई / किराणा / फेरीवाले)',
    baseMonthlyDefaultProb: 0.018,
    rainfallElasticity: 0.50,
    heatElasticity: 0.90,
    recoveryHaircut: 0.35,
    sourceCitation: 'ILO / NDMA Extreme Heat Labor Capacity Loss & Local Demand Contraction'
  },
  {
    category: 'HEALTH_CONSUMPTION',
    categoryLabelEn: 'Emergency Health & Household Consumption',
    categoryLabelMr: 'आरोग्य व कौटुंबिक आणीबाणी खर्च',
    baseMonthlyDefaultProb: 0.030,
    rainfallElasticity: 0.70,
    heatElasticity: 0.85,
    recoveryHaircut: 0.70,
    sourceCitation: 'NSSO 75th Round Morbidity & Climate Exposure Stress Analysis'
  }
];

export interface ClimatePresetScenario {
  id: string;
  nameEn: string;
  nameMr: string;
  rainfallDeficitPct: number;
  heatAnomalyC: number;
  descriptionEn: string;
  descriptionMr: string;
  historicalContext: string;
}

export const CLIMATE_PRESETS: ClimatePresetScenario[] = [
  {
    id: 'NORMAL_MONSOON',
    nameEn: 'Normal Monsoon Baseline',
    nameMr: 'सर्वसाधारण मान्सून (सामान्य)',
    rainfallDeficitPct: 0,
    heatAnomalyC: 0,
    descriptionEn: 'Within ±10% of Long Period Average (LPA). Baseline repayment behavior.',
    descriptionMr: 'दीर्घकालीन सरासरीच्या सामान्य कक्षेत. नियमित परतफेड.',
    historicalContext: 'IMD Standard Normal: Normal kharif harvest and active local demand.'
  },
  {
    id: 'VIDARBHA_2015',
    nameEn: '2015 Vidarbha Drought (-35%)',
    nameMr: '२०१५ विदर्भ दुष्काळ (-३५%)',
    rainfallDeficitPct: -35,
    heatAnomalyC: 1.8,
    descriptionEn: 'Moderate-to-severe meteorological drought with prolonged dry spell in July-August.',
    descriptionMr: 'मध्यम ते तीव्र दुष्काळ व ३ आठवड्यांचा पावसाचा खंड.',
    historicalContext: 'Historically observed 2015 Marathwada & Vidarbha drought; rainfed crop yield drops 40-50%.'
  },
  {
    id: 'EXTREME_DRY_SPELL',
    nameEn: 'Extreme Dry Spell & Heatwave (-50%)',
    nameMr: 'अति-तीव्र दुष्काळ व उष्णतेची लाट (-५०%)',
    rainfallDeficitPct: -50,
    heatAnomalyC: 3.2,
    descriptionEn: 'Severe meteorological drought coupled with severe summer heatwave (>44°C).',
    descriptionMr: 'अत्यंत गंभीर दुष्काळ व भीषण उष्णतेची लाट.',
    historicalContext: 'Severe stress test: acute fodder deficit, outdoor labor halt, systemic farm distress.'
  }
];

/**
 * Infer climate category for legacy loans from member occupation or loan notes
 */
export function inferClimateCategory(occupation?: string, loanNotes?: string): LoanClimateCategory {
  const text = `${occupation || ''} ${loanNotes || ''}`.toLowerCase();

  if (text.includes('dairy') || text.includes('livestock') || text.includes('buffalo') || text.includes('cow') || text.includes('goat') || text.includes('दुग्ध') || text.includes('पशू') || text.includes('गाय') || text.includes('म्हैस')) {
    return 'DAIRY_LIVESTOCK';
  }
  if (text.includes('drip') || text.includes('well') || text.includes('borewell') || text.includes('sugarcane') || text.includes('irrigat') || text.includes('बागायती') || text.includes('विहीर') || text.includes('ठिबक') || text.includes('ऊस')) {
    return 'IRRIGATED_AGRI';
  }
  if (text.includes('tailor') || text.includes('shop') || text.includes('kirana') || text.includes('beauty') || text.includes('sewing') || text.includes('vendor') || text.includes('शिलाई') || text.includes('दुकान') || text.includes('किराणा') || text.includes('ब्युटी')) {
    return 'NONFARM_MICROENTERPRISE';
  }
  if (text.includes('health') || text.includes('medical') || text.includes('hospital') || text.includes('education') || text.includes('marriage') || text.includes('आरोग्य') || text.includes('दवाखाना') || text.includes('शिक्षण') || text.includes('लग्न')) {
    return 'HEALTH_CONSUMPTION';
  }
  // Default to Rainfed Crop for rural farming members
  return 'RAINFED_CROP';
}
