import { HardHat, Smartphone, Shield, MapPin, Baby, Wifi, UserCheck } from 'lucide-react';

// ==========================================
// MOCK DATA & CONSTANTS
// ==========================================

// Fixed brand copy beside the hero search box
export const HERO_COPY = {
  title: 'เช่ารถขับเอง | หรือพร้อมคนขับมืออาชีพ', // '|' = keep each part on one line
  subtitle: 'คนขับชำนาญเส้นทาง ประสบการณ์สูง พาเที่ยวทั่วนครศรีฯ อย่างปลอดภัย • รถใหม่สะอาด รับ-ส่งฟรีสนามบินและตัวเมือง',
  badge: '🔥 โปรโมชั่นพิเศษ! จองวันนี้ ฟรีหมวกกันน็อก 2 ใบ + ประกันภัย',
};

export const LOCATIONS = [
  'สนามบินนครศรีธรรมราช (จัดส่งฟรี)',
  'หน้าร้าน PUNSO สาขาใหญ่ (ตัวเมือง)',
  'สถานีรถไฟ / บขส. นครศรีธรรมราช',
  'จัดส่งฟรีถึง โรงแรม / ที่พักในตัวเมือง',
];

export const CATEGORIES = {
  Motorcycle: ['Scooter', 'Bigbike'],
  Car: ['Sedan', 'Hatchback', 'EV', 'SUV'],
};

