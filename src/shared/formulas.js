  <script>
  // Shared formulas for all VitalDash calculators.
  // Pure functions: no DOM access, no side effects, no state.
  // Source citations live in /methodology.html.

  // ============= UNIT CONVERSIONS =============
  const cmToFtIn = (cm) => { const t = cm/2.54; return { ft: Math.floor(t/12), in: Math.round(t%12) }; };
  const ftInToCm = (ft, inch) => (ft*12 + inch) * 2.54;
  const kgToLb = (kg) => kg * 2.20462;
  const lbToKg = (lb) => lb / 2.20462;
  const cmToIn = (cm) => cm / 2.54;
  const inToCm = (inches) => inches * 2.54;

  // ============= CALORIE DEFICIT =============
  // 7700 kcal per kg of body fat (refined from Wishnofsky 1958).
  function deficitFromTimeline(targetLossKg, timelineWeeks) {
    if (timelineWeeks <= 0 || targetLossKg <= 0) return null;
    return (targetLossKg * 7700) / (timelineWeeks * 7);
  }

  function timelineFromDeficit(targetLossKg, dailyDeficit) {
    if (dailyDeficit <= 0 || targetLossKg <= 0) return null;
    return (targetLossKg * 7700) / (dailyDeficit * 7);
  }

  // Categorize deficit aggressiveness based on percent of TDEE (ISSN, ACSM guidelines).
  function deficitSafetyLevel(dailyDeficit, tdee) {
    if (dailyDeficit <= 0) return { level: 'none', label: 'None', color: 'slate', note: 'No deficit set.' };
    const pct = (dailyDeficit / tdee) * 100;
    if (pct < 10) return { level: 'mild', label: 'Mild', color: 'emerald', note: 'Sustainable but slow. Best for body recomposition or last few pounds.' };
    if (pct < 20) return { level: 'moderate', label: 'Moderate', color: 'emerald', note: 'Standard fat loss rate. Safe for most adults.' };
    if (pct < 25) return { level: 'aggressive', label: 'Aggressive', color: 'amber', note: 'Faster results but harder to sustain. Watch for muscle loss and energy dips.' };
    return { level: 'dangerous', label: 'Too aggressive', color: 'red', note: 'Above 25% of TDEE risks muscle loss, hormonal disruption, and rebound. Consult a doctor.' };
  }

  function dietExerciseSplit(totalDeficit, exerciseShare) {
    return {
      fromDiet: totalDeficit * (1 - exerciseShare),
      fromExercise: totalDeficit * exerciseShare,
    };
  }

  // ============= NAVY BODY FAT (Hodgdon-Beckett 1984) =============
  // All measurements in inches. Returns null on invalid input.
  function navyBodyFatMale(waistIn, neckIn, heightIn) {
    if (waistIn <= neckIn) return null;
    return 86.010 * Math.log10(waistIn - neckIn) - 70.041 * Math.log10(heightIn) + 36.76;
  }

  function navyBodyFatFemale(waistIn, hipIn, neckIn, heightIn) {
    if ((waistIn + hipIn) <= neckIn) return null;
    return 163.205 * Math.log10(waistIn + hipIn - neckIn) - 97.684 * Math.log10(heightIn) - 78.387;
  }

  // ============= BMI =============
  function calcBMI(kg, cm) { const m = cm / 100; return kg / (m * m); }

  function bmiCategory(bmi) {
    if (bmi < 18.5) return { label:'Underweight', color:'blue',    note:'Below the healthy range. Consider a balanced caloric surplus and strength training.' };
    if (bmi < 25)   return { label:'Normal',      color:'emerald', note:"You're in the healthy range. Maintain your current habits." };
    if (bmi < 30)   return { label:'Overweight',  color:'amber',   note:'Slightly above the healthy range. A modest calorie deficit can help.' };
    return            { label:'Obese',       color:'red',     note:'Significantly above the healthy range. Consult a doctor for personalised guidance.' };
  }

  // ============= BMR / TDEE (Mifflin-St Jeor 1990) =============
  function calcBMR(kg, cm, age, gender) {
    const base = 10 * kg + 6.25 * cm - 5 * age;
    if (gender === 'male')   return base + 5;
    if (gender === 'female') return base - 161;
    return base + (5 - 161) / 2;
  }
  function calcTDEE(bmr, activity) { return bmr * activity; }

  // ============= BODY FAT (Deurenberg 1991) =============
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

  // ============= IDEAL WEIGHT (WHO BMI 18.5 to 24.9) =============
  function idealWeightRange(cm) { const m = cm / 100; return { min: 18.5*m*m, max: 24.9*m*m }; }

  // ============= CALORIE TARGET =============
  function calcTarget(tdee, goal) {
    if (goal === 'lose')  return { value:tdee-500, label:'to lose ~0.45 kg / 1 lb per week', detail:'500 kcal deficit. Sustainable rate of fat loss.' };
    if (goal === 'build') return { value:tdee+300, label:'to build lean muscle',           detail:'300 kcal surplus. Lean bulk minimises fat gain.' };
    return                  { value:tdee,            label:'to maintain weight',              detail:'Maintenance level, same as TDEE.' };
  }

  // ============= MACROS (ISSN 2017 protein floor 1.6 g/kg) =============
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

  // ============= GOAL PROJECTION (7,700 kcal per kg) =============
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

  // ============= NHANES PERCENTILES =============
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

  // ============= STATS =============
  // Abramowitz-Stegun approximation, max error ~1.5e-7. Useful for z-score to percentile.
  function erf(x) {
    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x);
    const a1 =  0.254829592, a2 = -0.284496736, a3 =  1.421413741;
    const a4 = -1.453152027, a5 =  1.061405429, p  =  0.3275911;
    const t = 1 / (1 + p * x);
    const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    return sign * y;
  }
  </script>
