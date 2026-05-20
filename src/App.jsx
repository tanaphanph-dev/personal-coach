import React, { useState, useContext } from 'react';
import { AppProvider, AppContext } from './context/AppContext';
import DashboardView from './components/DashboardView';
import WorkoutView from './components/WorkoutView';
import ExercisesView from './components/ExercisesView';
import NutritionView from './components/NutritionView';
import ProfileView from './components/ProfileView';
import AICoachView from './components/AICoachView';

function AppContent() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { 
    userProfile, 
    profiles, 
    activeProfileId, 
    switchProfile, 
    createProfile, 
    deleteProfile, 
    language, 
    setLanguage, 
    t,
    lastLevelUp,
    setLastLevelUp
  } = useContext(AppContext);

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  // Create profile form states
  const [newName, setNewName] = useState('');
  const [newWeight, setNewWeight] = useState(70);
  const [newHeight, setNewHeight] = useState(170);
  const [newCal, setNewCal] = useState(2000);
  const [newWater, setNewWater] = useState(8);

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    createProfile({
      name: newName,
      weight: newWeight,
      height: newHeight,
      dailyCalories: newCal,
      dailyProtein: Math.round(newWeight * 2), // Auto estimate macros
      dailyCarbs: Math.round(newCal * 0.45 / 4),
      dailyFat: Math.round(newCal * 0.3 / 9),
      waterGoal: newWater
    });
    // Reset states
    setNewName('');
    setNewWeight(70);
    setNewHeight(170);
    setNewCal(2000);
    setNewWater(8);
    setIsCreateModalOpen(false);
  };


  // สลับแท็บหน้าเพจการแสดงผล
  const renderView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView onNavigate={setActiveTab} />;
      case 'workout':
        return <WorkoutView />;
      case 'exercises':
        return <ExercisesView />;
      case 'nutrition':
        return <NutritionView />;
      case 'profile':
        return <ProfileView />;
      case 'aicoach':
        return <AICoachView />;
      default:
        return <DashboardView onNavigate={setActiveTab} />;
    }
  };

  // ไอคอน SVG แบบดึงข้อมูล
  const icons = {
    dashboard: (
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
    workout: (
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    exercises: (
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    nutrition: (
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    profile: (
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    aicoach: (
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    )
  };

  const handleLanguageToggle = () => {
    setLanguage(prev => prev === 'th' ? 'en' : 'th');
  };

  return (
    <>
      {/* ส่วนบนของมือถือ (Mobile Header Bar) */}
      <header className="cyber-top-bar">
        <span className="top-bar-title">⚡ {t('nav.title')}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* ปุ่มสลับภาษา TH/EN สำหรับมือถือ */}
          <button 
            className="cyber-btn" 
            style={{ padding: '4px 8px', fontSize: '0.65rem', minWidth: '40px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={handleLanguageToggle}
          >
            {language === 'th' ? 'EN' : 'TH'}
          </button>

          <div 
            style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
            onClick={() => setIsProfileModalOpen(true)}
            title={t('profile.switcherTitle')}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'end' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>{userProfile.name}</span>
              <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>{userProfile.weight} {t('common.kg')}</span>
            </div>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-cyan), var(--color-violet))', border: '1px solid var(--color-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold', color: 'black' }}>
              {userProfile.name.charAt(0)}
            </div>
          </div>
        </div>
      </header>

      {/* เมนูด้านข้างของหน้าจอคอม (Desktop Sidebar) */}
      <aside className="cyber-sidebar">
        <div className="sidebar-logo" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>⚡ {t('nav.title')}</span>
          {/* ปุ่มสลับภาษา TH/EN สำหรับคอมพิวเตอร์ */}
          <button 
            className="cyber-btn" 
            style={{ padding: '4px 8px', fontSize: '0.7rem', minWidth: '40px', textTransform: 'uppercase' }}
            onClick={handleLanguageToggle}
          >
            {language === 'th' ? 'English' : 'ไทย'}
          </button>
        </div>

        <ul className="sidebar-menu">
          <li 
            className={`sidebar-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <div style={{ width: '20px', height: '20px', stroke: 'currentColor' }}>{icons.dashboard}</div>
            {t('nav.dashboard')}
          </li>
          <li 
            className={`sidebar-item ${activeTab === 'workout' ? 'active' : ''}`}
            onClick={() => setActiveTab('workout')}
          >
            <div style={{ width: '20px', height: '20px', stroke: 'currentColor' }}>{icons.workout}</div>
            {t('nav.workout')}
          </li>
          <li 
            className={`sidebar-item ${activeTab === 'exercises' ? 'active' : ''}`}
            onClick={() => setActiveTab('exercises')}
          >
            <div style={{ width: '20px', height: '20px', stroke: 'currentColor' }}>{icons.exercises}</div>
            {t('nav.exercises')}
          </li>
          <li 
            className={`sidebar-item ${activeTab === 'nutrition' ? 'active' : ''}`}
            onClick={() => setActiveTab('nutrition')}
          >
            <div style={{ width: '20px', height: '20px', stroke: 'currentColor' }}>{icons.nutrition}</div>
            {t('nav.nutrition')}
          </li>
          <li 
            className={`sidebar-item ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <div style={{ width: '20px', height: '20px', stroke: 'currentColor' }}>{icons.profile}</div>
            {t('nav.profile')}
          </li>
          <li 
            className={`sidebar-item ${activeTab === 'aicoach' ? 'active' : ''}`}
            onClick={() => setActiveTab('aicoach')}
          >
            <div style={{ width: '20px', height: '20px', stroke: 'currentColor' }}>{icons.aicoach}</div>
            {t('nav.aicoach')}
          </li>
        </ul>

        {/* ข้อมูลโปรไฟล์ผู้ใช้ล่างสุด Sidebar */}
        <div 
          style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
          onClick={() => setIsProfileModalOpen(true)}
          title={t('profile.switcherTitle')}
        >
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-cyan), var(--color-violet))', border: '1px solid var(--color-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 'bold', color: 'black' }}>
            {userProfile.name.charAt(0)}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontWeight: 'bold', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden', fontSize: '0.85rem' }}>{userProfile.name}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{language === 'th' ? 'สลับโปรไฟล์ ➔' : 'Switch Profile ➔'}</div>
          </div>
        </div>
      </aside>

      {/* เมนูแท็บด้านล่างสำหรับมือถือ (Mobile Tab Bar Navigation) */}
      <nav className="cyber-mobile-nav">
        <a 
          className={`mobile-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          {icons.dashboard}
          <span>{t('nav.dashboard')}</span>
        </a>
        <a 
          className={`mobile-nav-item ${activeTab === 'workout' ? 'active' : ''}`}
          onClick={() => setActiveTab('workout')}
        >
          {icons.workout}
          <span>{t('nav.workout')}</span>
        </a>
        <a 
          className={`mobile-nav-item ${activeTab === 'exercises' ? 'active' : ''}`}
          onClick={() => setActiveTab('exercises')}
        >
          {icons.exercises}
          <span>{t('nav.exercises')}</span>
        </a>
        <a 
          className={`mobile-nav-item ${activeTab === 'nutrition' ? 'active' : ''}`}
          onClick={() => setActiveTab('nutrition')}
        >
          {icons.nutrition}
          <span>{t('nav.nutrition')}</span>
        </a>
        <a 
          className={`mobile-nav-item ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          {icons.profile}
          <span>{t('nav.profile')}</span>
        </a>
        <a 
          className={`mobile-nav-item ${activeTab === 'aicoach' ? 'active' : ''}`}
          onClick={() => setActiveTab('aicoach')}
        >
          {icons.aicoach}
          <span>{t('nav.aicoach')}</span>
        </a>
      </nav>

      {/* ส่วนแสดงเนื้อหาหลัก */}
      <main className="cyber-main-wrapper" style={{ flexGrow: 1 }}>
        {renderView()}
      </main>

      {/* Profile Switcher Modal */}
      {isProfileModalOpen && (
        <div className="cyber-modal-overlay">
          <div className="cyber-modal-content glass-panel trim-cyan" style={{ maxWidth: '420px', width: '90%', background: 'rgba(10, 15, 26, 0.95)', border: '1px solid var(--color-cyan)' }}>
            <h3 style={{ textTransform: 'uppercase', color: 'var(--color-cyan)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 0 20px 0', fontSize: '1rem', borderBottom: '1px solid rgba(0, 242, 254, 0.2)', paddingBottom: '10px' }}>
              <span>👥 {t('profile.switcherTitle')}</span>
              <button style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.2rem' }} onClick={() => setIsProfileModalOpen(false)}>✕</button>
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '300px', overflowY: 'auto', marginBottom: '24px', paddingRight: '4px' }}>
              {profiles.map(p => (
                <div 
                  key={p.id}
                  className={`glass-panel`}
                  style={{ 
                    padding: '12px', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    cursor: 'pointer',
                    background: p.id === activeProfileId ? 'rgba(255, 0, 128, 0.08)' : 'rgba(0,0,0,0.3)',
                    border: `1px solid ${p.id === activeProfileId ? 'var(--color-magenta)' : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: '4px'
                  }}
                  onClick={() => {
                    switchProfile(p.id);
                    setIsProfileModalOpen(false);
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: p.id === activeProfileId ? 'linear-gradient(135deg, var(--color-magenta), var(--color-violet))' : 'linear-gradient(135deg, var(--color-cyan), var(--color-violet))', border: `1px solid ${p.id === activeProfileId ? 'var(--color-magenta)' : 'var(--color-cyan)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#000' }}>
                      {p.name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#fff' }}>
                        {p.name} {p.id === activeProfileId && <span style={{ color: 'var(--color-magenta)', fontSize: '0.65rem', marginLeft: '6px', verticalAlign: 'middle' }}>● ACTIVE</span>}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {p.weight} kg | {p.height} cm | {p.dailyCalories} kcal
                      </div>
                    </div>
                  </div>
                  
                  {profiles.length > 1 && (
                    <button 
                      className="cyber-btn"
                      style={{ 
                        padding: '4px 8px', 
                        fontSize: '0.65rem', 
                        background: 'rgba(255, 0, 128, 0.1)', 
                        border: '1px solid var(--color-magenta)',
                        color: 'var(--color-magenta)',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
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
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                type="button"
                className="cyber-btn" 
                style={{ flex: 1, padding: '10px', fontSize: '0.8rem', border: '1px solid var(--color-cyan)', boxShadow: 'var(--shadow-cyan)' }}
                onClick={() => {
                  setIsCreateModalOpen(true);
                  setIsProfileModalOpen(false);
                }}
              >
                {t('profile.addProfileBtn')}
              </button>
              <button 
                type="button"
                className="cyber-btn" 
                style={{ padding: '10px 16px', fontSize: '0.8rem', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.05)' }}
                onClick={() => setIsProfileModalOpen(false)}
              >
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Creator Modal */}
      {isCreateModalOpen && (
        <div className="cyber-modal-overlay">
          <form onSubmit={handleCreateSubmit} className="cyber-modal-content glass-panel trim-cyan" style={{ maxWidth: '420px', width: '90%', background: 'rgba(10, 15, 26, 0.95)', border: '1px solid var(--color-cyan)' }}>
            <h3 style={{ textTransform: 'uppercase', color: 'var(--color-cyan)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 0 20px 0', fontSize: '1rem', borderBottom: '1px solid rgba(0, 242, 254, 0.2)', paddingBottom: '10px' }}>
              <span>👤 {t('profile.createProfileTitle')}</span>
              <button type="button" style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.2rem' }} onClick={() => setIsCreateModalOpen(false)}>✕</button>
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  {language === 'th' ? 'ชื่ออัตลักษณ์ผู้ใช้' : 'Identity Name'}
                </label>
                <input 
                  type="text" 
                  required
                  value={newName} 
                  onChange={e => setNewName(e.target.value)} 
                  placeholder={language === 'th' ? 'เช่น นีโอ เรเซอร์' : 'e.g. Neo Racer'}
                  style={{ width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', color: '#fff', padding: '10px', borderRadius: '4px', fontSize: '0.8rem' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    {language === 'th' ? 'น้ำหนัก (กก.)' : 'Weight (kg)'}
                  </label>
                  <input 
                    type="number" 
                    required
                    min="1"
                    max="300"
                    value={newWeight} 
                    onChange={e => setNewWeight(Number(e.target.value))} 
                    style={{ width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', color: '#fff', padding: '10px', borderRadius: '4px', fontSize: '0.8rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    {language === 'th' ? 'ส่วนสูง (ซม.)' : 'Height (cm)'}
                  </label>
                  <input 
                    type="number" 
                    required
                    min="1"
                    max="250"
                    value={newHeight} 
                    onChange={e => setNewHeight(Number(e.target.value))} 
                    style={{ width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', color: '#fff', padding: '10px', borderRadius: '4px', fontSize: '0.8rem' }}
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    {language === 'th' ? 'เป้าหมายแคลอรี่ (kcal)' : 'Calories Goal (kcal)'}
                  </label>
                  <input 
                    type="number" 
                    required
                    min="500"
                    max="10000"
                    value={newCal} 
                    onChange={e => setNewCal(Number(e.target.value))} 
                    style={{ width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', color: '#fff', padding: '10px', borderRadius: '4px', fontSize: '0.8rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    {language === 'th' ? 'เป้าหมายน้ำดื่ม (แก้ว)' : 'Water Goal (glasses)'}
                  </label>
                  <input 
                    type="number" 
                    required
                    min="1"
                    max="50"
                    value={newWater} 
                    onChange={e => setNewWater(Number(e.target.value))} 
                    style={{ width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', color: '#fff', padding: '10px', borderRadius: '4px', fontSize: '0.8rem' }}
                  />
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="submit" className="cyber-btn" style={{ flex: 1, padding: '10px', fontSize: '0.8rem', border: '1px solid var(--color-cyan)', boxShadow: 'var(--shadow-cyan)' }}>
                {t('common.save')}
              </button>
              <button type="button" className="cyber-btn" style={{ padding: '10px 16px', fontSize: '0.8rem', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.05)' }} onClick={() => setIsCreateModalOpen(false)}>
                {t('common.cancel')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Level Up Showcase Overlay */}
      {lastLevelUp && (
        <div className="cyber-modal-overlay" style={{ zIndex: 9999, background: 'rgba(5, 5, 10, 0.96)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel trim-magenta" style={{ 
            maxWidth: '460px', 
            width: '90%', 
            padding: '40px 30px', 
            textAlign: 'center', 
            background: 'rgba(15, 10, 25, 0.95)', 
            border: '2px solid var(--color-magenta)', 
            boxShadow: 'var(--shadow-magenta)',
            borderRadius: '8px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Ambient glows */}
            <div style={{ position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(236, 72, 153, 0.3) 0%, transparent 70%)', pointerEvents: 'none' }} />
            
            <div style={{ fontSize: '4.5rem', marginBottom: '20px', filter: 'drop-shadow(0 0 12px var(--color-magenta))' }}>⚡</div>
            
            <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-magenta)', letterSpacing: '2px', fontSize: '2.2rem', margin: '0 0 10px 0', textShadow: 'var(--shadow-magenta)', fontWeight: 'bold' }}>
              {t('rpg.levelUpTitle')}
            </h2>
            
            <p style={{ color: '#fff', fontSize: '1.2rem', fontWeight: 'bold', margin: '0 0 24px 0' }}>
              {t('rpg.levelUpSub')}
            </p>
            
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
              <span style={{ fontSize: '1rem', color: 'var(--text-secondary)', textDecoration: 'line-through' }}>
                LEVEL {lastLevelUp.level - 1}
              </span>
              <span style={{ fontSize: '1.5rem', color: 'var(--color-cyan)' }}>➔</span>
              <span className="badge-neon" style={{ fontSize: '2rem', padding: '6px 16px', background: 'rgba(236,72,153,0.15)', border: '2px solid var(--color-magenta)', borderRadius: '6px', color: 'var(--color-magenta)', textShadow: 'var(--shadow-magenta)', fontWeight: 'bold' }}>
                LVL {lastLevelUp.level}
              </span>
            </div>
            
            <button 
              type="button" 
              className="cyber-btn trim-magenta" 
              style={{ width: '100%', padding: '14px', fontSize: '0.95rem', fontWeight: 'bold', border: '1px solid var(--color-magenta)', boxShadow: 'var(--shadow-magenta)', letterSpacing: '1px' }}
              onClick={() => setLastLevelUp(null)}
            >
              {t('rpg.levelUpConfirm')}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