// Same fleet as B2 Rental (copied from its live database, ids B2- → PS-)
export const INITIAL_VEHICLES = [
  {
    "id": "PS-C216",
    "name": "Honda City turbo",
    "type": "Car",
    "brand": "Honda",
    "image": "https://fxnvwjugcapmyybvgymv.supabase.co/storage/v1/object/public/vehicle-photos/B2-C216/4e94ecd5-cbde-4591-9fa5-b3cf4de9e04b.jpg",
    "seats": 5,
    "rating": 5,
    "status": "Available",
    "deposit": 3000,
    "gallery": [
      "https://fxnvwjugcapmyybvgymv.supabase.co/storage/v1/object/public/vehicle-photos/B2-C216/4e94ecd5-cbde-4591-9fa5-b3cf4de9e04b.jpg"
    ],
    "mileage": 0,
    "badgeTag": "มาใหม่",
    "category": "Sedan",
    "engineCc": "125 cc",
    "features": [
      "สภาพใหม่ 100%",
      "ตรวจเช็กระยะพร้อม",
      "ประกันภัยคุ้มครองมาตรฐาน"
    ],
    "fuelType": "เบนซิน 95",
    "plateNumber": "7235",
    "pricePerDay": 400,
    "reviewsCount": 0,
    "transmission": "Automatic",
    "nextServiceKm": 5000
  },
  {
    "id": "PS-M106",
    "name": "Honda PCX 160 ABS (2024)",
    "type": "Motorcycle",
    "brand": "Honda",
    "image": "/vehicles/honda-pcx-160.png",
    "seats": 2,
    "rating": 4.9,
    "status": "Available",
    "deposit": 500,
    "gallery": [
      "/vehicles/honda-pcx-160.png",
      "https://fxnvwjugcapmyybvgymv.supabase.co/storage/v1/object/public/vehicle-photos/B2-M101/7305b30e-6e9f-440a-b23a-dc4e7fbe5054.jpg",
      "https://fxnvwjugcapmyybvgymv.supabase.co/storage/v1/object/public/vehicle-photos/B2-M101/91fab474-ee2c-499c-a45b-2cdc803a2426.jpg"
    ],
    "mileage": 0,
    "badgeTag": "ฮิตยอดนิยม",
    "category": "Scooter",
    "engineCc": "160 cc",
    "features": [
      "กุญแจ Smart Key",
      "พอร์ตชาร์จ USB",
      "กล่องเก็บของ U-Box 30 ลิตร",
      "ฟรีหมวกกันน็อก มอก. 2 ใบ"
    ],
    "fuelType": "เบนซิน 95 / E20",
    "plateNumber": "9778",
    "pricePerDay": 400,
    "reviewsCount": 142,
    "transmission": "Automatic (CVT)",
    "nextServiceKm": 0
  },
  {
    "id": "PS-M105",
    "name": "Honda PCX 160 ABS (2024)",
    "type": "Motorcycle",
    "brand": "Honda",
    "image": "/vehicles/honda-pcx-160.png",
    "seats": 2,
    "rating": 4.9,
    "status": "Available",
    "deposit": 500,
    "gallery": [
      "/vehicles/honda-pcx-160.png",
      "https://fxnvwjugcapmyybvgymv.supabase.co/storage/v1/object/public/vehicle-photos/B2-M101/7305b30e-6e9f-440a-b23a-dc4e7fbe5054.jpg",
      "https://fxnvwjugcapmyybvgymv.supabase.co/storage/v1/object/public/vehicle-photos/B2-M101/91fab474-ee2c-499c-a45b-2cdc803a2426.jpg"
    ],
    "mileage": 0,
    "badgeTag": "ฮิตยอดนิยม",
    "category": "Scooter",
    "engineCc": "160 cc",
    "features": [
      "กุญแจ Smart Key",
      "พอร์ตชาร์จ USB",
      "กล่องเก็บของ U-Box 30 ลิตร",
      "ฟรีหมวกกันน็อก มอก. 2 ใบ"
    ],
    "fuelType": "เบนซิน 95 / E20",
    "plateNumber": "3682",
    "pricePerDay": 400,
    "reviewsCount": 142,
    "transmission": "Automatic (CVT)",
    "nextServiceKm": 0
  },
  {
    "id": "PS-M108",
    "name": "Honda PCX 160 ABS (2024)",
    "type": "Motorcycle",
    "brand": "Honda",
    "image": "/vehicles/honda-pcx-160.png",
    "seats": 2,
    "rating": 4.9,
    "status": "Available",
    "deposit": 500,
    "gallery": [
      "/vehicles/honda-pcx-160.png",
      "https://fxnvwjugcapmyybvgymv.supabase.co/storage/v1/object/public/vehicle-photos/B2-M101/7305b30e-6e9f-440a-b23a-dc4e7fbe5054.jpg",
      "https://fxnvwjugcapmyybvgymv.supabase.co/storage/v1/object/public/vehicle-photos/B2-M101/91fab474-ee2c-499c-a45b-2cdc803a2426.jpg"
    ],
    "mileage": 0,
    "badgeTag": "ฮิตยอดนิยม",
    "category": "Scooter",
    "engineCc": "160 cc",
    "features": [
      "กุญแจ Smart Key",
      "พอร์ตชาร์จ USB",
      "กล่องเก็บของ U-Box 30 ลิตร",
      "ฟรีหมวกกันน็อก มอก. 2 ใบ"
    ],
    "fuelType": "เบนซิน 95 / E20",
    "plateNumber": "รอระบุทะเบียน (B2-M108)",
    "pricePerDay": 400,
    "reviewsCount": 142,
    "transmission": "Automatic (CVT)",
    "nextServiceKm": 0
  },
  {
    "id": "PS-M107",
    "name": "Honda PCX 160 ABS (2024)",
    "type": "Motorcycle",
    "brand": "Honda",
    "image": "/vehicles/honda-pcx-160.png",
    "seats": 2,
    "rating": 4.9,
    "status": "Available",
    "deposit": 500,
    "gallery": [
      "/vehicles/honda-pcx-160.png",
      "https://fxnvwjugcapmyybvgymv.supabase.co/storage/v1/object/public/vehicle-photos/B2-M101/7305b30e-6e9f-440a-b23a-dc4e7fbe5054.jpg",
      "https://fxnvwjugcapmyybvgymv.supabase.co/storage/v1/object/public/vehicle-photos/B2-M101/91fab474-ee2c-499c-a45b-2cdc803a2426.jpg"
    ],
    "mileage": 0,
    "badgeTag": "ฮิตยอดนิยม",
    "category": "Scooter",
    "engineCc": "160 cc",
    "features": [
      "กุญแจ Smart Key",
      "พอร์ตชาร์จ USB",
      "กล่องเก็บของ U-Box 30 ลิตร",
      "ฟรีหมวกกันน็อก มอก. 2 ใบ"
    ],
    "fuelType": "เบนซิน 95 / E20",
    "plateNumber": "132",
    "pricePerDay": 400,
    "reviewsCount": 142,
    "transmission": "Automatic (CVT)",
    "nextServiceKm": 0
  },
  {
    "id": "PS-M101",
    "name": "Honda PCX 160 ABS (2024)",
    "type": "Motorcycle",
    "brand": "Honda",
    "image": "/vehicles/honda-pcx-160.png",
    "seats": 2,
    "rating": 4.9,
    "status": "Available",
    "deposit": 500,
    "gallery": [
      "/vehicles/honda-pcx-160.png",
      "https://fxnvwjugcapmyybvgymv.supabase.co/storage/v1/object/public/vehicle-photos/B2-M101/7305b30e-6e9f-440a-b23a-dc4e7fbe5054.jpg",
      "https://fxnvwjugcapmyybvgymv.supabase.co/storage/v1/object/public/vehicle-photos/B2-M101/91fab474-ee2c-499c-a45b-2cdc803a2426.jpg"
    ],
    "mileage": 0,
    "badgeTag": "ฮิตยอดนิยม",
    "category": "Scooter",
    "engineCc": "160 cc",
    "features": [
      "กุญแจ Smart Key",
      "พอร์ตชาร์จ USB",
      "กล่องเก็บของ U-Box 30 ลิตร",
      "ฟรีหมวกกันน็อก มอก. 2 ใบ"
    ],
    "fuelType": "เบนซิน 95 / E20",
    "plateNumber": "7847",
    "pricePerDay": 400,
    "reviewsCount": 142,
    "transmission": "Automatic (CVT)",
    "nextServiceKm": 0
  },
  {
    "id": "PS-M104",
    "name": "Honda PCX 160 ABS (2024)",
    "type": "Motorcycle",
    "brand": "Honda",
    "image": "/vehicles/honda-pcx-160.png",
    "seats": 2,
    "rating": 4.9,
    "status": "Available",
    "deposit": 500,
    "gallery": [
      "/vehicles/honda-pcx-160.png",
      "https://fxnvwjugcapmyybvgymv.supabase.co/storage/v1/object/public/vehicle-photos/B2-M101/7305b30e-6e9f-440a-b23a-dc4e7fbe5054.jpg",
      "https://fxnvwjugcapmyybvgymv.supabase.co/storage/v1/object/public/vehicle-photos/B2-M101/91fab474-ee2c-499c-a45b-2cdc803a2426.jpg"
    ],
    "mileage": 0,
    "badgeTag": "ฮิตยอดนิยม",
    "category": "Scooter",
    "engineCc": "160 cc",
    "features": [
      "กุญแจ Smart Key",
      "พอร์ตชาร์จ USB",
      "กล่องเก็บของ U-Box 30 ลิตร",
      "ฟรีหมวกกันน็อก มอก. 2 ใบ"
    ],
    "fuelType": "เบนซิน 95 / E20",
    "plateNumber": "159",
    "pricePerDay": 400,
    "reviewsCount": 142,
    "transmission": "Automatic (CVT)",
    "nextServiceKm": 0
  },
  {
    "id": "PS-M109",
    "name": "Honda Giorno+ 125 CBS",
    "type": "Motorcycle",
    "brand": "Honda",
    "image": "/vehicles/honda-giorno-plus.png",
    "seats": 2,
    "rating": 4.88,
    "status": "Available",
    "deposit": 500,
    "gallery": [
      "/vehicles/honda-giorno-plus.png",
      "https://fxnvwjugcapmyybvgymv.supabase.co/storage/v1/object/public/vehicle-photos/B2-M102/d634b490-a099-448c-afe4-f907eea5771e.jpg",
      "https://fxnvwjugcapmyybvgymv.supabase.co/storage/v1/object/public/vehicle-photos/B2-M102/f75bb4c4-cabb-4dda-9c54-88e91e9d7a4d.jpg"
    ],
    "mileage": 0,
    "badgeTag": "สไตล์โมเดิร์น",
    "category": "Scooter",
    "engineCc": "125 cc",
    "features": [
      "ดีไซน์คลาสสิก มินิมอล",
      "ระบบกระจายแรงเบรก CBS",
      "เบาะนั่งกว้างสบาย",
      "ช่องชาร์จไฟสำรอง"
    ],
    "fuelType": "เบนซิน 95",
    "plateNumber": "รอระบุทะเบียน (B2-M109)",
    "pricePerDay": 350,
    "reviewsCount": 98,
    "transmission": "Automatic",
    "nextServiceKm": 0
  },
  {
    "id": "PS-M102",
    "name": "Honda Giorno+ 125 CBS",
    "type": "Motorcycle",
    "brand": "Honda",
    "image": "/vehicles/honda-giorno-plus.png",
    "seats": 2,
    "rating": 4.88,
    "status": "Available",
    "deposit": 500,
    "gallery": [
      "/vehicles/honda-giorno-plus.png",
      "https://fxnvwjugcapmyybvgymv.supabase.co/storage/v1/object/public/vehicle-photos/B2-M102/d634b490-a099-448c-afe4-f907eea5771e.jpg",
      "https://fxnvwjugcapmyybvgymv.supabase.co/storage/v1/object/public/vehicle-photos/B2-M102/f75bb4c4-cabb-4dda-9c54-88e91e9d7a4d.jpg"
    ],
    "mileage": 0,
    "badgeTag": "สไตล์โมเดิร์น",
    "category": "Scooter",
    "engineCc": "125 cc",
    "features": [
      "ดีไซน์คลาสสิก มินิมอล",
      "ระบบกระจายแรงเบรก CBS",
      "เบาะนั่งกว้างสบาย",
      "ช่องชาร์จไฟสำรอง"
    ],
    "fuelType": "เบนซิน 95",
    "plateNumber": "รอระบุทะเบียน (B2-M102)",
    "pricePerDay": 350,
    "reviewsCount": 98,
    "transmission": "Automatic",
    "nextServiceKm": 0
  },
  {
    "id": "PS-C206",
    "name": "Honda City Hatchback 1.0 Turbo",
    "type": "Car",
    "brand": "Honda",
    "image": "/vehicles/honda-city-hatchback.png",
    "seats": 5,
    "rating": 5,
    "status": "Available",
    "deposit": 3000,
    "gallery": [
      "/vehicles/honda-city-hatchback.png",
      "/vehicles/honda-city-hatchback-2.png"
    ],
    "mileage": 0,
    "badgeTag": "ยอดนิยม",
    "category": "Hatchback",
    "engineCc": "1,000 cc เทอร์โบ",
    "features": [
      "เกียร์อัตโนมัติ ขับง่าย",
      "ประหยัดน้ำมัน",
      "เบาะหลังพับได้ ใส่สัมภาระสะดวก",
      "ประกันภัยชั้น 1"
    ],
    "fuelType": "เบนซิน 95 / E20",
    "plateNumber": "7231",
    "pricePerDay": 1100,
    "reviewsCount": 0,
    "transmission": "Automatic CVT",
    "nextServiceKm": 0
  },
  {
    "id": "PS-C207",
    "name": "Honda City Hatchback 1.0 Turbo",
    "type": "Car",
    "brand": "Honda",
    "image": "/vehicles/honda-city-hatchback.png",
    "seats": 5,
    "rating": 5,
    "status": "Available",
    "deposit": 3000,
    "gallery": [
      "/vehicles/honda-city-hatchback.png",
      "/vehicles/honda-city-hatchback-2.png"
    ],
    "mileage": 0,
    "badgeTag": "ยอดนิยม",
    "category": "Hatchback",
    "engineCc": "1,000 cc เทอร์โบ",
    "features": [
      "เกียร์อัตโนมัติ ขับง่าย",
      "ประหยัดน้ำมัน",
      "เบาะหลังพับได้ ใส่สัมภาระสะดวก",
      "ประกันภัยชั้น 1"
    ],
    "fuelType": "เบนซิน 95 / E20",
    "plateNumber": "7236",
    "pricePerDay": 1100,
    "reviewsCount": 0,
    "transmission": "Automatic CVT",
    "nextServiceKm": 0
  },
  {
    "id": "PS-C205",
    "name": "Honda City Hatchback 1.0 Turbo",
    "type": "Car",
    "brand": "Honda",
    "image": "/vehicles/honda-city-hatchback.png",
    "seats": 5,
    "rating": 5,
    "status": "Available",
    "deposit": 3000,
    "gallery": [
      "/vehicles/honda-city-hatchback.png",
      "/vehicles/honda-city-hatchback-2.png"
    ],
    "mileage": 0,
    "badgeTag": "ยอดนิยม",
    "category": "Hatchback",
    "engineCc": "1,000 cc เทอร์โบ",
    "features": [
      "เกียร์อัตโนมัติ ขับง่าย",
      "ประหยัดน้ำมัน",
      "เบาะหลังพับได้ ใส่สัมภาระสะดวก",
      "ประกันภัยชั้น 1"
    ],
    "fuelType": "เบนซิน 95 / E20",
    "plateNumber": "7233",
    "pricePerDay": 1100,
    "reviewsCount": 0,
    "transmission": "Automatic CVT",
    "nextServiceKm": 0
  },
  {
    "id": "PS-M103",
    "name": "Honda Forza 350 ABS",
    "type": "Motorcycle",
    "brand": "Honda",
    "image": "https://images.unsplash.com/photo-1609630875171-b1321377ee65?auto=format&fit=crop&w=800&q=80",
    "seats": 2,
    "rating": 4.96,
    "status": "Available",
    "deposit": 500,
    "gallery": [
      "https://images.unsplash.com/photo-1609630875171-b1321377ee65?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80"
    ],
    "mileage": 15880,
    "badgeTag": "ทัวริ่งหรูแรง",
    "category": "Bigbike",
    "engineCc": "330 cc eSP+",
    "features": [
      "ชิลด์หน้าปรับไฟฟ้า 150 มม.",
      "ระบบ HSTC ป้องกันล้อหมุนฟรี",
      "ดิสก์เบรก ABS หน้า-หลัง",
      "ช่องเก็บหมวก 2 ใบ"
    ],
    "fuelType": "เบนซิน 95",
    "plateNumber": "3กม-7777 นครศรีธรรมราช",
    "pricePerDay": 850,
    "reviewsCount": 79,
    "transmission": "Automatic",
    "nextServiceKm": 16000
  },
  {
    "id": "PS-C204",
    "name": "Honda City Hatchback 1.0 Turbo",
    "type": "Car",
    "brand": "Honda",
    "image": "/vehicles/honda-city-hatchback.png",
    "seats": 5,
    "rating": 5,
    "status": "Available",
    "deposit": 3000,
    "gallery": [
      "/vehicles/honda-city-hatchback.png",
      "/vehicles/honda-city-hatchback-2.png"
    ],
    "mileage": 0,
    "badgeTag": "ยอดนิยม",
    "category": "Hatchback",
    "engineCc": "1,000 cc เทอร์โบ",
    "features": [
      "เกียร์อัตโนมัติ ขับง่าย",
      "ประหยัดน้ำมัน",
      "เบาะหลังพับได้ ใส่สัมภาระสะดวก",
      "ประกันภัยชั้น 1"
    ],
    "fuelType": "เบนซิน 95 / E20",
    "plateNumber": "7234",
    "pricePerDay": 1100,
    "reviewsCount": 0,
    "transmission": "Automatic CVT",
    "nextServiceKm": 0
  },
  {
    "id": "PS-C208",
    "name": "Toyota Yaris Ativ 1.2",
    "type": "Car",
    "brand": "toyota",
    "image": "/vehicles/honda-city-hatchback.png",
    "seats": 5,
    "rating": 5,
    "status": "Available",
    "deposit": 3000,
    "gallery": [
      "/vehicles/honda-city-hatchback.png",
      "/vehicles/honda-city-hatchback-2.png"
    ],
    "mileage": 0,
    "badgeTag": "ยอดนิยม",
    "category": "Sedan",
    "engineCc": "1,000 cc เทอร์โบ",
    "features": [
      "เกียร์อัตโนมัติ ขับง่าย",
      "ประหยัดน้ำมัน",
      "เบาะหลังพับได้ ใส่สัมภาระสะดวก",
      "ประกันภัยชั้น 1"
    ],
    "fuelType": "เบนซิน 95 / E20",
    "plateNumber": "3380",
    "pricePerDay": 1100,
    "driveHubName": "มี",
    "reviewsCount": 0,
    "transmission": "Automatic CVT",
    "nextServiceKm": 0
  },
  {
    "id": "PS-C210",
    "name": "Honda City 1.0 Turbo",
    "type": "Car",
    "brand": "Honda",
    "image": "/vehicles/honda-city.png",
    "seats": 5,
    "rating": 5,
    "status": "Available",
    "deposit": 3000,
    "gallery": [
      "/vehicles/honda-city.png"
    ],
    "mileage": 0,
    "badgeTag": "ซีดานประหยัด",
    "category": "Sedan",
    "engineCc": "1,000 cc เทอร์โบ",
    "features": [
      "เกียร์อัตโนมัติ ขับง่าย",
      "ประหยัดน้ำมัน",
      "ท้ายรถกว้าง ใส่กระเป๋าได้เยอะ",
      "ประกันภัยชั้น 1"
    ],
    "fuelType": "เบนซิน 95 / E20",
    "plateNumber": "7235",
    "pricePerDay": 1100,
    "driveHubName": "มี",
    "reviewsCount": 0,
    "transmission": "Automatic CVT",
    "nextServiceKm": 0
  },
  {
    "id": "PS-C211",
    "name": "Honda City 1.0 Turbo",
    "type": "Car",
    "brand": "Honda",
    "image": "/vehicles/honda-city.png",
    "seats": 5,
    "rating": 5,
    "status": "Available",
    "deposit": 3000,
    "gallery": [
      "/vehicles/honda-city.png"
    ],
    "mileage": 0,
    "badgeTag": "ซีดานประหยัด",
    "category": "Sedan",
    "engineCc": "1,000 cc เทอร์โบ",
    "features": [
      "เกียร์อัตโนมัติ ขับง่าย",
      "ประหยัดน้ำมัน",
      "ท้ายรถกว้าง ใส่กระเป๋าได้เยอะ",
      "ประกันภัยชั้น 1"
    ],
    "fuelType": "เบนซิน 95 / E20",
    "plateNumber": "7232",
    "pricePerDay": 1100,
    "driveHubName": "มี",
    "reviewsCount": 0,
    "transmission": "Automatic CVT",
    "nextServiceKm": 0
  },
  {
    "id": "PS-C201",
    "name": "Toyota Yaris Ativ 1.2 Premium",
    "type": "Car",
    "brand": "Toyota",
    "image": "/vehicles/toyota-yaris-ativ.png",
    "seats": 5,
    "rating": 4.86,
    "status": "Available",
    "deposit": 3000,
    "gallery": [
      "/vehicles/toyota-yaris-ativ.png"
    ],
    "mileage": 0,
    "badgeTag": "ประหยัดน้ำมัน",
    "category": "Sedan",
    "engineCc": "1,200 cc",
    "features": [
      "Toyota Safety Sense",
      "หน้าจอ Apple CarPlay / Android Auto",
      "กล้องมองหลังพร้อมเซนเซอร์",
      "เบาะหนังทรงสปอร์ต"
    ],
    "fuelType": "เบนซิน 95 / E20 (23.3 กม./ลิตร)",
    "plateNumber": "รอระบุทะเบียน (B2-C201)",
    "pricePerDay": 1200,
    "reviewsCount": 115,
    "transmission": "Automatic Super CVT-i",
    "nextServiceKm": 0
  },
  {
    "id": "PS-C212",
    "name": "Toyota Yaris 1.2",
    "type": "Car",
    "brand": "Toyota",
    "image": "/vehicles/toyota-yaris.png",
    "seats": 5,
    "rating": 5,
    "status": "Available",
    "deposit": 3000,
    "gallery": [
      "/vehicles/toyota-yaris.png"
    ],
    "mileage": 0,
    "badgeTag": "คล่องตัว",
    "category": "Hatchback",
    "engineCc": "1,200 cc",
    "features": [
      "เกียร์อัตโนมัติ ขับง่าย",
      "ขนาดกะทัดรัด จอดง่าย",
      "ประหยัดน้ำมัน",
      "ประกันภัยชั้น 1"
    ],
    "fuelType": "เบนซิน 95 / E20",
    "plateNumber": "รอระบุทะเบียน (B2-C212)",
    "pricePerDay": 1000,
    "driveHubName": "มี",
    "reviewsCount": 0,
    "transmission": "Automatic CVT",
    "nextServiceKm": 0
  },
  {
    "id": "PS-C202",
    "name": "BYD Atto 3 Extended Range",
    "type": "Car",
    "brand": "BYD",
    "image": "/vehicles/byd-atto-3.png",
    "seats": 5,
    "rating": 4.95,
    "status": "Available",
    "deposit": 3000,
    "gallery": [
      "/vehicles/byd-atto-3.png"
    ],
    "mileage": 0,
    "badgeTag": "⚡ EV 100%",
    "category": "EV",
    "engineCc": "มอเตอร์ไฟฟ้า 201 แรงม้า",
    "features": [
      "แบตเตอรี่ Blade Battery ความปลอดภัยสูง",
      "หน้าจอสัมผัสหมุนไฟฟ้า 12.8 นิ้ว",
      "หลังคา Panoramic Sunroof",
      "ระบบสั่งงานด้วยเสียง"
    ],
    "fuelType": "⚡ ไฟฟ้า 100% (วิ่งไกล 480 กม.)",
    "plateNumber": "7238",
    "pricePerDay": 1800,
    "driveHubName": "มี",
    "reviewsCount": 160,
    "transmission": "Automatic Single Speed",
    "nextServiceKm": 0
  },
  {
    "id": "PS-C215",
    "name": "BYD Seal 5 DM-i",
    "type": "Car",
    "brand": "BYD",
    "image": "/vehicles/byd-seal-5.png",
    "seats": 5,
    "rating": 5,
    "status": "Available",
    "deposit": 3000,
    "gallery": [
      "/vehicles/byd-seal-5.png",
      "/vehicles/byd-seal-5-rear.png"
    ],
    "mileage": 0,
    "badgeTag": "⚡ ไฮบริดปลั๊กอิน",
    "category": "Sedan",
    "engineCc": "1,500 cc + มอเตอร์ไฟฟ้า",
    "features": [
      "รถเก๋งซีดาน ห้องโดยสารกว้าง นั่งสบาย",
      "ขับด้วยไฟฟ้าในเมือง ประหยัดมาก",
      "เดินทางไกลได้ไม่ต้องกังวลจุดชาร์จ",
      "ประกันภัยชั้น 1"
    ],
    "fuelType": "⚡ ไฮบริดปลั๊กอิน (น้ำมัน + ไฟฟ้า)",
    "plateNumber": "8271",
    "pricePerDay": 1800,
    "driveHubName": "มี",
    "reviewsCount": 0,
    "transmission": "Automatic (E-CVT)",
    "nextServiceKm": 0
  },
  {
    "id": "PS-C214",
    "name": "BYD Seal 5 DM-i",
    "type": "Car",
    "brand": "BYD",
    "image": "/vehicles/byd-seal-5.png",
    "seats": 5,
    "rating": 5.0,
    "status": "Available",
    "deposit": 3000,
    "gallery": [
      "/vehicles/byd-seal-5.png",
      "/vehicles/byd-seal-5-rear.png"
    ],
    "mileage": 0,
    "badgeTag": "⚡ ไฮบริดปลั๊กอิน",
    "category": "Sedan",
    "engineCc": "1,500 cc + มอเตอร์ไฟฟ้า",
    "features": [
      "รถเก๋งซีดาน ห้องโดยสารกว้าง นั่งสบาย",
      "ขับด้วยไฟฟ้าในเมือง ประหยัดมาก",
      "เดินทางไกลได้ไม่ต้องกังวลจุดชาร์จ",
      "ประกันภัยชั้น 1"
    ],
    "fuelType": "⚡ ไฮบริดปลั๊กอิน (น้ำมัน + ไฟฟ้า)",
    "plateNumber": "รอระบุทะเบียน (B2-C214)",
    "pricePerDay": 1800,
    "reviewsCount": 0,
    "transmission": "Automatic (E-CVT)",
    "nextServiceKm": 0
  },
  {
    "id": "PS-C203",
    "name": "Toyota Fortuner Legender 2.8 4WD",
    "type": "Car",
    "brand": "Toyota",
    "image": "/vehicles/toyota-fortuner.png",
    "seats": 7,
    "rating": 4.93,
    "status": "Available",
    "deposit": 3000,
    "gallery": [
      "/vehicles/toyota-fortuner.png"
    ],
    "mileage": 0,
    "badgeTag": "7 ที่นั่ง VIP",
    "category": "SUV",
    "engineCc": "2,800 cc ดีเซลเทอร์โบ",
    "features": [
      "ขับเคลื่อน 4 ล้อ 4WD",
      "ชุดเครื่องเสียง JBL 11 ลำโพง",
      "กล้องมองรอบทิศทาง 360 องศา",
      "ประตูท้ายเปิด-ปิดไฟฟ้า"
    ],
    "fuelType": "ดีเซล B7 / B20",
    "plateNumber": "975",
    "pricePerDay": 2800,
    "driveHubName": "มี",
    "reviewsCount": 88,
    "transmission": "Automatic 6-Speed 4WD",
    "nextServiceKm": 0
  },
  {
    "id": "PS-C213",
    "name": "Mitsubishi Pajero Sport 2.4",
    "type": "Car",
    "brand": "Mitsubishi",
    "image": "/vehicles/mitsubishi-pajero-sport.png",
    "seats": 7,
    "rating": 5,
    "status": "Available",
    "deposit": 3000,
    "gallery": [
      "/vehicles/mitsubishi-pajero-sport.png"
    ],
    "mileage": 0,
    "badgeTag": "7 ที่นั่ง",
    "category": "SUV",
    "engineCc": "2,400 cc ดีเซลเทอร์โบ",
    "features": [
      "7 ที่นั่ง เหมาะกับครอบครัว",
      "ขับทางชันได้สบาย",
      "ห้องโดยสารกว้าง",
      "ประกันภัยชั้น 1"
    ],
    "fuelType": "ดีเซล B7",
    "plateNumber": "2318",
    "pricePerDay": 2500,
    "reviewsCount": 0,
    "transmission": "Automatic",
    "nextServiceKm": 0
  }
];

