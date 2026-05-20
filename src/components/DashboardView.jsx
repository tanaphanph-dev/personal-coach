import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';

export default function DashboardView({ onNavigate }) {
  const { history, nutritionLog, userProfile, getStreakCount, getTodayString, language, t, getDailyQuests, buyCyberware, claimQuestReward } = useContext(AppContext);
  
  const streak = getStreakCount();
  const todayStr = getTodayString();
  const todayNutrition = nutritionLog[todayStr] || { water: 0, foods: [] };
  
  // คำนวณสารอาหารที่กินในวันนี้
  const todayTotals = todayNutrition.foods.reduce((acc, food) => {
    acc.calories += food.calories || 0;
    acc.protein += food.protein || 0;
    acc.carbs += food.carbs || 0;
    acc.fat += food.fat || 0;
    return acc;
  }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

  // คำนวณร้อยละเป้าหมายสารอาหาร
  const getPercent = (value, goal) => {
    if (!goal) return 0;
    return Math.min(100, Math.round((value / goal) * 100));
  };

  const calPercent = getPercent(todayTotals.calories, userProfile.dailyCalories);
  const proteinPercent = getPercent(todayTotals.protein, userProfile.dailyProtein);
  const carbsPercent = getPercent(todayTotals.carbs, userProfile.dailyCarbs);
  const fatPercent = getPercent(todayTotals.fat, userProfile.dailyFat);

  // คำนวณปริมาณน้ำ
  const waterPercent = getPercent(todayNutrition.water, userProfile.waterGoal);

  // เตรียมข้อมูลสำหรับกราฟระดับปริมาณงาน (Volume Graph)
  // ดึง 5 เซสชันล่าสุด
  const chartLogs = [...history].slice(0, 5).reverse();
  
  // วาดกราฟเส้น SVG แบบไดนามิก
  const renderSVGChart = () => {
    if (chartLogs.length === 0) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '120px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          {t('dashboard.volumeChartEmpty')}
        </div>
      );
    }

    const width = 500;
    const height = 120;
    const padding = 20;

    const maxVal = Math.max(...chartLogs.map(log => log.totalVolume), 1000);
    const minVal = 0;
    const valRange = maxVal - minVal;

    // คำนวณจุด (x, y)
    const points = chartLogs.map((log, idx) => {
      const x = padding + (idx * (width - 2 * padding)) / (chartLogs.length > 1 ? chartLogs.length - 1 : 1);
      const y = height - padding - ((log.totalVolume - minVal) / valRange) * (height - 2 * padding);
      return { x, y, date: log.date.substring(5), val: log.totalVolume, label: log.routineName.split(' ')[0] };
    });

    let pathD = '';
    let areaD = '';

    if (points.length > 0) {
      pathD = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
      areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;
    }

    return (
      <svg className="chart-svg" viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <linearGradient id="cyan-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-cyan)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="var(--color-cyan)" stopOpacity="0.0" />
          </linearGradient>
        </defs>
        
        {/* เส้นตารางหลัง */}
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} className="chart-grid-line" />
        <line x1={padding} y1={padding} x2={width - padding} y2={padding} className="chart-grid-line" />
        <line x1={padding} y1={(height) / 2} x2={width - padding} y2={(height) / 2} className="chart-grid-line" />

        {/* พื้นที่สีทึบใสใต้กราฟ */}
        {points.length > 0 && <path d={areaD} className="chart-area" />}

        {/* เส้นกราฟ */}
        {points.length > 0 && <path d={pathD} className="chart-line" />}

        {/* จุดข้อมูลและตัวอักษร */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="4" className="chart-dot" />
            <text x={p.x} y={p.y - 8} className="chart-text" fontSize="7" fill="white">
              {p.val} kg
            </text>
            <text x={p.x} y={height - padding + 10} className="chart-text" fontSize="7">
              {p.date} ({p.label})
            </text>
          </g>
        ))}
      </svg>
    );
  };

  const renderMacroRing = (percent, color, label, amount, unit, goal) => {
    const radius = 28;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percent / 100) * circumference;

    return (
      <div className="macro-ring-box">
        <div className="svg-ring-container">
          <svg width="80" height="80" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r={radius} className="svg-ring-bg" />
            <circle 
              cx="40" 
              cy="40" 
              r={radius} 
              className="svg-ring-progress" 
              stroke={color}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{ filter: `drop-shadow(0 0 4px ${color})` }}
            />
          </svg>
          <div className="ring-percent" style={{ color: color }}>{percent}%</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div className="stat-label" style={{ fontSize: '0.65rem' }}>{label}</div>
          <div style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>{amount}/{goal}<span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}> {unit}</span></div>
        </div>
      </div>
    );
  };

  // RPG Progression
  const level = userProfile.level || 1;
  const xp = userProfile.xp || 0;
  const chips = userProfile.chips || 0;
  const cyberware = userProfile.cyberware || [];
  const xpNeeded = level * 100;
  const xpPercent = Math.min(100, Math.round((xp / xpNeeded) * 100));

  const getRank = (lvl) => {
    if (lvl >= 15) return t('rpg.rankLegend');
    if (lvl >= 10) return t('rpg.rankMerc');
    if (lvl >= 5) return t('rpg.rankRunner');
    return t('rpg.rankStreetKid');
  };

  const dailyQuests = getDailyQuests();

  const cyberwareItems = [
    { id: 'kiroshi', price: 120, reqLevel: 1 },
    { id: 'armor', price: 180, reqLevel: 2 },
    { id: 'arms', price: 250, reqLevel: 3 },
    { id: 'sandevistan', price: 400, reqLevel: 4 },
  ];

  return (
    <div className="cyber-container">
      <h2 style={{ marginBottom: '24px', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ color: 'var(--color-cyan)' }}>⚡</span> {t('dashboard.title')}
      </h2>

      {/* RPG Progression HUD */}
      <div className="glass-panel trim-magenta" style={{ padding: '20px', borderRadius: '8px', marginBottom: '24px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, right: 0, width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(236, 72, 153, 0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
        
        <div style={{ display: 'flex', alignItems: 'center', justifyBetween: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '16px', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--text-secondary)' }}>
                {t('rpg.rank')}
              </span>
              <span style={{ fontFamily: 'var(--font-display)', color: 'var(--color-magenta)', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase' }}>
                {getRank(level)}
              </span>
            </div>
            <h3 style={{ margin: '4px 0 0 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="badge-neon" style={{ fontSize: '1.1rem', padding: '4px 8px', background: 'rgba(236,72,153,0.1)', border: '1px solid var(--color-magenta)', borderRadius: '4px', textShadow: 'var(--shadow-magenta)', color: 'var(--color-magenta)' }}>
                LVL {level}
              </span>
              <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{userProfile.name}</span>
            </h3>
          </div>
          
          <div style={{ display: 'flex', gap: '20px' }}>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)' }}>{t('rpg.chips')}</span>
              <div style={{ color: 'var(--color-yellow)', fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 'bold', textShadow: '0 0 8px rgba(234,179,8,0.3)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                🪙 {chips}
              </div>
            </div>
          </div>
        </div>

        {/* XP Progress Bar */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '6px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>PROGRESS SYNCING...</span>
            <span style={{ color: '#fff', fontWeight: 'bold' }}>{xp} / {xpNeeded} XP ({xpPercent}%)</span>
          </div>
          <div style={{ width: '100%', height: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '5px', overflow: 'hidden' }}>
            <div style={{ width: `${xpPercent}%`, height: '100%', background: 'linear-gradient(90deg, var(--color-magenta), var(--color-cyan))', boxShadow: 'var(--shadow-magenta)', transition: 'width 0.5s ease-out' }}></div>
          </div>
        </div>
      </div>

      {/* RPG Daily Quests & Cyberware Shop Grid */}
      <div className="grid-2" style={{ marginBottom: '24px' }}>
        {/* Daily Quests Panel */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1rem', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px', margin: 0 }}>
              {t('rpg.questTitle')}
            </h3>
            <p style={{ margin: '6px 0 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {t('rpg.questDesc')}
            </p>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {dailyQuests.map(quest => {
              const currentVal = Math.min(quest.target, quest.current);
              const progressPct = Math.round((currentVal / quest.target) * 100);
              
              return (
                <div key={quest.id} className="glass-panel" style={{ background: 'rgba(0,0,0,0.15)', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', border: quest.isCompleted && !quest.isClaimed ? '1px solid var(--color-cyan)' : '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.85rem', color: quest.isCompleted ? 'var(--color-cyan)' : '#fff' }}>{quest.title}</h4>
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{quest.desc}</p>
                    </div>
                    {quest.isClaimed ? (
                      <span style={{ fontSize: '0.7rem', padding: '2px 6px', background: 'rgba(255,255,255,0.1)', color: 'var(--text-secondary)', borderRadius: '4px' }}>
                        {t('rpg.questClaimed')} ✓
                      </span>
                    ) : quest.isCompleted ? (
                      <button 
                        className="cyber-btn trim-cyan" 
                        style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                        onClick={() => claimQuestReward(quest.id)}
                      >
                        {t('rpg.questClaim')}
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                        {progressPct}%
                      </span>
                    )}
                  </div>
                  
                  {/* Quest Progress Bar */}
                  <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ width: `${progressPct}%`, height: '100%', background: quest.isCompleted ? 'var(--color-cyan)' : 'var(--color-yellow)' }}></div>
                  </div>

                  {/* Rewards preview */}
                  <div style={{ display: 'flex', gap: '10px', fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                    <span>+{quest.xpReward} XP</span>
                    <span>+{quest.chipsReward} Chips</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cyberware Shop Panel */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1rem', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px', margin: 0 }}>
              {t('rpg.shopTitle')}
            </h3>
            <p style={{ margin: '6px 0 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {t('rpg.shopDesc')}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {cyberwareItems.map(item => {
              const isEquipped = cyberware.includes(item.id);
              const isLocked = level < item.reqLevel;
              const title = t(`rpg.${item.id}_title`);
              const desc = t(`rpg.${item.id}_desc`);

              return (
                <div key={item.id} className="glass-panel" style={{ background: 'rgba(0,0,0,0.15)', padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', border: isEquipped ? '1px solid var(--color-magenta)' : '1px solid rgba(255,255,255,0.05)', opacity: isLocked ? 0.6 : 1 }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.85rem', color: isEquipped ? 'var(--color-magenta)' : '#fff' }}>{title}</h4>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: '1.3' }}>{desc}</p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                    {isEquipped ? (
                      <span style={{ fontSize: '0.7rem', padding: '4px 8px', background: 'rgba(236,72,153,0.15)', color: 'var(--color-magenta)', border: '1px solid var(--color-magenta)', borderRadius: '4px', textShadow: 'var(--shadow-magenta)' }}>
                        {t('rpg.shopEquipped')}
                      </span>
                    ) : isLocked ? (
                      <span style={{ fontSize: '0.65rem', color: 'var(--color-magenta)' }}>
                        {t('rpg.shopReqLevel', { lvl: item.reqLevel })}
                      </span>
                    ) : (
                      <button 
                        className="cyber-btn" 
                        style={{ padding: '4px 8px', fontSize: '0.7rem', whiteSpace: 'nowrap' }}
                        onClick={() => buyCyberware(item.id, item.price, item.reqLevel)}
                      >
                        {t('rpg.shopBuy', { price: item.price })}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* AI Coach Banner */}
      <div 
        className="glass-panel trim-cyan" 
        style={{ 
          background: 'linear-gradient(90deg, rgba(139, 92, 246, 0.15), rgba(59, 130, 246, 0.15))', 
          border: '1px solid var(--color-cyan)', 
          padding: '16px', 
          borderRadius: '8px', 
          marginBottom: '24px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          cursor: 'pointer',
          boxShadow: 'var(--shadow-cyan)'
        }}
        onClick={() => onNavigate && onNavigate('aicoach')}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ fontSize: '2rem' }}>🤖</div>
          <div>
            <h4 style={{ margin: 0, color: '#fff', fontSize: '1rem', fontFamily: 'var(--font-display)' }}>
              {language === 'th' ? 'คุยกับโค้ชสมองกล AI' : 'Consult Your Cyber AI Coach'}
            </h4>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              {language === 'th' ? 'ออกแบบตารางฝึก ปรับเปลี่ยนสารอาหาร แนะนำมื้อถัดไปด้วยพลังของ Gemini' : 'Design workout routines & dynamically scale calories using Gemini AI.'}
            </p>
          </div>
        </div>
        <button className="cyber-btn" style={{ padding: '6px 12px', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
          {language === 'th' ? 'เปิดขั้วประมวลผล ➔' : 'Access Hub ➔'}
        </button>
      </div>

      {/* แถวการ์ดสถิติ 3 ช่อง */}
      <div className="grid-3" style={{ marginBottom: '24px' }}>
        <div className="glass-panel trim-cyan stat-card">
          <div className="stat-label">{t('dashboard.streak')}</div>
          <div className="stat-value" style={{ color: 'var(--color-cyan)', textShadow: 'var(--shadow-cyan)' }}>
            {streak} <span className="stat-unit">{t('dashboard.streakUnit')}</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
            {streak > 0 ? t('dashboard.streakActive') : t('dashboard.streakEmpty')}
          </div>
        </div>

        <div className="glass-panel trim-magenta stat-card">
          <div className="stat-label">{t('dashboard.caloriesToday')}</div>
          <div className="stat-value" style={{ color: 'var(--color-magenta)', textShadow: 'var(--shadow-magenta)' }}>
            {todayTotals.calories} <span className="stat-unit">/ {userProfile.dailyCalories} kcal</span>
          </div>
          <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', marginTop: '8px', overflow: 'hidden' }}>
            <div style={{ width: `${calPercent}%`, height: '100%', background: 'var(--color-magenta)', boxShadow: 'var(--shadow-magenta)' }}></div>
          </div>
        </div>

        <div className="glass-panel trim-green stat-card">
          <div className="stat-label">{t('dashboard.workoutLogged')}</div>
          <div className="stat-value" style={{ color: 'var(--color-green)', textShadow: 'var(--shadow-green)' }}>
            {history.length} <span className="stat-unit">{t('dashboard.workoutLoggedUnit')}</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
            {history.length > 0 ? `${t('dashboard.workoutLoggedLast')} ${history[0].routineName}` : t('dashboard.workoutLoggedEmpty')}
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* หน้าจอโภชนาการประจำวัน */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '1rem', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
            🎯 {t('dashboard.macroGoal')}
          </h3>
          <div className="macro-container">
            {renderMacroRing(proteinPercent, 'var(--color-cyan)', t('dashboard.protein'), todayTotals.protein, 'g', userProfile.dailyProtein)}
            {renderMacroRing(carbsPercent, 'var(--color-yellow)', t('dashboard.carbs'), todayTotals.carbs, 'g', userProfile.dailyCarbs)}
            {renderMacroRing(fatPercent, 'var(--color-magenta)', t('dashboard.fat'), todayTotals.fat, 'g', userProfile.dailyFat)}
          </div>
          <div className="glass-panel" style={{ background: 'rgba(0,0,0,0.15)', padding: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', width: '100%' }}>
              <div className="stat-label" style={{ flexGrow: 1 }}>{t('dashboard.waterGoal')}</div>
              <div style={{ fontFamily: 'var(--font-display)', color: 'var(--color-cyan)', fontWeight: 'bold' }}>
                {todayNutrition.water} / {userProfile.waterGoal} {t('dashboard.waterUnit')}
              </div>
            </div>
            <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', marginTop: '8px', overflow: 'hidden' }}>
              <div style={{ width: `${waterPercent}%`, height: '100%', background: 'var(--color-cyan)', boxShadow: 'var(--shadow-cyan)' }}></div>
            </div>
          </div>
        </div>

        {/* กราฟประสิทธิภาพนีออน */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h3 style={{ fontSize: '1rem', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
            📈 {t('dashboard.volumeChart')}
          </h3>
          <div style={{ position: 'relative', height: '100%', minHeight: '120px' }}>
            {renderSVGChart()}
          </div>
          <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '6px' }}>
            {t('dashboard.volumeChartSub')}
          </p>
        </div>
      </div>

      {/* รายการประวัติล่าช้าล่าสุด */}
      <div className="glass-panel" style={{ marginTop: '20px' }}>
        <h3 style={{ fontSize: '1rem', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px', marginBottom: '16px' }}>
          🗓️ {t('dashboard.recentHistory')}
        </h3>
        
        {history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-secondary)' }}>
            {t('dashboard.historyEmpty')}
          </div>
        ) : (
          <div className="history-list">
            {[...history].slice(0, 3).map((item, idx) => {
              const minutes = Math.floor(item.durationSeconds / 60);
              const dateObj = new Date(item.date);
              
              const formattedDate = language === 'th'
                ? dateObj.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })
                : dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: '2-digit' });
              
              return (
                <div key={item.id || idx} className="history-item">
                  <div className="history-header">
                    <span style={{ color: 'var(--color-cyan)' }}>{item.routineName}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{formattedDate} ({minutes} {language === 'th' ? 'นาที' : 'mins'})</span>
                  </div>
                  <div className="history-details">
                    <span style={{ fontWeight: 'bold', color: '#fff' }}>{t('dashboard.historyDetail')}: {item.totalVolume} kg</span> | {t('dashboard.historyExercises')}: {item.exercises.map(ex => `${ex.name} (${ex.sets.length} ${t('common.sets')})`).join(', ')}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
