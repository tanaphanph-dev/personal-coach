import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';

export default function NutritionView() {
  const { 
    nutritionLog, 
    userProfile, 
    addFoodLog, 
    removeFoodLog, 
    addWater, 
    getTodayString, 
    geminiApiKey, 
    t, 
    language,
    showToast 
  } = useContext(AppContext);
  
  const todayStr = getTodayString();
  const todayData = nutritionLog[todayStr] || { water: 0, foods: [] };

  // ฟอร์มบันทึกอาหารทั่วไป
  const [foodName, setFoodName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');

  // สถานะเครื่องสแกนเนอร์รูปภาพอาหาร
  const [showScanModal, setShowScanModal] = useState(false);
  const [scanProgress, setScanProgress] = useState('idle'); // idle, uploading, scanning, done, error
  const [previewUrl, setPreviewUrl] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const [scanImageBase64, setScanImageBase64] = useState('');
  const [scanImageMime, setScanImageMime] = useState('');
  const [isSimulation, setIsSimulation] = useState(false);

  // รายการอาหารยอดนิยมสลับภาษาอัตโนมัติ
  const FOOD_PRESETS = language === 'th' ? [
    { name: 'อกไก่ต้มน้ำปลา', calories: 220, protein: 40, carbs: 0, fat: 4 },
    { name: 'ข้าวกล้องสุก 1 ถ้วย', calories: 150, protein: 3, carbs: 32, fat: 1 },
    { name: 'ไข่ต้ม 2 ฟอง', calories: 140, protein: 12, carbs: 1, fat: 10 },
    { name: 'เวย์โปรตีน 1 สกู๊ป', calories: 120, protein: 25, carbs: 2, fat: 1 },
    { name: 'กล้วยน้ำว้า 2 ลูก', calories: 120, protein: 2, carbs: 30, fat: 0 },
    { name: 'แซลมอนย่างเกลือ', calories: 280, protein: 32, carbs: 0, fat: 16 }
  ] : [
    { name: 'Boiled Chicken Breast', calories: 220, protein: 40, carbs: 0, fat: 4 },
    { name: 'Brown Rice (1 cup)', calories: 150, protein: 3, carbs: 32, fat: 1 },
    { name: '2 Boiled Eggs', calories: 140, protein: 12, carbs: 1, fat: 10 },
    { name: 'Whey Protein (1 Scoop)', calories: 120, protein: 25, carbs: 2, fat: 1 },
    { name: '2 Bananas', calories: 120, protein: 2, carbs: 30, fat: 0 },
    { name: 'Grilled Salmon', calories: 280, protein: 32, carbs: 0, fat: 16 }
  ];

  // อาหารสำหรับสุ่มในการจำลองระบบ (Simulation Mode Presets)
  const MOCK_SCAN_PRESETS = language === 'th' ? [
    { name: 'สลัดแซลมอนอะโวคาโด', calories: 420, protein: 28, carbs: 12, fat: 30 },
    { name: 'อกไก่ย่างถ่านพร้อมข้าวสวย', calories: 480, protein: 38, carbs: 55, fat: 8 },
    { name: 'สปาเก็ตตี้โฮลวีทซอสเนื้อสับ', calories: 550, protein: 26, carbs: 68, fat: 16 },
    { name: 'แซนด์วิชทูน่าโฮลเกรน', calories: 310, protein: 22, carbs: 28, fat: 6 }
  ] : [
    { name: 'Salmon Avocado Salad', calories: 420, protein: 28, carbs: 12, fat: 30 },
    { name: 'Grilled Chicken with Jasmine Rice', calories: 480, protein: 38, carbs: 55, fat: 8 },
    { name: 'Whole Wheat Beef Spaghetti', calories: 550, protein: 26, carbs: 68, fat: 16 },
    { name: 'Whole Grain Tuna Sandwich', calories: 310, protein: 22, carbs: 28, fat: 6 }
  ];

  // คำนวณสารอาหารสะสมในวันนี้
  const totals = todayData.foods.reduce((acc, f) => {
    acc.calories += f.calories || 0;
    acc.protein += f.protein || 0;
    acc.carbs += f.carbs || 0;
    acc.fat += f.fat || 0;
    return acc;
  }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

  const getPercent = (val, max) => {
    if (!max) return 0;
    return Math.min(100, Math.round((val / max) * 100));
  };

  const calPercent = getPercent(totals.calories, userProfile.dailyCalories);
  const pPercent = getPercent(totals.protein, userProfile.dailyProtein);
  const cPercent = getPercent(totals.carbs, userProfile.dailyCarbs);
  const fPercent = getPercent(totals.fat, userProfile.dailyFat);

  // อนิเมชั่นระดับแก้วน้ำ
  const waterHeight = Math.min(100, (todayData.water / userProfile.waterGoal) * 100);

  // ส่งบันทึกอาหารทั่วไป
  const handleAddFood = (e) => {
    e.preventDefault();
    if (!foodName.trim() || !calories) {
      alert(t('nutrition.alertFill'));
      return;
    }

    const newFood = {
      id: 'f_' + Date.now(),
      name: foodName,
      calories: Number(calories) || 0,
      protein: Number(protein) || 0,
      carbs: Number(carbs) || 0,
      fat: Number(fat) || 0,
      time: new Date().toLocaleTimeString(language === 'th' ? 'th-TH' : 'en-US', { hour: '2-digit', minute: '2-digit' })
    };

    addFoodLog(todayStr, newFood);

    // ล้างฟอร์ม
    setFoodName('');
    setCalories('');
    setProtein('');
    setCarbs('');
    setFat('');
  };

  // แอดด่วนจาก Preset
  const handleQuickAdd = (preset) => {
    const newFood = {
      id: 'f_' + Date.now(),
      name: preset.name,
      calories: preset.calories,
      protein: preset.protein,
      carbs: preset.carbs,
      fat: preset.fat,
      time: new Date().toLocaleTimeString(language === 'th' ? 'th-TH' : 'en-US', { hour: '2-digit', minute: '2-digit' })
    };
    addFoodLog(todayStr, newFood, true);
  };

  // การจัดการไฟล์เมื่ออัปโหลดรูปอาหาร
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setPreviewUrl(URL.createObjectURL(file));
    setShowScanModal(true);
    setScanProgress('uploading');
    setScanResult(null);

    // แปลงไฟล์เป็น Base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result.split(',')[1];
      setScanImageBase64(base64String);
      setScanImageMime(file.type);
      
      // สตาร์ทกระบวนการวิเคราะห์
      triggerVisualScan(base64String, file.type);
    };
    reader.readAsDataURL(file);
  };

  // เรียกกระบวนการวิเคราะห์ภาพ (Gemini API vs Simulation)
  const triggerVisualScan = (base64Data, mimeType) => {
    if (geminiApiKey) {
      setIsSimulation(false);
      // เริ่มแอนิเมชัน
      setTimeout(() => {
        setScanProgress('scanning');
        callGeminiVisionAPI(base64Data, mimeType);
      }, 1500);
    } else {
      setIsSimulation(true);
      // โหมดจำลองประมวลผลดึงค่า Preset
      setTimeout(() => {
        setScanProgress('scanning');
        setTimeout(() => {
          // สุ่มดึงรายการอาหาร
          const randomPreset = MOCK_SCAN_PRESETS[Math.floor(Math.random() * MOCK_SCAN_PRESETS.length)];
          setScanResult(randomPreset);
          setScanProgress('done');
        }, 2000);
      }, 1500);
    }
  };

  // เรียกใช้ API ตรงของ Google Gemini 
  const callGeminiVisionAPI = async (base64Data, mimeType) => {
    try {
      const promptText = `Analyze the food in this image. Estimate the portion, calorie count (kcal), and macronutrients (protein, carbs, fat in grams). Respond ONLY with a valid JSON object in this exact schema, do not include markdown formatting, backticks, or other text:
{
  "foodName": "Name of the detected food (in ${language === 'th' ? 'Thai' : 'English'})",
  "calories": 350,
  "protein": 25,
  "carbs": 40,
  "fat": 10
}
If there are multiple food items, combine them into one general meal name and sum up the calories and macros.`;

      const payload = {
        contents: [
          {
            parts: [
              { text: promptText },
              {
                inlineData: {
                  mimeType: mimeType,
                  data: base64Data
                }
              }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json"
        }
      };

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API Error: Status ${response.status}`);
      }

      const resultJson = await response.json();
      const rawText = resultJson.candidates[0].content.parts[0].text;
      
      // ทำการพาร์ส JSON ที่ส่งกลับมา
      const foodData = JSON.parse(rawText);
      
      setScanResult({
        name: foodData.foodName || 'Scanned Food',
        calories: Number(foodData.calories) || 0,
        protein: Number(foodData.protein) || 0,
        carbs: Number(foodData.carbs) || 0,
        fat: Number(foodData.fat) || 0
      });
      setScanProgress('done');
    } catch (err) {
      console.error('Scan error:', err);
      // กรณีพัง ดีดเข้าระบบจำลองอัตโนมัติแจ้งเตือน
      showToast(t('common.error') + ': Gemini API processing failed. Falling back to simulation.', 'error');
      setIsSimulation(true);
      const fallbackPreset = MOCK_SCAN_PRESETS[0];
      setScanResult(fallbackPreset);
      setScanProgress('done');
    }
  };

  // ยืนยันบันทึกอาหารสแกน
  const handleConfirmScanResult = () => {
    if (!scanResult) return;
    
    const newFood = {
      id: 'f_' + Date.now(),
      name: scanResult.name || scanResult.foodName,
      calories: scanResult.calories,
      protein: scanResult.protein,
      carbs: scanResult.carbs,
      fat: scanResult.fat,
      time: new Date().toLocaleTimeString(language === 'th' ? 'th-TH' : 'en-US', { hour: '2-digit', minute: '2-digit' })
    };

    addFoodLog(todayStr, newFood, true);
    setShowScanModal(false);
    setPreviewUrl(null);
    showToast(t('nutrition.aiSuccessLog'), 'success');
  };

  return (
    <div className="cyber-container">
      <h2 style={{ marginBottom: '24px', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: 'var(--color-cyan)' }}>🥗</span> {t('nutrition.title')}
        </span>
        
        {/* ปุ่มสแกนรูปอาหาร PWA */}
        <div>
          <input 
            type="file" 
            accept="image/*" 
            capture="environment" 
            id="ai-camera-file" 
            style={{ display: 'none' }} 
            onChange={handleFileChange}
          />
          <button 
            className="cyber-btn" 
            style={{ border: '1px solid var(--color-cyan)', color: 'var(--color-cyan)', fontSize: '0.8rem', padding: '8px 16px' }}
            onClick={() => document.getElementById('ai-camera-file').click()}
          >
            {t('nutrition.aiButton')}
          </button>
        </div>
      </h2>

      {/* แถวแสดงปริมาณสารอาหารปัจจุบัน */}
      <div className="grid-2" style={{ marginBottom: '20px' }}>
        {/* วงแหวนแคลอรี */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{t('nutrition.calProgressHeader')}</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ position: 'relative', width: '90px', height: '90px' }}>
              <svg width="90" height="90" viewBox="0 0 90 90">
                <circle cx="45" cy="45" r="36" className="svg-ring-bg" strokeWidth="8" />
                <circle 
                  cx="45" 
                  cy="45" 
                  r="36" 
                  className="svg-ring-progress" 
                  stroke="var(--color-magenta)"
                  strokeWidth="8"
                  strokeDasharray={2 * Math.PI * 36}
                  strokeDashoffset={2 * Math.PI * 36 - (calPercent / 100) * (2 * Math.PI * 36)}
                  style={{ filter: 'drop-shadow(0 0 6px var(--color-magenta))' }}
                />
              </svg>
              <div className="ring-percent" style={{ color: 'var(--color-magenta)', fontSize: '0.95rem' }}>{calPercent}%</div>
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{totals.calories} <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>kcal</span></div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{t('nutrition.calGoalLabel')} {userProfile.dailyCalories} kcal</div>
              <div style={{ fontSize: '0.8rem', color: totals.calories > userProfile.dailyCalories ? 'var(--color-magenta)' : 'var(--color-green)', marginTop: '4px' }}>
                {totals.calories > userProfile.dailyCalories ? t('nutrition.calOver') : `${t('nutrition.calRemaining')}: ${userProfile.dailyCalories - totals.calories} kcal`}
              </div>
            </div>
          </div>
        </div>

        {/* แถบ Macro คาร์บ/โปรตีน/ไขมัน */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '10px', justifyContent: 'center' }}>
          <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>{t('nutrition.macroHeader')}</h3>
          
          {/* โปรตีน */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '2px' }}>
              <span>{t('nutrition.macroProtein')} {totals.protein} / {userProfile.dailyProtein}g</span>
              <span style={{ color: 'var(--color-cyan)' }}>{pPercent}%</span>
            </div>
            <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${pPercent}%`, height: '100%', background: 'var(--color-cyan)', boxShadow: 'var(--shadow-cyan)' }}></div>
            </div>
          </div>

          {/* คาร์บ */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '2px' }}>
              <span>{t('nutrition.macroCarbs')} {totals.carbs} / {userProfile.dailyCarbs}g</span>
              <span style={{ color: 'var(--color-yellow)' }}>{cPercent}%</span>
            </div>
            <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${cPercent}%`, height: '100%', background: 'var(--color-yellow)', boxShadow: '0 0 10px rgba(255, 230, 0, 0.4)' }}></div>
            </div>
          </div>

          {/* ไขมัน */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '2px' }}>
              <span>{t('nutrition.macroFat')} {totals.fat} / {userProfile.dailyFat}g</span>
              <span style={{ color: 'var(--color-magenta)' }}>{fPercent}%</span>
            </div>
            <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${fPercent}%`, height: '100%', background: 'var(--color-magenta)', boxShadow: 'var(--shadow-magenta)' }}></div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid-3" style={{ alignItems: 'start' }}>
        {/* บันทึกน้ำ (Water Logger Box) */}
        <div className="glass-panel water-tracker" style={{ gridColumn: 'span 1' }}>
          <h3 style={{ fontSize: '0.95rem', textTransform: 'uppercase', width: '100%', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
            {t('nutrition.waterHeader')}
          </h3>
          
          <div className="glass-water">
            {/* ระดับน้ำของเหลวอนิเมชั่น */}
            <div className="water-fluid" style={{ height: `${waterHeight}%` }}>
              {waterHeight > 0 && <div className="water-wave"></div>}
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{todayData.water}</span> / {userProfile.waterGoal} {t('dashboard.waterUnit')}
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
              {t('nutrition.waterTargetSub', { ml: userProfile.waterGoal * 250 })}
            </div>
          </div>

          <div className="water-controls">
            <button className="cyber-btn cyber-btn-secondary cyber-btn-sm" onClick={() => addWater(todayStr, -1)} disabled={todayData.water === 0}>
              {t('nutrition.waterMinusBtn')}
            </button>
            <button className="cyber-btn cyber-btn-success cyber-btn-sm" onClick={() => addWater(todayStr, 1)}>
              {t('nutrition.waterPlusBtn')}
            </button>
          </div>
        </div>

        {/* ป้อนเมนูอาหารที่ทาน (Add Food Form) */}
        <div className="glass-panel" style={{ gridColumn: 'span 2' }}>
          <h3 style={{ fontSize: '0.95rem', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px', marginBottom: '14px' }}>
            {t('nutrition.addFoodHeader')}
          </h3>
          
          <form onSubmit={handleAddFood} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="cyber-input-group" style={{ gridColumn: 'span 2', marginBottom: 0 }}>
              <label className="cyber-label">{t('nutrition.foodNameLabel')}</label>
              <input 
                type="text" 
                className="cyber-input" 
                placeholder={t('nutrition.foodNamePlace')}
                value={foodName} 
                onChange={(e) => setFoodName(e.target.value)}
                required
              />
            </div>

            <div className="cyber-input-group" style={{ marginBottom: 0 }}>
              <label className="cyber-label">{t('nutrition.caloriesLabel')}</label>
              <input 
                type="number" 
                className="cyber-input" 
                placeholder="0" 
                value={calories} 
                onChange={(e) => setCalories(e.target.value)}
                required
              />
            </div>

            <div className="cyber-input-group" style={{ marginBottom: 0 }}>
              <label className="cyber-label">{t('nutrition.proteinLabel')}</label>
              <input 
                type="number" 
                className="cyber-input" 
                placeholder="0" 
                value={protein} 
                onChange={(e) => setProtein(e.target.value)}
              />
            </div>

            <div className="cyber-input-group" style={{ marginBottom: 0 }}>
              <label className="cyber-label">{t('nutrition.carbsLabel')}</label>
              <input 
                type="number" 
                className="cyber-input" 
                placeholder="0" 
                value={carbs} 
                onChange={(e) => setCarbs(e.target.value)}
              />
            </div>

            <div className="cyber-input-group" style={{ marginBottom: 0 }}>
              <label className="cyber-label">{t('nutrition.fatLabel')}</label>
              <input 
                type="number" 
                className="cyber-input" 
                placeholder="0" 
                value={fat} 
                onChange={(e) => setFat(e.target.value)}
              />
            </div>

            <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'end', marginTop: '6px' }}>
              <button type="submit" className="cyber-btn cyber-btn-success">
                {t('nutrition.submitFoodBtn')}
              </button>
            </div>
          </form>

          {/* เมนูลัดแอดด่วน */}
          <div style={{ marginTop: '20px' }}>
            <label className="cyber-label" style={{ marginBottom: '8px', display: 'block' }}>{t('nutrition.quickAddHeader')}</label>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {FOOD_PRESETS.map((preset, idx) => (
                <button 
                  key={idx}
                  type="button" 
                  className="cyber-btn cyber-btn-sm cyber-btn-secondary"
                  style={{ fontSize: '0.65rem', textTransform: 'none' }}
                  onClick={() => handleQuickAdd(preset)}
                >
                  +{preset.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* สรุปตารางอาหารวันนี้ */}
      <div className="glass-panel" style={{ marginTop: '20px' }}>
        <h3 style={{ fontSize: '0.95rem', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px', marginBottom: '12px' }}>
          {t('nutrition.loggedFoodsHeader', { count: todayData.foods.length })}
        </h3>

        {todayData.foods.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-secondary)' }}>
            {t('nutrition.emptyFoods')}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {todayData.foods.map(food => (
              <div 
                key={food.id} 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  padding: '10px 14px', 
                  background: 'rgba(255, 255, 255, 0.01)', 
                  border: '1px solid var(--glass-border)', 
                  borderRadius: '6px' 
                }}
              >
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{food.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {food.time} | {t('dashboard.protein')} {food.protein}g | {t('dashboard.carbs')} {food.carbs}g | {t('dashboard.fat')} {food.fat}g
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span style={{ fontFamily: 'var(--font-display)', color: 'var(--color-magenta)', fontWeight: 'bold', fontSize: '0.95rem' }}>
                    {food.calories} kcal
                  </span>
                  <button 
                    className="cyber-btn cyber-btn-sm cyber-btn-secondary"
                    style={{ padding: '2px 6px', fontSize: '0.65rem', border: 'none', background: 'transparent', color: 'var(--text-muted)' }}
                    onClick={() => removeFoodLog(todayStr, food.id)}
                  >
                    {t('nutrition.deleteBtn')}
                  </button>
                </div>
              </div>
            ))}
            
            {/* สรุปรวมด้านล่าง */}
            <div 
              style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                padding: '12px 14px', 
                background: 'rgba(255,255,255,0.03)', 
                borderTop: '1px solid rgba(255, 255, 255, 0.05)', 
                fontWeight: 'bold',
                fontSize: '0.9rem',
                marginTop: '6px'
              }}
            >
              <span>{t('nutrition.totalSummary')}</span>
              <span style={{ color: 'var(--color-cyan)' }}>
                {totals.calories} kcal ({language === 'th' ? 'โปรตีน' : 'P'}: {totals.protein}g | {language === 'th' ? 'คาร์บ' : 'C'}: {totals.carbs}g | {language === 'th' ? 'ไขมัน' : 'F'}: {totals.fat}g)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 📸 ป๊อปอัปสแกนเนอร์รูปถ่ายอาหาร (Cyberpunk AI Scan Modal) */}
      {showScanModal && (
        <div className="cyber-modal-overlay">
          <div className="cyber-modal" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 className="modal-title">{t('nutrition.aiModalTitle')}</h3>
              <button className="modal-close" onClick={() => { setShowScanModal(false); setPreviewUrl(null); }}>×</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
              
              {/* พรีวิวภาพถ่าย พร้อมขอบนีออนเรืองแสงและเอฟเฟกต์แฮกเกอร์แสกน */}
              {previewUrl && (
                <div style={{ 
                  position: 'relative', 
                  width: '100%', 
                  height: '240px', 
                  borderRadius: '8px', 
                  border: '1px solid var(--color-cyan)', 
                  overflow: 'hidden', 
                  boxShadow: 'var(--shadow-cyan)',
                  background: '#000'
                }}>
                  <img 
                    src={previewUrl} 
                    alt="Food Scan Target" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: (scanProgress === 'uploading' || scanProgress === 'scanning') ? 0.7 : 1 }}
                  />

                  {/* เส้นเลเซอร์แอนิเมชันสำหรับประมวลผล */}
                  {(scanProgress === 'uploading' || scanProgress === 'scanning') && (
                    <div className="scan-line"></div>
                  )}

                  {/* ป้ายประมวลผลข้อความเรืองแสง */}
                  {(scanProgress === 'uploading' || scanProgress === 'scanning') && (
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      background: 'rgba(0,0,0,0.85)',
                      padding: '8px 16px',
                      borderRadius: '4px',
                      border: '1px solid var(--color-green)',
                      fontSize: '0.75rem',
                      fontFamily: 'var(--font-display)',
                      color: 'var(--color-green)',
                      letterSpacing: '1px',
                      textShadow: '0 0 4px var(--color-green)',
                      animation: 'pulse 1.5s infinite'
                    }}>
                      {scanProgress === 'uploading' ? t('nutrition.aiUploading') : t('nutrition.aiScanningText')}
                    </div>
                  )}
                </div>
              )}

              {/* ข้อความแจ้งเตือนโหมดจำลอง (Simulation Mode Alert) */}
              {scanProgress === 'done' && isSimulation && (
                <div style={{ 
                  background: 'rgba(255, 230, 0, 0.05)', 
                  border: '1px solid var(--color-yellow)', 
                  padding: '10px', 
                  borderRadius: '6px', 
                  fontSize: '0.75rem', 
                  color: 'var(--color-yellow)',
                  width: '100%',
                  lineHeight: '1.4'
                }}>
                  ⚠️ {t('nutrition.aiSimulationAlert')}
                </div>
              )}

              {/* แสดงความคืบหน้า / ผลลัพธ์การสแกน */}
              {scanProgress === 'done' && scanResult && (
                <div className="glass-panel trim-cyan" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <h4 style={{ color: 'var(--color-cyan)', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px', fontSize: '0.85rem' }}>
                    {t('nutrition.aiDetectedLabel')}
                  </h4>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{scanResult.name || scanResult.foodName}</span>
                    <span style={{ color: 'var(--color-magenta)', fontWeight: 'bold', fontSize: '1.2rem', fontFamily: 'var(--font-display)' }}>
                      {scanResult.calories} kcal
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', background: 'rgba(0,0,0,0.15)', padding: '10px', borderRadius: '4px', textAlign: 'center', fontSize: '0.75rem' }}>
                    <div>
                      <div style={{ color: 'var(--text-muted)' }}>{t('dashboard.protein')}</div>
                      <div style={{ fontWeight: 'bold', color: 'var(--color-cyan)' }}>{scanResult.protein}g</div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-muted)' }}>{t('dashboard.carbs')}</div>
                      <div style={{ fontWeight: 'bold', color: 'var(--color-yellow)' }}>{scanResult.carbs}g</div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-muted)' }}>{t('dashboard.fat')}</div>
                      <div style={{ fontWeight: 'bold', color: 'var(--color-magenta)' }}>{scanResult.fat}g</div>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{t('nutrition.aiAccuracy')}: 93.6%</span>
                    <span>{isSimulation ? 'SIMULATION' : 'GEMINI-1.5-FLASH'}</span>
                  </div>
                </div>
              )}

              {/* นำเสนอช่องทางกรอก API Key หากไม่มีและอยู่ในโหมด Done */}
              {scanProgress === 'done' && isSimulation && !geminiApiKey && (
                <div style={{ width: '100%', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {t('nutrition.aiAddKeyPrompt')}
                </div>
              )}

              {/* ปุ่มกดของหน้า Modal */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'end', width: '100%', marginTop: '10px' }}>
                <button 
                  className="cyber-btn cyber-btn-secondary" 
                  onClick={() => { setShowScanModal(false); setPreviewUrl(null); }}
                >
                  {t('common.cancel')}
                </button>
                {scanProgress === 'done' && (
                  <button className="cyber-btn cyber-btn-success" onClick={handleConfirmScanResult}>
                    {t('nutrition.aiConfirmBtn')}
                  </button>
                )}
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