export const INITIAL_BOOKINGS = [
  {
    id: 'PS-2026-0881',
    vehicleId: 'PS-M101',
    vehicleName: 'Honda PCX 160 ABS (2024)',
    vehicleType: 'Motorcycle',
    customerName: 'สมชาย ภักดี',
    phone: '0800000000',
    idCard: '1100200300400',
    pickupLocation: 'สนามบินนครศรีธรรมราช (จัดส่งฟรี)',
    returnLocation: 'สนามบินนครศรีธรรมราช (จัดส่งฟรี)',
    startDate: '2026-11-15',
    endDate: '2026-11-17',
    pickupTime: '09:00',
    returnTime: '09:00',
    totalDays: 2,
    addons: ['helmet', 'insurance'],
    subtotal: 1100,
    discount: 0,
    totalPrice: 1100,
    couponCode: '',
    status: 'Confirmed',
    createdAt: '2026-11-08 10:15',
    paymentMethod: 'PromptPay QR',
    slip: null,
  },
  {
    id: 'PS-2026-0882',
    vehicleId: 'PS-C202',
    vehicleName: 'BYD Atto 3 Extended Range',
    vehicleType: 'Car',
    customerName: 'กมลวรรณ สุขประเสริฐ',
    phone: '0891234567',
    idCard: '3100500600700',
    pickupLocation: 'หน้าร้าน PUNSO สาขาใหญ่ (ตัวเมือง)',
    returnLocation: 'หน้าร้าน PUNSO สาขาใหญ่ (ตัวเมือง)',
    startDate: '2026-11-18',
    endDate: '2026-11-20',
    pickupTime: '10:00',
    returnTime: '10:00',
    totalDays: 2,
    addons: ['insurance'],
    subtotal: 3900,
    discount: 0,
    totalPrice: 3900,
    couponCode: '',
    status: 'Pending',
    createdAt: '2026-11-10 14:30',
    paymentMethod: 'PromptPay QR',
    slip: null,
  },
  {
    id: 'PS-2026-0879',
    vehicleId: 'PS-M103',
    vehicleName: 'Honda Forza 350 ABS',
    vehicleType: 'Motorcycle',
    customerName: 'David Miller',
    phone: '0954443322',
    idCard: 'P-GB5531209',
    pickupLocation: 'จัดส่งฟรีถึง โรงแรม / ที่พักในตัวเมือง',
    returnLocation: 'จัดส่งฟรีถึง โรงแรม / ที่พักในตัวเมือง',
    startDate: '2026-11-09',
    endDate: '2026-11-13',
    pickupTime: '08:30',
    returnTime: '18:00',
    totalDays: 4,
    addons: ['helmet', 'phoneholder', 'insurance'],
    subtotal: 4200,
    discount: 210,
    totalPrice: 3990,
    couponCode: '',
    status: 'Picked Up',
    createdAt: '2026-11-05 19:02',
    paymentMethod: 'PromptPay QR',
    slip: null,
  },
  {
    id: 'PS-2026-0870',
    vehicleId: 'PS-C201',
    vehicleName: 'Toyota Yaris Ativ 1.2 Premium',
    vehicleType: 'Car',
    customerName: 'ปิยะพงษ์ ทองดี',
    phone: '0867771234',
    idCard: '1800100222333',
    pickupLocation: 'สนามบินนครศรีธรรมราช (จัดส่งฟรี)',
    returnLocation: 'สนามบินนครศรีธรรมราช (จัดส่งฟรี)',
    startDate: '2026-11-01',
    endDate: '2026-11-04',
    pickupTime: '12:00',
    returnTime: '12:00',
    totalDays: 3,
    addons: ['insurance'],
    subtotal: 4050,
    discount: 203,
    totalPrice: 3847,
    couponCode: '',
    status: 'Completed',
    createdAt: '2026-10-28 09:40',
    paymentMethod: 'PromptPay QR',
    slip: null,
  },
];

