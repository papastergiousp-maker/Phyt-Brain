
import type { Product } from '@/lib/types';
import { ALL_PRODUCTION_TYPES, PRODUCTION_KEYWORD_MAP } from '@/config/production-types';

const extractValue = (lines: string[], key: string): string | undefined => {
  const pattern = new RegExp(`^${key}:\\s*(.*)`, 'i');
  const line = lines.find(l => pattern.test(l));
  return line?.match(pattern)?.[1]?.trim();
};

const getDoseInfo = (doseString: string | undefined): { doseLow?: number; doseHigh?: number; doseUnit?: string } => {
    if (!doseString) return {};
    const doseLower = doseString.toLowerCase();

    const rangeMatch = doseLower.match(/(\d+[\.,]?\d*)\s*-\s*(\d+[\.,]?\d*)/);
    
    let doseLow: number | undefined;
    let doseHigh: number | undefined;

    if (rangeMatch) {
        doseLow = parseFloat(rangeMatch[1].replace(',', '.'));
        doseHigh = parseFloat(rangeMatch[2].replace(',', '.'));
    } else {
        const singleMatch = doseLower.match(/(\d+[\.,]?\d*)/);
        if (singleMatch) {
            const val = parseFloat(singleMatch[1].replace(',', '.'));
            doseLow = val;
            doseHigh = val;
        }
    }

    const unitMatch = doseLower.match(/(g|gr|γραμ|kg|kgr|κιλ|ml|l|lt|λίτρ|τεμ)\s*\/\s*(100[ ]?l|στρέμμα)/);
    const doseUnit = unitMatch ? unitMatch[0] : undefined;
    
    return { doseLow, doseHigh, doseUnit };
};

const getPriceInfo = (priceString: string | undefined): { priceValue?: number; priceUnit?: string } => {
    if (!priceString) return {};
    
    const priceLower = priceString.toLowerCase();
    
    // Match price value (supports € or euro symbol, and comma as decimal separator)
    const priceMatch = priceLower.match(/(?:€|eur)\s*(\d+[\.,]?\d*)/);
    const priceValue = priceMatch ? parseFloat(priceMatch[1].replace(',', '.')) : undefined;

    // Match unit (L, kg, etc.)
    const unitMatch = priceLower.match(/\/\s*(l|lt|λίτρ|kg|kgr|κιλ|τεμ|πακετο|σακι)/i);
    let priceUnit: string | undefined = undefined;
    if (unitMatch) {
        const unitRaw = unitMatch[1].toLowerCase();
        if (['l', 'lt', 'λίτρ'].includes(unitRaw)) priceUnit = 'L';
        else if (['kg', 'kgr', 'κιλ'].includes(unitRaw)) priceUnit = 'kg';
        else if (['τεμ', 'πακετο', 'σακι'].includes(unitRaw)) priceUnit = 'τεμάχιο';
    }

    return { priceValue, priceUnit };
};


