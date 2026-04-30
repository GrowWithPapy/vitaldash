  // ============= DOM HELPERS =============
  const $ = (id) => document.getElementById(id);
  function toast(msg) {
    const el = $('toast'); el.textContent = msg; el.style.opacity = '1';
    clearTimeout(el._t); el._t = setTimeout(() => { el.style.opacity = '0'; }, 2000);
  }
  function setSliderFill(slider) {
    if (!slider) return;
    const min = parseFloat(slider.min), max = parseFloat(slider.max);
    const pct = ((parseFloat(slider.value) - min) / (max - min)) * 100;
    slider.style.setProperty('--pct', pct + '%');
  }

  // ============= CHARTS =============
  let macroChart, historyChart, compositionChart;
  function initCharts() {
    macroChart = new Chart($('macro-chart'), {
      type: 'doughnut',
      data: { labels:['Protein','Carbs','Fat'], datasets:[{ data:[30,40,30], backgroundColor:['#f43f5e','#f59e0b','#0ea5e9'], borderWidth:0 }] },
      options: { responsive:true, maintainAspectRatio:true, cutout:'70%', plugins:{ legend:{display:false}, tooltip:{enabled:false} } },
    });
    historyChart = new Chart($('history-chart'), {
      type: 'line',
      data: { labels:[], datasets:[{ data:[], borderColor:'#0ea5e9', backgroundColor:'rgba(14,165,233,0.12)', tension:0.35, fill:true, pointRadius:3, pointBackgroundColor:'#0ea5e9', borderWidth:2 }] },
      options: { responsive:true, maintainAspectRatio:false, plugins:{ legend:{display:false}, tooltip:{ mode:'index', intersect:false } }, scales:{ x:{display:false}, y:{display:false, beginAtZero:false} } },
    });
    compositionChart = new Chart($('composition-ring'), {
      type: 'doughnut',
      data: {
        labels: ['Lean mass', 'Fat mass'],
        datasets: [{
          data: [82, 18],
          backgroundColor: ['#10b981', '#f59e0b'],
          borderWidth: 0,
          circumference: 270,
          rotation: 225,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        cutout: '78%',
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        animation: { animateRotate: true, duration: 600 },
      },
    });
  }
  function updateMacroChart(macros) {
    macroChart.data.datasets[0].data = [macros.protein.pct, macros.carbs.pct, macros.fat.pct];
    macroChart.update('none');
  }
  function updateHistoryChart() {
    const history = loadHistory();
    historyChart.data.labels = history.map(h => h.date);
    historyChart.data.datasets[0].data = history.map(h => h.weight);
    historyChart.update('none');
    $('log-empty').style.display = history.length ? 'none' : 'block';
  }

  // ============= RENDER PARTIALS =============
  function renderRealityCheck(bmi, bmiCat, bf, bfCat, gender, hasUserBf) {
    const el = $('reality-check');
    let payload = null;
    const lowBf = gender === 'female' ? 25 : 18;
    const highBf = gender === 'female' ? 32 : 25;

    if (bmi >= 25 && bf <= lowBf) {
      payload = { tone:'positive', title:'BMI says overweight, body says athletic.',
        body:`Your BMI of ${bmi.toFixed(1)} flags you as "${bmiCat.label}", but with ${bf.toFixed(1)}% body fat (${bfCat}), you're carrying lean mass — not fat. BMI can't tell muscle from fat.` };
    } else if (bmi < 25 && bmi >= 18.5 && bf >= highBf) {
      payload = { tone:'caution', title:'"Normal" BMI, but high body fat.',
        body:`Your BMI of ${bmi.toFixed(1)} sits in the healthy range, but ${bf.toFixed(1)}% body fat is in the "${bfCat}" zone. Sometimes called "skinny fat" — strength training can rebalance it.` };
    } else if (bmi < 18.5 && bf <= lowBf) {
      payload = { tone:'neutral', title:'Low BMI, lean composition.',
        body:`Your BMI flags as underweight, but your body fat is in the "${bfCat}" range. If you have visible muscle, you're likely just lean-built.` };
    }

    if (!payload) { el.classList.add('hidden'); el.innerHTML = ''; return; }

    const c = {
      positive: { bg:'bg-emerald-50 dark:bg-emerald-900/20', border:'border-emerald-200 dark:border-emerald-800', icon:'text-emerald-600 dark:text-emerald-400', title:'text-emerald-900 dark:text-emerald-200' },
      caution:  { bg:'bg-amber-50 dark:bg-amber-900/20',     border:'border-amber-200 dark:border-amber-800',     icon:'text-amber-600 dark:text-amber-400',     title:'text-amber-900 dark:text-amber-200' },
      neutral:  { bg:'bg-blue-50 dark:bg-blue-900/20',       border:'border-blue-200 dark:border-blue-800',       icon:'text-blue-600 dark:text-blue-400',       title:'text-blue-900 dark:text-blue-200' },
    }[payload.tone];

    const note = hasUserBf ? 'Based on the body fat % you provided.' : 'Based on Deurenberg estimate — measure with calipers/BIA/DEXA for confidence.';

    el.classList.remove('hidden');
    el.innerHTML = `
      <div class="${c.bg} ${c.border} border rounded-xl p-4">
        <div class="flex items-start gap-3">
          <svg class="w-5 h-5 ${c.icon} shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <div class="flex-1">
            <p class="text-xs font-semibold uppercase tracking-wider ${c.icon} mb-1">Reality check</p>
            <p class="font-semibold ${c.title} text-sm leading-snug">${payload.title}</p>
            <p class="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">${payload.body}</p>
            <p class="text-[10px] text-slate-500 dark:text-slate-400 italic mt-2">${note}</p>
          </div>
        </div>
      </div>`;
  }

  function renderAffiliates(goal, proteinG) {
    const list = AFFILIATES[goal];
    $('affiliate-row').innerHTML = list.map(item => {
      const desc = item.desc.replace('__PROTEIN__', `Hit ${proteinG}g protein`);
      return `<a href="${item.url}" target="_blank" rel="sponsored noopener" class="aff-card group block bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-sm">
        <div class="aspect-[4/3] bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <img src="${item.image}" alt="${item.title}" loading="lazy" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        </div>
        <div class="p-3">
          <p class="text-sm font-semibold leading-tight group-hover:text-brand-600 dark:group-hover:text-brand-400">${item.title}</p>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">${desc}</p>
          <p class="text-[10px] text-slate-400 mt-1.5 inline-flex items-center gap-1">View on Amazon
            <svg class="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M7 17L17 7M7 7h10v10"/></svg>
          </p>
        </div>
      </a>`;
    }).join('');
  }

  // ============= COMPARE TO PAST SELF =============
  function renderCompareSection() {
    const history = loadHistory();
    const section = $('compare-section');
    if (!section) return;
    if (history.length < 2) { section.classList.add('hidden'); return; }
    section.classList.remove('hidden');

    const select = $('compare-date');
    const prev = select.value;
    const isMetric = state.units === 'metric';
    const unit = isMetric ? 'kg' : 'lb';

    select.innerHTML = history.map(h => {
      const w = isMetric ? h.weight : kgToLb(h.weight);
      const dateStr = new Date(h.date).toLocaleDateString(undefined, { month:'short', day:'numeric' });
      return `<option value="${h.date}">${dateStr} (${w.toFixed(1)} ${unit})</option>`;
    }).join('');

    select.value = history.some(h => h.date === prev) ? prev : history[0].date;
    renderComparePanel(select.value);
  }

  function renderComparePanel(pastDate) {
    const panel = $('compare-stats');
    if (!panel) return;
    const history = loadHistory();
    const past = history.find(h => h.date === pastDate);
    if (!past) { panel.innerHTML = ''; return; }

    const today = new Date().toISOString().split('T')[0];
    if (past.date === today) {
      panel.innerHTML = `<p class="col-span-2 text-xs text-slate-500 dark:text-slate-400 italic">Logged today, no comparison yet.</p>`;
      return;
    }

    const isMetric = state.units === 'metric';
    const wUnit = isMetric ? 'kg' : 'lb';

    const pastBmi    = calcBMI(past.weight, state.heightCm);
    const pastBmr    = calcBMR(past.weight, state.heightCm, state.age, state.gender);
    const pastTdee   = calcTDEE(pastBmr, state.activity) + state.extraKcal;
    const pastTarget = calcTarget(pastTdee, state.goal).value;

    const curBmi    = calcBMI(state.weightKg, state.heightCm);
    const curBmr    = calcBMR(state.weightKg, state.heightCm, state.age, state.gender);
    const curTdee   = calcTDEE(curBmr, state.activity) + state.extraKcal;
    const curTarget = calcTarget(curTdee, state.goal).value;

    const days = Math.round((new Date(today) - new Date(past.date)) / 86400000);
    const dayLabel = days === 0 ? 'today' : `${days} day${days !== 1 ? 's' : ''}`;

    // Color reflects whether the weight delta moves toward the user's goal.
    const wDelta = state.weightKg - past.weight;
    let dirColor;
    if (state.goal === 'lose')       dirColor = wDelta < -0.05 ? 'emerald' : wDelta > 0.05 ? 'rose' : 'slate';
    else if (state.goal === 'build') dirColor = wDelta >  0.05 ? 'emerald' : wDelta < -0.05 ? 'rose' : 'slate';
    else                             dirColor = Math.abs(wDelta) <= 2 ? 'emerald' : 'rose';

    const wPast      = isMetric ? past.weight     : kgToLb(past.weight);
    const wCur       = isMetric ? state.weightKg  : kgToLb(state.weightKg);
    const wDeltaDisp = isMetric ? wDelta          : kgToLb(wDelta);

    panel.innerHTML = [
      compareStatBlock('Weight',       `${wPast.toFixed(1)} ${wUnit}`,        `${wCur.toFixed(1)} ${wUnit}`,        wDeltaDisp,            wUnit, 1, dayLabel, dirColor),
      compareStatBlock('BMI',          pastBmi.toFixed(1),                    curBmi.toFixed(1),                    curBmi - pastBmi,      '',    1, dayLabel, dirColor),
      compareStatBlock('TDEE',         `${Math.round(pastTdee)} kcal`,        `${Math.round(curTdee)} kcal`,        curTdee - pastTdee,    'kcal',0, dayLabel, dirColor),
      compareStatBlock('Daily target', `${Math.round(pastTarget)} kcal`,      `${Math.round(curTarget)} kcal`,      curTarget - pastTarget,'kcal',0, dayLabel, dirColor),
    ].join('');
  }

  function compareStatBlock(label, pastText, curText, delta, unit, decimals, dayLabel, dirColor) {
    const COLOR = {
      emerald: 'text-emerald-600 dark:text-emerald-400',
      rose:    'text-rose-600 dark:text-rose-400',
      slate:   'text-slate-500 dark:text-slate-400',
    };
    const eps = unit === 'kcal' ? 1 : 0.05;
    const arrow = delta > eps ? 'up' : delta < -eps ? 'down' : 'flat';
    const arrowColor = arrow === 'flat' ? COLOR.slate : COLOR[dirColor];
    const c = COLOR[dirColor];
    const sign = delta > 0 ? '+' : '';
    const deltaTxt = unit
      ? `${sign}${delta.toFixed(decimals)} ${unit}`
      : `${sign}${delta.toFixed(decimals)}`;
    const arrowSvg = arrow === 'up'
      ? `<svg class="w-3 h-3 ${arrowColor}" viewBox="0 0 12 12" aria-label="Increase"><path d="M6 2 L10 8 L2 8 Z" fill="currentColor"/></svg>`
      : arrow === 'down'
      ? `<svg class="w-3 h-3 ${arrowColor}" viewBox="0 0 12 12" aria-label="Decrease"><path d="M6 10 L2 4 L10 4 Z" fill="currentColor"/></svg>`
      : `<svg class="w-3 h-3 ${arrowColor}" viewBox="0 0 12 12" aria-label="No change"><rect x="2" y="5" width="8" height="2" fill="currentColor"/></svg>`;
    return `<div class="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-2.5">
      <p class="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">${label}</p>
      <div class="flex items-center justify-between mt-1 gap-1.5">
        <span class="text-xs text-slate-500 tabular-nums">${pastText}</span>
        ${arrowSvg}
        <span class="text-sm font-bold tabular-nums">${curText}</span>
      </div>
      <p class="text-[10px] mt-1 tabular-nums ${c}">${deltaTxt} over ${dayLabel}</p>
    </div>`;
  }

  // ============= MAIN RENDER =============
  function render() {
    // Slider fills + input displays
    $('age-out').textContent = state.age;
    setSliderFill($('age')); setSliderFill($('weight')); setSliderFill($('whatif-weight'));
    setSliderFill($('bodyfat')); setSliderFill($('goal-weight')); setSliderFill($('extra-kcal'));
    if (state.units === 'metric') setSliderFill($('height-cm'));

    if (state.units === 'metric') $('weight-out').textContent = `${state.weightKg.toFixed(state.weightKg % 1 ? 1 : 0)} kg`;
    else                          $('weight-out').textContent = `${kgToLb(state.weightKg).toFixed(1)} lb`;

    if (state.units === 'metric') $('height-out').textContent = `${state.heightCm} cm`;
    else { const {ft,in:inch} = cmToFtIn(state.heightCm); $('height-out').textContent = `${ft}′ ${inch}″`; }

    $('bf-out').textContent = state.bodyFat > 0 ? `${state.bodyFat}%` : 'auto';
    $('goal-weight-out').textContent = state.goalWeight > 0
      ? (state.units === 'metric' ? `${state.goalWeight} kg` : `${kgToLb(state.goalWeight).toFixed(1)} lb`)
      : '— ' + (state.units === 'metric' ? 'kg' : 'lb');

    // Active button states
    document.querySelectorAll('.gender-btn').forEach(b => {
      const a = b.dataset.gender === state.gender;
      b.className = `gender-btn px-2 py-2 rounded-md transition-all ${a ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`;
    });
    document.querySelectorAll('.goal-btn').forEach(b => {
      const a = b.dataset.goal === state.goal;
      b.className = `goal-btn px-2 py-2 rounded-md transition-all ${a ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`;
    });

    // Calculations
    const bmi    = calcBMI(state.weightKg, state.heightCm);
    const cat    = bmiCategory(bmi);
    const bmr    = calcBMR(state.weightKg, state.heightCm, state.age, state.gender);
    const tdee   = calcTDEE(bmr, state.activity);
    const tdeeAdjusted = tdee + state.extraKcal;
    const hasUserBf = state.bodyFat > 0;
    const bf     = hasUserBf ? state.bodyFat : estimateBodyFat(bmi, state.age, state.gender);
    const bfCat  = bodyFatCategory(bf, state.gender);
    const ideal  = idealWeightRange(state.heightCm);
    // Intake target is anchored to baseline TDEE so extra activity widens the deficit instead of shifting the target.
    const target = calcTarget(tdee, state.goal);
    const split  = macroSplit(state.goal);
    const macros = macroGrams(target.value, split, state.weightKg);
    $('extra-kcal-out').textContent = `+${state.extraKcal} kcal/day`;

    // BMI card
    $('bmi-value').textContent = bmi.toFixed(1);
    const cBadge = $('bmi-category');
    cBadge.textContent = cat.label;
    cBadge.className = `px-2 py-0.5 text-xs font-semibold rounded-full bg-${cat.color}-100 text-${cat.color}-700 dark:bg-${cat.color}-900/40 dark:text-${cat.color}-300`;
    $('bmi-explainer').textContent = cat.note;
    $('bmi-marker').style.left = `${Math.max(0, Math.min(100, ((bmi - 15) / 25) * 100))}%`;

    renderRealityCheck(bmi, cat, bf, bfCat, state.gender, hasUserBf);

    // Body composition ring
    const fatKg = state.weightKg * (bf / 100);
    const leanKg = state.weightKg - fatKg;
    const leanPct = Math.round((leanKg / state.weightKg) * 100);
    const fatPct = 100 - leanPct;

    if (compositionChart) {
      compositionChart.data.datasets[0].data = [leanPct, fatPct];
      // Fat segment color reflects whether body fat % is athletic, average, or high.
      let fatColor = '#f59e0b';
      const lowBf = state.gender === 'female' ? 21 : 14;
      const highBf = state.gender === 'female' ? 32 : 25;
      if (bf <= lowBf) fatColor = '#10b981';
      else if (bf > highBf) fatColor = '#ef4444';
      compositionChart.data.datasets[0].backgroundColor = ['#10b981', fatColor];
      compositionChart.update('none');
    }

    $('comp-lean-pct').textContent = `${leanPct}%`;

    if (state.units === 'metric') {
      $('comp-lean-kg').textContent = `${leanKg.toFixed(1)} kg`;
      $('comp-fat-kg').textContent = `${fatKg.toFixed(1)} kg`;
    } else {
      $('comp-lean-kg').textContent = `${kgToLb(leanKg).toFixed(1)} lb`;
      $('comp-fat-kg').textContent = `${kgToLb(fatKg).toFixed(1)} lb`;
    }

    // Stat cards
    $('bmr-value').textContent  = Math.round(bmr).toLocaleString();
    $('tdee-value').textContent = Math.round(tdeeAdjusted).toLocaleString();
    $('bf-value').textContent   = bf.toFixed(1);
    $('bf-source').textContent  = hasUserBf ? 'user-provided' : 'est. (Deurenberg)';
    $('bf-category').textContent = bfCat;

    // Percentile chips (NHANES 2015-2018)
    const bmiPct = bmiPercentile(bmi, state.age, state.gender);
    const wPct = weightPercentile(state.weightKg, state.age, state.gender);
    if (bmiPct !== null && wPct !== null) {
      const label = state.gender === 'male' ? 'men' : 'women';
      const band = ageBand(state.age);
      $('bmr-percentile').textContent  = `BMI ranks higher than ${bmiPct}% of ${label} aged ${band}`;
      $('tdee-percentile').textContent = `Weight ranks higher than ${wPct}% of ${label} aged ${band}`;
    } else {
      $('bmr-percentile').textContent = '';
      $('tdee-percentile').textContent = '';
    }

    if (state.units === 'metric') {
      $('ideal-value').textContent = `${ideal.min.toFixed(0)}–${ideal.max.toFixed(0)}`;
      $('ideal-unit').textContent  = 'kg';
    } else {
      $('ideal-value').textContent = `${kgToLb(ideal.min).toFixed(0)}–${kgToLb(ideal.max).toFixed(0)}`;
      $('ideal-unit').textContent  = 'lb';
    }

    // Daily target & macros
    $('target-value').textContent = Math.round(target.value).toLocaleString();
    $('goal-label').textContent   = target.label;
    $('target-detail').innerHTML  = `<p>${target.detail}</p><p class="opacity-75">${macros.protein.g}P · ${macros.carbs.g}C · ${macros.fat.g}F (grams)</p>`;
    $('macro-p-g').textContent   = macros.protein.g;
    $('macro-p-pct').textContent = macros.protein.pct;
    $('macro-c-g').textContent   = macros.carbs.g;
    $('macro-c-pct').textContent = macros.carbs.pct;
    $('macro-f-g').textContent   = macros.fat.g;
    $('macro-f-pct').textContent = macros.fat.pct;
    if (macroChart) updateMacroChart(macros);

    // Weight vs ideal
    const scaleMin = state.units === 'metric' ? 35 : 80;
    const scaleMax = state.units === 'metric' ? 200 : 440;
    const w  = state.units === 'metric' ? state.weightKg : kgToLb(state.weightKg);
    const lo = state.units === 'metric' ? ideal.min      : kgToLb(ideal.min);
    const hi = state.units === 'metric' ? ideal.max      : kgToLb(ideal.max);
    const pct = (v) => Math.max(0, Math.min(100, ((v - scaleMin) / (scaleMax - scaleMin)) * 100));
    $('ideal-bar').style.left  = pct(lo) + '%';
    $('ideal-bar').style.width = (pct(hi) - pct(lo)) + '%';
    $('weight-marker').style.left = pct(w) + '%';
    $('scale-min').textContent = `${Math.round(scaleMin)} ${state.units === 'metric' ? 'kg' : 'lb'}`;
    $('scale-max').textContent = `${Math.round(scaleMax)} ${state.units === 'metric' ? 'kg' : 'lb'}`;
    const delta = $('weight-delta');
    if (w < lo)      { delta.textContent = `${(lo - w).toFixed(1)} below`; delta.className = 'text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'; }
    else if (w > hi) { delta.textContent = `${(w - hi).toFixed(1)} over`;  delta.className = 'text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'; }
    else             { delta.textContent = 'on target';                    delta.className = 'text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'; }

    // What-if uses raw TDEE on both sides so the delta reflects body change only, not extra activity.
    const wiBmr  = calcBMR(state.whatIfWeight, state.heightCm, state.age, state.gender);
    const wiTdee = calcTDEE(wiBmr, state.activity);
    const wiW = state.units === 'metric' ? state.whatIfWeight : kgToLb(state.whatIfWeight);
    $('whatif-weight-out').textContent = `${wiW.toFixed(state.units === 'metric' && state.whatIfWeight % 1 ? 1 : 0)} ${state.units === 'metric' ? 'kg' : 'lb'}`;
    $('whatif-tdee').textContent = `${Math.round(wiTdee).toLocaleString()} kcal`;
    const diff = Math.round(wiTdee - tdee);
    $('whatif-delta').textContent = `${diff > 0 ? '+' : ''}${diff} kcal`;
    $('whatif-delta').className = `font-bold tabular-nums ${diff > 0 ? 'text-emerald-500' : diff < 0 ? 'text-rose-500' : ''}`;

    // Goal projection (DIFFERENTIATOR #1)
    const goalKg = state.goalWeight > 0 ? state.goalWeight : null;
    const proj = goalKg ? projectGoal(state.weightKg, goalKg, tdeeAdjusted, target.value) : null;

    if (!goalKg) {
      $('projection-headline').textContent = `Set a goal weight to see your timeline`;
      $('proj-rate').textContent = '—'; $('proj-time').textContent = '—'; $('proj-date').textContent = '—';
    } else if (!proj) {
      $('projection-headline').textContent = `You're already at your goal weight 🎯`;
      $('proj-rate').textContent = '0'; $('proj-time').textContent = 'now'; $('proj-date').textContent = 'today';
    } else if (!proj.possible) {
      const correctGoal = goalKg < state.weightKg ? '"Lose fat"' : '"Build"';
      $('projection-headline').textContent = `Switch goal to ${correctGoal} to reach this`;
      $('proj-rate').textContent = '—'; $('proj-time').textContent = '—'; $('proj-date').textContent = '—';
    } else {
      const verb = proj.totalKg < 0 ? 'lose' : 'gain';
      const amt = Math.abs(proj.totalKg);
      const amtDisplay = state.units === 'metric' ? `${amt.toFixed(1)} kg` : `${kgToLb(amt).toFixed(1)} lb`;
      const weeks = proj.weeks;
      const timeDisplay = weeks < 1 ? `${Math.round(weeks*7)} days` : weeks < 8 ? `${weeks.toFixed(1)} weeks` : `${(weeks/4.345).toFixed(1)} months`;
      $('projection-headline').textContent = `You'll ${verb} ${amtDisplay} in about ${timeDisplay}`;
      const rate = Math.abs(proj.weeklyKg);
      $('proj-rate').textContent = state.units === 'metric' ? `${rate.toFixed(2)} kg/wk` : `${kgToLb(rate).toFixed(2)} lb/wk`;
      $('proj-time').textContent = timeDisplay;
      $('proj-date').textContent = proj.date.toLocaleDateString(undefined, { month:'short', day:'numeric', year:'numeric' });
    }

    // 7-day plan (DIFFERENTIATOR #4)
    const plan = buildPlan(state.goal, macros, state.activity, tdee);
    $('plan-subtitle').textContent = plan.blurb;
    $('plan-days').innerHTML = plan.days.map(d => `
      <div class="plan-day flex items-start gap-3 py-2.5 first:pt-3">
        <div class="w-9 text-xs font-bold text-brand-600 dark:text-brand-400 pt-0.5">${d.day}</div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-semibold leading-tight">${d.focus}</p>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">${d.action} · ${d.food}</p>
        </div>
      </div>`).join('');

    renderAffiliates(state.goal, macros.protein.g);
    renderCompareSection();
  }

  // ============= UNIT TOGGLE =============
  function setUnits(units) {
    state.units = units;
    const isMetric = units === 'metric';
    $('unit-metric').className   = `px-3 py-1.5 rounded-md transition-all ${isMetric ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-500'}`;
    $('unit-imperial').className = `px-3 py-1.5 rounded-md transition-all ${!isMetric ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-500'}`;
    $('height-metric').classList.toggle('hidden', !isMetric);
    $('height-imperial').classList.toggle('hidden', isMetric);
    $('height-imperial').classList.toggle('grid', !isMetric);

    [['weight','weightKg', 70], ['whatif-weight','whatIfWeight', 70], ['goal-weight','goalWeight', 65]].forEach(([id, key, fallback]) => {
      const s = $(id);
      const v = state[key] || fallback;
      if (isMetric) { s.min = 35; s.max = 200; s.step = 0.5; s.value = v; }
      else          { s.min = 77; s.max = 440; s.step = 1;   s.value = Math.round(kgToLb(v)); }
    });
    savePrefs(); render();
  }

  // ============= EVENTS =============
  function bindEvents() {
    $('age').addEventListener('input', e => { state.age = +e.target.value; render(); });

    let lastWeight = state.weightKg;
    $('weight').addEventListener('input', e => {
      const v = +e.target.value;
      state.weightKg = state.units === 'metric' ? v : lbToKg(v);
      if (Math.abs(state.whatIfWeight - lastWeight) < 0.1) {
        state.whatIfWeight = state.weightKg;
        $('whatif-weight').value = state.units === 'metric' ? state.weightKg : Math.round(kgToLb(state.weightKg));
      }
      lastWeight = state.weightKg;
      render();
    });

    $('whatif-weight').addEventListener('input', e => {
      const v = +e.target.value;
      state.whatIfWeight = state.units === 'metric' ? v : lbToKg(v);
      render();
    });
    $('goal-weight').addEventListener('input', e => {
      const v = +e.target.value;
      state.goalWeight = state.units === 'metric' ? v : lbToKg(v);
      render();
    });
    $('height-cm').addEventListener('input', e => { state.heightCm = +e.target.value; render(); });
    const updateImperialH = () => { state.heightCm = ftInToCm(+$('height-ft').value || 0, +$('height-in').value || 0); render(); };
    $('height-ft').addEventListener('input', updateImperialH);
    $('height-in').addEventListener('input', updateImperialH);
    $('bodyfat').addEventListener('input', e => { state.bodyFat = +e.target.value; render(); });
    $('extra-kcal').addEventListener('input', e => { state.extraKcal = +e.target.value; render(); });
    $('activity').addEventListener('change', e => { state.activity = +e.target.value; render(); });

    document.querySelectorAll('.gender-btn').forEach(b => b.addEventListener('click', () => { state.gender = b.dataset.gender; render(); }));
    document.querySelectorAll('.goal-btn').forEach(b => b.addEventListener('click', () => { state.goal = b.dataset.goal; render(); }));

    $('theme-toggle').addEventListener('click', () => { document.documentElement.classList.toggle('dark'); savePrefs(); });
    $('unit-metric').addEventListener('click', () => setUnits('metric'));
    $('unit-imperial').addEventListener('click', () => setUnits('imperial'));
    $('save-profile').addEventListener('click', saveCurrentProfile);
    $('log-weight').addEventListener('click', logTodayWeight);
    $('share-btn').addEventListener('click', shareResults);
    $('compare-date').addEventListener('change', e => renderComparePanel(e.target.value));
  }

  // ============= PROFILES =============
  function saveCurrentProfile() {
    const name = prompt('Profile name?', 'My profile');
    if (!name) return;
    const profiles = loadProfiles();
    profiles.push({ id: Date.now(), name, ...state });
    saveProfiles(profiles); renderProfiles(); toast('Profile saved');
  }
  function loadProfile(id) {
    const profile = loadProfiles().find(p => p.id === id);
    if (!profile) return;
    Object.assign(state, {
      age: profile.age, gender: profile.gender, heightCm: profile.heightCm,
      weightKg: profile.weightKg, bodyFat: profile.bodyFat,
      activity: profile.activity, goal: profile.goal,
      whatIfWeight: profile.weightKg, goalWeight: profile.goalWeight || 0,
    });
    $('age').value = state.age;
    $('weight').value = state.units === 'metric' ? state.weightKg : Math.round(kgToLb(state.weightKg));
    $('whatif-weight').value = $('weight').value;
    $('goal-weight').value = state.units === 'metric' ? (state.goalWeight || 65) : Math.round(kgToLb(state.goalWeight || 65));
    $('bodyfat').value = state.bodyFat;
    $('activity').value = state.activity;
    if (state.units === 'metric') $('height-cm').value = state.heightCm;
    else { const {ft,in:inch} = cmToFtIn(state.heightCm); $('height-ft').value = ft; $('height-in').value = inch; }
    render(); toast(`Loaded: ${profile.name}`);
  }
  function deleteProfile(id) {
    saveProfiles(loadProfiles().filter(p => p.id !== id));
    renderProfiles(); toast('Profile deleted');
  }
  function renderProfiles() {
    const list = loadProfiles();
    const el = $('profiles-list');
    if (!list.length) { el.innerHTML = '<p class="text-slate-500 dark:text-slate-400 italic">No saved profiles yet.</p>'; return; }
    el.innerHTML = list.map(p => `
      <div class="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800">
        <button data-load="${p.id}" class="flex-1 text-left truncate">${p.name}</button>
        <span class="text-[10px] text-slate-400 tabular-nums">${p.weightKg}kg</span>
        <button data-del="${p.id}" class="text-slate-400 hover:text-rose-500">
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>`).join('');
    el.querySelectorAll('[data-load]').forEach(b => b.addEventListener('click', () => loadProfile(+b.dataset.load)));
    el.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', () => deleteProfile(+b.dataset.del)));
  }

  // ============= WEIGHT LOG & SHARE =============
  function logTodayWeight() {
    const history = loadHistory();
    const today = new Date().toISOString().split('T')[0];
    const idx = history.findIndex(h => h.date === today);
    const entry = { date: today, weight: +state.weightKg.toFixed(1) };
    if (idx >= 0) history[idx] = entry; else history.push(entry);
    history.sort((a,b) => a.date.localeCompare(b.date));
    while (history.length > 60) history.shift();
    saveHistory(history); updateHistoryChart();
    renderCompareSection();
    toast(`Logged ${entry.weight} kg`);
  }
  async function shareResults() {
    const bmi = calcBMI(state.weightKg, state.heightCm);
    const bmr = calcBMR(state.weightKg, state.heightCm, state.age, state.gender);
    const tdee = calcTDEE(bmr, state.activity) + state.extraKcal;
    const target = calcTarget(tdee, state.goal);
    const text = `My VitalDash:\nBMI: ${bmi.toFixed(1)} (${bmiCategory(bmi).label})\nBMR: ${Math.round(bmr)} kcal\nTDEE: ${Math.round(tdee)} kcal\nDaily target: ${Math.round(target.value)} kcal (${state.goal})\n\nCalculate yours: https://vitaldash.io`;
    if (navigator.share) { try { await navigator.share({ title:'My VitalDash results', text }); } catch {} }
    else { try { await navigator.clipboard.writeText(text); toast('Copied to clipboard'); } catch { toast('Could not copy'); } }
  }

  // ============= INIT =============
  function init() {
    loadPrefs(); initCharts(); bindEvents();
    renderProfiles(); updateHistoryChart();
    setUnits(state.units);
    $('year').textContent = new Date().getFullYear();
  }
  document.addEventListener('DOMContentLoaded', init);
  </script>


