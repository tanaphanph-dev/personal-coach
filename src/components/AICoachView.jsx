import React, { useState, useContext, useEffect, useRef } from 'react';
import { AppContext } from '../context/AppContext';

export default function AICoachView() {
  const { 
    userProfile, 
    routines, 
    history, 
    nutritionLog, 
    exercises, 
    addRoutine, 
    addFoodLog, 
    getTodayString, 
    geminiApiKey, 
    language, 
    t,
    showToast 
  } = useContext(AppContext);

  const [messages, setMessages] = useState([
    {
      id: 'init',
      sender: 'coach',
      text: t('aicoach.welcome'),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  // เลื่อนหน้าต่างลงล่างสุดเมื่อมีข้อความใหม่
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // คำนวณสารอาหารและแคลอรี่ที่กินวันนี้
  const todayStr = getTodayString();
  const todayNutrition = nutritionLog[todayStr] || { water: 0, foods: [] };
  const todayTotals = todayNutrition.foods.reduce((acc, food) => {
    acc.calories += food.calories || 0;
    acc.protein += food.protein || 0;
    acc.carbs += food.carbs || 0;
    acc.fat += food.fat || 0;
    return acc;
  }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

  // ฟังก์ชันสกัด JSON บล็อกออกจากคำตอบของ AI
  const extractJsonData = (text) => {
    try {
      const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
      const match = text.match(jsonRegex);
      if (match && match[1]) {
        return JSON.parse(match[1].trim());
      }
      
      // ลองค้นหาปีกกาตรงๆ เผื่อกรณี AI ไม่ใส่ block markdown
      const curlyRegex = /(\{[\s\S]*?\})/;
      const curlyMatch = text.match(curlyRegex);
      if (curlyMatch && curlyMatch[1]) {
        return JSON.parse(curlyMatch[1].trim());
      }
    } catch (e) {
      console.warn("Failed to extract JSON from response:", e);
    }
    return null;
  };

  // ฟังก์ชันลบตัว JSON code block ออกจากข้อความแสดงผลหลัก เพื่อให้อ่านง่าย
  const cleanMessageText = (text) => {
    let cleanText = text.replace(/```json\s*[\s\S]*?\s*```/g, '');
    cleanText = cleanText.replace(/\{[\s\S]*?"type"\s*:\s*"(routine|meal)"[\s\S]*?\}/g, '');
    return cleanText.trim();
  };

  // ฟังก์ชันจัดการบันทึกตารางซ้อมที่ AI เสนอมา
  const handleImportRoutine = (routineData) => {
    if (!routineData || !routineData.name || !routineData.exercises) return;
    
    const newRoutine = {
      id: 'routine_ai_' + Date.now(),
      name: routineData.name,
      exercises: routineData.exercises.map(ex => ({
        id: ex.id || 'ex1', // กำหนดเป็นอกเบื้องต้นหาก ID เสียหาย
        sets: Number(ex.sets || ex.setsCount || 3),
        reps: Number(ex.reps || 10),
        weight: Number(ex.weight || 0)
      }))
    };

    addRoutine(newRoutine);
    showToast(t('aicoach.toastRoutineAdded'), 'success');
  };

  // ฟังก์ชันล็อกอาหารที่ AI เสนอมาลงวันนี้ทันที
  const handleLogSuggestedMeal = (mealData) => {
    if (!mealData || !mealData.name) return;

    const newFood = {
      id: 'food_ai_' + Date.now(),
      name: mealData.name,
      calories: Number(mealData.calories || 0),
      protein: Number(mealData.protein || 0),
      carbs: Number(mealData.carbs || 0),
      fat: Number(mealData.fat || 0),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    addFoodLog(todayStr, newFood);
  };

  // ฟังก์ชันเรียก Gemini API จริง
  const callGeminiCoach = async (userMsgText, conversationHistory) => {
    // ดึง 3 วันล่าสุดของประวัติ
    const simplifiedHistory = history.slice(0, 3).map(h => ({
      date: h.date,
      routineName: h.routineName,
      totalVolume: h.totalVolume,
      exercises: h.exercises.map(ex => `${ex.name} (${ex.sets.length} sets)`)
    }));

    // ดึงรายชื่อท่าฝึกที่ใช้ในระบบเพื่อนำเสนอ ID ที่ถูกต้อง
    const libraryExercises = exercises.map(ex => ({ id: ex.id, name: ex.name, category: ex.category }));

    // สร้าง System Prompt
    const systemPrompt = `You are NEON COACH, an elite Cyberpunk health and strength AI coach.
Your style is motivational, techno-cybernetic, precise, and encouraging. Use futuristic or computer science vocabulary where fitting (e.g., "optimizing energy grid", "system upload complete", "calibrating fibers").
Always answer in the language requested by the user interface (active language: ${language === 'th' ? 'Thai' : 'English'}).

User profile metrics:
- Codename: ${userProfile.name}
- Weight: ${userProfile.weight} kg, Height: ${userProfile.height} cm
- Activity Level: ${userProfile.activityLevel}
- Daily Targets: ${userProfile.dailyCalories} kcal (Protein: ${userProfile.dailyProtein}g, Carbs: ${userProfile.dailyCarbs}g, Fat: ${userProfile.dailyFat}g)

Today's current consumed nutrients:
- Cal: ${todayTotals.calories}/${userProfile.dailyCalories} kcal
- Protein: ${todayTotals.protein}/${userProfile.dailyProtein}g
- Carbs: ${todayTotals.carbs}/${userProfile.dailyCarbs}g
- Fat: ${todayTotals.fat}/${userProfile.dailyFat}g
- Water: ${todayNutrition.water}/${userProfile.waterGoal} glasses

Last 3 workouts logged:
${JSON.stringify(simplifiedHistory, null, 2)}

Exercise Library available (Use only these exercise IDs if suggesting a routine):
${JSON.stringify(libraryExercises, null, 2)}

IF YOU ARE SUGGESTING OR DESIGNING A WORKOUT ROUTINE, you must include a JSON codeblock with this exact structure:
\`\`\`json
{
  "type": "routine",
  "name": "Routine Name (e.g. AI Cyber Upper body)",
  "exercises": [
    { "id": "ex1", "sets": 3, "reps": 10, "weight": 45 },
    { "id": "ex9", "sets": 3, "reps": 12, "weight": 14 }
  ]
}
\`\`\`

IF YOU ARE SUGGESTING A SPECIFIC FOOD MEAL or snacks, you must include a JSON codeblock with this exact structure:
\`\`\`json
{
  "type": "meal",
  "name": "Meal Name",
  "calories": 350,
  "protein": 30,
  "carbs": 40,
  "fat": 8
}
\`\`\`

Answer the user's message directly. Maintain conversation continuity based on the logs below. Keep explanations concise, clear, and punchy.`;

    const requestContents = [
      {
        role: 'user',
        parts: [{ text: systemPrompt }]
      }
    ];

    // โหลดประวัติแชตย้อนหลัง (จำกัดไม่เกิน 6 ข้อความเพื่อประหยัดโทเคน)
    const recentHistory = conversationHistory.slice(-6);
    recentHistory.forEach(msg => {
      requestContents.push({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      });
    });

    // แนบคำถามล่าสุด
    requestContents.push({
      role: 'user',
      parts: [{ text: userMsgText }]
    });

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: requestContents })
      }
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "NO RESPONSE";
  };

  // บอทจำลองกรณีผู้ใช้ไม่ได้ใส่ API Key (Simulation Mode)
  const handleSimulationBot = (userMsgText) => {
    const textLower = userMsgText.toLowerCase();
    
    // ตารางฝึก
    if (textLower.includes('ตาราง') || textLower.includes('ฝึก') || textLower.includes('ซ้อม') || textLower.includes('workout') || textLower.includes('routine') || textLower.includes('program')) {
      if (language === 'th') {
        return `⚡ **[โหมดจำลอง] วิเคราะห์กล้ามเนื้อแบบอะแดปทีฟ**
จากการวิเคราะห์ระบบ ร่างกายของคุณ (น้ำหนัก ${userProfile.weight} กก.) เหมาะสำหรับโปรแกรมเพิ่มพละกำลังส่วนบนเพื่อดันระดับขีดจำกัด! โค้ชได้สังเคราะห์ตารางฝึก **"AI Cyber Upper Force"** มาให้เรียบร้อยแล้ว:

- **Barbell Bench Press**: ดันอกสถิติจำนวน 3 เซต
- **Overhead Press**: สร้างความหนาของไหล่หน้า 3 เซต
- **Dumbbell Bicep Curl**: บีบกล้ามแขนส่วนหน้า 3 เซต

คุณสามารถใช้ปุ่มด้านล่างเพื่ออัปโหลดตารางนี้เข้าสู่หน้าต่างโปรแกรมของคุณได้ทันที!

\`\`\`json
{
  "type": "routine",
  "name": "AI Cyber Upper Force",
  "exercises": [
    { "id": "ex1", "sets": 3, "reps": 10, "weight": 40 },
    { "id": "ex4", "sets": 3, "reps": 8, "weight": 25 },
    { "id": "ex5", "sets": 3, "reps": 12, "weight": 12 }
  ]
}
\`\`\``;
      } else {
        return `⚡ **[SIMULATION] Adaptive Fiber Scan**
Analyzing your bio-profile (weight ${userProfile.weight} kg). Your systems are prime for an upper body overload protocol to increase power capacity! I have generated the **"AI Cyber Upper Force"** routine for you:

- **Barbell Bench Press**: 3 sets for core power
- **Overhead Press**: 3 sets to build shoulder shielding
- **Dumbbell Bicep Curl**: 3 sets for peak biceps calibration

Click the button below to load this routine into your system!

\`\`\`json
{
  "type": "routine",
  "name": "AI Cyber Upper Force",
  "exercises": [
    { "id": "ex1", "sets": 3, "reps": 10, "weight": 40 },
    { "id": "ex4", "sets": 3, "reps": 8, "weight": 25 },
    { "id": "ex5", "sets": 3, "reps": 12, "weight": 12 }
  ]
}
\`\`\``;
      }
    }

    // แนะนำมื้ออาหาร
    if (textLower.includes('กิน') || textLower.includes('อาหาร') || textLower.includes('มื้อ') || textLower.includes('เมนู') || textLower.includes('meal') || textLower.includes('food') || textLower.includes('calorie') || textLower.includes('แคล')) {
      const remainingCal = userProfile.dailyCalories - todayTotals.calories;
      const remainingProtein = Math.max(0, userProfile.dailyProtein - todayTotals.protein);
      
      if (language === 'th') {
        return `🥦 **[โหมดจำลอง] เมนูปรับระดับพลังงาน**
จากการสแกนสารอาหาร วันนี้คุณทานแคลอรี่ไปแล้ว **${todayTotals.calories} / ${userProfile.dailyCalories} kcal** (คงเหลือ ${remainingCal} kcal) 
โปรตีนได้รับแล้ว **${todayTotals.protein} / ${userProfile.dailyProtein} g** (ต้องการเพิ่มอีก ${remainingProtein} g)

แนะนำให้ทาน **"ข้าวมันไก่เนื้ออกต้มต้านแรงโน้มถ่วง" (Gravitational Chicken Breast Rice)** มื้อเย็นนี้เพื่อเก็บสะสมโปรตีนคุณภาพสูงให้ถึงขีดจำกัด!

- พลังงานรวม: 410 kcal
- โปรตีน: 38 g
- คาร์บ: 48 g
- ไขมัน: 7 g

\`\`\`json
{
  "type": "meal",
  "name": "ข้าวมันไก่เนื้ออกต้ม (AI Custom)",
  "calories": 410,
  "protein": 38,
  "carbs": 48,
  "fat": 7
}
\`\`\``;
      } else {
        return `🥦 **[SIMULATION] Calibrated Nutrition Scan**
Analyzing bio-engine inputs: You have consumed **${todayTotals.calories} / ${userProfile.dailyCalories} kcal** today (Remaining budget: ${remainingCal} kcal).
Protein intake is at **${todayTotals.protein} / ${userProfile.dailyProtein} g** (Missing: ${remainingProtein} g).

To optimize cell rebuilding, eat **"Gravitational Chicken Breast Rice"** tonight:

- Calories: 410 kcal
- Protein: 38 g
- Carbs: 48 g
- Fat: 7 g

\`\`\`json
{
  "type": "meal",
  "name": "Gravitational Chicken Breast Rice (AI)",
  "calories": 410,
  "protein": 38,
  "carbs": 48,
  "fat": 7
}
\`\`\``;
      }
    }

    // ทั่วไป
    if (language === 'th') {
      return `⚙️ **[โหมดจำลอง] วิเคราะห์ชีวมวลผู้ใช้: ${userProfile.name}**
ความสูง: ${userProfile.height} cm | น้ำหนัก: ${userProfile.weight} kg
เป้าหมายพลังงาน: ${userProfile.dailyCalories} kcal | กิจกรรมประจำวัน: ${userProfile.activityLevel}

*คำสั่งจำลองพร้อมตอบสนอง:*
1. สั่ง **"ออกแบบตารางฝึก"** หรือกดปุ่ม "🔨 ออกแบบตารางฝึกด่วนด้วย AI"
2. สั่ง **"แนะนำอาหารมื้อถัดไป"** หรือกดปุ่ม "🥦 แนะนำอาหารมื้อถัดไป"

(หมายเหตุ: ป้อน Gemini API Key ในหน้าเป้าหมายเพื่อเชื่อมระบบคุยตอบโต้เชิงลึกแบบอิสระได้ทันทีครับ)`;
    } else {
      return `⚙️ **[SIMULATION] Biometric Scan: ${userProfile.name}**
Height: ${userProfile.height} cm | Weight: ${userProfile.weight} kg
Calorie Target: ${userProfile.dailyCalories} kcal | Activity: ${userProfile.activityLevel}

*Simulated Command Set:*
1. Say **"design workout"** or click "🔨 AI Generate Routine"
2. Say **"suggest meal"** or click "🥦 AI Meal Advisor"

(Note: Configure your Gemini API Key in the Goals setting tab to enable fully fluid semantic AI chat)`;
    }
  };

  // ฟังก์ชันการส่งข้อความ
  const handleSendMessage = async (customText = '') => {
    const textToSend = customText || inputText;
    if (!textToSend.trim()) return;

    // ล้างช่องป้อนข้อความ
    if (!customText) setInputText('');

    // แอดข้อความผู้ใช้ลงหน้าแชต
    const userMessage = {
      id: 'user_' + Date.now(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    try {
      let botResponseText = '';
      if (geminiApiKey) {
        // คุยกับ AI จริง
        botResponseText = await callGeminiCoach(textToSend, messages);
      } else {
        // รันโหมดจำลองหน่วงเวลาเล็กน้อยให้สมจริง
        await new Promise(resolve => setTimeout(resolve, 1200));
        botResponseText = handleSimulationBot(textToSend);
      }

      const coachMessage = {
        id: 'coach_' + Date.now(),
        sender: 'coach',
        text: botResponseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, coachMessage]);
    } catch (e) {
      console.error(e);
      const errorMessage = {
        id: 'error_' + Date.now(),
        sender: 'coach',
        text: language === 'th' 
          ? `❌ ระบบขัดข้อง: ไม่สามารถติดต่อช่องสัญญาณของ Gemini AI ได้ กรุณาเช็ก API Key หรืออินเทอร์เน็ตของคุณ`
          : `❌ System Error: Connection to Gemini gateway failed. Please verify API Key or network links.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  // การคลิกชิปคำสั่งลัด
  const handleQuickCommand = (type) => {
    if (loading) return;
    if (type === 'workout') {
      handleSendMessage(language === 'th' ? 'ช่วยออกแบบตารางฝึกสร้างความแข็งแกร่งให้ที' : 'Please design a strength training workout routine');
    } else if (type === 'meal') {
      handleSendMessage(language === 'th' ? 'แนะนำอาหารมื้อถัดไปที่เข้ากับแคลอรี่เป้าหมายของฉัน' : 'Recommend a healthy meal based on my remaining calorie target');
    }
  };

  return (
    <div className="cyber-container" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', minHeight: '450px' }}>
      {/* ส่วนหัวหน้าเว็บ */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
          <span style={{ color: 'var(--color-magenta)' }}>🤖</span> {t('aicoach.title')}
        </h2>
        
        {/* กล่องบอกสถานะ API Key */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: geminiApiKey ? 'var(--color-green)' : 'var(--color-yellow)', boxShadow: geminiApiKey ? 'var(--shadow-green)' : 'var(--shadow-yellow)' }}></div>
          <span style={{ color: geminiApiKey ? 'var(--color-green)' : 'var(--color-yellow)' }}>
            {geminiApiKey ? 'GEMINI ONLINE' : t('aicoach.noApiKeyNotice')}
          </span>
        </div>
      </div>

      {!geminiApiKey && (
        <div className="glass-panel" style={{ padding: '12px', fontSize: '0.75rem', color: 'var(--text-secondary)', borderLeft: '3px solid var(--color-yellow)', marginBottom: '16px', background: 'rgba(234, 179, 8, 0.05)' }}>
          ⚠️ {t('aicoach.simulationNotice')}
        </div>
      )}

      {/* หน้าต่างสนทนา (Chat Messages Box) */}
      <div 
        className="glass-panel" 
        style={{ 
          flexGrow: 1, 
          overflowY: 'auto', 
          padding: '16px', 
          marginBottom: '16px', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '16px',
          background: 'rgba(0,0,0,0.3)',
          border: '1px solid var(--glass-border)',
          borderRadius: '8px'
        }}
      >
        {messages.map((msg) => {
          const isCoach = msg.sender === 'coach';
          const cleanText = cleanMessageText(msg.text);
          const jsonData = extractJsonData(msg.text);

          return (
            <div 
              key={msg.id} 
              style={{ 
                alignSelf: isCoach ? 'flex-start' : 'flex-end',
                maxWidth: '85%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: isCoach ? 'flex-start' : 'flex-end'
              }}
            >
              {/* แผงข้อความแชต */}
              <div 
                className="glass-panel"
                style={{ 
                  padding: '12px 16px', 
                  borderRadius: isCoach ? '12px 12px 12px 0' : '12px 12px 0 12px',
                  background: isCoach ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 240, 255, 0.1)',
                  border: `1px solid ${isCoach ? 'var(--glass-border)' : 'var(--color-cyan)'}`,
                  boxShadow: isCoach ? 'none' : '0 0 8px rgba(0, 240, 255, 0.1)',
                  whiteSpace: 'pre-line',
                  fontSize: '0.85rem',
                  lineHeight: '1.5'
                }}
              >
                {/* ชื่อผู้ส่ง */}
                <div style={{ fontSize: '0.65rem', fontWeight: 'bold', color: isCoach ? 'var(--color-magenta)' : 'var(--color-cyan)', marginBottom: '4px', fontFamily: 'var(--font-display)' }}>
                  {isCoach ? 'NEON_COACH_AI_v1.5' : userProfile.name}
                </div>
                <div>{cleanText}</div>
              </div>

              {/* วิดเจ็ตแบบอินเทอร์แอกทีฟ หากตรวจพบ JSON ข้อมูลตารางหรือมื้ออาหาร */}
              {jsonData && isCoach && (
                <div 
                  className="glass-panel" 
                  style={{ 
                    marginTop: '8px', 
                    padding: '12px', 
                    border: `1px dashed ${jsonData.type === 'routine' ? 'var(--color-green)' : 'var(--color-yellow)'}`,
                    borderRadius: '8px',
                    width: '100%',
                    background: 'rgba(0,0,0,0.4)',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.5)'
                  }}
                >
                  {jsonData.type === 'routine' ? (
                    <>
                      <h4 style={{ margin: '0 0 8px 0', fontSize: '0.85rem', color: 'var(--color-green)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        📋 {jsonData.name || t('aicoach.routineTitlePlaceholder')}
                      </h4>
                      <ul style={{ paddingLeft: '20px', margin: '0 0 12px 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {jsonData.exercises && jsonData.exercises.map((ex, idx) => {
                          const exerciseDetail = exercises.find(e => e.id === ex.id) || { name: ex.id };
                          return (
                            <li key={idx} style={{ marginBottom: '4px' }}>
                              {exerciseDetail.name}: {ex.sets} {t('common.sets')} x {ex.reps} {t('common.reps')} @ {ex.weight}kg
                            </li>
                          );
                        })}
                      </ul>
                      <button 
                        className="cyber-btn"
                        style={{ 
                          width: '100%', 
                          padding: '6px', 
                          fontSize: '0.75rem', 
                          background: 'var(--bg-secondary)', 
                          border: '1px solid var(--color-green)', 
                          boxShadow: 'var(--shadow-green)',
                          color: '#fff'
                        }}
                        onClick={() => handleImportRoutine(jsonData)}
                      >
                        📥 {language === 'th' ? 'บันทึกตารางฝึกนี้ลงระบบ' : 'Import Routine to Program'}
                      </button>
                    </>
                  ) : jsonData.type === 'meal' ? (
                    <>
                      <h4 style={{ margin: '0 0 8px 0', fontSize: '0.85rem', color: 'var(--color-yellow)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        🥦 {jsonData.name || t('aicoach.mealTitlePlaceholder')}
                      </h4>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '12px', background: 'rgba(255,255,255,0.02)', padding: '6px', borderRadius: '4px' }}>
                        <div>🔥 {jsonData.calories} kcal</div>
                        <div>🧬 P: {jsonData.protein}g</div>
                        <div>C: {jsonData.carbs}g</div>
                        <div>F: {jsonData.fat}g</div>
                      </div>
                      <button 
                        className="cyber-btn"
                        style={{ 
                          width: '100%', 
                          padding: '6px', 
                          fontSize: '0.75rem', 
                          background: 'var(--bg-secondary)', 
                          border: '1px solid var(--color-yellow)', 
                          boxShadow: 'var(--shadow-yellow)',
                          color: '#fff'
                        }}
                        onClick={() => handleLogSuggestedMeal(jsonData)}
                      >
                        🍽️ {language === 'th' ? 'บันทึกเมนูนี้เข้าประวัติวันนี้' : 'Log Suggestion to Meal'}
                      </button>
                    </>
                  ) : null}
                </div>
              )}

              {/* วันเวลาบันทึกข้างใต้แชท */}
              <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '4px', padding: '0 4px' }}>
                {msg.timestamp}
              </span>
            </div>
          );
        })}

        {/* แอนิเมชันตอนประมวลผลคำตอบ */}
        {loading && (
          <div style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', borderRadius: '12px 12px 12px 0', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--glass-border)' }}>
            <div className="pulse-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-magenta)', animation: 'pulse-scale 1s infinite alternate' }}></div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {t('aicoach.statusCoaching')}
            </span>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* แถวชิปคำสั่งลัดด่วน (Quick action chips) */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', overflowX: 'auto', paddingBottom: '4px' }}>
        <button 
          onClick={() => handleQuickCommand('workout')} 
          disabled={loading}
          className="cyber-btn"
          style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: '16px', background: 'rgba(0, 240, 255, 0.05)', border: '1px solid rgba(0, 240, 255, 0.3)', whiteSpace: 'nowrap' }}
        >
          {t('aicoach.btnGenRoutine')}
        </button>
        <button 
          onClick={() => handleQuickCommand('meal')} 
          disabled={loading}
          className="cyber-btn"
          style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: '16px', background: 'rgba(234, 179, 8, 0.05)', border: '1px solid rgba(234, 179, 8, 0.3)', whiteSpace: 'nowrap' }}
        >
          {t('aicoach.btnMealAdvisor')}
        </button>
      </div>

      {/* แผงฟอร์มพิมพ์ตอบโต้อุปกรณ์ส่ง (Input & Send Row) */}
      <form 
        onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
        style={{ display: 'flex', gap: '10px', width: '100%' }}
      >
        <input 
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={t('aicoach.placeholder')}
          disabled={loading}
          style={{ 
            flexGrow: 1, 
            background: 'var(--bg-secondary)', 
            border: '1px solid var(--glass-border)', 
            color: 'white', 
            borderRadius: '6px', 
            padding: '12px 16px',
            fontSize: '0.85rem'
          }}
        />
        <button 
          type="submit" 
          disabled={loading || !inputText.trim()}
          className="cyber-btn"
          style={{ 
            padding: '0 20px', 
            fontSize: '0.85rem', 
            background: 'var(--bg-secondary)', 
            border: '1px solid var(--color-magenta)', 
            boxShadow: 'var(--shadow-magenta)',
            color: '#fff',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {t('aicoach.btnSend')}
        </button>
      </form>
    </div>
  );
}
