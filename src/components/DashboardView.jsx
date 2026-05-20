import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';

export default function DashboardView() {
  const { history, nutritionLog, userProfile, getStreakCount, getTodayString } = useContext(AppContext);
  
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
          เพิ่มประวัติออกกำลังกายเพื่อแสดงกราฟประสิทธิภาพนีออน
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

  return (
    <div className="cyber-container">
      <h2 style={{ marginBottom: '24px', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ color: 'var(--color-cyan)' }}>⚡</span> แดชบอร์ดสรุปผลประจำวัน
      </h2>

      {/* แถวการ์ดสถิติ 3 ช่อง */}
      <div className="grid-3" style={{ marginBottom: '24px' }}>
        <div className="glass-panel trim-cyan stat-card">
          <div className="stat-label">การฝึกต่อเนื่อง (Streak)</div>
          <div className="stat-value" style={{ color: 'var(--color-cyan)', textShadow: 'var(--shadow-cyan)' }}>
            {streak} <span className="stat-unit">วัน</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
            {streak > 0 ? 'รักษาวินัยการออกกำลังกายได้เยี่ยมยอด!' : 'เริ่มออกกำลังกายเลยเพื่อเก็บประวัติสตรีค'}
          </div>
        </div>

        <div className="glass-panel trim-magenta stat-card">
          <div className="stat-label">วันนี้ได้รับแคลอรี</div>
          <div className="stat-value" style={{ color: 'var(--color-magenta)', textShadow: 'var(--shadow-magenta)' }}>
            {todayTotals.calories} <span className="stat-unit">/ {userProfile.dailyCalories} kcal</span>
          </div>
          <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', marginTop: '8px', overflow: 'hidden' }}>
            <div style={{ width: `${calPercent}%`, height: '100%', background: 'var(--color-magenta)', boxShadow: 'var(--shadow-magenta)' }}></div>
          </div>
        </div>

        <div className="glass-panel trim-green stat-card">
          <div className="stat-label">การออกกำลังกายที่บันทึกแล้ว</div>
          <div className="stat-value" style={{ color: 'var(--color-green)', textShadow: 'var(--shadow-green)' }}>
            {history.length} <span className="stat-unit">ครั้ง</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
            {history.length > 0 ? `เซสชันล่าสุด: ${history[0].routineName}` : 'กำลังรอเซสชันแรกของคุณ'}
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* หน้าจอโภชนาการประจำวัน */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '1rem', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
            🎯 การกระจายสารอาหารและเป้าหมายวันนี้
          </h3>
          <div className="macro-container">
            {renderMacroRing(proteinPercent, 'var(--color-cyan)', 'โปรตีน', todayTotals.protein, 'g', userProfile.dailyProtein)}
            {renderMacroRing(carbsPercent, 'var(--color-yellow)', 'คาร์โบไฮเดรต', todayTotals.carbs, 'g', userProfile.dailyCarbs)}
            {renderMacroRing(fatPercent, 'var(--color-magenta)', 'ไขมัน', todayTotals.fat, 'g', userProfile.dailyFat)}
          </div>
          <div className="glass-panel" style={{ background: 'rgba(0,0,0,0.15)', padding: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', width: '100%' }}>
              <div className="stat-label" style={{ flexGrow: 1 }}>การดื่มน้ำดื่มวันนี้</div>
              <div style={{ fontFamily: 'var(--font-display)', color: 'var(--color-cyan)', fontWeight: 'bold' }}>
                {todayNutrition.water} / {userProfile.waterGoal} แก้ว
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
            📈 แนวโน้มปริมาณการซ้อมรวม (Volume 5 ครั้งล่าสุด)
          </h3>
          <div style={{ position: 'relative', height: '100%', minHeight: '120px' }}>
            {renderSVGChart()}
          </div>
          <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '6px' }}>
            *ปริมาณการซ้อมรวมคำนวณจาก (เซต x จำนวนครั้ง x น้ำหนักที่ยก) ในแต่ละท่ารวมกัน
          </p>
        </div>
      </div>

      {/* รายการประวัติล่าช้าล่าสุด */}
      <div className="glass-panel" style={{ marginTop: '20px' }}>
        <h3 style={{ fontSize: '1rem', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px', marginBottom: '16px' }}>
          🗓️ ประวัติเซสชันการฝึก 3 ครั้งล่าสุด
        </h3>
        
        {history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-secondary)' }}>
            ยังไม่เคยมีบันทึกประวัติการออกกำลังกาย
          </div>
        ) : (
          <div className="history-list">
            {[...history].slice(0, 3).map((item, idx) => {
              const minutes = Math.floor(item.durationSeconds / 60);
              const dateObj = new Date(item.date);
              const thaiDate = dateObj.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
              
              return (
                <div key={item.id || idx} className="history-item">
                  <div className="history-header">
                    <span style={{ color: 'var(--color-cyan)' }}>{item.routineName}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{thaiDate} ({minutes} นาที)</span>
                  </div>
                  <div className="history-details">
                    <span style={{ fontWeight: 'bold', color: '#fff' }}>ปริมาณแรงซ้อมรวม: {item.totalVolume} kg</span> | ท่าฝึก: {item.exercises.map(ex => `${ex.name} (${ex.sets.length} เซต)`).join(', ')}
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
