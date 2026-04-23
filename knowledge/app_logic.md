# เอกสารอธิบาย Logic การทำงานและ API ของ Pouring Console V2.0

เอกสารฉบับนี้รวบรวมตรรกะการทำงาน (Logic) ของระบบทั้งในมุมองภาพรวมของหน้าจอ (UI Flow) และการเจาะลึกไปที่ระดับ Source Code ของ Custom Hooks ที่ติดต่อกับ API อย่างละเอียด 

ระบบทำงานร่วมกับ Backend Server ที่ฝั่งฮาร์ดแวร์ (กำหนด Default API Base ไว้ที่: `http://192.168.212.10:5000`)

---

## ส่วนที่ 1: ภาพรวมการทำงานของหน้าจอ (UI Logic & Flow)

ระบบ Pouring Console แบ่งการทำงานหลักออกเป็น 2 หน้าคือ **Live View** และ **Image Log**

### 1.1 หน้า Live View (การแสดงผลวิดีโอสถานะแบบ Real-time)
ควบคุมโดยไฟล์ `App.tsx` และ `VideoPlayer.tsx` มีหน้าที่แสดงภาพสดจากกล้องและข้อมูลกระบวนการเทน้ำโลหะ (Pouring Analysis) แบบเรียลไทม์

- **การสตรีมภาพวิดีโอ (Video Streaming):** ดึงภาพสดผ่านเทคนิค MJPEG Stream โดยใช้ `<img src="http://192.168.212.10:5000/video_feed" />` เมื่อระบบกำลังเท จะมี UI ขึ้นกระพริบ "ACTIVE PROCESSING"
- **การแสดงข้อมูลสถานะ (Status Sync):** ดึงค่าต่างๆ มาอัปเดตแบบเรียลไทม์ผ่าน `usePouringStatus` แสดงทั้ง Batch Information (Pattern, Ladle, Mold) และ Measurements (Upper, Middle, Below width, Fill Ratio %).
- **การแสดงการตั้งค่าระบบ:** หน้าต่าง Configuration Status ดึงข้อมูลเซนเซอร์ กล้อง การเซฟไฟล์จาก backend ผ่าน `useSystemSettings` มาโชว์สถานะล่าสุด

### 1.2 หน้า Image Log (ระบบค้นหา วิเคราะห์ และเล่นภาพย้อนหลัง)
ควบคุมโดยไฟล์ `ImageLogViewer.tsx` สำหรับตรวจสอบการเทน้ำโลหะย้อนหลัง

- **Step 1 - Cascading Filters:** การโหลดข้อมูลสำหรับฟิลเตอร์แบบเป็นลำดับขั้น 
  ผู้ใช้ต้องเลือกตามลำดับ: เลือกวันที่ -> พอดรอปดาวน์วันที่ได้ค่า จะไปดึง 'กะ' (Shift) -> เมื่อได้กะ จะไปดึง 'Pattern' 
- **Step 2 - Drill-down Navigation:** หลังจากกด Apply Filters ระบบดึง Metadata รูปตามฟิลเตอร์ แล้วนำมาจัดกลุ่มเป็น 3 ระดับเพื่อให้ผู้ใช้กดเจาะลึกไปดูรูปได้ง่าย:
  (เลือก Ladle No.) -> (เลือก Mold ID) -> (แสดงภาพทั้งหมดเรียงตามเวลา)
- **Step 3 - Slideshow & Data Inspection:** เมื่อคลิกที่รูปภาพ ระบบจะเข้าโหมด Slideshow Modal โดยดึงภาพทั้งหมดของ Mold นั้นมาเรียงต่อกันเป็นวิดีโอ มีปุ่ม Play/Pause ปรับความเร็วเฟรมเรตได้ (FPS) และมีค่า Results การเทของแต่ละภาพ แสดงกำกับล้อไปกับวิดีโอทันที

---

## ส่วนที่ 2: เจาะลึกการทำงานของ React Hooks และ API (Deep Dive)

เป็นการแยกจัดการ Business Logic ทั้งหมดผ่าน Custom Hooks เพื่อให้โค้ดส่วน UI สะอาดที่สุด

### 2.1 Hook: `usePouringStatus` (เกาะติดข้อมูล Real-time)
**ไฟล์:** `src/hooks/usePouringStatus.ts`
ทำหน้าที่เกาะติดสถานะล่าสุดจากเครื่องจักรและโมเดล AI ตลอดเวลา

