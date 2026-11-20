# UX/UI Mockup ↔ CEO AI Thailand V.1 — Mapping

> แหล่งที่มา: mockup "CEO AI · Dashboard" (Marketing Operating Dashboard, พ.ค. 2025) ที่ผู้ใช้ส่งมา
> เป้าหมาย: เชื่อมทุกส่วนของ mockup เข้ากับ **สิ่งที่ V.1 มีอยู่จริง** (หน้า/lib/ข้อมูล) และระบุช่องว่าง
> สถานะ: ร่างแผนที่ (ยังไม่แก้โค้ด UI) — ใช้ตัดสินใจก่อนลงมือสร้าง

## 0. กฎเหล็กก่อนเชื่อม (Truth loop — `src/lib/marketingTruth.ts`)
ตัวเลขใน mockup (Impressions 1.25M, Revenue ฿1,248,520, ROAS 3.21x ฯลฯ) เป็น **ข้อมูลตัวอย่าง**
V.1 ยัง pre-revenue → ทุกตัวเลขที่ขึ้นหน้าจอต้องมี `MetricMaturity`:
`MEASURED | DERIVED | DERIVED_FROM_ASSUMPTION | ASSUMED | PLACEHOLDER | UNAVAILABLE`
- ไม่มี source จริง → แสดง "ยังไม่มีข้อมูล / INSUFFICIENT DATA" ห้ามเอาเลข mockup ไปเป็น default
- ราคา: ใช้ `CURRENT_STARTER_OFFER` (฿790/เดือน, OWNER_DECISION) — ห้าม hardcode 390/590 (SUPERSEDED)
  (CLAUDE.md ยังเขียน ฿390 = drift เอกสาร ดู docs/governance/P1-0-1-PRICING-RECONCILIATION.md)
- Lineage ต้องครบ: campaign → variant → landing → CTA → activation → lead → customer → revenue

## 1. Sidebar ใน mockup → หน้า V.1

| กลุ่ม mockup | เมนู mockup | หน้า/โมดูล V.1 ที่มีแล้ว | สถานะ |
|---|---|---|---|
| Strategy | Audience | `personas` (Personas.tsx), `lib/segmentation.ts` | ✅ มี |
| Strategy | Message Pillars | `marketing` (Marketing.tsx) + `lib/marketingStrategy.ts` (marketingFromDe24) + `docs/marketing/CEO-AI-CONTENT-DNA.md` | ◐ มี logic ไม่มีหน้า pillar แยก |
| Strategy | Brand Guardrails | `docs/marketing/BRAND-ARCHITECTURE.md` §8, `lib/skillDirectives.ts`, `lib/seoData.ts` (canonical) | ◐ เป็นเอกสาร ยังไม่เป็น UI |
| Content Factory | Content Calendar / Items | `content` (ContentPlan.tsx) | ✅ มี |
| Content Factory | Create Content: Text→Image/Video, Image→Video | `factory`/`aicompany` (agent-run), AI assist | ❌ ยังไม่มี generate รูป/วิดีโอ |
| Approval | Review & Approve | `boardroom` (BoardRoom.tsx: CEO เสนอ→User อนุมัติ) | ◐ ใช้ pattern เดียวกันได้ |
| Approval | Content Library | — | ❌ ไม่มี |
| Distribution | Channels / Publishing | `marketing` (CHANNEL_TYPE, campaigns, status) — บันทึกด้วยมือ | ◐ ไม่มี auto-publish |
| Distribution | UTM & Tracking | — (`MarketingControlCenter` รายงานว่า utm=false) | ❌ ช่องว่างหลัก |
| Analytics | Overview / Campaigns / Content Performance / Audience Insights / Attribution | `analytics` (Analytics.tsx), `funnel` (ConversionFunnel), GA4 (`lib/analytics.ts track()`), `docs/marketing/GA4-NORTHSTAR-DASHBOARD.md` | ◐ funnel มี, attribution ไม่มี |
| Experiments | A/B Tests | `pulse` (Pulse.tsx) + `lib/experiments.ts` (EXPERIMENTS, aggregateExperiments, retention) | ✅ มี (opt-in, โปร่งใส) |
| Settings | Workspace / Integrations / Users & Roles | `team`, `lib/workspaces.ts`, `lib/integrations.ts` (LINE/Sheets), `lib/access.ts` | ✅ มี |

## 2. Dashboard widgets → แหล่งข้อมูล V.1

