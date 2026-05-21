import React, { createContext, useState, useEffect } from 'react';
import { getTranslation } from '../translations/locale';
import { Preferences } from '@capacitor/preferences';

export const AppContext = createContext();

const safeJsonParse = (str, fallback) => {
  if (!str) return fallback;
  try {
    const val = JSON.parse(str);
    return val === null ? fallback : val;
  } catch (e) {
    console.error("Failed to parse JSON from localStorage:", e);
    return fallback;
  }
};

// Helper to save data to both localStorage and Capacitor Preferences
const saveToStorage = async (key, value) => {
  try {
    localStorage.setItem(key, value);
    await Preferences.set({ key, value });
  } catch (e) {
    console.warn("Capacitor Preferences write failed/skipped:", e);
  }
};


// รายการท่าออกกำลังกายเริ่มต้นภาษาไทย
const DEFAULT_EXERCISES = [
  {
    id: 'ex1',
    name: 'Barbell Bench Press (บาร์เบล เบนช์เพรส)',
    category: 'Chest (อก)',
    description: 'นอนราบบนเบาะยาว ใช้มือจับบาร์เบลในระยะกว้างกว่าช่วงไหล่เล็กน้อย ดันขึ้นและลดระดับลงระดับอกเพื่อฝึกกล้ามเนื้ออก ไหล่หน้า และหลังแขน',
    difficulty: 'ปานกลาง',
    instructions: [
      'นอนราบบนเบาะยาว วางเท้าทั้งสองข้างให้มั่นคงบนพื้น',
      'จับบาร์เบลด้วยความกว้างประมาณ 1.5 เท่าของช่วงไหล่',
      'ยกบาร์ออกจากที่วาง ค่อยๆ ลดบาร์เบลลงช้าๆ จนแตะหน้าอกส่วนกลาง',
      'ออกแรงดันบาร์เบลกลับขึ้นไปให้สุดแขน โดยไม่ล็อกข้อศอก'
    ]
  },
  {
    id: 'ex2',
    name: 'Lat Pulldown (แลท พูลดาวน์)',
    category: 'Back (หลัง)',
    description: 'นั่งลงบนเก้าอี้ ดึงคานเหล็กลงมาหาหน้าอกส่วนบนเพื่อฝึกกล้ามเนื้อปีกหลัง (Latissimus Dorsi) และกล้ามเนื้อหลังส่วนบน',
    difficulty: 'ง่าย',
    instructions: [
      'ปรับเบาะรองขาให้กระชับ นั่งลงและจับคานจับให้กว้างกว่าช่วงไหล่',
      'ยืดอกขึ้นเล็กน้อย ค่อยๆ ดึงคานลงมาหาหน้าอกส่วนบนโดยใช้กล้ามเนื้อหลังและบีบสะบัก',
      'เกร็งค้างไว้ 1 วินาที จากนั้นผ่อนบาร์กลับขึ้นไปด้านบนช้าๆ จนสุดแขน'
    ]
  },
  {
    id: 'ex3',
    name: 'Barbell Squat (บาร์เบล สควอท)',
    category: 'Legs (ขา)',
    description: 'วางบาร์เบลไว้บนบ่า ย่อสะโพกและเข่าลงเหมือนการนั่งเก้าอี้ เพื่อเสริมสร้างกล้ามเนื้อต้นขาด้านหน้า สะโพก และหลังส่วนล่าง',
    difficulty: 'ยาก',
    instructions: [
      'วางเท้ากว้างเท่าหัวไหล่ ชี้ปลายเท้าออกด้านนอกประมาณ 15-30 องศา',
      'แบกบาร์เบลไว้บนกล้ามเนื้อบ่าส่วนบน ยืดอกและเกร็งหน้าท้อง',
      'ย่อสะโพกลงเหมือนจะนั่งเก้าอี้ โดยให้เข่าชี้ตามทิศทางปลายเท้าจนสะโพกขนานกับพื้น',
      'ออกแรงถีบพื้นดันตัวกลับขึ้นมาสู่ท่าเริ่มต้น'
    ]
  },
  {
    id: 'ex4',
    name: 'Overhead Press (โอเวอร์เฮด เพรส)',
    category: 'Shoulders (ไหล่)',
    description: 'ยืนตรง ดันบาร์เบลจากตำแหน่งหน้าอกขึ้นตรงเหนือศีรษะ เพื่อสร้างกล้ามเนื้อไหล่และกล้ามเนื้อแกนกลางลำตัว',
    difficulty: 'ยาก',
    instructions: [
      'ตั้งเท้ากว้างเท่าช่วงไหล่ จับบาร์เบลไว้ที่หน้าอกส่วนบนด้วยนิ้วหัวแม่มือกำรอบบาร์',
      'เกร็งก้น ต้นขา และแกนกลางลำตัวเพื่อพยุงร่างกายให้ตรงและมั่นคง',
      'ออกแรงดันบาร์เบลขึ้นตรงเหนือศีรษะ หลบใบหน้าเล็กน้อยขณะบาร์ผ่านหน้า',
      'ดันขึ้นจนสุดแขน จากนั้นค่อยๆ ผ่อนบาร์เบลกลับลงมาที่หน้าอกช้าๆ'
    ]
  },
  {
    id: 'ex5',
    name: 'Dumbbell Bicep Curl (ดัมเบล ไบเซป เคิร์ล)',
    category: 'Arms (แขน)',
    description: 'ยืนหรือนั่ง ถือดัมเบลแล้วพับข้อศอกยกดัมเบลขึ้น เพื่อบริหารกล้ามเนื้อหน้าแขน (Bicep)',
    difficulty: 'ง่าย',
    instructions: [
      'ยืนตรงถือดัมเบลข้างลำตัว หันฝ่ามือออกด้านหน้า หนีบข้อศอกไว้ข้างลำตัว',
      'พับข้อศอกยกดัมเบลขึ้นหาไหล่ โดยปล่อยให้ไหล่และศอกอยู่นิ่งที่สุด',
      'เกร็งกล้ามเนื้อหน้าแขนตอนยกสุดช้าๆ แล้วค่อยๆ ผ่อนดัมเบลลงกลับท่าเดิม'
    ]
  },
  {
    id: 'ex6',
    name: 'Plank (แพลงก์)',
    category: 'Core (แกนกลาง)',
    description: 'นอนคว่ำชันศอก เเกร็งตัวให้ตรงขนานกับพื้น เพื่อฝึกความทนทานของแกนกลางลำตัวทั้งหมด',
    difficulty: 'ง่าย',
    instructions: [
      'วางข้อศอกลงบนพื้นใต้หัวไหล่ ยืดขาทั้งสองข้างไปด้านหลัง ตั้งปลายเท้า',
      'ยกตัวขึ้นเกร็งหน้าท้อง ก้น และต้นขา ให้ลำตัวเป็นเส้นตรงขนานกับพื้น',
      'พยายามไม่ให้สะโพกโก่งหรือหย่อนคล้อย ค้างไว้ตามระยะเวลาที่กำหนด'
    ]
  },
  {
    id: 'ex7',
    name: 'Romanian Deadlift (โรมาเนียน เดดลิฟต์)',
    category: 'Legs (ขา)',
    description: 'ยืนถือบาร์เบลหรือดัมเบล ดันสะโพกไปด้านหลังแล้วก้มตัวลงช้าๆ เพื่อยืดสร้างกล้ามเนื้อต้นขาด้านหลัง (Hamstrings) และสะโพก',
    difficulty: 'ปานกลาง',
    instructions: [
      'ยืนตรงเท้ากว้างเท่าสะโพก ถือบาร์เบลไว้หน้าขา',
      'งอเข่าเพียงเล็กน้อย ดันสะโพกไปด้านหลัง ก้มตัวลงช้าๆ รูดบาร์เบลแนบขา',
      'ลงไปจนรู้สึกตึงที่หลังต้นขา (หลังต้องตรงตลอดเวลา ไม่ค่อม)',
      'ออกแรงจากสะโพกและหลังขา ดึงตัวกลับมาตรงในท่าเริ่มต้น'
    ]
  },
  {
    id: 'ex8',
    name: 'Push-Up (วิดพื้น)',
    category: 'Chest (อก)',
    description: 'ท่าบอดี้เวทพื้นฐานสำหรับฝึกกล้ามเนื้ออก แกนกลาง ไหล่ และหลังแขน โดยใช้การดันพื้น',
    difficulty: 'ง่าย',
    instructions: [
      'คว่ำตัวลงใช้มือและปลายเท้ายันพื้น มือห่างกันกว้างกว่าไหล่เล็กน้อย',
      'เกร็งลำตัวให้ตรง ค่อยๆ งอศอกลดตัวลงจนอกเกือบแตะพื้น',
      'ออกแรงดันตัวกลับขึ้นมาสู่ท่าเริ่มต้น'
    ]
  },
  {
    id: 'ex9',
    name: 'Incline Dumbbell Press (ดัมเบล ดันเฉียงบน)',
    category: 'Chest (อก)',
    description: 'นอนบนเบาะเอียงขึ้น 30-45 องศา ดันดัมเบลขึ้นเพื่อเน้นกล้ามเนื้ออกส่วนบน',
    difficulty: 'ปานกลาง',
    instructions: [
      'ปรับเบาะเอียงขึ้น 30-45 องศา นั่งพิงเบาะให้หลังแนบสนิท',
      'ถือดัมเบลในระดับไหล่ หักศอกลงทำมุมประมาณ 45-60 องศากับลำตัว',
      'ออกแรงดันดัมเบลขึ้นตรงๆ ให้ดัมเบลเข้าหากันเล็กน้อยด้านบน',
      'ลดดัมเบลลงช้าๆ จนรู้สึกตึงกล้ามเนื้ออกส่วนบน'
    ]
  },
  {
    id: 'ex10',
    name: 'Tricep Pushdown (ไตรเซป พุชดาวน์)',
    category: 'Arms (แขน)',
    description: 'ใช้เครื่องเคเบิล ดึงเชือกหรือบาร์ลงด้านล่างโดยให้ศอกอยู่นิ่ง เพื่อเน้นกล้ามเนื้อหลังแขน (Triceps)',
    difficulty: 'ง่าย',
    instructions: [
      'ยืนหันหน้าเข้าหาเครื่องเคเบิล จับเชือกหรือคานศอกตั้งฉาก 90 องศา',
      'หนีบศอกไว้ข้างลำตัว ออกแรงเกร็งหลังแขนเหยียดแขนลงด้านล่างจนสุด',
      'แบะเชือกออกเล็กน้อยตอนล่างสุด ค่อยๆ ผ่อนมือกลับขึ้นช้าๆ'
    ]
  },
  {
    id: 'ex11',
    name: 'Dumbbell Lateral Raise (ยกดัมเบลออกข้าง)',
    category: 'Shoulders (ไหล่)',
    description: 'ยืนถือดัมเบล ยกแขนออกด้านข้างให้ขนานกับพื้น เพื่อเน้นการสร้างกล้ามเนื้อไหล่ด้านข้าง (Lateral Deltoid)',
    difficulty: 'ง่าย',
    instructions: [
      'ยืนตรงถือดัมเบลข้างลำตัว งอข้อศอกเล็กน้อย',
      'ออกแรงจากหัวไหล่ยกดัมเบลขึ้นด้านข้าง จนแขนขนานกับพื้น',
      'ค่อยๆ ผ่อนดัมเบลลงมาที่ตำแหน่งเริ่มต้นช้าๆ อย่างควบคุม'
    ]
  },
  {
    id: 'ex12',
    name: 'Pull-Up (ดึงข้อ)',
    category: 'Back (หลัง)',
    description: 'โหนบาร์เดี่ยวและออกแรงดึงตัวขึ้น เพื่อพัฒนาความแข็งแกร่งของกล้ามเนื้อปีกหลัง ไหล่หลัง และกล้ามเนื้อต้นแขน',
    difficulty: 'ยาก',
    instructions: [
      'จับบาร์เดี่ยวด้วยความกว้างกว่าหัวไหล่เล็กน้อย หันฝ่ามือออกจากตัว',
      'เกร็งหน้าท้องและหลัง ออกแรงดึงลำตัวขึ้นไปจนคางพ้นขอบบาร์',
      'ค่อยๆ ผ่อนตัวลงมาอย่างช้าๆ จนสุดแขน'
    ]
  },
  {
    id: 'ex13',
    name: 'Dumbbell Row (ดัมเบล โรว์ แขนเดียว)',
    category: 'Back (หลัง)',
    description: 'ใช้เข่าและมือข้างหนึ่งค้ำเบาะ อีกมือถือดัมเบลดึงขึ้นข้างลำตัว เน้นกล้ามเนื้อหลังส่วนบนและปีกหลังทีละข้าง',
    difficulty: 'ง่าย',
    instructions: [
      'วางเข่าและมือข้างซ้ายลงบนเบาะราบ หลังตรงขนานกับพื้น',
      'ใช้มือขวาถือดัมเบลห้อยลงตรงๆ จากนั้นออกแรงดึงดัมเบลขึ้นหาเอว',
      'บีบกล้ามเนื้อหลังส่วนบนในจุดสูงสุด แล้วค่อยๆ ผ่อนดัมเบลลง'
    ]
  },
  {
    id: 'ex14',
    name: 'Leg Press (เลก เพรส)',
    category: 'Legs (ขา)',
    description: 'นั่งบนเครื่อง ออกแรงใช้ฝ่าเท้าดันแผ่นน้ำหนักขึ้นไป เพื่อบริหารกล้ามเนื้อต้นขาด้านหน้าและสะโพกอย่างปลอดภัย',
    difficulty: 'ง่าย',
    instructions: [
      'นั่งบนเบาะของเครื่องเลกเพรส วางฝ่าเท้ากว้างเท่าช่วงไหล่บนแผ่นดัน',
      'ปลดล็อกความปลอดภัย ค่อยๆ งอเข่าลดน้ำหนักลงมาจนเข่าทำมุม 90 องศา',
      'ออกแรงถีบฝ่าเท้าดันแผ่นน้ำหนักกลับขึ้นไป โดยไม่ล็อกเข่าสุด'
    ]
  },
  {
    id: 'ex15',
    name: 'Leg Extension (เลก เอ็กซ์เทนชัน)',
    category: 'Legs (ขา)',
    description: 'นั่งบนเครื่อง เตะขาขึ้นตรงไปด้านหน้าเพื่อเน้นการสร้างความคมชัดและพละกำลังของกล้ามเนื้อหน้าขา',
    difficulty: 'ง่าย',
    instructions: [
      'นั่งบนเครื่อง ปรับเบาะหลังให้กระชับ และให้เบาะนวมรองรับข้อเท้าพอดี',
      'จับที่จับด้านข้าง ออกแรงเกร็งหน้าขาส่งปลายเท้าเตะขึ้นจนขาตรง',
      'เกร็งค้างไว้เล็กน้อย ค่อยๆ ผ่อนขาลดลงสู่ท่าเริ่มต้น'
    ]
  },
  {
    id: 'ex16',
    name: 'Lying Leg Curl (เลก เคิร์ล นอน)',
    category: 'Legs (ขา)',
    description: 'นอนคว่ำบนเครื่อง ใช้หลังขาพับข้อเท้าเข้าหาบั้นท้าย เพื่อสร้างกล้ามเนื้อต้นขาด้านหลัง (Hamstrings)',
    difficulty: 'ง่าย',
    instructions: [
      'นอนคว่ำลงบนเครื่อง ปรับเบาะนวมให้อยู่บริเวณเหนือข้อเท้าเล็กน้อย',
      'จับคานจับแน่น ออกแรงพับขาขึ้นมาหาบั้นท้ายให้ได้มากที่สุด',
      'ต้านน้ำหนักค่อยๆ ผ่อนขากลับลงช้าๆ จนสุด'
    ]
  },
  {
    id: 'ex17',
    name: 'Cable Crossover (เคเบิล ครอสโอเวอร์)',
    category: 'Chest (อก)',
    description: 'ยืนตรงกลางเครื่องเคเบิลคู่ ดึงสายเคเบิลจากมุมสูงโค้งลงมาตัดกันด้านหน้า เพื่อบริหารอกส่วนล่างและร่องอก',
    difficulty: 'ปานกลาง',
    instructions: [
      'ยืนตรงกลาง ปรับเคเบิลให้อยู่ตำแหน่งสูง ถือที่จับแยกแขนออกก้าวไปข้างหน้าเล็กน้อย',
      'โน้มตัวไปข้างหน้าเล็กน้อย ค่อยๆ บีบมือทั้งสองข้างลงมาตัดกันที่หน้าท้องส่วนล่าง',
      'ค้างไว้เกร็งอก แล้วค่อยๆ กางแขนกลับขึ้นไปช้าๆ จนรู้สึกยืดอกสุด'
    ]
  },
  {
    id: 'ex18',
    name: 'Dumbbell Flyes (ดัมเบล ฟลาย)',
    category: 'Chest (อก)',
    description: 'นอนราบบนเบาะ กางแขนถือดัมเบลออกด้านข้างแล้วหุบเข้าหากันด้านบน เพื่อสร้างความกว้างและยืดหน้าอก',
    difficulty: 'ปานกลาง',
    instructions: [
      'นอนราบบนเบาะ ถือดัมเบลชี้ขึ้นตรงเหนือหน้าอก หันฝ่ามือเข้าหากัน',
      'ค่อยๆ กางแขนออกด้านข้างเป็นวงโค้ง งอศอกเล็กน้อยจนรู้สึกยืดหน้าอก',
      'ออกแรงบีบหน้าอกดึงดัมเบลกลับขึ้นไปที่ตำแหน่งเริ่มต้น'
    ]
  },
  {
    id: 'ex19',
    name: 'Hammer Curl (แฮมเมอร์ เคิร์ล)',
    category: 'Arms (แขน)',
    description: 'ถือดัมเบลโดยหันฝ่ามือเข้าหาลำตัว (จับแบบค้อน) แล้วยกขึ้น เพื่อสร้างความหนาของแขนท่อนล่างและหน้าแขนด้านนอก',
    difficulty: 'ง่าย',
    instructions: [
      'ยืนตรงถือดัมเบลสองข้างลำตัว หันฝ่ามือเข้าหากัน',
      'พับข้อศอกยกดัมเบลขึ้นโดยล็อกข้อมือตรงไม่บิด หันฝ่ามือเข้าหากันตลอดเวลา',
      'ยกขึ้นถึงระดับไหล่ เกร็งหน้าแขนแล้วค่อยๆ ลดลง'
    ]
  },
  {
    id: 'ex20',
    name: 'Skull Crusher (สกัล ครัชเชอร์)',
    category: 'Arms (แขน)',
    description: 'นอนราบบนเบาะ ถือบาร์หรือดัมเบลพับข้อศอกลดระดับลงหาหน้าผากเพื่อสร้างกล้ามเนื้อหลังแขน (Triceps) ส่วนหัวยาว',
    difficulty: 'ปานกลาง',
    instructions: [
      'นอนราบบนเบาะ ถือบาร์ EZ หรือดัมเบลเหยียดขึ้นตรงเหนือไหล่',
      'งอเฉพาะข้อศอกลดน้ำหนักลงมาช้าๆ จนเกือบแตะหน้าผาก (ต้นแขนต้องนิ่งตั้งฉาก)',
      'ออกแรงหลังแขนดันน้ำหนักกลับขึ้นไปสู่ท่าเริ่มต้น'
    ]
  },
  {
    id: 'ex21',
    name: 'Cable Face Pull (เฟส พูล)',
    category: 'Shoulders (ไหล่)',
    description: 'ดึงเชือกเคเบิลเข้าหาใบหน้าพร้อมกางศอกออก เพื่อเน้นสร้างกล้ามเนื้อไหล่หลัง (Rear Deltoid) และหลังส่วนบน',
    difficulty: 'ง่าย',
    instructions: [
      'ปรับสายเคเบิลระดับสายตา ใช้เชือกดึง ถอยหลังออกมาก้าวหนึ่งตัวตรง',
      'ออกแรงดึงเชือกเข้าหาหน้าผาก กางข้อศอกออกและบีบสะบักเข้าหากัน',
      'ผ่อนสายเคเบิลกลับไปด้านหน้าช้าๆ จนสุดแขน'
    ]
  },
  {
    id: 'ex22',
    name: 'Hanging Knee Raise (ห้อยตัวยกเข่า)',
    category: 'Core (แกนกลาง)',
    description: 'ห้อยตัวบนบาร์เดี่ยวเกร็งลำตัว แล้วยกเข่าขึ้นหาหน้าอก เพื่อบริหารกล้ามเนื้อหน้าท้องส่วนล่างและแกนกลางลำตัว',
    difficulty: 'ปานกลาง',
    instructions: [
      'ห้อยตัวบนบาร์เดี่ยว แขนเหยียดตรง เกร็งหัวไหล่และแกนกลางไว้เพื่อลดการแกว่งตัว',
      'ออกแรงจากหน้าท้องส่วนล่างยกเข่าทั้งสองข้างขึ้นมาหาอก ม้วนก้นกบเล็กน้อย',
      'ค่อยๆ ผ่อนขาลดลงช้าๆ สู่ตำแหน่งเริ่มต้นอย่างควบคุม'
    ]
  },
  {
    id: 'ex23',
    name: 'Russian Twist (รัสเซียน ทวิสต์)',
    category: 'Core (แกนกลาง)',
    description: 'นั่งชันเข่า เอนตัวไปหลังเล็กน้อย บิดลำตัวซ้ายขวาเพื่อบริหารกล้ามเนื้อหน้าท้องด้านข้าง (Obliques)',
    difficulty: 'ง่าย',
    instructions: [
      'นั่งบนพื้น ชันเข่าขึ้น ส้นเท้าแตะพื้น โน้มลำตัวไปด้านหลังเล็กน้อยทำมุม 45 องศา',
      'ประสานมือไว้ที่หน้าอก ออกแรงบิดแกนกลางหมุนหัวไหล่และลำตัวไปทางซ้ายและขวาสลับกัน',
      'พยายามเกร็งสะโพกให้นิ่งที่สุดขณะบิดลำตัว'
    ]
  },
  {
    id: 'ex24',
    name: 'Dumbbell Lunges (ดัมเบล ลันจ์)',
    category: 'Legs (ขา)',
    description: 'ถือดัมเบลสองข้าง ก้าวเท้าไปด้านหลังหรือด้านหน้าแล้วย่อเข่าลง เพื่อสร้างกำลังต้นขาด้านหน้า หลังขา และก้น',
    difficulty: 'ปานกลาง',
    instructions: [
      'ยืนตรงถือดัมเบลสองข้างลำตัว เท้ากว้างเท่าสะโพก',
      'ก้าวเท้าข้างหนึ่งไปข้างหน้ายาวๆ แล้วย่อตัวลงตรงๆ จนเข่าด้านหลังเกือบแตะพื้น',
      'หัวเข่าด้านหน้าไม่ควรยื่นเลยปลายเท้า ดันตัวด้วยส้นเท้าหน้ากลับมายืนตรงตามเดิม'
    ]
  },
  {
    id: 'ex25',
    name: 'Dumbbell Shoulder Press (ดัมเบล โชลเดอร์ เพรส)',
    category: 'Shoulders (ไหล่)',
    description: 'นั่งพิงเบาะตั้งตรง ดันดัมเบลจากระดับหูขึ้นเหนือศีรษะ เพื่อสร้างพละกำลังและความกว้างของกล้ามเนื้อไหล่โดยรวม',
    difficulty: 'ปานกลาง',
    instructions: [
      'นั่งพิงม้านั่งปรับตั้งฉาก ถือบาร์เบลหรือดัมเบลระดับหู ข้อศอกทำมุม 90 องศาหันฝ่ามือออกด้านหน้า',
      'ออกแรงจากไหล่ดันดัมเบลขึ้นตรงเหนือศีรษะจนสุดแขนโดยไม่ให้ดัมเบลกระทบกัน',
      'ค่อยๆ ผ่อนดัมเบลลงช้าๆ กลับมาสู่ระดับหู'
    ]
  }
];

