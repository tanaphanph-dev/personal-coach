import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';

export default function ProfileView() {
  const { userProfile, updateProfile, exportData, importData, resetData } = useContext(AppContext);

  // States สำหรับฟอร์มแก้ไขโปรไฟล์
  const [name, setName] = useState(userProfile.name);
  const [weight, setWeight] = useState(userProfile.weight);
  const [height, setHeight] = useState(userProfile.height);
  const [activityLevel, setActivityLevel] = useState(userProfile.activityLevel);
  const [dailyCalories, setDailyCalories] = useState(userProfile.dailyCalories);
  const [dailyProtein, setDailyProtein] = useState(userProfile.dailyProtein);
  const [dailyCarbs, setDailyCarbs] = useState(userProfile.dailyCarbs);
  const [dailyFat, setDailyFat] = useState(userProfile.dailyFat);
  const [waterGoal, setWaterGoal] = useState(userProfile.waterGoal);

  // ยืนยันบันทึกโปรไฟล์
  const handleSaveProfile = (e) => {
    e.preventDefault();
    
    updateProfile({
      name,
      weight: Number(weight) || 0,
      height: Number(height) || 0,
      activityLevel,
      dailyCalories: Number(dailyCalories) || 0,
      dailyProtein: Number(dailyProtein) || 0,
      dailyCarbs: Number(dailyCarbs) || 0,
      dailyFat: Number(dailyFat) || 0,
      waterGoal: Number(waterGoal) || 0
    });
  };

  // ดำเนินการอัปโหลดไฟล์ JSON สำรองข้อมูล
  const handleImportFile = (e) => {
    const fileReader = new FileReader();
    const file = e.target.files[0];
    if (!file) return;

    fileReader.onload = (event) => {
      const text = event.target.result;
      const success = importData(text);
      if (success) {
        // รีเฟรชหน้าต่างเพื่อให้ค่าสเตทอัปเดตเต็มรูปแบบ
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    };
    fileReader.readAsText(file, 'UTF-8');
  };

  const handleResetSystem = () => {
    if (window.confirm('⚠️ คำเตือนระบบล้างรหัส ⚠️\nคุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลประวัติตารางออกกำลังกาย สถิติ และอาหารทั้งหมด? ขั้นตอนนี้จะไม่สามารถยกเลิกได้!')) {
      resetData();
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  return (
    <div className="cyber-container">
      <h2 style={{ marginBottom: '24px', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ color: 'var(--color-cyan)' }}>⚙️</span> โปรไฟล์และการตั้งค่าเป้าหมาย
      </h2>

      <div className="grid-2">
        {/* แผงแก้ไขโปรไฟล์และเป้าหมายสุขภาพ */}
        <div className="glass-panel trim-cyan">
          <h3 style={{ fontSize: '1rem', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px', marginBottom: '16px' }}>
            👤 แก้ไขโปรไฟล์ผู้ใช้งาน
          </h3>

          <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="cyber-input-group">
              <label className="cyber-label">ชื่อผู้ใช้งาน (Codename)</label>
              <input 
                type="text" 
                className="cyber-input" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="cyber-input-group">
                <label className="cyber-label">น้ำหนักปัจจุบัน (kg)</label>
                <input 
                  type="number" 
                  className="cyber-input" 
                  value={weight} 
                  onChange={(e) => setWeight(e.target.value)} 
                  required 
                />
              </div>
              <div className="cyber-input-group">
                <label className="cyber-label">ส่วนสูง (cm)</label>
                <input 
                  type="number" 
                  className="cyber-input" 
                  value={height} 
                  onChange={(e) => setHeight(e.target.value)} 
                  required 
                />
              </div>
            </div>

            <div className="cyber-input-group">
              <label className="cyber-label">ระดับกิจกรรมประจำวัน</label>
              <select 
                className="cyber-select" 
                value={activityLevel}
                onChange={(e) => setActivityLevel(e.target.value)}
              >
                <option value="Sedentary (ทำงานออฟฟิศ นั่งนิ่งๆ)">Sedentary (ทำงานออฟฟิศ นั่งนิ่งๆ)</option>
                <option value="Lightly Active (เดินบ่อย ออกกำลังกาย 1-2 วัน/สัปดาห์)">Lightly Active (เดินบ่อย ออกกำลังกาย 1-2 วัน/สัปดาห์)</option>
                <option value="Active (ออกกำลังกาย 3-5 วัน/สัปดาห์)">Active (ออกกำลังกาย 3-5 วัน/สัปดาห์)</option>
                <option value="Very Active (ออกกำลังกายหนัก/ทำงานใช้แรงงานทุกวัน)">Very Active (ออกกำลังกายหนัก/ทำงานใช้แรงงานทุกวัน)</option>
              </select>
            </div>

            <h4 style={{ fontSize: '0.8rem', color: 'var(--color-cyan)', textTransform: 'uppercase', marginTop: '10px', marginBottom: '6px' }}>
              🎯 ปรับแต่งเป้าหมายโภชนาการประจำวัน
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="cyber-input-group">
                <label className="cyber-label">แคลอรีต่อวัน (kcal)</label>
                <input 
                  type="number" 
                  className="cyber-input" 
                  value={dailyCalories} 
                  onChange={(e) => setDailyCalories(e.target.value)} 
                  required 
                />
              </div>
              <div className="cyber-input-group">
                <label className="cyber-label">เป้าหมายดื่มน้ำ (แก้ว/วัน)</label>
                <input 
                  type="number" 
                  className="cyber-input" 
                  value={waterGoal} 
                  onChange={(e) => setWaterGoal(e.target.value)} 
                  required 
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              <div className="cyber-input-group">
                <label className="cyber-label">โปรตีน (g)</label>
                <input 
                  type="number" 
                  className="cyber-input" 
                  value={dailyProtein} 
                  onChange={(e) => setDailyProtein(e.target.value)} 
                  required 
                />
              </div>
              <div className="cyber-input-group">
                <label className="cyber-label">คาร์บ (g)</label>
                <input 
                  type="number" 
                  className="cyber-input" 
                  value={dailyCarbs} 
                  onChange={(e) => setDailyCarbs(e.target.value)} 
                  required 
                />
              </div>
              <div className="cyber-input-group">
                <label className="cyber-label">ไขมัน (g)</label>
                <input 
                  type="number" 
                  className="cyber-input" 
                  value={dailyFat} 
                  onChange={(e) => setDailyFat(e.target.value)} 
                  required 
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'end', marginTop: '10px' }}>
              <button type="submit" className="cyber-btn cyber-btn-success">
                บันทึกการเปลี่ยนแปลง
              </button>
            </div>
          </form>
        </div>

        {/* แผงจัดการข้อมูลระบบฐานข้อมูลโลคอล */}
        <div className="glass-panel trim-magenta" style={{ display: 'flex', flexDirection: 'column', gap: '20px', justifyContent: 'between' }}>
          <div>
            <h3 style={{ fontSize: '1rem', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px', marginBottom: '16px', color: 'var(--color-magenta)' }}>
              💾 จัดการข้อมูลสำรองระบบ (Local Database)
            </h3>
            
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '16px' }}>
              แอปพลิเคชันจะเก็บรักษาข้อมูลทั้งหมดเอาไว้บนหน่วยความจำประมวลผลเบราว์เซอร์ของคุณ (LocalStorage) 
              คุณสามารถส่งออกข้อมูลเป็นไฟล์เก็บถาวรเพื่ออัปโหลดกู้คืนภายหลัง หรือรีเซ็ตข้อมูลทั้งหมดเพื่อเริ่มนับศูนย์ใหม่ได้ทันที
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* ปุ่มส่งออก */}
              <div>
                <button className="cyber-btn" style={{ width: '100%' }} onClick={exportData}>
                  📥 ส่งออกข้อมูลสำรอง (Export JSON)
                </button>
              </div>

              {/* ปุ่มนำเข้า */}
              <div className="glass-panel" style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderStyle: 'dashed' }}>
                <label className="cyber-label" style={{ display: 'block', marginBottom: '8px' }}>📂 อัปโหลดไฟล์เพื่อนำเข้าข้อมูล (Import JSON)</label>
                <input 
                  type="file" 
                  accept=".json"
                  style={{ display: 'none' }}
                  id="import-file-input"
                  onChange={handleImportFile}
                />
                <button 
                  className="cyber-btn cyber-btn-secondary" 
                  style={{ width: '100%', fontSize: '0.8rem' }}
                  onClick={() => document.getElementById('import-file-input').click()}
                >
                  เลือกไฟล์ข้อมูลสำรอง .json
                </button>
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px', marginTop: '20px' }}>
            <h4 style={{ fontSize: '0.8rem', color: 'var(--color-magenta)', textTransform: 'uppercase', marginBottom: '6px' }}>
              ☣️ ล้างข้อมูลทำลายเซสชัน
            </h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
              ขั้นตอนนี้จะคืนค่าระบบกลับสู่สถานะดั้งเดิม ลบความคืบหน้าน้ำหนักยก ตารางฝึก และบันทึกแคลอรีทั้งหมด
            </p>
            <button className="cyber-btn cyber-btn-secondary" style={{ width: '100%', border: '1px solid var(--color-magenta)', color: 'var(--color-magenta)' }} onClick={handleResetSystem}>
              ล้างข้อมูล & รีเซ็ตระบบทั้งหมด
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