- **API Endpoint:** `GET /status`
- **การทำงาน (Mechanism):**
  1. ทันทีที่ Hook ถูกเรียกใช้งาน Component จะสั่งจับเวลา `setInterval` เพื่อยิง API `fetch()` ดึงข้อมูลทุกๆ **500ms** (ครึ่งวินาที)
  2. โครงสร้างข้อมูลที่ได้จะไปแมปเข้ากับ Type `PouringStatus`
  3. ถ้าเซิร์ฟเวอร์ตายหรือหลุด Hook จะดักจับ Error และส่ง `isError = true` ไปที่ UI ทำให้แสดงคำว่า "DISCONNECTED"
  4. ยกเลิกการดึงข้อมูลทันทีเมื่อผู้ใช้ปิดหน้า (Auto clearInterval) แบนด์วิธเครือข่ายจึงไม่เต็ม

### 2.2 Hook: `useSystemSettings` (ดึงตั้งค่าระบบรายคาบ)
**ไฟล์:** `src/hooks/useSystemSettings.ts`
ดูแลการดึง Configuration สถานะเซนเซอร์และกล้อง

- **API Endpoint:** `GET /api/settings`
- **การทำงาน (Mechanism):**
  1. ยิง HTTP GET คาดหวัง JSON ตอบกลับโครงสร้าง `{ success: true, config: { ... } }`
  2. ใช้ `setInterval` ทิ้งระยะห่างไว้ที่ **10000ms (10 วินาที)** เพราะค่า Configuration เหล่านี้ไม่มีการเปลี่ยนแปลงบ่อย ประหยัดทรัพยากรฝั่งเครื่อง Jetson
  3. ส่ง State `isLoading` เพื่อจัดการ Loading UI รอจังหวะข้อมูลวิ่งเข้าครั้งแรก

### 2.3 Hook: `useImageLog` (ควบคุมระบบเล่น Slideshow ภาพย้อนหลัง)
**ไฟล์:** `src/hooks/useImageLog.ts`
Hook ตัวหลักที่รับจบหน้าที่การยิง API ค้นหาภาพ และแปลงเป็นเครื่องเล่นวิดีโอ

- **API Endpoints หลัก:**
  - `GET /api/images/list?pattern=...&mold=...` (ดึง Metadata ทั้งหมดทีเดียว)
  - `GET /api/images/serve/{imagePath}` (ดึงไฟล์ภาพ Binary)
- **การทำงานของระบบ Filter (API Translation):**
  - เมื่อเรียกฟังก์ชัน `fetchImages(filters)` ตัว Hook จะนำ Property ใน Object `filters` ไปต่อท้าย Query ปั้นเป็น URLSearchParams อัตโนมัติ หากไม่มีก็จะยิง List ทั้งหมด
  - จะเก็บข้อมูลลงสองที่คือ `images` (ภาพทั้งหมดที่เจอ) และ `playbackImages` (เอาไว้หล่อเลี้ยง Slideshow ของ Mold ย่อยๆ)
- **การทำงานของระบบ Playback (Animation Engine):**
  - มีตัวแปร `currentIndex`, `isPlaying` ควบคุม
  - วงจร Animation ทำงานผ่าน `useEffect` ซึ่งถ้าระบบ `isPlaying=true` ก็ตั้งเวลา `setInterval` วิ่งไปรันฟังก์ชัน `nextFrame()`
  - เวลาหน่วงคำนวนจากสูตร `1000 / playbackSpeed` (เช่น 5 FPS = เลื่อนภาพถัดไปทุกๆ 200ms)
  - รูปแบบภาพใช้ `getImageUrl(path)` ไปรันใน Web Browser ภาพจึงถูก Cache อัตโนมัติทำให้การรัน Animation ลื่นไหล

### 2.4 ลำดับการเรียกฟิลเตอร์ API (ใน ImageLogViewer.tsx)
การสร้างฟิลเตอร์ 3 ขั้นจะถูกกระตุ้นตาม Action ของ User ด้วย `useEffect` บนคอมโพเนนต์โดยตรง ดังนี้:

1. **Mount:** ยิง `GET /api/images/dates` อัตโนมัติเพื่อปลุก Dropdown แรก (Date)
2. **Date Changed:** ยิง `GET /api/images/shifts?dateFrom=<val>&dateTo=<val>`
3. **Shift Changed:** ยิง `GET /api/images/patterns?dateFrom=<val>&dateTo=<val>&shift=<val>`
4. **Apply Button:** สั่ง Hook `useImageLog.fetchImages(...)` เพื่อยิงหาภาพจริง