export const parseProductsFromCatalog = (catalogDataString: string): Product[] => {
    const products: Product[] = [];
    const companyBlocks = catalogDataString.split(/Εταιρεία:/).slice(1);

    companyBlocks.forEach(block => {
        const companyLines = block.trim().split('\n');
        if (companyLines.length === 0) return;
        
        const companyName = companyLines[0].split('[SPONSORED]')[0].trim();
        const productChunks = block.split(/^\s*\d+\.\s+/m).slice(1);

        productChunks.forEach(chunk => {
            const productLines = chunk.trim().split('\n').map(l => l.trim().replace(/^-\s*/, ''));
            if (productLines.length === 0 || productLines[0] === '') return;

            const nameLine = productLines[0];
            const name = nameLine.replace(/^Προϊόν:\s*/i, '').split('[SPONSORED]')[0].trim();
            if (!name) return;

            const id = `${companyName.replace(/\s/g, '-')}-${name.replace(/\s/g, '-')}`.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/--+/g, '-');
            
            const activeIngredient = extractValue(productLines, 'Δραστική Ουσία');
            const applicationField = extractValue(productLines, 'Πεδίο Εφαρμογής') || '';
            const typeField = extractValue(productLines, 'Τύπος') || '';
            const characteristicsField = extractValue(productLines, 'Χαρακτηριστικά');
            const observations = extractValue(productLines, 'Παρατηρήσεις');
            const targets = extractValue(productLines, 'Στόχοι');
            const dose = extractValue(productLines, 'Δόση');
            const { doseLow, doseHigh, doseUnit } = getDoseInfo(dose);
            const priceIndication = extractValue(productLines, 'Τιμή Ένδειξης');
            const { priceValue, priceUnit } = getPriceInfo(priceIndication);


            let category = 'Uncategorized';
            const combinedCategoryFields = `${applicationField} ${typeField} ${name}`.toLowerCase();
            if (combinedCategoryFields.includes('σπόρος') || combinedCategoryFields.includes('σπόροι') || combinedCategoryFields.includes('υβρίδιο') || combinedCategoryFields.includes('ποικιλία')) category = 'Σπόροι';
            else if (combinedCategoryFields.includes('μυκητοκτόνο')) category = 'Μυκητοκτόνα';
            else if (combinedCategoryFields.includes('εντομοκτόνο')) category = 'Εντομοκτόνα';
            else if (combinedCategoryFields.includes('ζιζανιοκτόνο')) category = 'Ζιζανιοκτόνα';
            else if (combinedCategoryFields.includes('λίπασμα') || combinedCategoryFields.includes('εδαφοβελτιωτικό') || combinedCategoryFields.includes('βιοδιεγέρτης')) category = 'Λιπάσματα';
            
            const fullNotes = [observations, targets ? `Στόχοι: ${targets}` : '', characteristicsField ? `Χαρακτηριστικά: ${characteristicsField}` : ''].filter(Boolean).join('. ');

            let unit = 'Τεμάχιο';
            let weightPerUnit: number | undefined = undefined;

            if (category === 'Σπόροι') {
                unit = 'Σακί';
                weightPerUnit = 20; // Default kg per bag
                if (name.toLowerCase().includes('ηλίανθος') || name.toLowerCase().includes('βαμβάκι')) weightPerUnit = 15;
            }


            const suitableForProduction = new Set<string>();
            const combinedTextFieldForMatching = ` ${name.toLowerCase()} ${applicationField.toLowerCase()} ${targets?.toLowerCase() || ''} ${typeField.toLowerCase()} ${observations?.toLowerCase() || ''} ${characteristicsField?.toLowerCase() || ''} `;
            
            const allKeywords = [...ALL_PRODUCTION_TYPES, ...Object.keys(PRODUCTION_KEYWORD_MAP)];
            const uniqueKeywords = Array.from(new Set(allKeywords));

            uniqueKeywords.forEach(keyword => {
                const keywordLower = keyword.toLowerCase();
                const pattern = new RegExp(`\\b${keywordLower}\\b`, 'i');

                if (pattern.test(combinedTextFieldForMatching)) {
                    const mappedProds = PRODUCTION_KEYWORD_MAP[keyword as keyof typeof PRODUCTION_KEYWORD_MAP];
                    if (mappedProds) {
                        mappedProds.forEach(p => suitableForProduction.add(p));
                    } else {
                        const originalCasedProd = ALL_PRODUCTION_TYPES.find(p => p.toLowerCase() === keywordLower);
                        if (originalCasedProd) {
                        suitableForProduction.add(originalCasedProd);
                        }
                    }
                }
            });

            products.push({
                id, name, category, unit, weightPerUnit,
                activeIngredient: activeIngredient || '',
                manufacturer: companyName,
                suitableForProduction: Array.from(suitableForProduction).sort((a,b) => a.localeCompare(b, 'el')),
                notes: fullNotes,
                dose,
                doseLow,
                doseHigh,
                doseUnit,
                priceIndication,
                priceValue,
                priceUnit
            });
        });
    });
    return products;
};