export const ADDONS = [
  { id: 'driver', name: 'บริการพร้อมคนขับ (คนขับมืออาชีพ ชำนาญเส้นทาง)', price: 500, unit: 'day', icon: UserCheck, onlyFor: 'Car', note: 'บาท/วัน' },
  { id: 'helmet', name: 'หมวกกันน็อกมาตรฐาน มอก. 2 ใบ (Full Face / Half)', price: 0, unit: 'free', icon: HardHat, onlyFor: 'Motorcycle', note: 'บริการฟรีไม่มีค่าใช้จ่าย' },
  { id: 'phoneholder', name: 'แท่นจับมือถือกันสั่นอลูมิเนียม Smart Holder', price: 50, unit: 'day', icon: Smartphone, note: 'บาท/วัน' },
  { id: 'insurance', name: 'ประกันภัยคุ้มครองพิเศษ Zero Deductible (ไม่มีค่าเสียหายส่วนแรก)', price: 150, unit: 'day', icon: Shield, note: 'บาท/วัน' },
  { id: 'childseat', name: 'คาร์ซีทเด็ก (Child Car Seat) มาตรฐาน ECE', price: 100, unit: 'day', icon: Baby, onlyFor: 'Car', note: 'บาท/วัน' },
  { id: 'wifi', name: 'Pocket WiFi 4G/5G ไม่จำกัดเน็ต', price: 80, unit: 'day', icon: Wifi, note: 'บาท/วัน' },
  { id: 'delivery', name: 'บริการรับ-ส่งรถถึงโรงแรม/ที่พักนอกเขตเมือง (ไป-กลับ 2 เที่ยว)', price: 200, unit: 'trip', trips: 2, icon: MapPin, note: 'บาท/เที่ยว' },
];

