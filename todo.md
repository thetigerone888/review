# FeedbackIQ — Project TODO

## Branding & Setup
- [x] สร้างโลโก้แอป FeedbackIQ
- [x] ปรับแต่งธีมสี (Indigo primary, Emerald success)
- [x] อัปเดต app.config.ts ชื่อแอปและ logoUrl

## Data Layer & Store
- [x] สร้าง TypeScript types สำหรับ Survey, Question, Response, Tag
- [x] สร้าง Zustand store สำหรับ surveys และ responses
- [x] สร้าง seed data (ตัวอย่างข้อมูล)
- [x] ฟังก์ชัน sentiment analysis (keyword-based)
- [x] ฟังก์ชันคำนวณ NPS score
- [x] ฟังก์ชัน export CSV และ JSON

## Navigation & Layout
- [x] ตั้งค่า Tab Bar (Dashboard, Surveys, Analytics, Settings)
- [x] เพิ่ม icon mappings ใน icon-symbol.tsx
- [x] ตั้งค่า Stack navigator สำหรับ modal screens

## Dashboard Screen
- [x] NPS Score Card พร้อม gauge visualization
- [x] Sentiment breakdown (Positive/Neutral/Negative counts)
- [x] Response summary stats (total, today, rate)
- [x] Recent responses FlatList
- [x] Active surveys count

## Survey List Screen
- [x] Filter tabs (All/Active/Draft/Closed)
- [x] Survey Card component
- [x] FAB button สร้างแบบสอบถามใหม่
- [x] Empty state

## Create Survey Screen
- [x] Form: ชื่อและคำอธิบาย
- [x] Question builder (Rating, NPS, Multiple Choice, Text, Yes/No)
- [x] Add/Remove questions
- [x] Channel selection (QR, Link, In-App, Email)
- [x] Save as Draft / Publish

## Survey Detail Screen
- [x] Stats overview (responses, avg rating, NPS)
- [x] Copy link functionality
- [x] Share via system sheet
- [x] Close / Activate toggle
- [x] Delete survey

## Fill Survey Screen (Response Collection)
- [x] Progress bar
- [x] Question cards (one-at-a-time)
- [x] Rating question (star rating)
- [x] NPS question (0-10 selector)
- [x] Multiple choice question
- [x] Text input question
- [x] Yes/No question
- [x] Submit & Thank You screen

## Response List Screen
- [x] Search bar
- [x] Filter by sentiment
- [x] Response Card พร้อม sentiment badge
- [x] Navigate to detail

## Response Detail Screen
- [x] Full response display
- [x] Sentiment score badge + NPS badge
- [x] Tag management (toggle from preset list)
- [x] Internal notes with save

## Analytics Screen
- [x] NPS trend chart (last 7 days)
- [x] Sentiment breakdown bar chart
- [x] Response rate by channel bar chart
- [x] Top tags cloud
- [x] NPS breakdown (Promoters/Passives/Detractors)
- [x] Survey selector filter

## Settings Screen
- [x] Export data (CSV/JSON)
- [x] Theme toggle (Light/Dark/System)
- [x] Notification preferences
- [x] About section
- [x] Data summary stats

## Export Functionality
- [x] Export responses to CSV format
- [x] Export responses to JSON format
- [x] Share exported file via system share sheet