| Widget mockup | แหล่งใน V.1 | หมายเหตุ |
|---|---|---|
| KPI: Impressions / Reach / Video Views / CTR / Conversions / Revenue | GA4 events + `lib/finance.ts` (revenue จริง) | Impressions/Reach/Video Views ไม่มีแหล่งจริง → `UNAVAILABLE` จนต่อ ads/social API. Conversions = `purchase`/`begin_checkout`/`signup_instant`. Revenue = `financeSummary()` |
| Campaign Performance (table) | `data.marketing.campaigns` | CPA/ROAS ต้องมี spend + revenue ผูก lineage ก่อน (ตอนนี้ไม่มี) |
| Top Performing Content | — | ต้องมี content_id ใน UTM ก่อน |
| Channels & Integrations | `lib/integrations.ts`, `marketing.channels` | โชว์เฉพาะ channel ที่เชื่อมจริง (LINE/Sheets) ที่เหลือเป็น "ยังไม่เชื่อม" |
| Content Calendar | `ContentPlan.tsx` | ใช้ได้ตรง |
| Content Factory (3 การ์ด) | `factory`/agent-run | ซ่อน/ติดป้าย "เร็ว ๆ นี้" จนกว่า generate ได้จริง |
| **MIT 24 Steps Progress (14/24 · 58%)** | `lib/de24Journey.ts` (`de24Journey(data)`), `lib/de24Sync.ts`, `bmc` | ✅ ผูกตรง — เสาหลักของ positioning |
| **Business Genome (radar)** | `lib/bmcOutcomes.ts`, `lib/marketValidation.ts`, `vrio`, `lib/personalBrand.ts` | ◐ ยังไม่มีโมเดล genome — ต้องนิยามแกน (Audience Fit / Offer Strength / Value Prop / Channel Fit / Content Quality) แล้ว derive จากข้อมูลจริง ติดป้าย `DERIVED` |
| **Measurement Health (72/100, Caution)** | `MarketingControlCenter.tsx` + `measurementHealth()` | ✅ มีแล้วแบบ READY/INSUFFICIENT_DATA — mockup เป็นคะแนน 0–100: ควรคงสถานะ+รายการ `missing[]` เป็นหลัก ถ้าทำคะแนนให้ = สัดส่วนสัญญาณครบ (ไม่ใช่เลขแต่ง) |
| Audience Insights (donut) | `lib/segmentation.ts`, `lib/leads.ts` | สัดส่วนต้องมาจาก lead จริง ไม่ใช่ตัวอย่าง |
| AI Insight | `ai-assist` Edge Function | ต้อง prompt แบบ "ห้ามแต่งตัวเลข" (แบบเดียวกับ `cfoPrompt`) |
| **Next Best Actions** | `PriorityActions.tsx`, `MarketingControlCenter` (Top Issue/NBA), `lib/weeklyDigest.ts` | ✅ มี pattern; ปุ่ม "สร้างการทดสอบ"→`pulse`, "จัดการ UTM"→ต้องสร้างหน้า UTM |
| Date range + "สร้างแคมเปญใหม่" + แจ้งเตือน + AI Insight (header) | `marketing` (add campaign), `lib/weeklyDigest.ts` | header ปุ่มทำได้เร็ว |

## 3. ช่องว่าง (เรียงตามผลต่อ "truth loop")
1. **UTM & Tracking** — ปลดล็อก attribution/CPA/ROAS และ Measurement Health (ตอนนี้ utm=false)
2. **Lineage IDs** (campaign/variant/landing/cta) ฝังใน track() events
3. **Business Genome model** — นิยามแกน + สูตร derive
4. **Content Library + Approval flow** — reuse pattern ห้องบอร์ด
5. Content generation (text→image/video) — ไว้หลังสุด ไม่ใช่แก่นของ V.1 (positioning: ไม่ใช่ "จ้างทีม AI ทั้งบริษัท")
6. Ads/Social API (Impressions/Reach/Video Views) — จนกว่าจะมี จะแสดงเป็น UNAVAILABLE

## 4. การปรับ IA ให้เข้ากับ V.1 (เสนอ)
- V.1 ใช้ state-based nav (`PageId` ใน `src/types.ts`) + โหมด focus ตาม `onboardGoal` → **อย่าเพิ่มเมนู 20+ รายการตาม mockup ตรง ๆ**
  ใช้ 7 กลุ่มของ mockup เป็นหัวข้อในหน้า `marketing` (แท็บ) หรือเป็น sub-menu "เครื่องมือ" แทน
- Dashboard: เก็บเฉพาะ MIT 24 Steps, Measurement Health, Next Best Actions, Revenue จริง เป็น above-the-fold
  (สอดคล้อง positioning: MIT 24 × ระบบบริหาร) ส่วน KPI โฆษณาซ่อนจนกว่ามีข้อมูล
- ภาษา/ศัพท์: ใช้ "ธุรกิจ" ไม่ใช่ "โรงงาน" (`skillDirectives.ts`)
- Visual tokens: mockup เป็นธีมสว่าง + ม่วง/indigo; V.1 ใช้ CSS vars ใน `src/index.css` (`--accent: #06b6d4`)
  → ต้องตัดสินใจ: ปรับ token ให้ตรง mockup หรือคง theme V.1 (ยังไม่ได้ตรวจว่า dark/light ปัจจุบันเป็นแบบไหน)

## 5. ขั้นตอนถัดไปที่แนะนำ
1. อนุมัติแผนที่นี้ + เลือกว่า visual tokens ตาม mockup หรือ V.1
2. Phase A (ไม่มีความเสี่ยงข้อมูลปลอม): Dashboard header + การ์ด MIT24/Measurement Health/NBA จาก lib ที่มีอยู่
3. Phase B: UTM & lineage + หน้า UTM → ปลดล็อก Campaign Performance/Attribution
4. Phase C: Business Genome + Content Library/Approval