export const DEFAULT_COUPONS = [
  { code: 'PUNSO2026', percent: 10, active: true, label: 'ส่วนลดช่วงเทศกาล 10%' },
  { code: 'EVGREEN', percent: 15, active: true, label: 'ส่วนลดรถ EV 15%', onlyCategory: 'EV' },
];

// Long-rental tiered discount (applied to vehicle base price only)
export const DURATION_TIERS = [
  { minDays: 7, percent: 15, label: 'เช่า 7 วันขึ้นไป ลด 15%' },
  { minDays: 3, percent: 5, label: 'เช่า 3 วันขึ้นไป ลด 5%' },
];

// Distances are approximate road distances from Nakhon Si Thammarat city.
// Photos: Wikimedia Commons (see `credit`), stored in public/destinations/.
export const DESTINATIONS = [
  {
    name: 'ขนอม (Khanom)',
    desc: 'ทะเลน้ำใส หาดทรายขาวเงียบสงบ ลุ้นชมโลมาสีชมพู และจุดชมวิวเขาพลายดำ เส้นทางเลียบทะเลสิชล–ขนอมขับสวยตลอดทาง',
    image: '/destinations/khanom.jpg',
    tag: 'ทะเล & โลมาสีชมพู',
    distance: '95 กม.',
    drive: '~1 ชม. 30 นาที',
    featured: true,
    credit: 'Khanom Beach — Wikimedia Commons (CC BY-SA 3.0)',
    highlights: ['หาดขนอม / หาดในเพลา น้ำใส ทรายขาว คนไม่พลุกพล่าน', 'ล่องเรือชมโลมาสีชมพูช่วงเช้า', 'จุดชมวิวเขาพลายดำ เห็นทะเลอ่าวไทยมุมกว้าง'],
    bestTime: 'มี.ค. – ต.ค. ทะเลเรียบ (พ.ย. – ม.ค. มีมรสุม คลื่นแรง)',
    tip: 'รถยนต์นั่งสบายทั้งครอบครัว หรือ PCX ขับเลียบทะเลสิชล–ขนอมชมวิวตลอดทาง',
    maps: 'Khanom Beach Nakhon Si Thammarat',
  },
  {
    name: 'วัดพระมหาธาตุวรมหาวิหาร',
    desc: 'พระบรมธาตุเจดีย์คู่บ้านคู่เมืองอายุกว่าพันปี ไหว้พระขอพรกลางเมืองนคร',
    image: '/destinations/wat-phra-mahathat.jpg',
    tag: 'ไหว้พระ',
    distance: '3 กม.',
    drive: '~10 นาที',
    credit: 'Chedi Phra Baromathat — Wikimedia Commons (CC BY-SA 3.0)',
    highlights: ['พระบรมธาตุเจดีย์ทรงลังกา สูงกว่า 55 เมตร', 'วิหารพระทรงม้า และพิพิธภัณฑ์ในวัด', 'รอบวัดมีร้านขนมจีนและของฝากเมืองนคร'],
    bestTime: 'ช่วงเช้า อากาศไม่ร้อน คนไม่เยอะ',
    tip: 'แต่งกายสุภาพ ใกล้ตัวเมือง มอเตอร์ไซค์หาที่จอดง่าย',
    maps: 'Wat Phra Mahathat Woramahawihan',
  },
  {
    name: 'หมู่บ้านคีรีวง',
    desc: 'หมู่บ้านอากาศดีที่สุดในไทย ลำธารใส สวนผลไม้ น้ำตกวังไม้ปัก และผ้ามัดย้อมสีธรรมชาติ',
    image: '/destinations/khiriwong.jpg',
    tag: 'อากาศดี',
    distance: '25 กม.',
    drive: '~35 นาที',
    credit: 'Wang Mai Pak Waterfall — Wikimedia Commons (CC0)',
    highlights: ['ลำธารใสไหลผ่านกลางหมู่บ้าน อากาศเย็นสดชื่น', 'น้ำตกวังไม้ปัก เล่นน้ำได้', 'ผ้ามัดย้อมสีธรรมชาติ และสวนผลไม้ (มังคุด ทุเรียน ช่วง มิ.ย. – ก.ย.)'],
    bestTime: 'ช่วงเช้า หมอกบางและอากาศเย็นที่สุด',
    tip: 'มอเตอร์ไซค์ขับรับลมสบาย ถนนดี ใช้เวลาไม่นานจากตัวเมือง',
    maps: 'Khiriwong Village Lan Saka',
  },
  {
    name: 'น้ำตกกะโรม',
    desc: 'น้ำตก 19 ชั้นในอุทยานแห่งชาติเขาหลวง ร่มรื่น เล่นน้ำได้ ใกล้ตัวเมือง',
    image: '/destinations/karom-waterfall.jpg',
    tag: 'น้ำตก',
    distance: '30 กม.',
    drive: '~40 นาที',
    credit: 'Karom Waterfall — Wikimedia Commons (CC BY-SA 4.0)',
    highlights: ['น้ำตก 19 ชั้น ไหลลดหลั่นตามแนวหิน', 'ชั้นล่างเล่นน้ำได้ เดินจากลานจอดรถไม่ไกล', 'ป่าร่มรื่น เหมาะพักผ่อนครึ่งวัน'],
    bestTime: 'เที่ยวได้ทั้งปี ช่วงฝนน้ำเยอะสวยที่สุด',
    tip: 'มีค่าเข้าอุทยานฯ เตรียมชุดเปลี่ยนถ้าจะเล่นน้ำ',
    maps: 'Karom Waterfall Khao Luang National Park',
  },
  {
    name: 'น้ำตกกรุงชิง',
    desc: 'ไฮไลต์อุทยานฯ เขาหลวง เดินป่าเส้นทางธรรมชาติ ~4 กม. สู่น้ำตกหนานฝนแสนห่า',
    image: '/destinations/krung-ching-waterfall.jpg',
    tag: 'เดินป่า',
    distance: '70 กม.',
    drive: '~1 ชม. 15 นาที',
    credit: 'Krung Ching Waterfall — Wikimedia Commons (CC BY-SA 4.0)',
    highlights: ['น้ำตกหนานฝนแสนห่า ไฮไลต์ของอุทยานฯ เขาหลวง', 'เส้นทางเดินป่า ~4 กม. ผ่านป่าดิบชื้น เฟิร์น และมอส', 'อากาศเย็น ธรรมชาติสมบูรณ์มาก'],
    bestTime: 'ช่วงฝนตกหนักอาจปิดเส้นทาง ควรเช็กกับอุทยานฯ ก่อนไป',
    tip: 'เริ่มเดินช่วงเช้า ใส่รองเท้าเดินป่า ไป–กลับใช้เวลาประมาณ 3 ชม.',
    maps: 'Krung Ching Waterfall Nopphitam',
  },
];

