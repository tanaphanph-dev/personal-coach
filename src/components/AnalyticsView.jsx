import React, { useContext, useState, useMemo } from 'react';
import { AppContext } from '../context/AppContext';

export default function AnalyticsView() {
  const { history, nutritionLog, exercises, userProfile, t, language } = useContext(AppContext);
  const [selectedExerciseId, setSelectedExerciseId] = useState('');
  const [activeDonutIndex, setActiveDonutIndex] = useState(null);
  const [hoveredBarIndex, setHoveredBarIndex] = useState(null);

  // -------------------------------------------------------------
  // Chart 1: 1RM Progression Line Chart
  // -------------------------------------------------------------
  
  // Find all unique exercises that have actual logs in history
  const loggedExercises = useMemo(() => {
    const uniqueEx = new Map();
    if (!history) return [];
    
    // Scan history backwards (chronological order)
    [...history].reverse().forEach(session => {
      if (!session.exercises) return;
      session.exercises.forEach(ex => {
        if (!uniqueEx.has(ex.id)) {
          // Find standard details from exercise catalog
          const catalogEx = exercises.find(catalog => catalog.id === ex.id);
          uniqueEx.set(ex.id, {
            id: ex.id,
            name: catalogEx ? catalogEx.name : ex.name,
            category: catalogEx ? catalogEx.category : 'General'
          });
        }
      });
    });
    
    const list = Array.from(uniqueEx.values());
    // Auto-select first exercise if not set
    if (list.length > 0 && !selectedExerciseId) {
      setSelectedExerciseId(list[0].id);
    }
    return list;
  }, [history, exercises, selectedExerciseId]);

  // Extract 1RM data for the selected exercise
  const oneRepMaxData = useMemo(() => {
    if (!selectedExerciseId || !history) return [];
    
    const trend = [];
    // Go chronologically
    [...history].reverse().forEach(session => {
      if (!session.exercises) return;
      const exInstance = session.exercises.find(ex => ex.id === selectedExerciseId);
      if (!exInstance || !exInstance.sets) return;
      
      // Calculate max 1RM for this session's sets: 1RM = weight * (1 + reps/30)
      let max1RM = 0;
      exInstance.sets.forEach(set => {
        if (set.completed && set.weight > 0 && set.reps > 0) {
          const estimated1RM = set.weight * (1 + set.reps / 30);
          if (estimated1RM > max1RM) {
            max1RM = estimated1RM;
          }
        }
      });
      
      if (max1RM > 0) {
        trend.push({
          date: session.date,
          rawDate: new Date(session.date),
          value: Math.round(max1RM * 10) / 10
        });
      }
    });
    
    return trend.sort((a, b) => a.rawDate - b.rawDate);
  }, [selectedExerciseId, history]);

  // -------------------------------------------------------------
  // Chart 2: Muscle Workload Volume Distribution (Donut Chart)
  // -------------------------------------------------------------
  
  const muscleWorkloadData = useMemo(() => {
    const volumes = {
      Chest: 0,
      Back: 0,
      Legs: 0,
      Shoulders: 0,
      Arms: 0,
      Core: 0,
      Other: 0
    };
    
    let totalVolume = 0;
    
    if (history) {
      history.forEach(session => {
        if (!session.exercises) return;
        session.exercises.forEach(ex => {
          // Determine muscle group
          const catalogEx = exercises.find(catalog => catalog.id === ex.id);
          const category = catalogEx ? catalogEx.category.toLowerCase() : '';
          
          let muscleGroup = 'Other';
          if (category.includes('chest') || category.includes('อก')) muscleGroup = 'Chest';
          else if (category.includes('back') || category.includes('หลัง')) muscleGroup = 'Back';
          else if (category.includes('leg') || category.includes('ขา')) muscleGroup = 'Legs';
          else if (category.includes('shoulder') || category.includes('ไหล่')) muscleGroup = 'Shoulders';
          else if (category.includes('arm') || category.includes('แขน')) muscleGroup = 'Arms';
          else if (category.includes('core') || category.includes('แกนกลาง')) muscleGroup = 'Core';
          
          let volume = 0;
          if (ex.sets) {
            ex.sets.forEach(set => {
              if (set.completed) {
                volume += (set.weight || 0) * (set.reps || 0);
              }
            });
          }
          
          volumes[muscleGroup] += volume;
          totalVolume += volume;
        });
      });
    }
    
    const colors = {
      Chest: 'var(--color-cyan)',
      Back: 'var(--color-magenta)',
      Legs: '#39ff14', // neon green
      Shoulders: '#ff007f', // hot pink
      Arms: '#ffb300', // golden neon
      Core: '#9d00ff', // cyber purple
      Other: '#888888'
    };
    
    return Object.keys(volumes)
      .map(key => ({
        name: key,
        value: volumes[key],
        color: colors[key],
        percentage: totalVolume > 0 ? Math.round((volumes[key] / totalVolume) * 100) : 0
      }))
      .filter(item => item.value > 0);
  }, [history, exercises]);

  // -------------------------------------------------------------
  // Chart 3: 7-Day Calorie Balance (Dual Bar Chart)
  // -------------------------------------------------------------
  
  const weeklyCalorieData = useMemo(() => {
    const data = [];
    const targetCal = userProfile.dailyCalories || 2000;
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      
      const dayData = nutritionLog[dateStr] || { water: 0, foods: [] };
      const actualCal = (dayData.foods || []).reduce((sum, f) => sum + (f.calories || 0), 0);
      
      // Formatted Label (e.g. "20 May" or "20 พ.ค.")
      const options = { day: 'numeric', month: 'short' };
      const label = d.toLocaleDateString(language === 'en' ? 'en-US' : 'th-TH', options);
      
      data.push({
        date: dateStr,
        label,
        target: targetCal,
        actual: actualCal,
        diff: actualCal - targetCal
      });
    }
    return data;
  }, [nutritionLog, userProfile, language]);

  // Helpers for line chart drawing
  const getLineChartPath = (data, width, height, padding) => {
    if (data.length === 0) return '';
    const minVal = Math.min(...data.map(d => d.value)) * 0.9;
    const maxVal = Math.max(...data.map(d => d.value)) * 1.1;
    const valRange = maxVal - minVal || 1;
    
    const points = data.map((d, index) => {
      const x = padding + (index * (width - 2 * padding)) / (data.length - 1 || 1);
      const y = height - padding - ((d.value - minVal) * (height - 2 * padding)) / valRange;
      return `${x},${y}`;
    });
    
    return `M ${points.join(' L ')}`;
  };

  const getLinePoints = (data, width, height, padding) => {
    if (data.length === 0) return [];
    const minVal = Math.min(...data.map(d => d.value)) * 0.9;
    const maxVal = Math.max(...data.map(d => d.value)) * 1.1;
    const valRange = maxVal - minVal || 1;
    
    return data.map((d, index) => {
      const x = padding + (index * (width - 2 * padding)) / (data.length - 1 || 1);
      const y = height - padding - ((d.value - minVal) * (height - 2 * padding)) / valRange;
      return { x, y, ...d };
    });
  };

  // Render donut chart segments
  let accumulatedPercent = 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-500 uppercase">
            {t('analytics.title')}
          </h2>
          <p className="text-xs text-gray-400">
            {language === 'en' ? 'Diagnostics & Performance Matrix' : 'สถิติประเมินประสิทธิภาพโครงข่ายและพละกำลัง'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* CHART 1: 1RM LINE GRAPH */}
        <div className="glass-panel p-5 relative overflow-hidden" style={{ minHeight: '380px' }}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
            <div>
              <h3 className="text-md font-semibold text-cyan-400 uppercase tracking-wide flex items-center gap-2">
                <span>📈</span> {t('analytics.oneRepMax')}
              </h3>
              <p className="text-[10px] text-gray-400">{t('analytics.oneRepMaxDesc')}</p>
            </div>
            
            {loggedExercises.length > 0 && (
              <select
                value={selectedExerciseId}
                onChange={(e) => setSelectedExerciseId(e.target.value)}
                className="cyber-input text-xs py-1 px-2 max-w-[200px]"
              >
                {loggedExercises.map(ex => (
                  <option key={ex.id} value={ex.id}>{ex.name}</option>
                ))}
              </select>
            )}
          </div>

          {oneRepMaxData.length === 0 ? (
            <div className="h-60 flex flex-col items-center justify-center text-center p-4">
              <span className="text-3xl mb-2">💾</span>
              <p className="text-xs text-gray-500">{t('analytics.noData')}</p>
            </div>
          ) : (
            <div className="relative">
              <svg viewBox="0 0 500 240" className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="neonCyanGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-cyan)" stopOpacity="1" />
                    <stop offset="100%" stopColor="var(--color-cyan)" stopOpacity="0.2" />
                  </linearGradient>
                  <filter id="neonGlowCyan" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* Y-axis guidelines */}
                {[0, 1, 2, 3, 4].map(i => {
                  const y = 30 + i * 40;
                  return (
                    <line
                      key={i}
                      x1="40"
                      y1={y}
                      x2="480"
                      y2={y}
                      stroke="rgba(0,255,255,0.06)"
                      strokeWidth="1"
                      strokeDasharray="4 4"
                    />
                  );
                })}

                {/* Main line path */}
                <path
                  d={getLineChartPath(oneRepMaxData, 500, 240, 40)}
                  fill="none"
                  stroke="var(--color-cyan)"
                  strokeWidth="3"
                  filter="url(#neonGlowCyan)"
                />

                {/* Data points */}
                {getLinePoints(oneRepMaxData, 500, 240, 40).map((pt, idx) => (
                  <g key={idx} className="cursor-pointer group">
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="5"
                      fill="var(--color-dark)"
                      stroke="var(--color-cyan)"
                      strokeWidth="2.5"
                    />
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="10"
                      fill="var(--color-cyan)"
                      fillOpacity="0"
                      className="group-hover:fill-opacity-20 transition-all duration-200"
                    />
                    {/* Tooltip Overlay */}
                    <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                      <rect
                        x={pt.x - 35}
                        y={pt.y - 32}
                        width="70"
                        height="20"
                        rx="3"
                        fill="rgba(10, 15, 30, 0.95)"
                        stroke="var(--color-cyan)"
                        strokeWidth="1"
                      />
                      <text
                        x={pt.x}
                        y={pt.y - 18}
                        fill="#fff"
                        fontSize="9"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {pt.value} kg
                      </text>
                    </g>
                    {/* X-axis date labels */}
                    {idx === 0 || idx === oneRepMaxData.length - 1 || oneRepMaxData.length < 5 ? (
                      <text
                        x={pt.x}
                        y="225"
                        fill="#888"
                        fontSize="8"
                        textAnchor="middle"
                      >
                        {new Date(pt.date).toLocaleDateString(language === 'en' ? 'en-US' : 'th-TH', { month: 'short', day: 'numeric' })}
                      </text>
                    ) : null}
                  </g>
                ))}
              </svg>
            </div>
          )}
        </div>

        {/* CHART 2: MUSCLE WORKLOAD DONUT CHART */}
        <div className="glass-panel p-5 relative overflow-hidden" style={{ minHeight: '380px' }}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-magenta-500/5 rounded-full blur-2xl pointer-events-none"></div>
          
          <h3 className="text-md font-semibold text-magenta-400 uppercase tracking-wide flex items-center gap-2 mb-1">
            <span>🕸️</span> {t('analytics.muscleWorkload')}
          </h3>
          <p className="text-[10px] text-gray-400 mb-4">{t('analytics.muscleWorkloadDesc')}</p>

          {muscleWorkloadData.length === 0 ? (
            <div className="h-60 flex flex-col items-center justify-center text-center p-4">
              <span className="text-3xl mb-2">⚡</span>
              <p className="text-xs text-gray-500">{t('analytics.noData')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              {/* Donut SVG */}
              <div className="flex justify-center relative">
                <svg width="180" height="180" viewBox="0 0 100 100">
                  {/* Background Circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="rgba(255,255,255,0.03)"
                    strokeWidth="8"
                  />
                  {/* Dynamic Segments */}
                  {muscleWorkloadData.map((item, index) => {
                    const radius = 40;
                    const circumference = 2 * Math.PI * radius;
                    const strokeDash = (item.percentage / 100) * circumference;
                    const strokeOffset = circumference - (accumulatedPercent / 100) * circumference;
                    accumulatedPercent += item.percentage;
                    
                    const isHighlighted = activeDonutIndex === index || activeDonutIndex === null;

                    return (
                      <circle
                        key={item.name}
                        cx="50"
                        cy="50"
                        r={radius}
                        fill="transparent"
                        stroke={item.color}
                        strokeWidth={activeDonutIndex === index ? 10 : 8}
                        strokeDasharray={`${strokeDash} ${circumference}`}
                        strokeDashoffset={strokeOffset}
                        transform="rotate(-90 50 50)"
                        className="transition-all duration-300 cursor-pointer"
                        onMouseEnter={() => setActiveDonutIndex(index)}
                        onMouseLeave={() => setActiveDonutIndex(null)}
                        strokeOpacity={isHighlighted ? 1 : 0.25}
                        style={{
                          filter: activeDonutIndex === index ? `drop-shadow(0 0 3px ${item.color})` : 'none'
                        }}
                      />
                    );
                  })}
                </svg>

                {/* Absolute Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  {activeDonutIndex !== null ? (
                    <>
                      <span className="text-xs text-gray-400 uppercase tracking-widest">
                        {muscleWorkloadData[activeDonutIndex].name}
                      </span>
                      <span className="text-xl font-bold" style={{ color: muscleWorkloadData[activeDonutIndex].color }}>
                        {muscleWorkloadData[activeDonutIndex].percentage}%
                      </span>
                      <span className="text-[9px] text-gray-500">
                        {muscleWorkloadData[activeDonutIndex].value} kg
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-[10px] text-gray-400 uppercase tracking-widest">TOTAL</span>
                      <span className="text-lg font-bold text-white">
                        {muscleWorkloadData.reduce((s, x) => s + x.value, 0)}
                      </span>
                      <span className="text-[9px] text-gray-500">kg volume</span>
                    </>
                  )}
                </div>
              </div>

              {/* Legends */}
              <div className="space-y-2">
                {muscleWorkloadData.map((item, index) => (
                  <div
                    key={item.name}
                    className="flex justify-between items-center p-2 rounded cursor-pointer transition-all"
                    style={{
                      background: activeDonutIndex === index ? 'rgba(255,255,255,0.04)' : 'transparent',
                      borderLeft: `3px solid ${item.color}`
                    }}
                    onMouseEnter={() => setActiveDonutIndex(index)}
                    onMouseLeave={() => setActiveDonutIndex(null)}
                  >
                    <span className="text-xs font-medium text-gray-300 uppercase tracking-wide pl-2">
                      {item.name}
                    </span>
                    <div className="text-right">
                      <span className="text-xs font-bold text-white">{item.percentage}%</span>
                      <span className="text-[9px] text-gray-400 block">{item.value} kg</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CHART 3: 7-DAY CALORIE BALANCING CHART */}
      <div className="glass-panel p-5 relative overflow-hidden">
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl pointer-events-none"></div>
        
        <h3 className="text-md font-semibold text-purple-400 uppercase tracking-wide flex items-center gap-2 mb-1">
          <span>🔥</span> {t('analytics.calorieWeekly')}
        </h3>
        <p className="text-[10px] text-gray-400 mb-6">{t('analytics.calorieWeeklyDesc')}</p>

        <div className="relative">
          {/* Chart Bars */}
          <div className="grid grid-cols-7 gap-2 md:gap-4 h-64 items-end pt-4 border-b border-gray-800">
            {weeklyCalorieData.map((day, idx) => {
              const maxCal = Math.max(...weeklyCalorieData.map(d => Math.max(d.target, d.actual, 1000)));
              
              // Heights in percent
              const targetHeight = (day.target / maxCal) * 90;
              const actualHeight = (day.actual / maxCal) * 90;
              
              const isSurplus = day.actual > day.target;
              
              return (
                <div
                  key={day.date}
                  className="flex flex-col items-center justify-end h-full group cursor-pointer"
                  onMouseEnter={() => setHoveredBarIndex(idx)}
                  onMouseLeave={() => setHoveredBarIndex(null)}
                >
                  <div className="flex w-full items-end justify-center gap-1 min-h-[150px]">
                    {/* Target Bar (Left) */}
                    <div
                      className="w-3 sm:w-5 bg-gradient-to-t from-gray-700 to-cyan-500/50 rounded-t-sm transition-all duration-300"
                      style={{
                        height: `${targetHeight}%`,
                        opacity: hoveredBarIndex === idx || hoveredBarIndex === null ? 1 : 0.4
                      }}
                    />
                    
                    {/* Actual Bar (Right) */}
                    <div
                      className={`w-3 sm:w-5 bg-gradient-to-t rounded-t-sm transition-all duration-300 ${
                        isSurplus
                          ? 'from-magenta-900/40 to-fuchsia-500'
                          : 'from-emerald-950/40 to-emerald-400'
                      }`}
                      style={{
                        height: `${actualHeight}%`,
                        opacity: hoveredBarIndex === idx || hoveredBarIndex === null ? 1 : 0.4,
                        filter: hoveredBarIndex === idx ? 'drop-shadow(0 0 4px rgba(240, 46, 170, 0.4))' : 'none'
                      }}
                    />
                  </div>

                  {/* Day Label */}
                  <span className="text-[9px] md:text-xs text-gray-500 mt-2 block font-medium group-hover:text-cyan-400 transition-colors">
                    {day.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Floating Details Overlay */}
          <div className="min-h-[48px] mt-4 flex items-center justify-between px-2 bg-black/30 border border-gray-800/50 rounded-lg p-2.5">
            {hoveredBarIndex !== null ? (
              <>
                <div className="flex gap-4 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
                    <span className="text-[10px] text-gray-400 uppercase">{t('analytics.target')}:</span>
                    <span className="text-xs font-bold text-cyan-300">
                      {weeklyCalorieData[hoveredBarIndex].target} kcal
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${weeklyCalorieData[hoveredBarIndex].actual > weeklyCalorieData[hoveredBarIndex].target ? 'bg-fuchsia-500' : 'bg-emerald-400'}`}></div>
                    <span className="text-[10px] text-gray-400 uppercase">{t('analytics.actual')}:</span>
                    <span className={`text-xs font-bold ${weeklyCalorieData[hoveredBarIndex].actual > weeklyCalorieData[hoveredBarIndex].target ? 'text-fuchsia-400' : 'text-emerald-400'}`}>
                      {weeklyCalorieData[hoveredBarIndex].actual} kcal
                    </span>
                  </div>
                </div>

                <div>
                  {weeklyCalorieData[hoveredBarIndex].actual > 0 ? (
                    weeklyCalorieData[hoveredBarIndex].diff > 0 ? (
                      <span className="text-[10px] bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20 px-2 py-0.5 rounded font-mono uppercase">
                        ⚠️ +{weeklyCalorieData[hoveredBarIndex].diff} kcal {t('analytics.surplus')}
                      </span>
                    ) : (
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono uppercase">
                        ✅ {weeklyCalorieData[hoveredBarIndex].diff} kcal {t('analytics.deficit')}
                      </span>
                    )
                  ) : (
                    <span className="text-[10px] text-gray-500 italic">No food logged</span>
                  )}
                </div>
              </>
            ) : (
              <span className="text-xs text-gray-500 italic w-full text-center">
                {language === 'en' ? '👋 Hover over any bar to dissect calorie balance metrics' : '👋 ชี้เมาส์เหนือแท่งข้อมูลเพื่อแยกส่วนวิเคราะห์สถิติแคลอรี่สะสม'}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
