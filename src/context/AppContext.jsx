import React, { createContext, useState, useEffect } from 'react';
import { getTranslation } from '../translations/locale';

export const AppContext = createContext();

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
        return JSON.parse(localProfiles);
      } catch (e) {
        console.error("Profiles parse error:", e);
      }
    }

    const localOldProfile = localStorage.getItem('cp_coach_profile');
    if (localOldProfile) {
      try {
        const oldProfile = JSON.parse(localOldProfile);
        return [{
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
        waterGoal: 10
      }
    ];
  };

  const [profiles, setProfiles] = useState(getInitialProfiles);
  const [activeProfileId, setActiveProfileId] = useState(() => {
    return localStorage.getItem('cp_coach_active_profile_id') || 'p_default';
  });

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
    waterGoal: 10
  };

  // แผนรองรับ Routines รายผู้ใช้
  const [routines, setRoutines] = useState(() => {
    const activeId = localStorage.getItem('cp_coach_active_profile_id') || 'p_default';
    const local = localStorage.getItem(`cp_coach_routines_${activeId}`);
    if (local) return JSON.parse(local);
    if (activeId === 'p_default') {
      const oldGlobal = localStorage.getItem('cp_coach_routines');
      if (oldGlobal) return JSON.parse(oldGlobal);
    }
    return DEFAULT_ROUTINES;
  });

  // แผนรองรับ History รายผู้ใช้
  const [history, setHistory] = useState(() => {
    const activeId = localStorage.getItem('cp_coach_active_profile_id') || 'p_default';
    const local = localStorage.getItem(`cp_coach_history_${activeId}`);
    if (local) return JSON.parse(local);
    if (activeId === 'p_default') {
      const oldGlobal = localStorage.getItem('cp_coach_history');
      if (oldGlobal) return JSON.parse(oldGlobal);
    }
    return DEFAULT_HISTORY;
  });

  // แผนรองรับ Nutrition รายผู้ใช้
  const [nutritionLog, setNutritionLog] = useState(() => {
    const activeId = localStorage.getItem('cp_coach_active_profile_id') || 'p_default';
    const local = localStorage.getItem(`cp_coach_nutrition_${activeId}`);
    if (local) return JSON.parse(local);
    if (activeId === 'p_default') {
      const oldGlobal = localStorage.getItem('cp_coach_nutrition');
      if (oldGlobal) return JSON.parse(oldGlobal);
    }
    return DEFAULT_NUTRITION;
  });

  // แผนรองรับ Exercises รายผู้ใช้
  const [exercises, setExercises] = useState(() => {
    const activeId = localStorage.getItem('cp_coach_active_profile_id') || 'p_default';
    const local = localStorage.getItem(`cp_coach_exercises_${activeId}`);
    if (local) return JSON.parse(local);
    if (activeId === 'p_default') {
      const oldGlobal = localStorage.getItem('cp_coach_exercises');
      if (oldGlobal) return JSON.parse(oldGlobal);
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

  // เซฟการสลับภาษาลง LocalStorage
  useEffect(() => {
    localStorage.setItem('cp_coach_language', language);
  }, [language]);

  // คอยซิงก์ Profiles และ Active ID ลงใน LocalStorage
  useEffect(() => {
    localStorage.setItem('cp_coach_profiles', JSON.stringify(profiles));
  }, [profiles]);

  useEffect(() => {
    localStorage.setItem('cp_coach_active_profile_id', activeProfileId);
  }, [activeProfileId]);

  // คอยซิงก์ข้อมูลรายอัตลักษณ์ลง LocalStorage เมื่อตัวแปรเปลี่ยน
  useEffect(() => {
    if (activeProfileId) {
      localStorage.setItem(`cp_coach_routines_${activeProfileId}`, JSON.stringify(routines));
    }
  }, [routines, activeProfileId]);

  useEffect(() => {
    if (activeProfileId) {
      localStorage.setItem(`cp_coach_history_${activeProfileId}`, JSON.stringify(history));
    }
  }, [history, activeProfileId]);

  useEffect(() => {
    if (activeProfileId) {
      localStorage.setItem(`cp_coach_nutrition_${activeProfileId}`, JSON.stringify(nutritionLog));
    }
  }, [nutritionLog, activeProfileId]);

  useEffect(() => {
    if (activeProfileId) {
      localStorage.setItem(`cp_coach_exercises_${activeProfileId}`, JSON.stringify(exercises));
    }
  }, [exercises, activeProfileId]);

  // คอยโหลดข้อมูลใหม่เมื่อกดสลับผู้ใช้ (Active ID เปลี่ยน)
  useEffect(() => {
    const suffix = activeProfileId;
    const localRoutines = localStorage.getItem(`cp_coach_routines_${suffix}`);
    setRoutines(localRoutines ? JSON.parse(localRoutines) : DEFAULT_ROUTINES);

    const localHistory = localStorage.getItem(`cp_coach_history_${suffix}`);
    setHistory(localHistory ? JSON.parse(localHistory) : DEFAULT_HISTORY);

    const localNutrition = localStorage.getItem(`cp_coach_nutrition_${suffix}`);
    setNutritionLog(localNutrition ? JSON.parse(localNutrition) : DEFAULT_NUTRITION);

    const localExercises = localStorage.getItem(`cp_coach_exercises_${suffix}`);
    setExercises(localExercises ? JSON.parse(localExercises) : DEFAULT_EXERCISES);
  }, [activeProfileId]);

  // บันทึกและลบคีย์ Gemini API
  const saveGeminiApiKey = (key) => {
    setGeminiApiKey(key);
    localStorage.setItem('cp_coach_gemini_key', key);
    showToast(t('profile.geminiKeySaved'), 'success');
  };

  const clearGeminiApiKey = () => {
    setGeminiApiKey('');
    localStorage.removeItem('cp_coach_gemini_key');
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

  const addWorkoutLog = (log) => {
    setHistory(prev => [log, ...prev]);
    showToast(t('workout.toastSaved'), 'success');
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
      waterGoal: Number(profileData.waterGoal || 8)
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

    // Clean up local storage data for this user ID
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

  const addFoodLog = (date, food) => {
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
          routines: r ? JSON.parse(r) : [],
          history: h ? JSON.parse(h) : [],
          nutritionLog: n ? JSON.parse(n) : {},
          exercises: e ? JSON.parse(e) : []
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
          if (uData.routines) localStorage.setItem(`cp_coach_routines_${pId}`, JSON.stringify(uData.routines));
          if (uData.history) localStorage.setItem(`cp_coach_history_${pId}`, JSON.stringify(uData.history));
          if (uData.nutritionLog) localStorage.setItem(`cp_coach_nutrition_${pId}`, JSON.stringify(uData.nutritionLog));
          if (uData.exercises) localStorage.setItem(`cp_coach_exercises_${pId}`, JSON.stringify(uData.exercises));
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

        if (data.routines) localStorage.setItem(`cp_coach_routines_p_default`, JSON.stringify(data.routines));
        if (data.history) localStorage.setItem(`cp_coach_history_p_default`, JSON.stringify(data.history));
        if (data.nutritionLog) localStorage.setItem(`cp_coach_nutrition_p_default`, JSON.stringify(data.nutritionLog));
        if (data.exercises) localStorage.setItem(`cp_coach_exercises_p_default`, JSON.stringify(data.exercises));
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
    });

    localStorage.removeItem('cp_coach_profile');
    localStorage.removeItem('cp_coach_routines');
    localStorage.removeItem('cp_coach_history');
    localStorage.removeItem('cp_coach_nutrition');
    localStorage.removeItem('cp_coach_exercises');

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
      waterGoal: 10
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
      resetData
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