// โปรแกรมออกกำลังกายเริ่มต้นภาษาไทย
const DEFAULT_ROUTINES = [
  {
    id: 'r1',
    name: 'Push Day (อก / ไหล่ / หลังแขน)',
    exercises: [
      { id: 'ex1', sets: 4, reps: 10, weight: 50 },
      { id: 'ex9', sets: 3, reps: 12, weight: 16 },
      { id: 'ex4', sets: 3, reps: 8, weight: 30 },
      { id: 'ex10', sets: 3, reps: 15, weight: 15 }
    ]
  },
  {
    id: 'r2',
    name: 'Pull Day (หลัง / หน้าแขน)',
    exercises: [
      { id: 'ex2', sets: 4, reps: 10, weight: 45 },
      { id: 'ex5', sets: 3, reps: 12, weight: 12 }
    ]
  },
  {
    id: 'r3',
    name: 'Leg Day (ขา / แกนกลางลำตัว)',
    exercises: [
      { id: 'ex3', sets: 4, reps: 8, weight: 60 },
      { id: 'ex7', sets: 3, reps: 10, weight: 40 },
      { id: 'ex6', sets: 3, reps: 60, weight: 0 } // น้ำหนัก 0 คือ บอดี้เวท / แพลงก์ใช้นับวิ
    ]
  }
];

