# Customer Feedback App — Design Document

## App Concept
แอปมือถือสำหรับรวบรวมและวิเคราะห์ความคิดเห็นของลูกค้า ช่วยให้ธุรกิจสร้างแบบสอบถาม แจกจ่ายผ่านหลายช่องทาง และวิเคราะห์ผลลัพธ์แบบเรียลไทม์

---

## Brand Identity

- **App Name:** FeedbackIQ
- **Primary Color:** `#6366F1` (Indigo) — สื่อถึงความน่าเชื่อถือและความชาญฉลาด
- **Secondary Color:** `#10B981` (Emerald) — สำหรับ success states และ positive sentiment
- **Accent Color:** `#F59E0B` (Amber) — สำหรับ warning และ neutral sentiment
- **Error Color:** `#EF4444` (Red) — สำหรับ negative sentiment
- **Background (Light):** `#F8FAFC`
- **Background (Dark):** `#0F172A`
- **Surface (Light):** `#FFFFFF`
- **Surface (Dark):** `#1E293B`

---

## Screen List

| # | Screen Name | Description |
|---|-------------|-------------|
| 1 | Dashboard | ภาพรวม KPI, NPS score, sentiment summary, recent responses |
| 2 | Survey List | รายการแบบสอบถามทั้งหมด พร้อม status (active/draft/closed) |
| 3 | Create Survey | สร้างแบบสอบถามใหม่ พร้อม question builder |
| 4 | Survey Detail | รายละเอียดแบบสอบถาม, QR code, share links |
| 5 | Response List | รายการคำตอบทั้งหมดพร้อม filter และ tag |
| 6 | Response Detail | รายละเอียดคำตอบแต่ละรายการ พร้อม sentiment badge |
| 7 | Analytics | กราฟวิเคราะห์ NPS trend, sentiment breakdown, response rate |
| 8 | Fill Survey | หน้าตอบแบบสอบถาม (สำหรับ preview และ in-app collection) |
| 9 | Settings | ตั้งค่าแอป, export data, notification preferences |

---

## Primary Content & Functionality

### 1. Dashboard
- **NPS Score Card:** แสดงคะแนน NPS (-100 ถึง +100) พร้อม gauge chart
- **Sentiment Breakdown:** Pie/donut chart แสดงสัดส่วน Positive / Neutral / Negative
- **Response Summary:** จำนวนคำตอบรวม, อัตราการตอบกลับ, คำตอบใหม่วันนี้
- **Recent Responses:** FlatList แสดง 5 คำตอบล่าสุดพร้อม sentiment badge
- **Active Surveys:** จำนวนแบบสอบถามที่กำลังใช้งาน

### 2. Survey List
- **Filter Tabs:** All / Active / Draft / Closed
- **Survey Card:** ชื่อ, จำนวนคำตอบ, วันที่สร้าง, status badge, response rate
- **FAB Button:** สร้างแบบสอบถามใหม่
- **Swipe Actions:** Archive / Delete

### 3. Create Survey
- **Survey Title & Description**
- **Question Types:** Rating (1-5 stars), NPS (0-10), Multiple Choice, Text, Yes/No
- **Question Builder:** Drag-to-reorder, required toggle
- **Channel Settings:** QR Code, Link, In-App, Email
- **Preview Mode:** ดูตัวอย่างก่อน publish

### 4. Survey Detail
- **Share Options:** QR Code display, Copy Link, Share via system sheet
- **Stats Overview:** Total responses, avg rating, NPS score
- **Channel Performance:** แสดงว่าช่องทางไหนได้รับคำตอบมากที่สุด
- **Edit / Close / Duplicate actions**

### 5. Response List
- **Search & Filter:** ค้นหาตามข้อความ, filter ตาม sentiment, tag, date range
- **Response Card:** Sentiment badge (😊/😐/😞), preview text, date, tags
- **Bulk Actions:** Export selected, add tag

### 6. Response Detail
- **Full Response View:** คำตอบทุกข้อ
- **Sentiment Analysis:** Overall sentiment score + per-question analysis
- **Tags:** เพิ่ม/ลบ tag
- **Notes:** เพิ่ม internal note

### 7. Analytics
- **NPS Trend Chart:** Line chart แสดง NPS ตามช่วงเวลา
- **Sentiment Over Time:** Stacked bar chart
- **Top Tags:** Tag cloud / bar chart
- **Response Rate by Channel:** Bar chart
- **Export Button:** ส่งออกเป็น CSV/JSON

### 8. Fill Survey
- **Progress Bar:** แสดงความคืบหน้า
- **Question Cards:** แต่ละคำถามแสดงแยกหน้า (one-at-a-time)
- **Thank You Screen:** หน้าขอบคุณหลังส่งคำตอบ

### 9. Settings
- **Export Data:** CSV, JSON
- **Notification Settings:** เปิด/ปิดการแจ้งเตือน
- **Theme:** Light / Dark / System
- **About:** Version info

---

## Key User Flows

### Flow 1: สร้างและแจกแบบสอบถาม
1. Tab "Surveys" → FAB (+) → Create Survey screen
2. กรอกชื่อ, เพิ่มคำถาม (drag to reorder)
3. เลือกช่องทาง → Preview → Publish
4. Survey Detail → Copy Link / Show QR Code / Share

### Flow 2: ดูและวิเคราะห์คำตอบ
1. Dashboard → แตะ "View All Responses"
2. Response List → Filter ตาม sentiment
3. แตะ Response Card → Response Detail
4. เพิ่ม tag / note

### Flow 3: ดู Analytics และส่งออก
1. Tab "Analytics" → เลือก survey / date range
2. ดู NPS trend, sentiment breakdown
3. กด Export → เลือก format → Share

### Flow 4: ตอบแบบสอบถาม (In-App Preview)
1. Survey Detail → Preview
2. Fill Survey screen (one question at a time)
3. Submit → Thank You screen

---

## Navigation Structure

```
Tab Bar (Bottom):
├── Dashboard (home.fill)
├── Surveys (doc.text.fill)
├── Analytics (chart.bar.fill)
└── Settings (gearshape.fill)

Modal Stacks:
├── Create Survey (modal from Surveys tab)
├── Survey Detail (push from Survey List)
├── Response List (push from Survey Detail)
├── Response Detail (push from Response List)
└── Fill Survey (modal)
```

---

## Color Usage

| Element | Color Token |
|---------|-------------|
| Primary CTA buttons | `primary` (Indigo) |
| Positive sentiment | `success` (Emerald) |
| Neutral sentiment | `warning` (Amber) |
| Negative sentiment | `error` (Red) |
| NPS Promoters | `success` |
| NPS Passives | `warning` |
| NPS Detractors | `error` |
| Active badge | `success` |
| Draft badge | `muted` |
| Closed badge | `border` |
