# Floor Plan Import (PDF → DB)

สคริปต์นำเข้าข้อมูลจริงจาก PDF ประกาศเช่าพื้นที่ของกรมท่าอากาศยาน 22 ไฟล์
ไปที่ floor: D:\propre\floorplan

## ผลลัพธ์

- **19 airports** (DOA regional airports)
- **19 buildings** (Terminal / New Terminal)
- **18 floors** (ส่วนใหญ่ชั้น 1)
- **266 units** พร้อม unit code + area + purpose

## ขั้นตอน

### 1. Extract text จาก PDF

ต้องติดตั้ง `poppler-utils` (มี `pdftotext` command)

```bash
mkdir -p /tmp/fp-raw
cd D:/propre/floorplan
for f in *.pdf; do
  out="/tmp/fp-raw/$(echo "$f" | sed 's/\.pdf$//').txt"
  pdftotext -raw -enc UTF-8 "$f" "$out"
done
```

### 2. Parse units

```bash
node scripts/floorplan-import/parse-pdfs.mjs
# output: /tmp/fp-raw/parsed.json
```

Parser จับคู่ `CODE \n AREA` (เช่น `A1\n8.00`) และ `CODE purpose text` แยกเป็น object

Airport abbreviation ไทย (`ทนธ` → NAW) อยู่ใน `AIRPORT_MAP` 19 รายการ
(เพิ่มได้ถ้ามี PDF ใหม่)

### 3. Insert to DB

#### Local:
```bash
# ต้องรันจาก packages/api เพื่อให้เข้าถึง @prisma/client
cp parsed.json packages/api/fp-parsed.json
cp scripts/floorplan-import/insert-to-db.mjs packages/api/insert-fp.mjs
cd packages/api
sed -i 's|/tmp/fp-parsed.json|./fp-parsed.json|' insert-fp.mjs
node insert-fp.mjs
```

#### Production (EC2):
```bash
# Upload files to EC2
scp /tmp/fp-raw/parsed.json ec2-user@EC2_IP:/tmp/fp-parsed.json
scp scripts/floorplan-import/insert-to-db.mjs ec2-user@EC2_IP:/tmp/insert-fp.mjs

# Run inside api container
ssh ec2-user@EC2_IP "cd /opt/doa && sudo docker compose exec -T api sh -c '
  mv /tmp/insert-fp.mjs /app/packages/api/insert-fp.mjs &&
  mv /tmp/fp-parsed.json /app/packages/api/fp-parsed.json &&
  cd /app/packages/api &&
  sed -i \"s|/tmp/fp-parsed.json|./fp-parsed.json|\" insert-fp.mjs &&
  node insert-fp.mjs
'"
```

## Idempotent

ใช้ `prisma.upsert()` — รันซ้ำได้ ไม่ duplicate:
- airport upsert by `airportCode`
- building upsert by `buildingCode`
- floor upsert by `floorCode`
- unit upsert by `unitCode`

## Schema ที่สร้าง

```
Airport (NAW)
└── Building (NAW-T1, อาคารผู้โดยสาร)
    └── Floor (NAW-T1-F1, ชั้น 1)
        └── Units (NAW-A1, NAW-A2, ..., NAW-W1)
```

Unit code format: `{airportCode}-{shortCode}` เช่น `NAW-A1`, `UBP-B3`

## Known limitations

- บาง PDF มี noise จาก floor plan diagram → purpose บางตัวไม่ตรง
- Purpose fallback ใช้ prefix heuristic (A= ร้านค้า, B= ร้านอาหารว่าง, ฯลฯ)
- ยังไม่ได้ extract รูป SVG จาก PDF (ต้องแปลง manual)
- KKC (ขอนแก่น) parse ไม่ได้เลย — PDF format ต่างออกไป (ต้องแก้ parser)