// ประวัติจำลองสำหรับสร้างกราฟ (3 วันย้อนหลัง)
const DEFAULT_HISTORY = [
  {
    id: 'h1',
    routineName: 'Pull Day (หลัง / หน้าแขน)',
    date: '2026-05-17',
    durationSeconds: 2700, // 45 นาที
    totalVolume: 3240, // volume = sets * reps * weight
    exercises: [
      {
        id: 'ex2',
        name: 'Lat Pulldown (แลท พูลดาวน์)',
        sets: [
          { reps: 10, weight: 40, completed: true },
          { reps: 10, weight: 40, completed: true },
          { reps: 10, weight: 45, completed: true },
          { reps: 10, weight: 45, completed: true }
        ]
      },
      {
        id: 'ex5',
        name: 'Dumbbell Bicep Curl (ดัมเบล ไบเซป เคิร์ล)',
        sets: [
          { reps: 12, weight: 10, completed: true },
          { reps: 12, weight: 12, completed: true },
          { reps: 12, weight: 12, completed: true }
        ]
      }
    ]
  },
  {
    id: 'h2',
    routineName: 'Leg Day (ขา / แกนกลางลำตัว)',
    date: '2026-05-18',
    durationSeconds: 3200, // 53 นาที
    totalVolume: 5120,
    exercises: [
      {
        id: 'ex3',
        name: 'Barbell Squat (บาร์เบล สควอท)',
        sets: [
          { reps: 8, weight: 50, completed: true },
          { reps: 8, weight: 55, completed: true },
          { reps: 8, weight: 60, completed: true },
          { reps: 8, weight: 60, completed: true }
        ]
      },
      {
        id: 'ex7',
        name: 'Romanian Deadlift (โรมาเนียน เดดลิฟต์)',
        sets: [
          { reps: 10, weight: 40, completed: true },
          { reps: 10, weight: 40, completed: true },
          { reps: 10, weight: 40, completed: true }
        ]
      }
    ]
  },
  {
    id: 'h3',
    routineName: 'Push Day (อก / ไหล่ / หลังแขน)',
    date: '2026-05-19',
    durationSeconds: 3600, // 60 นาที
    totalVolume: 5850,
    exercises: [
      {
        id: 'ex1',
        name: 'Barbell Bench Press (บาร์เบล เบนช์เพรส)',
        sets: [
          { reps: 10, weight: 45, completed: true },
          { reps: 10, weight: 50, completed: true },
          { reps: 10, weight: 50, completed: true },
          { reps: 8, weight: 55, completed: true }
        ]
      },
      {
        id: 'ex9',
        name: 'Incline Dumbbell Press (ดัมเบล ดันเฉียงบน)',
        sets: [
          { reps: 12, weight: 14, completed: true },
          { reps: 12, weight: 16, completed: true },
          { reps: 12, weight: 16, completed: true }
        ]
      },
      {
        id: 'ex4',
        name: 'Overhead Press (โอเวอร์เฮด เพรส)',
        sets: [
          { reps: 8, weight: 25, completed: true },
          { reps: 8, weight: 30, completed: true },
          { reps: 8, weight: 30, completed: true }
        ]
      }
    ]
  }
];

