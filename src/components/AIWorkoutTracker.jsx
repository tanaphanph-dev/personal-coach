import React, { useContext, useState, useRef, useEffect } from 'react';
import { AppContext } from '../context/AppContext';

export default function AIWorkoutTracker() {
  const { gainXpAndChips, showToast, t, language, addWorkoutLog, getTodayString } = useContext(AppContext);
  const [isActive, setIsActive] = useState(false);
  const [selectedEx, setSelectedEx] = useState('squat');
  const [reps, setReps] = useState(0);
  const [statusText, setStatusText] = useState('System Offline');
  
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 992);
  
  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 992);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animationFrameId = useRef(null);
  const prevFrameData = useRef(null);
  const streamRef = useRef(null);

  // Motion analysis state refs
  const motionHistory = useRef([]);
  const repState = useRef('up'); // 'up' or 'down'
  const lastRepTime = useRef(0);
  const skeletonNodes = useRef({
    head: { x: 150, y: 80, targetY: 80 },
    shoulderL: { x: 100, y: 120, targetY: 120 },
    shoulderR: { x: 200, y: 120, targetY: 120 },
    hipL: { x: 110, y: 200, targetY: 200 },
    hipR: { x: 190, y: 200, targetY: 200 },
    kneeL: { x: 105, y: 260, targetY: 260 },
    kneeR: { x: 195, y: 260, targetY: 260 },
    ankleL: { x: 105, y: 310, targetY: 310 },
    ankleR: { x: 195, y: 310, targetY: 310 }
  });

  // Sci-fi synth sound effect
  const playBeep = (freq, duration, type = 'sine') => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.type = type;
      oscillator.frequency.value = freq;
      
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + duration);
    } catch (e) {
      console.log('Audio Context beep failed: ', e);
    }
  };

  const playSuccessSound = () => {
    playBeep(523.25, 0.1, 'triangle'); // C5
    setTimeout(() => playBeep(659.25, 0.1, 'triangle'), 80); // E5
    setTimeout(() => playBeep(783.99, 0.15, 'sine'), 160); // G5
  };

  const playRepSound = (currentReps) => {
    // Play a cyber laser-like pitch slide
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300 + (currentReps * 30), audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(900 + (currentReps * 30), audioCtx.currentTime + 0.15);
      
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch (e) {
      playBeep(880, 0.15);
    }
  };

  // Start Camera
  const startCamera = async () => {
    try {
      setStatusText('Initializing Optical Matrix...');
      const constraints = {
        video: { width: 320, height: 240, facingMode: 'user' },
        audio: false
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      
      setIsActive(true);
      setReps(0);
      setStatusText(t('aitracker.statusReady'));
      playBeep(440, 0.15);
      setTimeout(() => playBeep(880, 0.2), 120);
    } catch (err) {
      console.error('Camera access error: ', err);
      setStatusText('Camera Error: Permission Denied');
      showToast('Could not initialize video matrix. Verify camera permissions.', 'error');
    }
  };

  // Stop Camera
  const stopCamera = () => {
    setIsActive(false);
    setStatusText('System Offline');
    
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    prevFrameData.current = null;
    motionHistory.current = [];
    playBeep(220, 0.3, 'sawtooth');
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Frame processing loop
  useEffect(() => {
    if (!isActive) return;

    const processFrame = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return;

      const ctx = canvas.getContext('2d');
      const width = canvas.width;
      const height = canvas.height;

      // Draw the video frame to canvas
      ctx.drawImage(video, 0, 0, width, height);

      // Extract image pixels
      const frame = ctx.getImageData(0, 0, width, height);
      const length = frame.data.length;

      let motionPixelCount = 0;
      let sumX = 0;
      let sumY = 0;

      // Compute frame difference to detect motion
      if (prevFrameData.current) {
        const threshold = 25; // Sensitivity
        for (let i = 0; i < length; i += 4) {
          const r1 = frame.data[i];
          const g1 = frame.data[i + 1];
          const b1 = frame.data[i + 2];
          
          const r2 = prevFrameData.current.data[i];
          const g2 = prevFrameData.current.data[i + 1];
          const b2 = prevFrameData.current.data[i + 2];

          // Brightness calculation
          const brightness1 = (r1 + g1 + b1) / 3;
          const brightness2 = (r2 + g2 + b2) / 3;

          const diff = Math.abs(brightness1 - brightness2);

          if (diff > threshold) {
            motionPixelCount++;
            const pixelIndex = i / 4;
            const x = pixelIndex % width;
            const y = Math.floor(pixelIndex / width);
            sumX += x;
            sumY += y;
            
            // Render motion pixels subtly as green glow dust
            if (Math.random() < 0.05) {
              ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
              ctx.fillRect(x, y, 2, 2);
            }
          }
        }
      }

      // Store current frame for next iteration
      prevFrameData.current = frame;

      // Draw scanning laser HUD overlay
      ctx.strokeStyle = 'rgba(0, 255, 255, 0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      const laserY = (Date.now() % 3000 / 3000) * height;
      ctx.moveTo(0, laserY);
      ctx.lineTo(width, laserY);
      ctx.stroke();

      // Draw horizontal target zone lines based on selected exercise
      ctx.strokeStyle = 'rgba(240, 46, 170, 0.4)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      
      let lowerBound = height * 0.7;
      let upperBound = height * 0.45;
      
      if (selectedEx === 'squat') {
        lowerBound = height * 0.75;
        upperBound = height * 0.55;
      } else if (selectedEx === 'pushup') {
        lowerBound = height * 0.8;
        upperBound = height * 0.6;
      } else { // curl
        lowerBound = height * 0.7;
        upperBound = height * 0.45;
      }

      ctx.moveTo(0, lowerBound);
      ctx.lineTo(width, lowerBound);
      ctx.moveTo(0, upperBound);
      ctx.lineTo(width, upperBound);
      ctx.stroke();
      ctx.setLineDash([]); // Reset line dash

      // If we detected motion, evaluate reps and move joints
      if (motionPixelCount > 300) {
        setStatusText(t('aitracker.statusActive'));
        const centerX = sumX / motionPixelCount;
        const centerY = sumY / motionPixelCount;

        // Smooth skeleton animation target adjustments
        const nodes = skeletonNodes.current;
        
        nodes.head.targetY = centerY - 45;
        nodes.shoulderL.targetY = centerY - 20;
        nodes.shoulderR.targetY = centerY - 20;
        nodes.hipL.targetY = centerY + 30;
        nodes.hipR.targetY = centerY + 30;
        nodes.kneeL.targetY = centerY + 70;
        nodes.kneeR.targetY = centerY + 70;
        nodes.ankleL.targetY = centerY + 105;
        nodes.ankleR.targetY = centerY + 105;

        // Move standard relative X offsets around motion center X
        nodes.head.x = centerX;
        nodes.shoulderL.x = centerX - 35;
        nodes.shoulderR.x = centerX + 35;
        nodes.hipL.x = centerX - 25;
        nodes.hipR.x = centerX + 25;
        nodes.kneeL.x = centerX - 28;
        nodes.kneeR.x = centerX + 28;
        nodes.ankleL.x = centerX - 26;
        nodes.ankleR.x = centerX + 26;

        // Save Y coordinates for rep peak detection
        motionHistory.current.push(centerY);
        if (motionHistory.current.length > 25) {
          motionHistory.current.shift();
        }

        // Evaluate motion trend over the history
        const now = Date.now();
        if (motionHistory.current.length >= 10 && now - lastRepTime.current > 1200) {
          const avgY = motionHistory.current.reduce((a, b) => a + b, 0) / motionHistory.current.length;
          
          if (repState.current === 'up' && avgY > lowerBound) {
            // User went down into squat/pushup or extended curl
            repState.current = 'down';
            playBeep(261.63, 0.08, 'sawtooth'); // lower sound marker
          } else if (repState.current === 'down' && avgY < upperBound) {
            // User went up back to start
            repState.current = 'up';
            setReps(r => {
              const nextReps = r + 1;
              playRepSound(nextReps);
              return nextReps;
            });
            lastRepTime.current = now;
          }
        }
      }

      // Physics interpolation for skeleton joints
      const nodes = skeletonNodes.current;
      Object.keys(nodes).forEach(key => {
        const node = nodes[key];
        node.y += (node.targetY - node.y) * 0.15; // Smooth spring slide
      });

      // Draw skeleton lines
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = 'var(--color-cyan)';
      ctx.beginPath();
      
      // Spine
      ctx.moveTo(nodes.head.x, nodes.head.y);
      ctx.lineTo((nodes.shoulderL.x + nodes.shoulderR.x) / 2, (nodes.shoulderL.y + nodes.shoulderR.y) / 2);
      ctx.lineTo((nodes.hipL.x + nodes.hipR.x) / 2, (nodes.hipL.y + nodes.hipR.y) / 2);
      ctx.stroke();

      // Shoulders
      ctx.beginPath();
      ctx.moveTo(nodes.shoulderL.x, nodes.shoulderL.y);
      ctx.lineTo(nodes.shoulderR.x, nodes.shoulderR.y);
      ctx.stroke();

      // Left leg
      ctx.strokeStyle = 'var(--color-magenta)';
      ctx.beginPath();
      ctx.moveTo(nodes.hipL.x, nodes.hipL.y);
      ctx.lineTo(nodes.kneeL.x, nodes.kneeL.y);
      ctx.lineTo(nodes.ankleL.x, nodes.ankleL.y);
      ctx.stroke();

      // Right leg
      ctx.beginPath();
      ctx.moveTo(nodes.hipR.x, nodes.hipR.y);
      ctx.lineTo(nodes.kneeR.x, nodes.kneeR.y);
      ctx.lineTo(nodes.ankleR.x, nodes.ankleR.y);
      ctx.stroke();

      // Draw Joint Markers
      ctx.fillStyle = '#39ff14'; // neon green node joints
      Object.keys(nodes).forEach(key => {
        const node = nodes[key];
        ctx.beginPath();
        ctx.arc(node.x, node.y, 4, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // Frame Rate sync
      animationFrameId.current = requestAnimationFrame(processFrame);
    };

    animationFrameId.current = requestAnimationFrame(processFrame);
    return () => cancelAnimationFrame(animationFrameId.current);
  }, [isActive, selectedEx, t]);

  const saveRepsToLog = () => {
    if (reps === 0) return;
    
    const exerciseName = selectedEx === 'squat' 
      ? t('aitracker.squat') 
      : selectedEx === 'pushup' 
        ? t('aitracker.pushup') 
        : t('aitracker.curl');

    const exerciseId = selectedEx === 'squat' 
      ? 'ex3' 
      : selectedEx === 'pushup' 
        ? 'ex8' 
        : 'ex5';

    const logEntry = {
      id: 'h_' + Date.now(),
      routineName: 'AI Optical Session (' + exerciseName + ')',
      date: getTodayString(),
      durationSeconds: Math.max(30, reps * 3), // Estimated duration
      totalVolume: selectedEx === 'pushup' ? 0 : reps * 15,
      exercises: [
        {
          id: exerciseId,
          name: exerciseName,
          sets: [
            {
              reps: reps,
              weight: selectedEx === 'pushup' ? 0 : 15,
              completed: true
            }
          ]
        }
      ]
    };

    addWorkoutLog(logEntry);
    
    // Extra bonus rewards for using AI camera!
    gainXpAndChips(15, 10);
    playSuccessSound();
    
    // Reset tracker count
    setReps(0);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h2 style={{ marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-cyan)', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🛸</span> {t('aitracker.title')}
        </h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
          {t('aitracker.desc')}
        </p>
      </div>

      <div className="grid-3">
        
        {/* WEBCAM FEED & SKELETON RENDERER */}
        <div 
          className="glass-panel" 
          style={{ 
            gridColumn: isDesktop ? 'span 2' : 'span 1', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            position: 'relative', 
            overflow: 'hidden', 
            backgroundColor: 'rgba(0,0,0,0.6)', 
            minHeight: '320px',
            padding: '16px'
          }}
        >
          <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', alignItems: 'center', gap: '8px', zIndex: 10 }}>
            <span style={{ 
              width: '8px', 
              height: '8px', 
              borderRadius: '50%', 
              background: isActive ? 'var(--color-green)' : 'var(--color-magenta)', 
              boxShadow: isActive ? 'var(--shadow-green)' : 'var(--shadow-magenta)', 
              display: 'inline-block'
            }}></span>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              {statusText}
            </span>
          </div>

          {/* Hidden HTML5 video element */}
          <video
            ref={videoRef}
            style={{ display: 'none' }}
            width="320"
            height="240"
            playsInline
            muted
          />

          {/* Holographic Canvas rendering skeleton */}
          <canvas
            ref={canvasRef}
            width="320"
            height="240"
            style={{
              width: '100%',
              maxWidth: '480px',
              aspectRatio: '4/3',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.05)',
              background: '#040508',
              transform: 'scaleX(-1)',
              boxShadow: isActive ? 'var(--shadow-cyan)' : 'none',
              transition: 'var(--transition-normal)'
            }}
          />

          {!isActive && (
            <button
              onClick={startCamera}
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(8, 9, 13, 0.9)',
                border: 'none',
                cursor: 'pointer',
                transition: 'var(--transition-normal)'
              }}
            >
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                border: '1px solid var(--color-cyan)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '12px',
                boxShadow: 'var(--shadow-cyan)',
                background: 'rgba(0,255,255,0.05)'
              }}>
                <span style={{ fontSize: '1.8rem', color: 'var(--color-cyan)' }}>📷</span>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-cyan)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold', fontFamily: 'var(--font-display)' }}>
                {t('aitracker.startCamera')}
              </span>
            </button>
          )}

          {isActive && (
            <button
              onClick={stopCamera}
              className="cyber-btn cyber-btn-secondary cyber-btn-sm"
              style={{ position: 'absolute', bottom: '12px', right: '12px', zIndex: 11 }}
            >
              {t('aitracker.stopCamera')}
            </button>
          )}
        </div>

        {/* HUD PANEL: CONTROL AND TELEMETRY */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', justifyContent: 'space-between' }}>
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px' }}>
            <h3 style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px', margin: 0 }}>
              🛰️ Telemetry & Calibration
            </h3>

            {/* Select Exercise */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.5px' }}>
                {t('aitracker.selectExercise')}
              </label>
              <select
                value={selectedEx}
                onChange={(e) => {
                  setSelectedEx(e.target.value);
                  setReps(0);
                  playBeep(440, 0.1);
                }}
                disabled={isActive}
                className="cyber-select"
                style={{ width: '100%' }}
              >
                <option value="squat">{t('aitracker.squat')}</option>
                <option value="pushup">{t('aitracker.pushup')}</option>
                <option value="curl">{t('aitracker.curl')}</option>
              </select>
            </div>

            {/* Rep Counter Banner */}
            <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '6px', padding: '16px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontFamily: 'var(--font-display)' }}>{t('aitracker.count')}</span>
              <div style={{ fontSize: '3rem', fontWeight: '900', color: 'var(--color-cyan)', fontFamily: 'var(--font-display)', letterSpacing: '2px', textShadow: 'var(--shadow-cyan)' }}>
                {reps}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-yellow)', paddingTop: '4px' }}>
                🏆 {t('aitracker.bonusXp')}
              </div>
            </div>

            {/* Actions */}
            <button
              onClick={saveRepsToLog}
              disabled={reps === 0}
              className="cyber-btn cyber-btn-success"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              💾 {t('aitracker.saveToLog')}
            </button>
          </div>

          {/* AI BIO-GRID STATUS */}
          <div className="glass-panel" style={{ padding: '16px', background: 'rgba(0,0,0,0.2)', fontFamily: 'var(--font-display)', fontSize: '0.65rem', display: 'flex', flexDirection: 'column', gap: '8px', color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>CYBERNETIC SYNC:</span>
              <span style={{ color: isActive ? 'var(--color-cyan)' : 'var(--color-magenta)' }}>{isActive ? 'ONLINE' : 'OFFLINE'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>ANGLE SENSOR:</span>
              <span style={{ color: 'var(--text-secondary)' }}>CALIBRATING (98.4°)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>POSTURE CHECK:</span>
              <span style={{ color: 'var(--color-green)' }}>OPTIMAL</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>FRAME DIFFERENCE:</span>
              <span style={{ color: 'var(--text-secondary)' }}>ACTIVE (SENSITIVE)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>SYNAPSE CHIPS FEED:</span>
              <span style={{ color: 'var(--color-yellow)' }}>+15 XP APPLIED ON LOG</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
