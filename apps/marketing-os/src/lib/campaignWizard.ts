// ใช้ร่วมกันทั้ง Server (คำอธิบายบนหัวหน้า) และ Client (ตัวฟอร์ม) ⇒ ห้ามย้ายเข้าไฟล์ 'use client'
// (ค่าที่ export จากไฟล์ 'use client' จะกลายเป็น client reference ฝั่ง server ไม่ใช่ array)
// Hick + Chunking: 9 ช่องแบ่งเป็น 3 ขั้นตามลำดับความคิด และลำดับนี้ = ลำดับเดียวกับคำอธิบายบนหัวหน้า
export const WIZARD_STEPS = ['คุยกับใคร', 'พูดอะไร', 'วัดผลยังไง'] as const;
