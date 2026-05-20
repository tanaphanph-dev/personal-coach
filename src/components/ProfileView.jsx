import React, { useContext, useState, useEffect } from 'react';
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
    profiles,
    activeProfileId,
    switchProfile,
    createProfile,
    deleteProfile,
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

  // คอยอัปเดตแบบฟอร์มเมื่อสลับผู้ใช้งาน
  useEffect(() => {
    setName(userProfile.name);
    setWeight(userProfile.weight);
    setHeight(userProfile.height);
    setActivityLevel(userProfile.activityLevel);
    setDailyCalories(userProfile.dailyCalories);
    setDailyProtein(userProfile.dailyProtein);
    setDailyCarbs(userProfile.dailyCarbs);
    setDailyFat(userProfile.dailyFat);
    setWaterGoal(userProfile.waterGoal);
  }, [userProfile]);

  // คอยอัปเดตคีย์ Gemini เมื่อคีย์ใน Context มีการเปลี่ยนแปลง
  useEffect(() => {
    setApiKeyInput(geminiApiKey);
  }, [geminiApiKey]);

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

        {/* Interactive Cybernetic Avatar */}
        <div className="glass-panel trim-magenta" style={{ marginTop: '20px', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: '100px', height: '100px', background: 'radial-gradient(circle, rgba(236, 72, 153, 0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
          
          <h3 style={{ fontSize: '0.9rem', textTransform: 'uppercase', alignSelf: 'stretch', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px', margin: 0, color: 'var(--color-magenta)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>🤖 Cybernetic Avatar Matrix</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Sync Rate: {(userProfile.cyberware || []).length * 25}%</span>
          </h3>
          
          <svg width="200" height="280" viewBox="0 0 200 280" style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)' }}>
            <defs>
              <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="glow-magenta" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="glow-yellow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Wireframe human outline */}
            <circle cx="100" cy="50" r="18" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
            <path d="M 85,50 A 15,15 0 0,0 115,50" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="2,2" />
            <line x1="100" y1="68" x2="100" y2="150" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />
            <ellipse cx="100" cy="95" rx="30" ry="20" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
            <ellipse cx="100" cy="125" rx="25" ry="12" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />

            {/* Arms path */}
            <path d="M 70,85 L 45,115 L 35,150" fill="none" stroke={(userProfile.cyberware || []).includes('arms') ? 'var(--color-cyan)' : 'rgba(255,255,255,0.15)'} strokeWidth={(userProfile.cyberware || []).includes('arms') ? '3.5' : '1.5'} filter={(userProfile.cyberware || []).includes('arms') ? 'url(#glow-cyan)' : ''} />
            <path d="M 130,85 L 155,115 L 165,150" fill="none" stroke={(userProfile.cyberware || []).includes('arms') ? 'var(--color-cyan)' : 'rgba(255,255,255,0.15)'} strokeWidth={(userProfile.cyberware || []).includes('arms') ? '3.5' : '1.5'} filter={(userProfile.cyberware || []).includes('arms') ? 'url(#glow-cyan)' : ''} />

            {/* Legs path */}
            <path d="M 85,150 L 75,200 L 70,260" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
            <path d="M 115,150 L 125,200 L 130,260" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />

            {/* Kiroshi Optics Eye */}
            <circle 
              cx="103" 
              cy="47" 
              r={(userProfile.cyberware || []).includes('kiroshi') ? '6' : '3'} 
              fill={(userProfile.cyberware || []).includes('kiroshi') ? 'var(--color-cyan)' : 'rgba(255,255,255,0.2)'} 
              stroke={(userProfile.cyberware || []).includes('kiroshi') ? '#fff' : 'none'}
              strokeWidth="1"
              filter={(userProfile.cyberware || []).includes('kiroshi') ? 'url(#glow-cyan)' : ''}
            />

            {/* Subdermal Armor Plate lines */}
            {(userProfile.cyberware || []).includes('armor') && (
              <path 
                d="M 80,95 L 120,95 M 85,110 L 115,110 M 90,125 L 110,125" 
                stroke="var(--color-magenta)" 
                strokeWidth="2.5" 
                filter="url(#glow-magenta)"
              />
            )}

            {/* Sandevistan Modules */}
            {(userProfile.cyberware || []).includes('sandevistan') ? (
              <g filter="url(#glow-yellow)">
                <rect x="97" y="75" width="6" height="8" rx="1" fill="var(--color-yellow)" />
                <rect x="97" y="90" width="6" height="8" rx="1" fill="var(--color-yellow)" />
                <rect x="97" y="105" width="6" height="8" rx="1" fill="var(--color-yellow)" />
                <rect x="97" y="120" width="6" height="8" rx="1" fill="var(--color-yellow)" />
                <rect x="97" y="135" width="6" height="8" rx="1" fill="var(--color-yellow)" />
              </g>
            ) : (
              <g opacity="0.3">
                <rect x="98" y="75" width="4" height="6" rx="1" fill="white" />
                <rect x="98" y="90" width="4" height="6" rx="1" fill="white" />
                <rect x="98" y="105" width="4" height="6" rx="1" fill="white" />
                <rect x="98" y="120" width="4" height="6" rx="1" fill="white" />
              </g>
            )}

            {/* Gorilla Arms indicator points */}
            {(userProfile.cyberware || []).includes('arms') && (
              <g filter="url(#glow-cyan)">
                <circle cx="35" cy="150" r="5" fill="var(--color-cyan)" />
                <circle cx="165" cy="150" r="5" fill="var(--color-cyan)" />
              </g>
            )}
          </svg>

          {/* Cyberware tags */}
          <div style={{ width: '100%', display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
            <span style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', background: (userProfile.cyberware || []).includes('kiroshi') ? 'rgba(0, 242, 254, 0.15)' : 'rgba(255,255,255,0.05)', color: (userProfile.cyberware || []).includes('kiroshi') ? 'var(--color-cyan)' : 'var(--text-secondary)', border: `1px solid ${(userProfile.cyberware || []).includes('kiroshi') ? 'var(--color-cyan)' : 'transparent'}` }}>
              Kiroshi Optics {(userProfile.cyberware || []).includes('kiroshi') ? '✓' : '✗'}
            </span>
            <span style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', background: (userProfile.cyberware || []).includes('armor') ? 'rgba(255, 0, 128, 0.15)' : 'rgba(255,255,255,0.05)', color: (userProfile.cyberware || []).includes('armor') ? 'var(--color-magenta)' : 'var(--text-secondary)', border: `1px solid ${(userProfile.cyberware || []).includes('armor') ? 'var(--color-magenta)' : 'transparent'}` }}>
              Subdermal Armor {(userProfile.cyberware || []).includes('armor') ? '✓' : '✗'}
            </span>
            <span style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', background: (userProfile.cyberware || []).includes('arms') ? 'rgba(0, 242, 254, 0.15)' : 'rgba(255,255,255,0.05)', color: (userProfile.cyberware || []).includes('arms') ? 'var(--color-cyan)' : 'var(--text-secondary)', border: `1px solid ${(userProfile.cyberware || []).includes('arms') ? 'var(--color-cyan)' : 'transparent'}` }}>
              Gorilla Arms {(userProfile.cyberware || []).includes('arms') ? '✓' : '✗'}
            </span>
            <span style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', background: (userProfile.cyberware || []).includes('sandevistan') ? 'rgba(234, 179, 8, 0.15)' : 'rgba(255,255,255,0.05)', color: (userProfile.cyberware || []).includes('sandevistan') ? 'var(--color-yellow)' : 'var(--text-secondary)', border: `1px solid ${(userProfile.cyberware || []).includes('sandevistan') ? 'var(--color-yellow)' : 'transparent'}` }}>
              Sandevistan {(userProfile.cyberware || []).includes('sandevistan') ? '✓' : '✗'}
            </span>
          </div>
        </div>

        {/* ส่วนขวา: จัดการอัตลักษณ์ผู้ใช้ คีย์ Gemini AI และจัดข้อมูลสำรอง */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* แผงจัดการอัตลักษณ์ (Identity Management) */}
          <div className="glass-panel trim-cyan">
            <h3 style={{ fontSize: '1rem', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px', marginBottom: '12px', color: 'var(--color-cyan)' }}>
              {t('profile.identityHeader')}
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              {profiles.map(p => (
                <div 
                  key={p.id}
                  style={{
                    padding: '8px 12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: p.id === activeProfileId ? 'rgba(0, 242, 254, 0.08)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${p.id === activeProfileId ? 'var(--color-cyan)' : 'rgba(255,255,255,0.05)'}`,
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                  onClick={() => switchProfile(p.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: p.id === activeProfileId ? 'linear-gradient(135deg, var(--color-cyan), var(--color-violet))' : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold', color: p.id === activeProfileId ? 'black' : '#fff' }}>
                      {p.name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: p.id === activeProfileId ? 'var(--color-cyan)' : '#fff' }}>
                        {p.name} {p.id === activeProfileId && <span style={{ fontSize: '0.6rem', color: 'var(--color-magenta)', marginLeft: '6px' }}>(Active)</span>}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                        {p.weight} kg | {p.dailyCalories} kcal
                      </div>
                    </div>
                  </div>
                  
                  {profiles.length > 1 && (
                    <button 
                      type="button" 
                      className="cyber-btn"
                      style={{ padding: '2px 6px', fontSize: '0.6rem', border: '1px solid var(--color-magenta)', color: 'var(--color-magenta)', background: 'rgba(255,0,128,0.05)', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(t('profile.confirmDeleteProfile', { name: p.name }))) {
                          deleteProfile(p.id);
                        }
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Quick Inline Identity Creator */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
              <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '8px', color: 'var(--text-secondary)' }}>
                {t('profile.createProfileTitle')}
              </h4>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="text" 
                  className="cyber-input" 
                  placeholder={t('profile.addProfileBtn')} 
                  style={{ fontSize: '0.75rem', padding: '8px' }}
                  id="new-profile-name-input"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.target.value.trim()) {
                      createProfile({ name: e.target.value.trim() });
                      e.target.value = '';
                    }
                  }}
                />
                <button 
                  type="button" 
                  className="cyber-btn"
                  style={{ padding: '8px 12px', fontSize: '0.75rem', whiteSpace: 'nowrap' }}
                  onClick={() => {
                    const inp = document.getElementById('new-profile-name-input');
                    if (inp && inp.value.trim()) {
                      createProfile({ name: inp.value.trim() });
                      inp.value = '';
                    }
                  }}
                >
                  + Add
                </button>
              </div>
            </div>
          </div>

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
