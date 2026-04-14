import fs from 'fs';
import path from 'path';

const AIRPORT_MAP = {
  'ทขก': { code: 'KKC', nameTh: 'ท่าอากาศยานขอนแก่น',       nameEn: 'Khon Kaen Airport',        province: 'ขอนแก่น' },
  'ทตง': { code: 'TST', nameTh: 'ท่าอากาศยานตรัง',           nameEn: 'Trang Airport',            province: 'ตรัง' },
  'ทกบ': { code: 'KBV', nameTh: 'ท่าอากาศยานกระบี่',          nameEn: 'Krabi Airport',            province: 'กระบี่' },
  'ทชพ': { code: 'CJM', nameTh: 'ท่าอากาศยานชุมพร',          nameEn: 'Chumphon Airport',         province: 'ชุมพร' },
  'ทนธ': { code: 'NAW', nameTh: 'ท่าอากาศยานนราธิวาส',       nameEn: 'Narathiwat Airport',       province: 'นราธิวาส' },
  'ทนพ': { code: 'KOP', nameTh: 'ท่าอากาศยานนครพนม',         nameEn: 'Nakhon Phanom Airport',    province: 'นครพนม' },
  'ทนศ': { code: 'NST', nameTh: 'ท่าอากาศยานนครศรีธรรมราช', nameEn: 'Nakhon Si Thammarat Airport', province: 'นครศรีธรรมราช' },
  'ทบร': { code: 'BFV', nameTh: 'ท่าอากาศยานบุรีรัมย์',       nameEn: 'Buri Ram Airport',         province: 'บุรีรัมย์' },
  'ทปย': { code: 'PYY', nameTh: 'ท่าอากาศยานปาย',            nameEn: 'Pai Airport',              province: 'แม่ฮ่องสอน' },
  'ทพล': { code: 'PHS', nameTh: 'ท่าอากาศยานพิษณุโลก',       nameEn: 'Phitsanulok Airport',      province: 'พิษณุโลก' },
  'ทมส': { code: 'HGN', nameTh: 'ท่าอากาศยานแม่ฮ่องสอน',      nameEn: 'Mae Hong Son Airport',     province: 'แม่ฮ่องสอน' },
  'ทรอ': { code: 'ROI', nameTh: 'ท่าอากาศยานร้อยเอ็ด',        nameEn: 'Roi Et Airport',           province: 'ร้อยเอ็ด' },
  'ทลป': { code: 'LPT', nameTh: 'ท่าอากาศยานลำปาง',           nameEn: 'Lampang Airport',          province: 'ลำปาง' },
  'ทลย': { code: 'LOE', nameTh: 'ท่าอากาศยานเลย',             nameEn: 'Loei Airport',             province: 'เลย' },
  'ทสฎ': { code: 'URT', nameTh: 'ท่าอากาศยานสุราษฎร์ธานี',    nameEn: 'Surat Thani Airport',      province: 'สุราษฎร์ธานี' },
  'ทสน': { code: 'SNO', nameTh: 'ท่าอากาศยานสกลนคร',          nameEn: 'Sakon Nakhon Airport',     province: 'สกลนคร' },
  'ทหห': { code: 'HHQ', nameTh: 'ท่าอากาศยานหัวหิน',           nameEn: 'Hua Hin Airport',          province: 'ประจวบคีรีขันธ์' },
  'ทอด': { code: 'UTH', nameTh: 'ท่าอากาศยานอุดรธานี',         nameEn: 'Udon Thani Airport',       province: 'อุดรธานี' },
  'ทอบ': { code: 'UBP', nameTh: 'ท่าอากาศยานอุบลราชธานี',     nameEn: 'Ubon Ratchathani Airport', province: 'อุบลราชธานี' },
};

function extractAbbrev(filename) {
  const m = filename.match(/ท[\u0E01-\u0E7F]{2}/);
  return m ? m[0] : null;
}

