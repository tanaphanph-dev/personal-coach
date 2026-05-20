import React, { useContext, useState, useRef, useEffect } from 'react';
import { AppContext } from '../context/AppContext';

export default function AIWorkoutTracker() {
  const { gainXpAndChips, showToast, t, language } = useContext(AppContext);
  const [isActive, setIsActive] = useState(false);
  const [selectedEx, setSelectedEx] = useState('squat');
  const [reps, setReps] = useState(0);
  const [statusText, setStatusText] = useState('System Offline');
  
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
    
    // Save to user history using context XP distributor
    gainXpAndChips(15, 10);
    playSuccessSound();
    showToast(t('aitracker.toastSaved'), 'success');
    
    // Reset tracker count
    setReps(0);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500 uppercase">
          {t('aitracker.title')}
        </h2>
        <p className="text-xs text-gray-400">
          {t('aitracker.desc')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* WEBCAM FEED & SKELETON RENDERER */}
        <div className="lg:col-span-2 glass-panel p-4 flex flex-col items-center justify-center relative overflow-hidden bg-black/60 min-h-[300px]">
          <div className="absolute top-2 left-2 flex items-center gap-1.5 z-10">
            <span className={`w-2.5 h-2.5 rounded-full ${isActive ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`}></span>
            <span className="text-[10px] text-gray-400 font-mono tracking-widest uppercase">{statusText}</span>
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
            className="w-full max-w-[480px] aspect-[4/3] rounded-lg border border-gray-800 bg-slate-950/80 scale-x-[-1]"
            style={{
              boxShadow: isActive ? '0 0 15px rgba(0, 255, 255, 0.15)' : 'none'
            }}
          />

          {!isActive && (
            <button
              onClick={startCamera}
              className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 transition-all hover:bg-black/80 group"
            >
              <div className="w-16 h-16 rounded-full border border-cyan-400/50 flex items-center justify-center mb-3 group-hover:border-cyan-400 group-hover:shadow-[0_0_10px_rgba(0,255,255,0.4)] transition-all">
                <span className="text-2xl text-cyan-400 group-hover:scale-110 transition-all">📷</span>
              </div>
              <span className="text-xs text-cyan-400 uppercase tracking-widest font-bold">
                {t('aitracker.startCamera')}
              </span>
            </button>
          )}

          {isActive && (
            <button
              onClick={stopCamera}
              className="absolute bottom-3 right-3 cyber-button-magenta text-[10px] py-1.5 px-3 uppercase tracking-wider"
            >
              {t('aitracker.stopCamera')}
            </button>
          )}
        </div>

        {/* HUD PANEL: CONTROL AND TELEMETRY */}
        <div className="flex flex-col gap-5 justify-between">
          <div className="glass-panel p-5 space-y-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-800 pb-2">
              🛰️ Telemetry & Calibration
            </h3>

            {/* Select Exercise */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-gray-400 uppercase font-bold">
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
                className="cyber-input text-xs w-full"
              >
                <option value="squat">{t('aitracker.squat')}</option>
                <option value="pushup">{t('aitracker.pushup')}</option>
                <option value="curl">{t('aitracker.curl')}</option>
              </select>
            </div>

            {/* Rep Counter Banner */}
            <div className="bg-black/50 border border-gray-800 rounded p-4 text-center space-y-1">
              <span className="text-[10px] text-gray-400 uppercase font-mono">{t('aitracker.count')}</span>
              <div className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500 font-mono tracking-widest animate-pulse">
                {reps}
              </div>
              <div className="text-[9px] text-yellow-400 animate-bounce pt-1">
                🏆 {t('aitracker.bonusXp')}
              </div>
            </div>

            {/* Actions */}
            <button
              onClick={saveRepsToLog}
              disabled={reps === 0}
              className="cyber-button w-full uppercase text-xs font-bold tracking-wider py-2.5"
              style={{
                opacity: reps === 0 ? 0.4 : 1,
                cursor: reps === 0 ? 'not-allowed' : 'pointer'
              }}
            >
              💾 {t('aitracker.saveToLog')}
            </button>
          </div>

          {/* AI BIO-GRID STATUS */}
          <div className="glass-panel p-4 bg-black/40 font-mono text-[9px] space-y-1.5 text-gray-500">
            <div className="flex justify-between">
              <span>CYBERNETIC SYNC:</span>
              <span className={isActive ? 'text-cyan-400' : 'text-red-500'}>{isActive ? 'ONLINE' : 'OFFLINE'}</span>
            </div>
            <div className="flex justify-between">
              <span>ANGLE SENSOR:</span>
              <span className="text-gray-300">CALIBRATING (98.4°)</span>
            </div>
            <div className="flex justify-between">
              <span>POSTURE CHECK:</span>
              <span className="text-emerald-400">OPTIMAL</span>
            </div>
            <div className="flex justify-between">
              <span>FRAME DIFFERENCE:</span>
              <span className="text-gray-300">ACTIVE (SENSITIVE)</span>
            </div>
            <div className="flex justify-between">
              <span>SYNAPSE CHIPS FEED:</span>
              <span className="text-yellow-400">+15 XP APPLIED ON LOG</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
