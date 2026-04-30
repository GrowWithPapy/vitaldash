  <script>
  // ============= STATE =============
  const state = {
    age: 30, gender: 'male',
    heightCm: 175, weightKg: 70,
    bodyFat: 0, activity: 1.55,
    goal: 'maintain', units: 'metric',
    whatIfWeight: 70, goalWeight: 0,
  };

  // ============= CALCULATIONS =============
  function calcBMI(kg, cm) { const m = cm / 100; return kg / (m * m); }

  function bmiCategory(bmi) {
    if (bmi < 18.5) return { label:'Underweight', color:'blue',    note:'Below the healthy range. Consider a balanced caloric surplus and strength training.' };
    if (bmi < 25)   return { label:'Normal',      color:'emerald', note:"You're in the healthy range. Maintain your current habits." };
    if (bmi < 30)   return { label:'Overweight',  color:'amber',   note:'Slightly above the healthy range. A modest calorie deficit can help.' };
    return            { label:'Obese',       color:'red',     note:'Significantly above the healthy range. Consult a doctor for personalised guidance.' };
  }

  function calcBMR(kg, cm, age, gender) {
    const base = 10 * kg + 6.25 * cm - 5 * age;
    if (gender === 'male')   return base + 5;
    if (gender === 'female') return base - 161;
    return base + (5 - 161) / 2;
  }
  function calcTDEE(bmr, activity) { return bmr * activity; }

  function estimateBodyFat(bmi, age, gender) {
    if (gender === 'other') {
      const m = 1.20 * bmi + 0.23 * age - 10.8 - 5.4;
      const f = 1.20 * bmi + 0.23 * age - 5.4;
      return (m + f) / 2;
    }
    const sex = gender === 'male' ? 1 : 0;
    return 1.20 * bmi + 0.23 * age - 10.8 * sex - 5.4;
  }

  function bodyFatCategory(bf, gender) {
    const ranges = gender === 'female'
      ? [{max:14,label:'Essential'},{max:21,label:'Athletic'},{max:25,label:'Fit'},{max:32,label:'Average'},{max:100,label:'High'}]
      : [{max:6, label:'Essential'},{max:14,label:'Athletic'},{max:18,label:'Fit'},{max:25,label:'Average'},{max:100,label:'High'}];
    return ranges.find(r => bf <= r.max).label;
  }

  function idealWeightRange(cm) { const m = cm / 100; return { min: 18.5*m*m, max: 24.9*m*m }; }

  function calcTarget(tdee, goal) {
    if (goal === 'lose')  return { value:tdee-500, label:'to lose ~0.45 kg / 1 lb per week', detail:'500 kcal deficit. Sustainable rate of fat loss.' };
    if (goal === 'build') return { value:tdee+300, label:'to build lean muscle',           detail:'300 kcal surplus. Lean bulk minimises fat gain.' };
    return                  { value:tdee,            label:'to maintain weight',              detail:'Maintenance level — same as TDEE.' };
  }

  function macroSplit(goal) {
    if (goal === 'lose')  return { p:0.40, c:0.35, f:0.25 };
    if (goal === 'build') return { p:0.30, c:0.45, f:0.25 };
    return                  { p:0.30, c:0.40, f:0.30 };
  }

  function macroGrams(targetKcal, split, weightKg) {
    let pPct = split.p, cPct = split.c, fPct = split.f;
    let pGrams = (targetKcal * pPct) / 4;
    const proteinFloor = 1.6 * weightKg;
    if (pGrams < proteinFloor) {
      pGrams = proteinFloor;
      const newPctP = (pGrams * 4) / targetKcal;
      const remaining = 1 - newPctP;
      const cfTotal = cPct + fPct;
      cPct = (cPct / cfTotal) * remaining;
      fPct = (fPct / cfTotal) * remaining;
      pPct = newPctP;
    }
    return {
      protein: { g: Math.round(pGrams),                  pct: Math.round(pPct * 100) },
      carbs:   { g: Math.round((targetKcal * cPct) / 4), pct: Math.round(cPct * 100) },
      fat:     { g: Math.round((targetKcal * fPct) / 9), pct: Math.round(fPct * 100) },
    };
  }

  // ============= DIFFERENTIATOR #1 — GOAL PROJECTION =============
  function projectGoal(currentKg, goalKg, tdee, target) {
    if (!goalKg || goalKg === currentKg) return null;
    const dailyDelta = target - tdee;
    if (dailyDelta === 0) return null;
    const weeklyKg = (dailyDelta * 7) / 7700;
    const totalKg = goalKg - currentKg;
    if (Math.sign(weeklyKg) !== Math.sign(totalKg)) return { possible: false };
    const weeks = Math.abs(totalKg / weeklyKg);
    const date = new Date();
    date.setDate(date.getDate() + Math.round(weeks * 7));
    return { possible: true, weeklyKg, weeks, date, totalKg };
  }

  // ============= DIFFERENTIATOR #3 — PERCENTILE LOOKUP =============
  // CDC NHANES adult median TDEE estimates (moderately active)
  const NHANES = { medianTDEE: { male: 2700, female: 2050 } };

  function erf(x) {
    const sign = Math.sign(x); x = Math.abs(x);
    const a1=0.254829592, a2=-0.284496736, a3=1.421413741, a4=-1.453152027, a5=1.061405429, p=0.3275911;
    const t = 1 / (1 + p * x);
    const y = 1 - (((((a5*t + a4)*t) + a3)*t + a2)*t + a1) * t * Math.exp(-x*x);
    return sign * y;
  }
  function percentile(value, median, sd) {
    const z = (value - median) / sd;
    return Math.round(50 * (1 + erf(z / Math.SQRT2)));
  }
  function tdeePercentile(tdee, gender) { return percentile(tdee, NHANES.medianTDEE[gender], 400); }
  function bmrPercentile(bmr, gender) { return percentile(bmr, NHANES.medianTDEE[gender] / 1.55, 250); }

  // ============= DIFFERENTIATOR #4 — 7-DAY PLAN =============
  function buildPlan(goal, macros, activity, tdee) {
    const proteinG = macros.protein.g;
    const proteinPerMeal = Math.round(proteinG / 4);
    const cardio = activity < 1.4 ? '20 min brisk walk' : activity < 1.6 ? '25 min run/cycle' : '35 min run/cycle';
    const lifting = goal === 'build' ? 'Heavy compound lifts' : 'Full-body strength circuit';
    const blurb = {
      lose:     `Hit ${proteinG}g protein daily. Walk ${activity < 1.4 ? '8,000' : '10,000'} steps. Sleep 7+ hrs.`,
      maintain: `Stay around ${Math.round(tdee)} kcal. Mix strength + cardio. Sleep matters.`,
      build:    `${proteinG}g protein, ~${macros.carbs.g}g carbs. Lift heavy. Recover hard.`,
    }[goal];
    return {
      blurb,
      days: [
        { day:'Mon', focus:'Upper body strength',    food:`${proteinPerMeal}g protein per meal`, action: lifting + ' — 45 min' },
        { day:'Tue', focus:'Cardio + steps',          food:'High-fiber, lower carbs',             action: cardio },
        { day:'Wed', focus:'Lower body strength',     food:'Whole-grain carbs around training',    action: lifting + ' (legs) — 45 min' },
        { day:'Thu', focus:'Active recovery',         food:'Hydrate. Veg with every meal.',        action: '30 min walk + mobility' },
        { day:'Fri', focus:'Full-body strength',      food:`${proteinPerMeal}g protein per meal`,  action: lifting + ' — 45 min' },
        { day:'Sat', focus:'Long cardio + free meal', food:'1 planned indulgence — guilt-free',    action: '45–60 min walk/hike/cycle' },
        { day:'Sun', focus:'Rest + meal prep',        food:'Cook 3 meals for the week ahead',      action: 'Full rest. Stretch 15 min.' },
      ]
    };
  }

  // ============= AFFILIATES =============
  // Replace YOUR_TAG with your Amazon Associates tracking ID
  const AMAZON_TAG = 'YOUR_TAG';
  const a = (q) => `https://www.amazon.com/s?k=${encodeURIComponent(q)}&tag=${AMAZON_TAG}`;

  const AFFILIATES = {
    lose: [
      { title:'Smart body-fat scale', desc:'Track weight + body composition trends.',  url:a('smart bathroom scale body fat') },
      { title:'Whey protein powder',  desc:'Hit your protein floor without effort.',   url:a('whey protein powder') },
      { title:'Resistance bands set', desc:'Cheap home strength training, anywhere.',  url:a('resistance bands set') },
    ],
    maintain: [
      { title:'Smart bathroom scale', desc:'Catch trends before they become problems.',url:a('smart bathroom scale body fat') },
      { title:'Daily multivitamin',   desc:'Cover micronutrient gaps in any diet.',     url:a('daily multivitamin') },
      { title:'Adjustable kettlebell',desc:'One tool, full-body strength.',             url:a('adjustable kettlebell') },
    ],
    build: [
      { title:'Whey protein powder',  desc:'__PROTEIN__ per day, easily.',              url:a('whey protein isolate 5lb') },
      { title:'Creatine monohydrate', desc:'Cheapest proven muscle/strength supplement.',url:a('creatine monohydrate') },
      { title:'Adjustable dumbbells', desc:'Progressive overload at home.',             url:a('adjustable dumbbells') },
    ],
  };

  // ============= UNIT CONVERSIONS =============
  const cmToFtIn = (cm) => { const t = cm/2.54; return { ft: Math.floor(t/12), in: Math.round(t%12) }; };
  const ftInToCm = (ft, inch) => (ft*12 + inch) * 2.54;
  const kgToLb = (kg) => kg * 2.20462;
  const lbToKg = (lb) => lb / 2.20462;

  // ============= PERSISTENCE =============
  const STORAGE = { prefs:'vd_prefs', profiles:'vd_profiles', history:'vd_history' };
  function loadPrefs() {
    try {
      const p = JSON.parse(localStorage.getItem(STORAGE.prefs)) || {};
      if (p.units) state.units = p.units;
      if (p.theme === 'dark') document.documentElement.classList.add('dark');
      else if (p.theme === 'light') document.documentElement.classList.remove('dark');
      else if (window.matchMedia('(prefers-color-scheme: dark)').matches) document.documentElement.classList.add('dark');
    } catch {}
  }
  function savePrefs() {
    localStorage.setItem(STORAGE.prefs, JSON.stringify({
      units: state.units,
      theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
    }));
  }
  const loadProfiles = () => { try { return JSON.parse(localStorage.getItem(STORAGE.profiles)) || []; } catch { return []; } };
  const saveProfiles = (list) => localStorage.setItem(STORAGE.profiles, JSON.stringify(list));
  const loadHistory  = () => { try { return JSON.parse(localStorage.getItem(STORAGE.history))  || []; } catch { return []; } };
  const saveHistory  = (list) => localStorage.setItem(STORAGE.history, JSON.stringify(list));
