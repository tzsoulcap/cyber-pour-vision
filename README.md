# Cyber Pour Vision — Pouring Console V2.0

ระบบ Dashboard สำหรับตรวจสอบกระบวนการเทน้ำโลหะ (Molten Metal Pouring) แบบ Real-time และย้อนหลัง พัฒนาด้วย React + TypeScript + Vite โดยทำงานร่วมกับ Backend Server บน Jetson Hardware

---

## สิ่งที่ต้องมีก่อนรัน

| เครื่องมือ | เวอร์ชันที่แนะนำ |
|---|---|
| [Node.js](https://nodejs.org/) | 18+ |
| [Bun](https://bun.sh/) (package manager) | 1.0+ |
| Backend Server (Jetson) | รันอยู่ที่ `http://192.168.212.10:5000` |

> หากไม่มี Bun ใช้ `npm` แทนได้ทุกคำสั่ง

---

## การติดตั้ง

```bash
# Clone โปรเจกต์
git clone <repository-url>
cd cyber-pour-vision

# ติดตั้ง dependencies
bun install
# หรือ
npm install
```

---

## การรันในโหมด Development

```bash
bun dev
# หรือ
npm run dev
```

เปิด browser ที่ `http://localhost:8080`

> **หมายเหตุ:** หากไม่ได้เชื่อมต่อกับ Backend Server ระบบจะแสดงสถานะ **DISCONNECTED** / **CONNECTION ERROR** ซึ่งเป็นเรื่องปกติ ทุก Feature ที่ไม่ต้องการ API จะยังทำงานได้ตามปกติ

---

## การ Build สำหรับ Production

```bash
bun run build
# หรือ
npm run build
```

ไฟล์ที่ build แล้วจะอยู่ในโฟลเดอร์ `dist/` สามารถ deploy ด้วย static file server ใดก็ได้

```bash
# Preview build ก่อน deploy
bun run preview
# หรือ
npm run preview
```

---

## การรัน Tests

```bash
bun run test
# หรือ
npm run test

# รันแบบ watch mode (auto re-run เมื่อแก้ไขไฟล์)
bun run test:watch
```

---

## โครงสร้างโปรเจกต์

```
src/
├── components/
│   ├── console/          # UI หลักของระบบ
│   │   ├── Sidebar.tsx       # เมนูด้านซ้าย (Live / Archive)
│   │   ├── LiveFeed.tsx      # Video stream จากกล้อง
│   │   ├── DataSidebar.tsx   # Batch Info + Measurements (Real-time)
│   │   ├── BottomDashboard.tsx # Configuration + System Health
│   │   ├── ArchiveView.tsx   # Image Log + Slideshow
│   │   └── Panel.tsx         # Base panel component
│   └── ui/               # shadcn/ui components
├── hooks/
│   ├── usePouringStatus.ts   # GET /status (poll ทุก 500ms)
│   ├── useSystemSettings.ts  # GET /api/settings (poll ทุก 10s)
│   └── useImageLog.ts        # GET /api/images/list + cascading filters
└── pages/
    ├── Index.tsx         # หน้าหลัก
    └── NotFound.tsx
```

---

## API Backend

ระบบเชื่อมต่อกับ Backend ที่ `http://192.168.212.10:5000`

| Endpoint | Method | คำอธิบาย |
|---|---|---|
| `/status` | GET | สถานะ Real-time (Batch, Measurements, FPS) |
| `/video_feed` | GET | MJPEG Stream จากกล้อง |
| `/api/settings` | GET | ดึงการตั้งค่าระบบ |
| `/api/settings` | POST | แก้ไขการตั้งค่าระบบ |
| `/api/images/dates` | GET | รายการวันที่ที่มีข้อมูล |
| `/api/images/shifts` | GET | รายการกะตามวันที่ |
| `/api/images/patterns` | GET | รายการ Pattern ตามกะ |
| `/api/images/list` | GET | ดึง Image Metadata พร้อม Measurements |
| `/api/images/serve/{path}` | GET | ดึงไฟล์ภาพ |

---

## การเปลี่ยน Backend URL

แก้ไขค่า `API_BASE` ในไฟล์ต่อไปนี้:

- `src/hooks/usePouringStatus.ts`
- `src/hooks/useSystemSettings.ts`
- `src/hooks/useImageLog.ts`
