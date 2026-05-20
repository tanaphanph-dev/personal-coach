import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';

export default function ProfileView() {
  const { 
    userProfile, 
    updateProfile, 
    exportData, 
    importData, 
    resetData, 
    geminiApiKey, 
    saveGeminiApiKey, 
    clearGeminiApiKey, 
    t 
  } = useContext(AppContext);

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

  // State สำหรับคีย์ Gemini API
  const [apiKeyInput, setApiKeyInput] = useState(geminiApiKey);

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

  const handleSaveApiKey = (e) => {
    e.preventDefault();
    if (!apiKeyInput.trim()) return;
    saveGeminiApiKey(apiKeyInput.trim());
  };

  const handleClearApiKey = () => {
    clearGeminiApiKey();
    setApiKeyInput('');
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
    if (window.confirm(t('profile.confirmReset'))) {
      resetData();
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  return (
    <div className="cyber-container">
      <h2 style={{ marginBottom: '24px', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ color: 'var(--color-cyan)' }}>⚙️</span> {t('profile.title')}
      </h2>

      <div className="grid-2">
        {/* แผงแก้ไขโปรไฟล์และเป้าหมายสุขภาพ */}
        <div className="glass-panel trim-cyan">
          <h3 style={{ fontSize: '1rem', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px', marginBottom: '16px' }}>
            {t('profile.editHeader')}
          </h3>

          <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="cyber-input-group">
              <label className="cyber-label">{t('profile.nameLabel')}</label>
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
                <label className="cyber-label">{t('profile.weightLabel')}</label>
                <input 
                  type="number" 
                  className="cyber-input" 
                  value={weight} 
                  onChange={(e) => setWeight(e.target.value)} 
                  required 
                />
              </div>
              <div className="cyber-input-group">
                <label className="cyber-label">{t('profile.heightLabel')}</label>
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
              <label className="cyber-label">{t('profile.activityLabel')}</label>
              <select 
                className="cyber-select" 
                value={activityLevel}
                onChange={(e) => setActivityLevel(e.target.value)}
              >
                <option value="Sedentary (ทำงานออฟฟิศ นั่งนิ่งๆ)">Sedentary</option>
                <option value="Lightly Active (เดินบ่อย ออกกำลังกาย 1-2 วัน/สัปดาห์)">Lightly Active</option>
                <option value="Active (ออกกำลังกาย 3-5 วัน/สัปดาห์)">Active</option>
                <option value="Very Active (ออกกำลังกายหนัก/ทำงานใช้แรงงานทุกวัน)">Very Active</option>
              </select>
            </div>

            <h4 style={{ fontSize: '0.8rem', color: 'var(--color-cyan)', textTransform: 'uppercase', marginTop: '10px', marginBottom: '6px' }}>
              {t('profile.macroGoalHeader')}
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="cyber-input-group">
                <label className="cyber-label">{t('profile.calGoalLabel')}</label>
                <input 
                  type="number" 
                  className="cyber-input" 
                  value={dailyCalories} 
                  onChange={(e) => setDailyCalories(e.target.value)} 
                  required 
                />
              </div>
              <div className="cyber-input-group">
                <label className="cyber-label">{t('profile.waterGoalLabel')}</label>
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
                <label className="cyber-label">{t('profile.proteinLabel')}</label>
                <input 
                  type="number" 
                  className="cyber-input" 
                  value={dailyProtein} 
                  onChange={(e) => setDailyProtein(e.target.value)} 
                  required 
                />
              </div>
              <div className="cyber-input-group">
                <label className="cyber-label">{t('profile.carbsLabel')}</label>
                <input 
                  type="number" 
                  className="cyber-input" 
                  value={dailyCarbs} 
                  onChange={(e) => setDailyCarbs(e.target.value)} 
                  required 
                />
              </div>
              <div className="cyber-input-group">
                <label className="cyber-label">{t('profile.fatLabel')}</label>
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
                {t('profile.saveChangesBtn')}
              </button>
            </div>
          </form>
        </div>

        {/* ส่วนขวา: จัดการคีย์ Gemini AI และจัดข้อมูลสำรอง */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* แผง Gemini API Key */}
          <div className="glass-panel trim-cyan">
            <h3 style={{ fontSize: '1rem', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px', marginBottom: '12px', color: 'var(--color-cyan)' }}>
              {t('profile.geminiHeader')}
            </h3>
            
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4', marginBottom: '14px' }}>
              {t('profile.geminiDesc')}
            </p>

            <form onSubmit={handleSaveApiKey} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div className="cyber-input-group" style={{ marginBottom: 0 }}>
                <label className="cyber-label">{t('profile.geminiKeyLabel')}</label>
                <input 
                  type="password" 
                  className="cyber-input" 
                  placeholder={t('profile.geminiKeyPlace')}
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                />
              </div>

              {geminiApiKey && (
                <div style={{ fontSize: '0.75rem', color: 'var(--color-green)', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>✓</span> {t('profile.geminiKeySaved')} (***{geminiApiKey.substring(geminiApiKey.length - 4)})
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'end' }}>
                {geminiApiKey && (
                  <button type="button" className="cyber-btn cyber-btn-secondary" style={{ border: '1px solid var(--color-magenta)', color: 'var(--color-magenta)', fontSize: '0.75rem', padding: '6px 12px' }} onClick={handleClearApiKey}>
                    {t('profile.geminiClearBtn')}
                  </button>
                )}
                <button type="submit" className="cyber-btn cyber-btn-success" style={{ fontSize: '0.75rem', padding: '6px 12px' }}>
                  {t('profile.geminiSaveBtn')}
                </button>
              </div>
            </form>
          </div>

          {/* แผงจัดการข้อมูลระบบฐานข้อมูลโลคอล */}
          <div className="glass-panel trim-magenta" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '1rem', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px', color: 'var(--color-magenta)' }}>
              {t('profile.dbHeader')}
            </h3>
            
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              {t('profile.dbDesc')}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* ปุ่มส่งออก */}
              <div>
                <button className="cyber-btn" style={{ width: '100%' }} onClick={exportData}>
                  {t('profile.exportBtn')}
                </button>
              </div>

              {/* ปุ่มนำเข้า */}
              <div className="glass-panel" style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderStyle: 'dashed' }}>
                <label className="cyber-label" style={{ display: 'block', marginBottom: '8px' }}>{t('profile.importLabel')}</label>
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
                  {t('profile.importSelectBtn')}
                </button>
              </div>
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px', marginTop: '8px' }}>
              <h4 style={{ fontSize: '0.8rem', color: 'var(--color-magenta)', textTransform: 'uppercase', marginBottom: '6px' }}>
                {t('profile.resetHeader')}
              </h4>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
                {t('profile.resetDesc')}
              </p>
              <button className="cyber-btn cyber-btn-secondary" style={{ width: '100%', border: '1px solid var(--color-magenta)', color: 'var(--color-magenta)' }} onClick={handleResetSystem}>
                {t('profile.resetSystemBtn')}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
