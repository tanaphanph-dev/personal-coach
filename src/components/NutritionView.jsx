import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';

export default function NutritionView() {
  const { nutritionLog, userProfile, addFoodLog, removeFoodLog, addWater, getTodayString } = useContext(AppContext);
  
  const todayStr = getTodayString();
  const todayData = nutritionLog[todayStr] || { water: 0, foods: [] };

  // Form State
  const [foodName, setFoodName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');

  // อาหารยอดฮิตสำหรับให้ผู้ใช้เลือกกดคลิกเพื่อบันทึกด่วน
  const FOOD_PRESETS = [
    { name: 'อกไก่ต้มน้ำปลา', calories: 220, protein: 40, carbs: 0, fat: 4 },
    { name: 'ข้าวกล้องสุก 1 ถ้วย', calories: 150, protein: 3, carbs: 32, fat: 1 },
    { name: 'ไข่ต้ม 2 ฟอง', calories: 140, protein: 12, carbs: 1, fat: 10 },
    { name: 'เวย์โปรตีน 1 สกู๊ป', calories: 120, protein: 25, carbs: 2, fat: 1 },
    { name: 'กล้วยน้ำว้า 2 ลูก', calories: 120, protein: 2, carbs: 30, fat: 0 },
    { name: 'แซลมอนย่างเกลือ', calories: 280, protein: 32, carbs: 0, fat: 16 }
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

  // ฟังก์ชันคำนวณระดับความสูงน้ำดื่มสำหรับอนิเมชั่นแก้ว
  const waterHeight = Math.min(100, (todayData.water / userProfile.waterGoal) * 100);

  // ส่งบันทึกอาหาร
  const handleAddFood = (e) => {
    e.preventDefault();
    if (!foodName.trim() || !calories) {
      alert('กรุณากรอกชื่ออาหารและแคลอรี');
      return;
    }

    const newFood = {
      id: 'f_' + Date.now(),
      name: foodName,
      calories: Number(calories) || 0,
      protein: Number(protein) || 0,
      carbs: Number(carbs) || 0,
      fat: Number(fat) || 0,
      time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
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
      time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
    };
    addFoodLog(todayStr, newFood);
  };

  return (
    <div className="cyber-container">
      <h2 style={{ marginBottom: '24px', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ color: 'var(--color-cyan)' }}>🥗</span> ระบบบันทึกโภชนาการวันนี้
      </h2>

      {/* แถวแสดงปริมาณสารอาหารปัจจุบัน */}
      <div className="grid-2" style={{ marginBottom: '20px' }}>
        {/* วงแหวนแคลอรี */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>🔥 ความคืบหน้าแคลอรี</h3>
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
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>เป้าหมายแคลอรีรายวัน: {userProfile.dailyCalories} kcal</div>
              <div style={{ fontSize: '0.8rem', color: totals.calories > userProfile.dailyCalories ? 'var(--color-magenta)' : 'var(--color-green)', marginTop: '4px' }}>
                {totals.calories > userProfile.dailyCalories ? 'เกินค่าเป้าหมายที่ตั้งไว้' : `คงเหลือได้อีก ${userProfile.dailyCalories - totals.calories} kcal`}
              </div>
            </div>
          </div>
        </div>

        {/* แถบ Macro คาร์บ/โปรตีน/ไขมัน */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '10px', justifyContent: 'center' }}>
          <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>🧬 สัดส่วนสารอาหารหลัก</h3>
          
          {/* โปรตีน */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '2px' }}>
              <span>โปรตีน (Protein): {totals.protein} / {userProfile.dailyProtein}g</span>
              <span style={{ color: 'var(--color-cyan)' }}>{pPercent}%</span>
            </div>
            <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${pPercent}%`, height: '100%', background: 'var(--color-cyan)', boxShadow: 'var(--shadow-cyan)' }}></div>
            </div>
          </div>

          {/* คาร์บ */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '2px' }}>
              <span>คาร์โบไฮเดรต (Carbs): {totals.carbs} / {userProfile.dailyCarbs}g</span>
              <span style={{ color: 'var(--color-yellow)' }}>{cPercent}%</span>
            </div>
            <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${cPercent}%`, height: '100%', background: 'var(--color-yellow)', boxShadow: '0 0 10px rgba(255, 230, 0, 0.4)' }}></div>
            </div>
          </div>

          {/* ไขมัน */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '2px' }}>
              <span>ไขมัน (Fats): {totals.fat} / {userProfile.dailyFat}g</span>
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
            💧 ดื่มน้ำวันนี้
          </h3>
          
          <div className="glass-water">
            {/* ระดับน้ำของเหลวอนิเมชั่น */}
            <div className="water-fluid" style={{ height: `${waterHeight}%` }}>
              {waterHeight > 0 && <div className="water-wave"></div>}
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{todayData.water}</span> / {userProfile.waterGoal} แก้ว
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>(เป้าหมายประมาณ {userProfile.waterGoal * 250} ml)</div>
          </div>

          <div className="water-controls">
            <button className="cyber-btn cyber-btn-secondary cyber-btn-sm" onClick={() => addWater(todayStr, -1)} disabled={todayData.water === 0}>
              - 1 แก้ว
            </button>
            <button className="cyber-btn cyber-btn-success cyber-btn-sm" onClick={() => addWater(todayStr, 1)}>
              + 1 แก้ว
            </button>
          </div>
        </div>

        {/* ป้อนเมนูอาหารที่ทาน (Add Food Form) */}
        <div className="glass-panel" style={{ gridColumn: 'span 2' }}>
          <h3 style={{ fontSize: '0.95rem', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px', marginBottom: '14px' }}>
            🍽️ บันทึกอาหารมื้อใหม่
          </h3>
          
          <form onSubmit={handleAddFood} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="cyber-input-group" style={{ gridColumn: 'span 2', marginBottom: 0 }}>
              <label className="cyber-label">ชื่อเมนูอาหาร</label>
              <input 
                type="text" 
                className="cyber-input" 
                placeholder="เช่น ข้าวกะเพราเนื้อ, นมจืด 1 กล่อง" 
                value={foodName} 
                onChange={(e) => setFoodName(e.target.value)}
                required
              />
            </div>

            <div className="cyber-input-group" style={{ marginBottom: 0 }}>
              <label className="cyber-label">พลังงาน (Calories - kcal)</label>
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
              <label className="cyber-label">โปรตีน (Protein - g)</label>
              <input 
                type="number" 
                className="cyber-input" 
                placeholder="0" 
                value={protein} 
                onChange={(e) => setProtein(e.target.value)}
              />
            </div>

            <div className="cyber-input-group" style={{ marginBottom: 0 }}>
              <label className="cyber-label">คาร์โบไฮเดรต (Carbs - g)</label>
              <input 
                type="number" 
                className="cyber-input" 
                placeholder="0" 
                value={carbs} 
                onChange={(e) => setCarbs(e.target.value)}
              />
            </div>

            <div className="cyber-input-group" style={{ marginBottom: 0 }}>
              <label className="cyber-label">ไขมัน (Fat - g)</label>
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
                บันทึกอาหาร
              </button>
            </div>
          </form>

          {/* เมนูลัดแอดด่วน */}
          <div style={{ marginTop: '20px' }}>
            <label className="cyber-label" style={{ marginBottom: '8px', display: 'block' }}>⚡ อาหารคลีนแอดด่วน (Quick Add)</label>
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
          📝 รายการอาหารที่รับประทานในวันนี้ ({todayData.foods.length} เมนู)
        </h3>

        {todayData.foods.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-secondary)' }}>
            วันนี้คุณยังไม่ได้เริ่มบันทึกอาหาร
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
                    {food.time} | โปรตีน {food.protein}g | คาร์บ {food.carbs}g | ไขมัน {food.fat}g
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
                    ✕ ลบ
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
              <span>ผลรวมโภชนาการวันนี้:</span>
              <span style={{ color: 'var(--color-cyan)' }}>
                {totals.calories} kcal (P: {totals.protein}g | C: {totals.carbs}g | F: {totals.fat}g)
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