// บันทึกอาหารวันนี้เริ่มต้น
const DEFAULT_NUTRITION = {
  '2026-05-20': {
    water: 4, // 4 แก้ว
    foods: [
      { id: 'f1', name: 'อกไก่ย่างเกลือ', calories: 250, protein: 45, carbs: 0, fat: 5, time: '08:30' },
      { id: 'f2', name: 'ข้าวกล้องสุก 2 ทัพพี', calories: 160, protein: 3, carbs: 35, fat: 1, time: '08:30' },
      { id: 'f3', name: 'เวย์โปรตีน 1 สกู๊ป', calories: 120, protein: 25, carbs: 3, fat: 1, time: '12:00' },
      { id: 'f4', name: 'กล้วยหอม 1 ลูก', calories: 100, protein: 1, carbs: 25, fat: 0, time: '15:00' }
    ]
  }
};

const DEFAULT_PROFILE = {
  name: 'นีโอ เรเซอร์',
  weight: 72,
  height: 178,
  activityLevel: 'Active (ออกกำลังกาย 3-5 วัน/สัปดาห์)',
  dailyCalories: 2400,
  dailyProtein: 144, // 2g ต่อ นน. ตัว
  dailyCarbs: 270,
  dailyFat: 80,
  waterGoal: 10 // 10 แก้ว
};