export const REVIEWS = [
  { name: 'ณัฐธิดา ว.', vehicle: 'Honda PCX 160', rating: 5, date: 'ต.ค. 2026', text: 'รับรถที่สนามบินไวมาก รถใหม่ สะอาด หมวกกันน็อกหอม พนักงานอธิบายเส้นทางไปคีรีวงให้ด้วย ประทับใจค่ะ' },
  { name: 'Mark T.', vehicle: 'BYD Atto 3', rating: 5, date: 'Sep 2026', text: 'Smooth booking with PromptPay, the EV was fully charged and they showed me where to find chargers. Highly recommend!' },
  { name: 'ธีรวัฒน์ ส.', vehicle: 'Toyota Fortuner', rating: 4.8, date: 'ส.ค. 2026', text: 'พาครอบครัวไปขนอม 7 คนนั่งสบาย รถแรง ประกันชั้น 1 ทำให้อุ่นใจ คืนรถก็ไม่ยุ่งยาก' },
];

// Standard refundable deposit per vehicle type
export const DEPOSIT_BY_TYPE = { Motorcycle: 500, Car: 3000 };
export const depositOf = (v) => Number(v?.deposit) || DEPOSIT_BY_TYPE[v?.type] || 500;

export const REQUIREMENTS = [
  { title: 'บัตรประชาชน / Passport', desc: 'ตัวจริงของผู้เช่า สำหรับยืนยันตัวตน' },
  { title: 'ใบขับขี่ที่ยังไม่หมดอายุ', desc: 'ประเภทให้ตรงกับพาหนะ (ต่างชาติใช้ IDP ได้)' },
  { title: 'เงินมัดจำ (คืนเต็มจำนวน)', desc: 'มอเตอร์ไซค์ ฿500 / รถยนต์ ฿3,000 ต่อคัน • เงินสด/โอน คืนทันทีเมื่อตรวจสภาพรถเรียบร้อย' },
  { title: 'อายุ 18 ปีขึ้นไป', desc: 'รถยนต์ 21 ปีขึ้นไป และมีใบขับขี่อย่างน้อย 1 ปี' },
];