// Parse -raw format: unit code บรรทัดเดียว ตามด้วย area บรรทัดถัดไป
function parseUnits(text) {
  const lines = text.split('\n').map(l => l.trim());
  const units = new Map(); // code → { code, areaSqm, purpose }
  
  // Pass 1: จับ CODE → AREA pair (บรรทัดถัดไปเป็นตัวเลข)
  for (let i = 0; i < lines.length - 1; i++) {
    const line = lines[i];
    const next = lines[i + 1];
    // บรรทัด = 1 code เท่านั้น (A1) ตามด้วยตัวเลข
    const codeMatch = line.match(/^([A-Z]\d+)$/);
    const areaMatch = next.match(/^(\d+(?:\.\d+)?)$/);
    if (codeMatch && areaMatch) {
      const code = codeMatch[1];
      const area = parseFloat(areaMatch[1]);
      if (!units.has(code)) {
        units.set(code, { code, areaSqm: area, purpose: '' });
      }
    }
    // รูปแบบ "CODE CODE" + "AREA AREA"
    const twoCodeMatch = line.match(/^([A-Z]\d+)\s+([A-Z]\d+)$/);
    const twoAreaMatch = next.match(/^(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)$/);
    if (twoCodeMatch && twoAreaMatch) {
      for (let j = 1; j <= 2; j++) {
        const code = twoCodeMatch[j];
        const area = parseFloat(twoAreaMatch[j]);
        if (!units.has(code)) units.set(code, { code, areaSqm: area, purpose: '' });
      }
    }
  }
  
  // Pass 2: หาวัตถุประสงค์จากบรรทัด "CODE purpose_text"
  for (const line of lines) {
    const m = line.match(/^([A-Z]\d+)\s+([\u0E01-\u0E7F].+)$/);
    if (m && units.has(m[1]) && !units.get(m[1]).purpose) {
      let purpose = m[2].trim().replace(/\s+/g, ' ');
      // ลบ trailing numbers
      purpose = purpose.replace(/\s+\d+(\.\d+)?$/, '').trim();
      if (purpose.length >= 3 && !purpose.match(/^[A-Z]\d+/)) {
        units.get(m[1]).purpose = purpose;
      }
    }
  }
  
  return [...units.values()].sort((a, b) => a.code.localeCompare(b.code, 'en', { numeric: true }));
}

// หา floor name จาก text
function extractFloor(text) {
  const m = text.match(/ช้?ั[่น]\s*(\d+|G|B\d*)/);
  return m ? `ชั้น ${m[1]}` : 'ชั้น 1';
}

// หาชื่ออาคาร
function extractBuilding(text) {
  if (/อาคารผู้โดยสาร/.test(text)) return 'อาคารผู้โดยสาร';
  if (/อาคารหลังใหม่/.test(text)) return 'อาคารหลังใหม่';
  return 'อาคารผู้โดยสาร';
}

const dir = 'C:/Users/ADMIN/AppData/Local/Temp/fp-raw';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.txt'));

// Group by airport code — merge multiple PDFs per airport
const byAirport = new Map();

for (const f of files) {
  const abbr = extractAbbrev(f);
  const airport = abbr ? AIRPORT_MAP[abbr] : null;
  if (!airport) continue;
  const text = fs.readFileSync(path.join(dir, f), 'utf8');
  const units = parseUnits(text);
  const floorName = extractFloor(text);
  const buildingName = extractBuilding(text);
  const isNewBuilding = /อาคารหลังใหม่/.test(f) || /อาคารหลังใหม่/.test(text);
  
  if (!byAirport.has(airport.code)) {
    byAirport.set(airport.code, {
      ...airport,
      buildings: new Map(),
    });
  }
  const ap = byAirport.get(airport.code);
  
  // แยกอาคารเก่า/ใหม่
  const buildingKey = isNewBuilding ? 'อาคารหลังใหม่' : buildingName;
  if (!ap.buildings.has(buildingKey)) {
    ap.buildings.set(buildingKey, { name: buildingKey, floors: new Map() });
  }
  const building = ap.buildings.get(buildingKey);
  if (!building.floors.has(floorName)) {
    building.floors.set(floorName, { name: floorName, units: new Map() });
  }
  const floor = building.floors.get(floorName);
  for (const u of units) {
    if (!floor.units.has(u.code)) floor.units.set(u.code, u);
  }
}

// Convert Maps → objects for JSON output
const output = [];
let totalUnits = 0;
for (const [code, ap] of byAirport) {
  const buildings = [];
  for (const [bname, b] of ap.buildings) {
    const floors = [];
    for (const [fname, f] of b.floors) {
      const units = [...f.units.values()];
      totalUnits += units.length;
      floors.push({ name: fname, units });
    }
    buildings.push({ name: bname, floors });
  }
  output.push({
    code, nameTh: ap.nameTh, nameEn: ap.nameEn, province: ap.province,
    buildings,
  });
}

console.log('=== Result ===');
output.forEach(a => {
  a.buildings.forEach(b => {
    b.floors.forEach(f => {
      console.log(`  ${a.code} / ${b.name} / ${f.name}: ${f.units.length} units`);
    });
  });
});
console.log(`\nTotal: ${output.length} airports, ${totalUnits} units`);

fs.writeFileSync('C:/Users/ADMIN/AppData/Local/Temp/fp-raw/parsed.json', JSON.stringify(output, null, 2));
console.log('Saved.');