export const AppProvider = ({ children }) => {
  // 1. จัดการด้านสเตทสลับภาษา (TH/EN)
  const [language, setLanguage] = useState(() => {
    const local = localStorage.getItem('cp_coach_language');
    return local === 'en' ? 'en' : 'th';
  });

  // 2. จัดการด้านคีย์ Gemini API
  const [geminiApiKey, setGeminiApiKey] = useState(() => {
    return localStorage.getItem('cp_coach_gemini_key') || '';
  });

  // 1. จัดการด้านสเตทโปรไฟล์ทั้งหมดและรองรับการย้ายข้อมูลเดิม (Migration)
  const getInitialProfiles = () => {
    const localProfiles = localStorage.getItem('cp_coach_profiles');
    if (localProfiles) {
      try {
        const parsed = JSON.parse(localProfiles);
        return parsed.map(p => ({
          level: 1,
          xp: 0,
          chips: 100,
          cyberware: [],
          claimedQuests: {},
          ...p
        }));
      } catch (e) {
        console.error("Profiles parse error:", e);
      }
    }

    const localOldProfile = localStorage.getItem('cp_coach_profile');
    if (localOldProfile) {
      try {
        const oldProfile = JSON.parse(localOldProfile);
        return [{
          level: 1,
          xp: 0,
          chips: 100,
          cyberware: [],
          claimedQuests: {},
          ...oldProfile,
          id: 'p_default'
        }];
      } catch (e) {
        console.error("Old profile migration error:", e);
      }
    }

    return [
      {
        id: 'p_default',
        name: 'นีโอ เรเซอร์',
        weight: 72,
        height: 178,
        activityLevel: 'Active (ออกกำลังกาย 3-5 วัน/สัปดาห์)',
        dailyCalories: 2400,
        dailyProtein: 144,
        dailyCarbs: 270,
        dailyFat: 80,
        waterGoal: 10,
        level: 1,
        xp: 0,
        chips: 100,
        cyberware: [],
        claimedQuests: {}
      }
    ];
  };

  const [profiles, setProfiles] = useState(getInitialProfiles);
  const [activeProfileId, setActiveProfileId] = useState(() => {
    return localStorage.getItem('cp_coach_active_profile_id') || 'p_default';
  });

  const [lastLevelUp, setLastLevelUp] = useState(null);

  const activeProfile = profiles.find(p => p.id === activeProfileId) || profiles[0] || {
    id: 'p_default',
    name: 'นีโอ เรเซอร์',
    weight: 72,
    height: 178,
    activityLevel: 'Active (ออกกำลังกาย 3-5 วัน/สัปดาห์)',
    dailyCalories: 2400,
    dailyProtein: 144,
    dailyCarbs: 270,
    dailyFat: 80,
    waterGoal: 10,
    level: 1,
    xp: 0,
    chips: 100,
    cyberware: [],
    claimedQuests: {}
  };

  // แผนรองรับ Routines รายผู้ใช้
  const [routines, setRoutines] = useState(() => {
    const activeId = localStorage.getItem('cp_coach_active_profile_id') || 'p_default';
    const local = localStorage.getItem(`cp_coach_routines_${activeId}`);
    if (local) {
      const val = safeJsonParse(local, null);
      if (val) return val;
    }
    if (activeId === 'p_default') {
      const oldGlobal = localStorage.getItem('cp_coach_routines');
      if (oldGlobal) {
        const val = safeJsonParse(oldGlobal, null);
        if (val) return val;
      }
    }
    return DEFAULT_ROUTINES;
  });

  // แผนรองรับ History รายผู้ใช้
  const [history, setHistory] = useState(() => {
    const activeId = localStorage.getItem('cp_coach_active_profile_id') || 'p_default';
    const local = localStorage.getItem(`cp_coach_history_${activeId}`);
    if (local) {
      const val = safeJsonParse(local, null);
      if (val) return val;
    }
    if (activeId === 'p_default') {
      const oldGlobal = localStorage.getItem('cp_coach_history');
      if (oldGlobal) {
        const val = safeJsonParse(oldGlobal, null);
        if (val) return val;
      }
    }
    return DEFAULT_HISTORY;
  });

  // แผนรองรับ Nutrition รายผู้ใช้
  const [nutritionLog, setNutritionLog] = useState(() => {
    const activeId = localStorage.getItem('cp_coach_active_profile_id') || 'p_default';
    const local = localStorage.getItem(`cp_coach_nutrition_${activeId}`);
    if (local) {
      const val = safeJsonParse(local, null);
      if (val) return val;
    }
    if (activeId === 'p_default') {
      const oldGlobal = localStorage.getItem('cp_coach_nutrition');
      if (oldGlobal) {
        const val = safeJsonParse(oldGlobal, null);
        if (val) return val;
      }
    }
    return DEFAULT_NUTRITION;
  });

  // แผนรองรับ Exercises รายผู้ใช้
  const [exercises, setExercises] = useState(() => {
    const activeId = localStorage.getItem('cp_coach_active_profile_id') || 'p_default';
    const local = localStorage.getItem(`cp_coach_exercises_${activeId}`);
    if (local) {
      const val = safeJsonParse(local, null);
      if (val) return val;
    }
    if (activeId === 'p_default') {
      const oldGlobal = localStorage.getItem('cp_coach_exercises');
      if (oldGlobal) {
        const val = safeJsonParse(oldGlobal, null);
        if (val) return val;
      }
    }
    return DEFAULT_EXERCISES;
  });

  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // ฟังก์ชันช่วยเหลือสำหรับแปลภาษา (Translation helper)
  const t = (path, replacements = {}) => {
    return getTranslation(language, path, replacements);
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // โหลดข้อมูลทั้งหมดจาก Capacitor Preferences เมื่อเริ่มต้นแอปครั้งแรก (Restore from native Preferences)
  useEffect(() => {
    const loadAllFromPreferences = async () => {
      try {
        const langVal = await Preferences.get({ key: 'cp_coach_language' });
        if (langVal.value) setLanguage(langVal.value);

        const geminiVal = await Preferences.get({ key: 'cp_coach_gemini_key' });
        if (geminiVal.value) setGeminiApiKey(geminiVal.value);

        const profilesVal = await Preferences.get({ key: 'cp_coach_profiles' });
        let activeId = activeProfileId;
        if (profilesVal.value) {
          const parsedProfiles = safeJsonParse(profilesVal.value, null);
          if (parsedProfiles) {
            setProfiles(parsedProfiles);
          }
        }

        const activeIdVal = await Preferences.get({ key: 'cp_coach_active_profile_id' });
        if (activeIdVal.value) {
          activeId = activeIdVal.value;
          setActiveProfileId(activeId);
        }

        const routinesVal = await Preferences.get({ key: `cp_coach_routines_${activeId}` });
        if (routinesVal.value) setRoutines(safeJsonParse(routinesVal.value, DEFAULT_ROUTINES));

        const historyVal = await Preferences.get({ key: `cp_coach_history_${activeId}` });
        if (historyVal.value) setHistory(safeJsonParse(historyVal.value, DEFAULT_HISTORY));

        const nutritionVal = await Preferences.get({ key: `cp_coach_nutrition_${activeId}` });
        if (nutritionVal.value) setNutritionLog(safeJsonParse(nutritionVal.value, DEFAULT_NUTRITION));

        const exercisesVal = await Preferences.get({ key: `cp_coach_exercises_${activeId}` });
        if (exercisesVal.value) setExercises(safeJsonParse(exercisesVal.value, DEFAULT_EXERCISES));
      } catch (e) {
        console.warn("Capacitor preferences init load skipped or failed:", e);
      }
    };
    loadAllFromPreferences();
  }, []);

  // เซฟการสลับภาษาลง LocalStorage และ Preferences
  useEffect(() => {
    saveToStorage('cp_coach_language', language);
  }, [language]);

  // คอยซิงก์ Profiles และ Active ID ลงใน LocalStorage และ Preferences
  useEffect(() => {
    saveToStorage('cp_coach_profiles', JSON.stringify(profiles));
  }, [profiles]);

  useEffect(() => {
    saveToStorage('cp_coach_active_profile_id', activeProfileId);
  }, [activeProfileId]);

  // คอยซิงก์ข้อมูลรายอัตลักษณ์ลง LocalStorage และ Preferences เมื่อตัวแปรเปลี่ยน
  useEffect(() => {
    if (activeProfileId) {
      saveToStorage(`cp_coach_routines_${activeProfileId}`, JSON.stringify(routines));
    }
  }, [routines, activeProfileId]);

  useEffect(() => {
    if (activeProfileId) {
      saveToStorage(`cp_coach_history_${activeProfileId}`, JSON.stringify(history));
    }
  }, [history, activeProfileId]);

  useEffect(() => {
    if (activeProfileId) {
      saveToStorage(`cp_coach_nutrition_${activeProfileId}`, JSON.stringify(nutritionLog));
    }
  }, [nutritionLog, activeProfileId]);

  useEffect(() => {
    if (activeProfileId) {
      saveToStorage(`cp_coach_exercises_${activeProfileId}`, JSON.stringify(exercises));
    }
  }, [exercises, activeProfileId]);

  // คอยโหลดข้อมูลใหม่เมื่อกดสลับผู้ใช้ (Active ID เปลี่ยน)
  useEffect(() => {
    const suffix = activeProfileId;
    const localRoutines = localStorage.getItem(`cp_coach_routines_${suffix}`);
    setRoutines(safeJsonParse(localRoutines, DEFAULT_ROUTINES));

    const localHistory = localStorage.getItem(`cp_coach_history_${suffix}`);
    setHistory(safeJsonParse(localHistory, DEFAULT_HISTORY));

    const localNutrition = localStorage.getItem(`cp_coach_nutrition_${suffix}`);
    setNutritionLog(safeJsonParse(localNutrition, DEFAULT_NUTRITION));

    const localExercises = localStorage.getItem(`cp_coach_exercises_${suffix}`);
    setExercises(safeJsonParse(localExercises, DEFAULT_EXERCISES));
  }, [activeProfileId]);

  // บันทึกและลบคีย์ Gemini API
  const saveGeminiApiKey = (key) => {
    setGeminiApiKey(key);
    saveToStorage('cp_coach_gemini_key', key);
    showToast(t('profile.geminiKeySaved'), 'success');
  };

  const clearGeminiApiKey = () => {
    setGeminiApiKey('');
    localStorage.removeItem('cp_coach_gemini_key');
    Preferences.remove({ key: 'cp_coach_gemini_key' }).catch(() => {});
    showToast(t('profile.geminiKeyCleared'), 'success');
  };

  // ฟังก์ชันคำนวณวันฝึกต่อเนื่อง (Streak)
  const getStreakCount = () => {
    if (history.length === 0) return 0;
    const uniqueDates = [...new Set(history.map(item => item.date))].sort().reverse();
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (uniqueDates[0] !== todayStr && uniqueDates[0] !== yesterdayStr) {
      return 0;
    }

    let streak = 0;
    let checkDate = new Date();

    for (let i = 0; i < 30; i++) {
      const checkStr = checkDate.toISOString().split('T')[0];
      if (uniqueDates.includes(checkStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        if (i === 0 && checkStr === todayStr) {
          checkDate.setDate(checkDate.getDate() - 1);
          continue;
        }
        break;
      }
    }
    return streak;
  };

  const getTodayString = () => {
    return new Date().toISOString().split('T')[0];
  };

  // RPG State functions
  const gainXpAndChips = (xpAmount, chipsAmount) => {
    let levelUpOccurred = false;
    let newLvl = 1;
    
    setProfiles(prev => prev.map(p => {
      if (p.id === activeProfileId) {
        const currentLvl = p.level || 1;
        const currentXp = p.xp || 0;
        const currentChips = p.chips || 0;
        
        let tempXp = currentXp + xpAmount;
        let tempLvl = currentLvl;
        let xpNeeded = tempLvl * 100;
        
        while (tempXp >= xpNeeded) {
          tempXp -= xpNeeded;
          tempLvl++;
          xpNeeded = tempLvl * 100;
          levelUpOccurred = true;
        }
        
        newLvl = tempLvl;
        
        return {
          ...p,
          level: tempLvl,
          xp: tempXp,
          chips: currentChips + chipsAmount
        };
      }
      return p;
    }));

    if (levelUpOccurred) {
      setLastLevelUp({ level: newLvl });
    }
  };

  const buyCyberware = (cyberwareId, price, reqLevel) => {
    const lvl = activeProfile.level || 1;
    const chp = activeProfile.chips || 0;
    const cware = activeProfile.cyberware || [];
    
    if (lvl < reqLevel) {
      showToast(t('rpg.shopReqLevel', { lvl: reqLevel }), 'error');
      return false;
    }
    if (chp < price) {
      showToast(t('rpg.notEnoughChips'), 'error');
      return false;
    }
    if (cware.includes(cyberwareId)) {
      return false;
    }
    
    setProfiles(prev => prev.map(p => {
      if (p.id === activeProfileId) {
        const currentChips = p.chips || 0;
        const currentCyberware = p.cyberware || [];
        return {
          ...p,
          chips: currentChips - price,
          cyberware: [...currentCyberware, cyberwareId]
        };
      }
      return p;
    }));
    
    const itemName = t(`rpg.${cyberwareId}_title`) || cyberwareId;
    showToast(t('rpg.toastPurchased', { name: itemName }), 'success');
    return true;
  };

  const getDailyQuests = () => {
    const today = getTodayString();
    const todayData = nutritionLog[today] || { water: 0, foods: [] };
    const todayWater = todayData.water || 0;
    const todayWorkout = history.filter(log => log.date === today).length;
    const todayFoodCal = (todayData.foods || []).reduce((sum, f) => sum + (f.calories || 0), 0);
    const todayRoutines = routines.length;

    const claimed = activeProfile.claimedQuests?.[today] || [];

    return [
      {
        id: 'q_water',
        title: t('rpg.q_water_title'),
        desc: t('rpg.q_water_desc', { current: todayWater }),
        target: 8,
        current: todayWater,
        isCompleted: todayWater >= 8,
        isClaimed: claimed.includes('q_water'),
        xpReward: 100,
        chipsReward: 50
      },
      {
        id: 'q_workout',
        title: t('rpg.q_workout_title'),
        desc: t('rpg.q_workout_desc', { current: todayWorkout }),
        target: 1,
        current: todayWorkout,
        isCompleted: todayWorkout >= 1,
        isClaimed: claimed.includes('q_workout'),
        xpReward: 100,
        chipsReward: 50
      },
      {
        id: 'q_nutrition',
        title: t('rpg.q_nutrition_title'),
        desc: t('rpg.q_nutrition_desc', { current: todayFoodCal }),
        target: 1500,
        current: todayFoodCal,
        isCompleted: todayFoodCal >= 1500,
        isClaimed: claimed.includes('q_nutrition'),
        xpReward: 100,
        chipsReward: 50
      },
      {
        id: 'q_routine',
        title: t('rpg.q_routine_title'),
        desc: t('rpg.q_routine_desc', { current: todayRoutines }),
        target: 1,
        current: todayRoutines,
        isCompleted: todayRoutines >= 1,
        isClaimed: claimed.includes('q_routine'),
        xpReward: 100,
        chipsReward: 50
      }
    ];
  };

  const claimQuestReward = (questId) => {
    const quests = getDailyQuests();
    const quest = quests.find(q => q.id === questId);
    if (!quest || !quest.isCompleted || quest.isClaimed) return;
    
    const today = getTodayString();
    
    setProfiles(prev => prev.map(p => {
      if (p.id === activeProfileId) {
        const claimed = p.claimedQuests || {};
        const todayClaimed = claimed[today] || [];
        if (todayClaimed.includes(questId)) return p;
        return {
          ...p,
          claimedQuests: {
            ...claimed,
            [today]: [...todayClaimed, questId]
          }
        };
      }
      return p;
    }));
    
    const doubleXp = (activeProfile.cyberware || []).includes('sandevistan');
    const finalXp = doubleXp ? quest.xpReward * 2 : quest.xpReward;
    
    gainXpAndChips(finalXp, quest.chipsReward);
  };

  const addWorkoutLog = (log) => {
    setHistory(prev => [log, ...prev]);
    showToast(t('workout.toastSaved'), 'success');

    // RPG: Base reward for completing workout routine
    let totalXp = 50;
    let totalChips = 20;

    // Additional reward per exercise performed
    const exCount = log.exercises?.length || 0;
    if (exCount > 0) {
      const hasArms = (activeProfile.cyberware || []).includes('arms');
      const bonusXp = hasArms ? 10 : 0;
      totalXp += (25 + bonusXp) * exCount;
      totalChips += 10 * exCount;
    }

    gainXpAndChips(totalXp, totalChips);
  };

  const updateProfile = (profileData) => {
    setProfiles(prev => prev.map(p => p.id === activeProfileId ? { ...p, ...profileData } : p));
    showToast(t('profile.toastUpdated'), 'success');
  };

  const switchProfile = (profileId) => {
    const targetProfile = profiles.find(p => p.id === profileId);
    if (targetProfile) {
      setActiveProfileId(profileId);
      showToast(t('profile.switchSuccess', { name: targetProfile.name }), 'success');
    }
  };

  const createProfile = (profileData) => {
    const newId = 'p_' + Date.now();
    const newProfile = {
      id: newId,
      name: profileData.name || 'User ' + (profiles.length + 1),
      weight: Number(profileData.weight || 70),
      height: Number(profileData.height || 170),
      activityLevel: profileData.activityLevel || 'Active (ออกกำลังกาย 3-5 วัน/สัปดาห์)',
      dailyCalories: Number(profileData.dailyCalories || 2000),
      dailyProtein: Number(profileData.dailyProtein || 120),
      dailyCarbs: Number(profileData.dailyCarbs || 230),
      dailyFat: Number(profileData.dailyFat || 65),
      waterGoal: Number(profileData.waterGoal || 8),
      level: 1,
      xp: 0,
      chips: 100,
      cyberware: [],
      claimedQuests: {}
    };

    setProfiles(prev => [...prev, newProfile]);
    setActiveProfileId(newId);
    showToast(t('profile.createSuccess', { name: newProfile.name }), 'success');
    return newId;
  };

  const deleteProfile = (profileId) => {
    if (profiles.length <= 1) {
      showToast(language === 'en' ? 'Cannot delete the only profile' : 'ไม่สามารถลบโปรไฟล์สุดท้ายที่เหลืออยู่ได้', 'error');
      return;
    }

    localStorage.removeItem(`cp_coach_routines_${profileId}`);
    localStorage.removeItem(`cp_coach_history_${profileId}`);
    localStorage.removeItem(`cp_coach_nutrition_${profileId}`);
    localStorage.removeItem(`cp_coach_exercises_${profileId}`);

    const remaining = profiles.filter(p => p.id !== profileId);
    setProfiles(remaining);

    if (activeProfileId === profileId) {
      setActiveProfileId(remaining[0].id);
    }
    showToast(t('profile.deleteSuccess'), 'success');
  };

  const addRoutine = (routine) => {
    setRoutines(prev => [...prev, routine]);
    showToast(t('workout.toastAdded', { name: routine.name }), 'success');
  };

  const editRoutine = (id, updatedRoutine) => {
    setRoutines(prev => prev.map(r => r.id === id ? { ...r, ...updatedRoutine } : r));
    showToast(t('workout.toastEdited'), 'success');
  };

  const deleteRoutine = (id) => {
    setRoutines(prev => prev.filter(r => r.id !== id));
    showToast(t('workout.toastDeleted'), 'success');
  };

  const addFoodLog = (date, food, isScanned = false) => {
    setNutritionLog(prev => {
      const dayData = prev[date] || { water: 0, foods: [] };
      return {
        ...prev,
        [date]: {
          ...dayData,
          foods: [...dayData.foods, food]
        }
      };
    });
    showToast(t('nutrition.toastAdded', { name: food.name }), 'success');

    // RPG: Reward XP & Chips for logging food
    if (isScanned) {
      const hasKiroshi = (activeProfile.cyberware || []).includes('kiroshi');
      const bonusXp = hasKiroshi ? 5 : 0;
      gainXpAndChips(20 + bonusXp, 10);
    } else {
      gainXpAndChips(15, 5);
    }
  };

  const removeFoodLog = (date, id) => {
    setNutritionLog(prev => {
      const dayData = prev[date];
      if (!dayData) return prev;
      return {
        ...prev,
        [date]: {
          ...dayData,
          foods: dayData.foods.filter(f => f.id !== id)
        }
      };
    });
    showToast(t('nutrition.toastDeleted'), 'success');
  };

  const addWater = (date, amount) => {
    setNutritionLog(prev => {
      const dayData = prev[date] || { water: 0, foods: [] };
      const newWater = Math.max(0, dayData.water + amount);
      return {
        ...prev,
        [date]: {
          ...dayData,
          water: newWater
        }
      };
    });

    // RPG: Only reward if adding water
    if (amount > 0) {
      const hasArmor = (activeProfile.cyberware || []).includes('armor');
      const bonusXp = hasArmor ? 2 : 0;
      gainXpAndChips((5 + bonusXp) * amount, 2 * amount);
    }
  };

  const exportData = () => {
    const allData = {
      profiles,
      activeProfileId,
      userData: profiles.reduce((acc, p) => {
        const r = localStorage.getItem(`cp_coach_routines_${p.id}`);
        const h = localStorage.getItem(`cp_coach_history_${p.id}`);
        const n = localStorage.getItem(`cp_coach_nutrition_${p.id}`);
        const e = localStorage.getItem(`cp_coach_exercises_${p.id}`);
        acc[p.id] = {
          routines: safeJsonParse(r, []),
          history: safeJsonParse(h, []),
          nutritionLog: safeJsonParse(n, {}),
          exercises: safeJsonParse(e, [])
        };
        return acc;
      }, {})
    };

    const dataStr = JSON.stringify(allData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `cyber_coach_profiles_backup_${new Date().toISOString().split('T')[0]}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    showToast(t('profile.toastExported'), 'success');
  };

  const importData = (jsonData) => {
    try {
      const data = JSON.parse(jsonData);
      if (data.profiles && data.userData) {
        setProfiles(data.profiles);
        setActiveProfileId(data.activeProfileId || data.profiles[0].id);

        Object.keys(data.userData).forEach(pId => {
          const uData = data.userData[pId];
          if (uData.routines) saveToStorage(`cp_coach_routines_${pId}`, JSON.stringify(uData.routines));
          if (uData.history) saveToStorage(`cp_coach_history_${pId}`, JSON.stringify(uData.history));
          if (uData.nutritionLog) saveToStorage(`cp_coach_nutrition_${pId}`, JSON.stringify(uData.nutritionLog));
          if (uData.exercises) saveToStorage(`cp_coach_exercises_${pId}`, JSON.stringify(uData.exercises));
        });
      } else {
        // Legacy fallback
        const newProfiles = [{
          ...(data.userProfile || {
            name: 'นีโอ เรเซอร์',
            weight: 72,
            height: 178,
            activityLevel: 'Active (ออกกำลังกาย 3-5 วัน/สัปดาห์)',
            dailyCalories: 2400,
            dailyProtein: 144,
            dailyCarbs: 270,
            dailyFat: 80,
            waterGoal: 10
          }),
          id: 'p_default'
        }];
        setProfiles(newProfiles);
        setActiveProfileId('p_default');

        if (data.routines) saveToStorage(`cp_coach_routines_p_default`, JSON.stringify(data.routines));
        if (data.history) saveToStorage(`cp_coach_history_p_default`, JSON.stringify(data.history));
        if (data.nutritionLog) saveToStorage(`cp_coach_nutrition_p_default`, JSON.stringify(data.nutritionLog));
        if (data.exercises) saveToStorage(`cp_coach_exercises_p_default`, JSON.stringify(data.exercises));
      }

      // Force refresh active profile state reload
      setActiveProfileId(prev => prev);
      showToast(t('profile.toastImported'), 'success');
      return true;
    } catch (e) {
      showToast(t('profile.toastImportFailed'), 'error');
      return false;
    }
  };

  const resetData = () => {
    profiles.forEach(p => {
      localStorage.removeItem(`cp_coach_routines_${p.id}`);
      localStorage.removeItem(`cp_coach_history_${p.id}`);
      localStorage.removeItem(`cp_coach_nutrition_${p.id}`);
      localStorage.removeItem(`cp_coach_exercises_${p.id}`);
      Preferences.remove({ key: `cp_coach_routines_${p.id}` }).catch(() => {});
      Preferences.remove({ key: `cp_coach_history_${p.id}` }).catch(() => {});
      Preferences.remove({ key: `cp_coach_nutrition_${p.id}` }).catch(() => {});
      Preferences.remove({ key: `cp_coach_exercises_${p.id}` }).catch(() => {});
    });

    localStorage.removeItem('cp_coach_profile');
    localStorage.removeItem('cp_coach_routines');
    localStorage.removeItem('cp_coach_history');
    localStorage.removeItem('cp_coach_nutrition');
    localStorage.removeItem('cp_coach_exercises');

    Preferences.remove({ key: 'cp_coach_profile' }).catch(() => {});
    Preferences.remove({ key: 'cp_coach_routines' }).catch(() => {});
    Preferences.remove({ key: 'cp_coach_history' }).catch(() => {});
    Preferences.remove({ key: 'cp_coach_nutrition' }).catch(() => {});
    Preferences.remove({ key: 'cp_coach_exercises' }).catch(() => {});

    const defaultProfile = {
      id: 'p_default',
      name: 'นีโอ เรเซอร์',
      weight: 72,
      height: 178,
      activityLevel: 'Active (ออกกำลังกาย 3-5 วัน/สัปดาห์)',
      dailyCalories: 2400,
      dailyProtein: 144,
      dailyCarbs: 270,
      dailyFat: 80,
      waterGoal: 10,
      level: 1,
      xp: 0,
      chips: 100,
      cyberware: [],
      claimedQuests: {}
    };

    setProfiles([defaultProfile]);
    setActiveProfileId('p_default');
    showToast(t('profile.toastReset'), 'success');
  };

  return (
    <AppContext.Provider value={{
      language,
      setLanguage,
      geminiApiKey,
      saveGeminiApiKey,
      clearGeminiApiKey,
      t,
      userProfile: activeProfile,
      profiles,
      activeProfileId,
      switchProfile,
      createProfile,
      deleteProfile,
      routines,
      history,
      nutritionLog,
      exercises,
      toast,
      showToast,
      getStreakCount,
      getTodayString,
      addWorkoutLog,
      updateProfile,
      addRoutine,
      editRoutine,
      deleteRoutine,
      addFoodLog,
      removeFoodLog,
      addWater,
      exportData,
      importData,
      resetData,
      lastLevelUp,
      setLastLevelUp,
      gainXpAndChips,
      buyCyberware,
      claimQuestReward,
      getDailyQuests
    }}>
      {children}
      {toast && (
        <div className={`cyber-toast`}>
          <span style={{ color: toast.type === 'error' ? 'var(--color-magenta)' : 'var(--color-green)' }}>
            {toast.type === 'error' ? '⚡ ERROR:' : '⚡ SYSTEM:'}
          </span>
          <span>{toast.message}</span>
        </div>
      )}
    </AppContext.Provider>
  );
};
