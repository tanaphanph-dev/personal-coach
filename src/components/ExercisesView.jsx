import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';

export default function ExercisesView() {
  const { exercises, t, language } = useContext(AppContext);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(language === 'th' ? 'ทั้งหมด' : 'All');
  const [activeDetailsExercise, setActiveDetailsExercise] = useState(null); // ตัวที่กำลังดูรายละเอียดอยู่

  // หมวดหมู่กล้ามเนื้อสำหรับแสดงตัวกรองดรอปดาวน์
  const categories = language === 'th'
    ? ['ทั้งหมด', 'Chest (อก)', 'Back (หลัง)', 'Legs (ขา)', 'Shoulders (ไหล่)', 'Arms (แขน)', 'Core (แกนกลาง)']
    : ['All', 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core'];

  // กรองรายชื่อท่าออกกำลังกายตามประเภทและการค้นหา
  const filteredExercises = exercises.filter(ex => {
    const matchesSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          ex.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    // จับคู่ประเภทได้สองภาษา
    let matchesCategory = false;
    if (selectedCategory === 'ทั้งหมด' || selectedCategory === 'All') {
      matchesCategory = true;
    } else {
      const cleanCat = selectedCategory.split(' ')[0]; // ดึง 'Chest', 'Back' ฯลฯ
      matchesCategory = ex.category.toLowerCase().includes(cleanCat.toLowerCase());
    }

    return matchesSearch && matchesCategory;
  });

  const getDifficultyBadgeClass = (diff) => {
    if (diff === 'ง่าย' || diff === 'Easy') return 'badge-green';
    if (diff === 'ปานกลาง' || diff === 'Intermediate' || diff === 'Medium') return 'badge-cyan';
    if (diff === 'ยาก' || diff === 'Advanced' || diff === 'Hard') return 'badge-magenta';
    return 'badge-muted';
  };

  const getDifficultyText = (diff) => {
    if (diff === 'ง่าย' || diff === 'Easy') return t('exercises.difficultyEasy');
    if (diff === 'ปานกลาง' || diff === 'Intermediate' || diff === 'Medium') return t('exercises.difficultyMed');
    if (diff === 'ยาก' || diff === 'Advanced' || diff === 'Hard') return t('exercises.difficultyHard');
    return diff;
  };

  return (
    <div className="cyber-container">
      <h2 style={{ marginBottom: '24px', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ color: 'var(--color-cyan)' }}>📖</span> {t('exercises.title')}
      </h2>

      {/* แผงค้นหาและจัดระเบียบ */}
      <div className="glass-panel" style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="cyber-input-group" style={{ marginBottom: 0 }}>
          <label className="cyber-label">{t('exercises.searchLabel')}</label>
          <input 
            type="text" 
            className="cyber-input" 
            placeholder={t('exercises.searchPlace')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* เมนูตัวกรองกล้ามเนื้อ */}
        <div>
          <label className="cyber-label" style={{ marginBottom: '8px', display: 'block' }}>{t('exercises.filterLabel')}</label>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {categories.map(cat => (
              <button 
                key={cat}
                className={`cyber-btn cyber-btn-sm ${selectedCategory === cat ? '' : 'cyber-btn-secondary'}`}
                style={{ fontSize: '0.7rem' }}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* รายการแสดงท่าฝึกหลังการกรอง */}
      {filteredExercises.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>
          {t('exercises.empty')}
        </div>
      ) : (
        <div className="exercise-list">
          {filteredExercises.map(ex => {
            return (
              <div 
                key={ex.id} 
                className="exercise-card" 
                onClick={() => setActiveDetailsExercise(ex)}
              >
                <div className="exercise-info">
                  <div className="exercise-name">{ex.name}</div>
                  <div className="exercise-meta">
                    <span className="badge badge-cyan">{ex.category}</span>
                    <span className={`badge ${getDifficultyBadgeClass(ex.difficulty)}`}>
                      {t('exercises.difficulty')} {getDifficultyText(ex.difficulty)}
                    </span>
                  </div>
                </div>
                <div>
                  <span style={{ color: 'var(--color-cyan)', fontSize: '0.8rem', fontFamily: 'var(--font-display)' }}>
                    {t('exercises.guideLink')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* หน้าต่างป๊อปอัปแสดงคำอธิบายและรูปทรง / ขั้นตอนออกกำลังกาย (Instruction Detail Modal) */}
      {activeDetailsExercise && (
        <div className="cyber-modal-overlay">
          <div className="cyber-modal" style={{ maxWidth: '550px' }}>
            <div className="modal-header">
              <h3 className="modal-title">{activeDetailsExercise.name}</h3>
              <button className="modal-close" onClick={() => setActiveDetailsExercise(null)}>×</button>
            </div>
            
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <span className="badge badge-cyan" style={{ fontSize: '0.75rem' }}>{activeDetailsExercise.category}</span>
              <span className={`badge ${getDifficultyBadgeClass(activeDetailsExercise.difficulty)}`} style={{ fontSize: '0.75rem' }}>
                {t('exercises.difficulty')} {getDifficultyText(activeDetailsExercise.difficulty)}
              </span>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '0.85rem', color: 'var(--color-cyan)', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>
                {t('exercises.modalDescHeader')}
              </h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                {activeDetailsExercise.description}
              </p>
            </div>

            <div>
              <h4 style={{ fontSize: '0.85rem', color: 'var(--color-magenta)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>
                {t('exercises.modalInstructionsHeader')}
              </h4>
              <ol style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                {activeDetailsExercise.instructions.map((step, idx) => (
                  <li key={idx}>
                    <span style={{ color: '#fff' }}>{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'end' }}>
              <button className="cyber-btn cyber-btn-secondary" onClick={() => setActiveDetailsExercise(null)}>
                {t('exercises.modalCloseBtn')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