export const FAQS = [
  { q: 'ต้องใช้บัตรเครดิตในการจองหรือไม่?', a: 'ไม่จำเป็นค่ะ ชำระผ่าน PromptPay QR ได้ทันที และวางเงินมัดจำเป็นเงินสดหรือโอนในวันรับรถ ซึ่งจะคืนให้เต็มจำนวนเมื่อคืนรถ' },
  { q: 'ยกเลิกการจองได้ไหม มีค่าธรรมเนียมหรือเปล่า?', a: 'ยกเลิกฟรีก่อนวันรับรถ 48 ชั่วโมง หากยกเลิกภายใน 48 ชั่วโมงจะหักค่าธรรมเนียม 1 วันของค่าเช่า' },
  { q: 'คืนรถล่าช้ากว่าเวลาที่กำหนดได้หรือไม่?', a: 'ผ่อนผันได้ 1 ชั่วโมง หลังจากนั้นคิดชั่วโมงละ 10% ของค่าเช่ารายวัน และเกิน 4 ชั่วโมงคิดเป็น 1 วัน' },
  { q: 'ต้องเติมน้ำมัน / ชาร์จไฟคืนหรือไม่?', a: 'รับรถระดับไหน คืนระดับนั้น (Same-to-Same) สำหรับรถ EV คืนแบตเตอรี่ไม่ต่ำกว่า 70%' },
  { q: 'ถ้ารถเสียหรือเกิดอุบัติเหตุต้องทำอย่างไร?', a: 'โทรสายด่วน 24 ชม. ทีมงานจะประสานประกันและส่งรถคันใหม่ให้ภายใน 2 ชั่วโมงในเขตเมือง' },
];

export const BOOKING_STATUS = {
  Pending: { label: 'รอตรวจสอบชำระเงิน', icon: '⏳', cls: 'bg-amber-500/10 border-amber-500/30 text-amber-600' },
  Confirmed: { label: 'ยืนยันการจองแล้ว', icon: '✓', cls: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600' },
  'Picked Up': { label: 'รับรถแล้ว / กำลังเช่า', icon: '🔑', cls: 'bg-zinc-900/5 border-zinc-400/30 text-zinc-800' },
  Completed: { label: 'คืนรถเสร็จสิ้น', icon: '★', cls: 'bg-zinc-900/5 border-zinc-400/30 text-zinc-900' },
  Cancelled: { label: 'ยกเลิกรายการ', icon: '✕', cls: 'bg-rose-500/10 border-rose-500/30 text-rose-600' },
};

export const BOOKING_FLOW = ['Pending', 'Confirmed', 'Picked Up', 'Completed'];

export const DEFAULT_SETTINGS = {
  promptPayId: '0800000000',
  accountName: 'บริษัท ปันโซ คาร์ เร้นท์ทัล จำกัด (PUNSO Car Rental Co., Ltd.)',
  lineOaId: '@punso',
  facebookUrl: '',
  facebookName: 'PUNSO Car Rental',
  storePhone: '080-000-0000',
  storeAddress: '123/45 ถนนพัฒนาการคูขวาง ต.ในเมือง อ.เมือง จ.นครศรีธรรมราช 80000',
  openHours: '07:00 - 21:00 ทุกวัน',
  paymentWindowMin: 15,
};

// Top-of-page photo slider: the recommended travel destinations
export const HERO_SLIDES = DESTINATIONS.map((d, i) => ({ id: i + 1, ...d, bgImage: d.image }));
