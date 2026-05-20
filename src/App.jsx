import React, { useState, useContext } from 'react';
import { AppProvider, AppContext } from './context/AppContext';
import DashboardView from './components/DashboardView';
import WorkoutView from './components/WorkoutView';
import ExercisesView from './components/ExercisesView';
import NutritionView from './components/NutritionView';
import ProfileView from './components/ProfileView';

function AppContent() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { userProfile, language, setLanguage, t } = useContext(AppContext);

  // สลับแท็บหน้าเพจการแสดงผล
  const renderView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'workout':
        return <WorkoutView />;
      case 'exercises':
        return <ExercisesView />;
      case 'nutrition':
        return <NutritionView />;
      case 'profile':
        return <ProfileView />;
      default:
        return <DashboardView />;
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
        </ul>

        {/* ข้อมูลโปรไฟล์ผู้ใช้ล่างสุด Sidebar */}
        <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-cyan), var(--color-violet))', border: '1px solid var(--color-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 'bold', color: 'black' }}>
            {userProfile.name.charAt(0)}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontWeight: 'bold', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden', fontSize: '0.85rem' }}>{userProfile.name}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Cal Goal: {userProfile.dailyCalories}</div>
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
      </nav>

      {/* ส่วนแสดงเนื้อหาหลัก */}
      <main className="cyber-main-wrapper" style={{ flexGrow: 1 }}>
        {renderView()}
      </main>
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
