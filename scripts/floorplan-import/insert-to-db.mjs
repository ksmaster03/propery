import fs from 'fs';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const data = JSON.parse(fs.readFileSync('/tmp/fp-parsed.json','utf8'));

function fillPurpose(units) {
  const prefixPurpose = new Map();
  for (const u of units) {
    if (!u.purpose) continue;
    const prefix = u.code.charAt(0);
    if (!prefixPurpose.has(prefix)) prefixPurpose.set(prefix, new Map());
    const c = prefixPurpose.get(prefix);
    c.set(u.purpose, (c.get(u.purpose) || 0) + 1);
  }
  const fallback = new Map();
  for (const [p, counts] of prefixPurpose) {
    let best = '', max = 0;
    for (const [pur, c] of counts) { if (c > max) { max = c; best = pur; } }
    fallback.set(p, best);
  }
  for (const u of units) {
    if (!u.purpose) u.purpose = fallback.get(u.code.charAt(0)) || `พื้นที่ ${u.code}`;
  }
}

async function main() {
  let tA=0,tB=0,tF=0,tU=0;
  const org = await prisma.tmOrganization.findFirst({ where: { orgCode: 'DOA' } });
  for (const ap of data) {
    const airport = await prisma.tmAirport.upsert({
      where: { airportCode: ap.code },
      update: { airportNameTh: ap.nameTh, airportNameEn: ap.nameEn, province: ap.province, organizationId: org.id },
      create: { airportCode: ap.code, airportNameTh: ap.nameTh, airportNameEn: ap.nameEn, province: ap.province, organizationId: org.id },
    });
    tA++;
    for (const b of ap.buildings) {
      const bCode = b.name.includes('หลังใหม่') ? `${ap.code}-T2` : `${ap.code}-T1`;
      const building = await prisma.tmBuilding.upsert({
        where: { buildingCode: bCode },
        update: { buildingNameTh: b.name, airportId: airport.id },
        create: { buildingCode: bCode, buildingNameTh: b.name, buildingNameEn: b.name.includes('หลังใหม่') ? 'New Terminal' : 'Terminal', airportId: airport.id, totalFloors: 1 },
      });
      tB++;
      for (const f of b.floors) {
        if (f.units.length === 0) continue;
        const fNum = parseInt(f.name.replace(/[^\d]/g, '')) || 1;
        const fCode = `${bCode}-F${fNum}`;
        const floor = await prisma.tmFloor.upsert({
          where: { floorCode: fCode },
          update: { floorNameTh: f.name, buildingId: building.id },
          create: { floorCode: fCode, floorNameTh: f.name, floorNameEn: `Floor ${fNum}`, floorNumber: fNum, buildingId: building.id },
        });
        tF++;
        fillPurpose(f.units);
        for (const u of f.units) {
          const unitCode = `${ap.code}-${u.code}`;
          try {
            await prisma.tmUnit.upsert({
              where: { unitCode },
              update: { areaSqm: u.areaSqm, purpose: u.purpose, buildingId: building.id, floorId: floor.id, airportId: airport.id },
              create: { unitCode, unitNameTh: u.purpose.slice(0, 100), airportId: airport.id, buildingId: building.id, floorId: floor.id, areaSqm: u.areaSqm, status: 'VACANT', purpose: u.purpose, fpShapeType: 'RECT' },
            });
            tU++;
          } catch (err) { console.warn('skip', unitCode, err.message); }
        }
      }
    }
  }
  console.log(`\n✓ Airports: ${tA}, Buildings: ${tB}, Floors: ${tF}, Units: ${tU}`);
  await prisma.$disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });
