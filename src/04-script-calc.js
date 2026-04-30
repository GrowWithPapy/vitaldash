  <script>
  // ============= STATE =============
  const state = {
    age: 30, gender: 'male',
    heightCm: 175, weightKg: 70,
    bodyFat: 0, activity: 1.55,
    goal: 'maintain', units: 'metric',
    whatIfWeight: 70, goalWeight: 0,
    extraKcal: 0,
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
  // CDC NHANES 2015-2018 reference data (Vital Health Stat 3(46), 2021)
  // Source: https://www.cdc.gov/nchs/data/series/sr_03/sr03-046-508.pdf
  const NHANES_2015_2018 = {
    // BMI percentiles for adult males by age band (Table 15, all race/Hispanic groups)
    bmi_male: {
      '20-39': { p5: 20.4, p25: 24.7, p50: 27.7, p75: 32.0, p90: 36.9, p95: 40.4 },
      '40-59': { p5: 21.7, p25: 26.0, p50: 29.4, p75: 33.4, p90: 38.0, p95: 41.0 },
      '60+':   { p5: 21.5, p25: 25.4, p50: 28.7, p75: 32.0, p90: 36.1, p95: 39.0 }
    },
    bmi_female: {
      '20-39': { p5: 19.5, p25: 23.6, p50: 27.6, p75: 33.7, p90: 39.7, p95: 44.7 },
      '40-59': { p5: 20.8, p25: 25.4, p50: 30.0, p75: 35.7, p90: 41.4, p95: 45.4 },
      '60+':   { p5: 20.4, p25: 25.0, p50: 29.0, p75: 33.4, p90: 37.7, p95: 41.4 }
    },
    // Weight in kg, all races (Tables 3 and 5)
    weight_male: {
      '20-39': { p5: 61.7, p25: 73.5, p50: 85.5, p75: 101.4, p90: 119.9, p95: 133.6 },
      '40-59': { p5: 64.8, p25: 78.3, p50: 90.1, p75: 103.0, p90: 121.7, p95: 132.0 },
      '60+':   { p5: 61.4, p25: 73.5, p50: 87.5, p75: 100.4, p90: 113.8, p95: 124.4 }
    },
    weight_female: {
      '20-39': { p5: 49.4, p25: 60.9, p50: 71.4, p75: 88.9, p90: 109.0, p95: 122.9 },
      '40-59': { p5: 51.2, p25: 64.2, p50: 74.9, p75: 91.1, p90: 108.5, p95: 122.4 },
      '60+':   { p5: 49.4, p25: 60.4, p50: 72.5, p75: 85.0, p90: 99.4, p95: 110.1 }
    }
  };

  // Look up percentile for a value within a population. Linearly interpolates between table points.
  function nhanesPercentile(value, table) {
    const points = [
      [table.p5, 5], [table.p25, 25], [table.p50, 50],
      [table.p75, 75], [table.p90, 90], [table.p95, 95]
    ];
    if (value <= points[0][0]) return Math.max(1, Math.round((value / points[0][0]) * 5));
    if (value >= points[points.length - 1][0]) return Math.min(99, 95 + Math.round(((value - points[points.length-1][0]) / points[points.length-1][0]) * 4));
    for (let i = 0; i < points.length - 1; i++) {
      const [v1, p1] = points[i];
      const [v2, p2] = points[i + 1];
      if (value >= v1 && value <= v2) {
        return Math.round(p1 + ((value - v1) / (v2 - v1)) * (p2 - p1));
      }
    }
    return 50;
  }

  function ageBand(age) {
    if (age < 40) return '20-39';
    if (age < 60) return '40-59';
    return '60+';
  }

  function bmiPercentile(bmi, age, gender) {
    if (gender === 'other' || age < 20) return null;
    const table = gender === 'male' ? NHANES_2015_2018.bmi_male : NHANES_2015_2018.bmi_female;
    return nhanesPercentile(bmi, table[ageBand(age)]);
  }

  function weightPercentile(weightKg, age, gender) {
    if (gender === 'other' || age < 20) return null;
    const table = gender === 'male' ? NHANES_2015_2018.weight_male : NHANES_2015_2018.weight_female;
    return nhanesPercentile(weightKg, table[ageBand(age)]);
  }

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
      { title:'Smart body-fat scale', desc:'Track weight + body composition trends.',  url:a('smart bathroom scale body fat'), image:'https://images.unsplash.com/photo-1594882645126-14020914d58d?w=300&q=80' },
      { title:'Whey protein powder',  desc:'Hit your protein floor without effort.',   url:a('whey protein powder'),           image:'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=300&q=80' },
      { title:'Resistance bands set', desc:'Cheap home strength training, anywhere.',  url:a('resistance bands set'),          image:'https://images.unsplash.com/photo-1599058917765-a780eda07a3e?w=300&q=80' },
    ],
    maintain: [
      { title:'Smart bathroom scale', desc:'Catch trends before they become problems.',url:a('smart bathroom scale body fat'), image:'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=300&q=80' },
      { title:'Daily multivitamin',   desc:'Cover micronutrient gaps in any diet.',     url:a('daily multivitamin'),           image:'https://images.unsplash.com/photo-1550572017-edd951b55104?w=300&q=80' },
      { title:'Adjustable kettlebell',desc:'One tool, full-body strength.',             url:a('adjustable kettlebell'),         image:'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&q=80' },
    ],
    build: [
      { title:'Whey protein powder',  desc:'__PROTEIN__ per day, easily.',              url:a('whey protein isolate 5lb'),     image:'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=300&q=80' },
      { title:'Creatine monohydrate', desc:'Cheapest proven muscle/strength supplement.',url:a('creatine monohydrate'),        image:'https://images.unsplash.com/photo-1579722821273-0f6c1b5d0bf5?w=300&q=80' },
      { title:'Adjustable dumbbells', desc:'Progressive overload at home.',             url:a('adjustable dumbbells'),          image:'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=300&q=80' },
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
