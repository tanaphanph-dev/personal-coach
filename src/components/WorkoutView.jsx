import React, { useContext, useState, useEffect, useRef } from 'react';
import { AppContext } from '../context/AppContext';

export default function WorkoutView() {
  const { routines, exercises, addWorkoutLog, addRoutine, deleteRoutine, getTodayString } = useContext(AppContext);

  // States สำหรับสลับโหมด
  const [activeWorkout, setActiveWorkout] = useState(null); // โปรแกรมที่กำลังฝึกอยู่
  const [workoutTimer, setWorkoutTimer] = useState(0); // นาฬิกาจับเวลา (วินาที)
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [workoutState, setWorkoutState] = useState(null); // บันทึกรายละเอียดการยกสด

  // คอนเฟิร์มจบการฝึกสะสมปริมาตร
  const [showCongrats, setShowCongrats] = useState(false);
  const [lastWorkoutSummary, setLastWorkoutSummary] = useState(null);

  // โหมดสร้างโปรแกรมใหม่
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoutineName, setNewRoutineName] = useState('');
  const [selectedBuilderExercises, setSelectedBuilderExercises] = useState([]); // ท่าที่เลือกในตาราง

  const timerRef = useRef(null);

  // การทำงานของนาฬิกาจับเวลา
  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setWorkoutTimer(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning]);

  // ฟอร์แมตเวลา
  const formatTime = (totalSeconds) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return [
      hrs > 0 ? String(hrs).padStart(2, '0') : null,
      String(mins).padStart(2, '0'),
      String(secs).padStart(2, '0')
    ].filter(Boolean).join(':');
  };

  // เริ่มออกกำลังกาย
  const startWorkout = (routine) => {
    setActiveWorkout(routine);
    setWorkoutTimer(0);
    setIsTimerRunning(true);
    
    // ตั้งต้นโครงสร้างข้อมูลชุดการออกกำลังกายเปล่าๆ เพื่อให้ผู้ใช้ติ๊กบันทึก
    const initialExercises = routine.exercises.map(item => {
      const exerciseDetails = exercises.find(ex => ex.id === item.id) || { name: 'ท่าออกกำลังกายลึกลับ' };
      
      const sets = [];
      for (let i = 0; i < item.sets; i++) {
        sets.push({
          setNum: i + 1,
          reps: item.reps,
          weight: item.weight,
          completed: false
        });
      }

      return {
        id: item.id,
        name: exerciseDetails.name,
        sets: sets
      };
    });

    setWorkoutState({
      routineId: routine.id,
      routineName: routine.name,
      exercises: initialExercises
    });
  };

  // จัดการอัปเดตข้อมูลจำนวนครั้งหรือน้ำหนักในหน้าบันทึกสด
  const handleSetChange = (exerciseIdx, setIdx, field, value) => {
    setWorkoutState(prev => {
      const updatedExercises = [...prev.exercises];
      updatedExercises[exerciseIdx].sets[setIdx][field] = Number(value) || 0;
      return { ...prev, exercises: updatedExercises };
    });
  };

  // จัดการกดบันทึกเซต (ติ๊กถูก)
  const toggleSetComplete = (exerciseIdx, setIdx) => {
    setWorkoutState(prev => {
      const updatedExercises = [...prev.exercises];
      const setItem = updatedExercises[exerciseIdx].sets[setIdx];
      setItem.completed = !setItem.completed;
      return { ...prev, exercises: updatedExercises };
    });
  };

  // บันทึกและสรุปผลเมื่อจบเซสชัน
  const finishWorkout = () => {
    if (!workoutState) return;

    let totalVolume = 0;
    const completedExercises = [];

    workoutState.exercises.forEach(ex => {
      const completedSets = ex.sets.filter(s => s.completed);
      if (completedSets.length > 0) {
        completedSets.forEach(s => {
          totalVolume += s.reps * s.weight;
        });

        completedExercises.push({
          id: ex.id,
          name: ex.name,
          sets: completedSets.map(s => ({
            reps: s.reps,
            weight: s.weight,
            completed: true
          }))
        });
      }
    });

    if (completedExercises.length === 0) {
      alert('กรุณาติ๊กสำเร็จ (ปุ่มสีเขียว) อย่างน้อย 1 เซตเพื่อทำการบันทึกข้อมูลครับ');
      return;
    }

    const logEntry = {
      id: 'h_' + Date.now(),
      routineName: workoutState.routineName,
      date: getTodayString(),
      durationSeconds: workoutTimer,
      totalVolume: totalVolume,
      exercises: completedExercises
    };

    addWorkoutLog(logEntry);
    setIsTimerRunning(false);
    
    // ตั้งค่าสำหรับการแสดงผลสำเร็จความยินดี
    setLastWorkoutSummary({
      routineName: workoutState.routineName,
      volume: totalVolume,
      duration: formatTime(workoutTimer)
    });
    
    setActiveWorkout(null);
    setWorkoutState(null);
    setShowCongrats(true);
  };

  // ยกเลิกเซสชัน
  const cancelWorkout = () => {
    if (window.confirm('คุณต้องการยกเลิกเซสชันออกกำลังกายนี้ใช่หรือไม่? ข้อมูลประจุนี้จะหายไป')) {
      setIsTimerRunning(false);
      setActiveWorkout(null);
      setWorkoutState(null);
    }
  };

  // หน้าโปรแกรมสร้าง Routine
  const handleAddBuilderExercise = (exerciseId) => {
    if (selectedBuilderExercises.some(ex => ex.id === exerciseId)) return;
    setSelectedBuilderExercises(prev => [...prev, { id: exerciseId, sets: 3, reps: 10, weight: 10 }]);
  };

  const handleRemoveBuilderExercise = (exerciseId) => {
    setSelectedBuilderExercises(prev => prev.filter(ex => ex.id !== exerciseId));
  };

  const handleBuilderParamChange = (exerciseId, field, value) => {
    setSelectedBuilderExercises(prev => prev.map(ex => {
      if (ex.id === exerciseId) {
        return { ...ex, [field]: Number(value) || 0 };
      }
      return ex;
    }));
  };

  const saveNewRoutine = (e) => {
    e.preventDefault();
    if (!newRoutineName.trim()) {
      alert('กรุณากรอกชื่อโปรแกรมการออกกำลังกาย');
      return;
    }
    if (selectedBuilderExercises.length === 0) {
      alert('กรุณาเลือกท่าออกกำลังกายอย่างน้อย 1 ท่า');
      return;
    }

    const newRoutine = {
      id: 'r_' + Date.now(),
      name: newRoutineName,
      exercises: selectedBuilderExercises
    };

    addRoutine(newRoutine);
    
    // รีเซ็ตค่า
    setNewRoutineName('');
    setSelectedBuilderExercises([]);
    setShowCreateModal(false);
  };

  return (
    <div className="cyber-container">
      {/* 1. แสดงยินดีหลังออกเสร็จ (Congrats Overlay Splash) */}
      {showCongrats && lastWorkoutSummary && (
        <div className="congrats-overlay">
          <div className="congrats-box">
            <div className="congrats-title">⚡ SESSION COMPLETED ⚡</div>
            <div className="congrats-sub">บันทึกข้อมูลเข้าระบบความแกร่งแล้ว!</div>
            
            <div className="glass-panel" style={{ background: 'rgba(0,0,0,0.3)', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>โปรแกรม: <span style={{ color: '#fff', fontWeight: 'bold' }}>{lastWorkoutSummary.routineName}</span></div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>เวลาฝึกซ้อมจริง: <span style={{ color: 'var(--color-cyan)', fontWeight: 'bold' }}>{lastWorkoutSummary.duration} นาที</span></div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>ปริมาณงานซ้อมรวม: <span style={{ color: 'var(--color-green)', fontWeight: 'bold' }}>{lastWorkoutSummary.volume} kg</span></div>
            </div>

            <button className="cyber-btn cyber-btn-success" onClick={() => setShowCongrats(false)}>
              ปิดหน้าต่าง & ไปแดชบอร์ด
            </button>
          </div>
        </div>
      )}

      {/* 2. หน้าเล่นการออกกำลังกายแบบบันทึกสด (Active Workout Player View) */}
      {activeWorkout && workoutState ? (
        <div className="glass-panel trim-cyan" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'between', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '14px' }}>
            <div>
              <h2 style={{ color: 'var(--color-cyan)', fontSize: '1.25rem' }}>💪 กำลังออกกำลังกาย: {activeWorkout.name}</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>กรอกน้ำหนักและครั้ง จากนั้นกดปุ่มสีเขียวเมื่อยกครบเซต</p>
            </div>
            
            <div className="timer-box" style={{ minWidth: '150px', padding: '10px' }}>
              <span className="stat-label" style={{ fontSize: '0.6rem' }}>เวลาฝึกสด</span>
              <span className="timer-digits" style={{ fontSize: '1.8rem' }}>{formatTime(workoutTimer)}</span>
            </div>
          </div>

          <div className="workout-player-container">
            {workoutState.exercises.map((ex, exIdx) => (
              <div key={ex.id || exIdx} className={`player-exercise-card ${ex.sets.every(s => s.completed) ? 'completed' : ''}`}>
                <h4 style={{ color: 'var(--color-cyan)', marginBottom: '12px', fontSize: '0.95rem' }}>
                  {exIdx + 1}. {ex.name}
                </h4>

                {/* ส่วนหัวตารางสำหรับแสดงบนจอคอมและปรับปรุงให้อ่านง่าย */}
                <div className="set-row" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontWeight: 'bold', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  <div className="set-number">เซต</div>
                  <div style={{ textTransform: 'uppercase', textAlign: 'center' }}>น้ำหนัก (kg)</div>
                  <div style={{ textTransform: 'uppercase', textAlign: 'center' }}>ครั้ง (Reps)</div>
                  <div style={{ textTransform: 'uppercase', textAlign: 'center' }}>เสร็จ</div>
                </div>

                {ex.sets.map((set, setIdx) => (
                  <div key={setIdx} className="set-row">
                    <div className="set-number">{set.setNum}</div>
                    <div>
                      <input 
                        type="number" 
                        className="set-input"
                        value={set.weight}
                        disabled={set.completed}
                        onChange={(e) => handleSetChange(exIdx, setIdx, 'weight', e.target.value)}
                      />
                    </div>
                    <div>
                      <input 
                        type="number" 
                        className="set-input"
                        value={set.reps}
                        disabled={set.completed}
                        onChange={(e) => handleSetChange(exIdx, setIdx, 'reps', e.target.value)}
                      />
                    </div>
                    <div>
                      <div 
                        className={`set-check ${set.completed ? 'checked' : ''}`}
                        onClick={() => toggleSetComplete(exIdx, setIdx)}
                      >
                        {set.completed ? '✓' : ''}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'end', marginTop: '20px' }}>
            <button className="cyber-btn cyber-btn-secondary" onClick={cancelWorkout}>
              ยกเลิกการฝึก
            </button>
            <button className="cyber-btn cyber-btn-success" onClick={finishWorkout}>
              เสร็จสิ้นการฝึก
            </button>
          </div>
        </div>
      ) : (
        /* 3. หน้ารายการ Routine หลัก (Routine Selection and Creation) */
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: 'var(--color-cyan)' }}>💪</span> โปรแกรมการฝึกซ้อมของคุณ
            </h2>
            <button className="cyber-btn cyber-btn-sm" onClick={() => setShowCreateModal(true)}>
              + สร้างโปรแกรม
            </button>
          </div>

          {routines.length === 0 ? (
            <div className="glass-panel" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
              ยังไม่มีโปรแกรมการฝึกซ้อมของคุณในระบบ กดปุ่ม "+ สร้างโปรแกรม" ด้านบนเพื่อเริ่มกำหนดตารางฝึกซ้อม
            </div>
          ) : (
            <div className="grid-2">
              {routines.map(routine => {
                return (
                  <div key={routine.id} className="glass-panel trim-cyan" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px' }}>
                    <div>
                      <h3 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '8px' }}>{routine.name}</h3>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                        ประกอบด้วย {routine.exercises.length} ท่าออกกำลังกาย
                      </p>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {routine.exercises.map((item, idx) => {
                          const exInfo = exercises.find(e => e.id === item.id) || { name: 'ท่าออกกำลังกาย' };
                          return (
                            <div key={idx} style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'between' }}>
                              <span>• {exInfo.name}</span>
                              <span style={{ color: 'var(--color-cyan)' }}>{item.sets} เซต x {item.reps} ครั้ง ({item.weight} kg)</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
                      <button 
                        className="cyber-btn cyber-btn-sm" 
                        style={{ background: 'var(--color-cyan)', color: 'black', border: 'none' }}
                        onClick={() => startWorkout(routine)}
                      >
                        ▶ เริ่มออกกำลังกาย
                      </button>
                      <button 
                        className="cyber-btn cyber-btn-sm cyber-btn-secondary" 
                        style={{ padding: '4px 8px', fontSize: '0.65rem' }}
                        onClick={() => {
                          if (window.confirm(`ต้องการลบโปรแกรม "${routine.name}" หรือไม่?`)) {
                            deleteRoutine(routine.id);
                          }
                        }}
                      >
                        ลบ
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 4. Modal สำหรับสร้างโปรแกรมออกกำลังกายใหม่ (Create Routine Modal) */}
      {showCreateModal && (
        <div className="cyber-modal-overlay">
          <div className="cyber-modal" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3 className="modal-title">🔨 กำหนดตารางฝึกใหม่</h3>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>×</button>
            </div>
            
            <form onSubmit={saveNewRoutine} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="cyber-input-group">
                <label className="cyber-label">ชื่อตารางฝึก/โปรแกรม</label>
                <input 
                  type="text" 
                  className="cyber-input" 
                  placeholder="เช่น Push Day (อก/ไหล่), เล่นขาเน้นสะโพก"
                  value={newRoutineName}
                  onChange={(e) => setNewRoutineName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="cyber-label" style={{ marginBottom: '8px', display: 'block' }}>เพิ่มท่าออกกำลังกายในโปรแกรม</label>
                
                {/* ดรอปดาวน์เลือกท่าฝึกที่มีอยู่ */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                  <select 
                    className="cyber-select" 
                    style={{ flexGrow: 1 }}
                    defaultValue=""
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAddBuilderExercise(e.target.value);
                        e.target.value = ''; // รีเซ็ตการเลือก
                      }
                    }}
                  >
                    <option value="" disabled>--- เลือกท่าฝึกแล้วกดเพิ่ม ---</option>
                    {exercises.map(ex => (
                      <option key={ex.id} value={ex.id}>
                        {ex.category} - {ex.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* รายชื่อท่าฝึกที่แอดเข้ามาในตาราง */}
                {selectedBuilderExercises.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(0,0,0,0.15)', borderRadius: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    ยังไม่ได้เลือกท่าใดๆ กรุณาเลือกท่าฝึกจากดรอปดาวน์ด้านบน
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '200px', overflowY: 'auto', paddingRight: '4px' }}>
                    {selectedBuilderExercises.map((item, idx) => {
                      const exInfo = exercises.find(e => e.id === item.id) || { name: 'ท่าฝึก' };
                      return (
                        <div key={item.id} className="builder-exercise-row">
                          <span style={{ fontSize: '0.85rem', fontWeight: 'bold', maxWidth: '40%' }}>{exInfo.name}</span>
                          
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>เซต</span>
                              <input 
                                type="number" 
                                style={{ width: '45px', textAlign: 'center', background: 'black', border: '1px solid var(--glass-border)', color: 'white', fontSize: '0.75rem', padding: '2px' }}
                                value={item.sets}
                                min="1"
                                onChange={(e) => handleBuilderParamChange(item.id, 'sets', e.target.value)}
                              />
                            </div>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>ครั้ง</span>
                              <input 
                                type="number" 
                                style={{ width: '45px', textAlign: 'center', background: 'black', border: '1px solid var(--glass-border)', color: 'white', fontSize: '0.75rem', padding: '2px' }}
                                value={item.reps}
                                min="1"
                                onChange={(e) => handleBuilderParamChange(item.id, 'reps', e.target.value)}
                              />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>น้ำหนัก</span>
                              <input 
                                type="number" 
                                style={{ width: '45px', textAlign: 'center', background: 'black', border: '1px solid var(--glass-border)', color: 'white', fontSize: '0.75rem', padding: '2px' }}
                                value={item.weight}
                                min="0"
                                onChange={(e) => handleBuilderParamChange(item.id, 'weight', e.target.value)}
                              />
                            </div>

                            <button 
                              type="button"
                              className="cyber-btn cyber-btn-sm cyber-btn-secondary"
                              style={{ padding: '2px 6px', fontSize: '0.6rem', marginTop: '10px' }}
                              onClick={() => handleRemoveBuilderExercise(item.id)}
                            >
                              ออก
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'end', marginTop: '10px' }}>
                <button type="button" className="cyber-btn cyber-btn-secondary" onClick={() => setShowCreateModal(false)}>
                  ยกเลิก
                </button>
                <button type="submit" className="cyber-btn cyber-btn-success">
                  บันทึกตารางฝึก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
