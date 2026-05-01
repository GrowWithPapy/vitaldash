  <script>
  const AMAZON_TAG_CD = 'growwithpas0e-20';
  function buildAmazonUrl(query) {
    return 'https://www.amazon.com/s?k=' + encodeURIComponent(query) + '&tag=' + AMAZON_TAG_CD;
  }
  const CALORIE_DEFICIT_AFFILIATES = [
    {
      title: 'Digital food scale',
      desc: 'Most people underestimate calories by 30%. A scale fixes this for $20.',
      query: 'digital kitchen food scale grams ounces',
      image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=300&q=80',
    },
    {
      title: 'Whey protein powder',
      desc: 'Protein preserves muscle during a deficit. The single most important macro to hit.',
      query: 'whey protein powder unflavored',
      image: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=300&q=80',
    },
    {
      title: 'Meal prep containers',
      desc: 'Pre-portion meals to remove daily calorie guesswork. Compounds with the food scale.',
      query: 'meal prep containers bento glass',
      image: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=300&q=80',
    },
    {
      title: 'Pill organizer for vitamins',
      desc: 'Keep micronutrients consistent during a deficit when food volume drops.',
      query: 'weekly pill organizer vitamins',
      image: 'https://images.unsplash.com/photo-1550572017-edd951b55104?w=300&q=80',
    },
  ];

  (function () {
    const state = {
      units: 'imperial',
      tdee: 2500,
      targetLossKg: 4.5,
      timelineWeeks: 12,
      exerciseShare: 0.5,
    };

    function $(id) { return document.getElementById(id); }

    function bindOne(id, event, handler) {
      const el = $(id);
      if (!el) { console.warn('[calorie-deficit] missing element:', id); return; }
      el.addEventListener(event, handler);
    }

    function readInputs() {
      state.tdee = parseFloat($('cd-tdee').value) || 0;
      const lossInput = parseFloat($('cd-loss').value) || 0;
      state.targetLossKg = state.units === 'imperial' ? lossInput / 2.20462 : lossInput;
      state.timelineWeeks = parseFloat($('cd-timeline').value) || 0;
      state.exerciseShare = (parseFloat($('cd-split').value) || 0) / 100;
    }

    function updateUnitDisplay() {
      const unit = state.units === 'imperial' ? 'lb' : 'kg';
      $('cd-loss-unit').textContent = unit;
      $('cd-unit-imperial').className = 'px-3 py-1.5 rounded-md transition-all ' + (state.units === 'imperial' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-500');
      $('cd-unit-metric').className = 'px-3 py-1.5 rounded-md transition-all ' + (state.units === 'metric' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-500');
    }

    const BAR_COLOR = {
      mild: 'bg-emerald-300',
      moderate: 'bg-emerald-400',
      aggressive: 'bg-amber-300',
      dangerous: 'bg-red-400',
      none: 'bg-white/30',
    };

    const BADGE_COLOR = {
      mild: 'bg-emerald-200/30 border-emerald-200/50 text-emerald-50',
      moderate: 'bg-emerald-200/30 border-emerald-200/50 text-emerald-50',
      aggressive: 'bg-amber-200/30 border-amber-200/50 text-amber-50',
      dangerous: 'bg-red-200/30 border-red-200/50 text-red-50',
      none: 'bg-white/20 border-white/30 text-white',
    };

    function compute() {
      const dailyDeficit = deficitFromTimeline(state.targetLossKg, state.timelineWeeks);

      if (!dailyDeficit || !state.tdee || dailyDeficit > state.tdee) {
        $('cd-deficit-value').textContent = '--';
        $('cd-safety-badge').textContent = 'Set inputs';
        $('cd-safety-badge').className = 'inline-block px-2 py-0.5 text-xs font-semibold rounded-full border ' + BADGE_COLOR.none;
        $('cd-safety-note').textContent = 'Enter your TDEE, target loss, and timeline.';
        $('cd-eat').textContent = '-- kcal/day';
        $('cd-burn').textContent = '-- kcal/day';
        $('cd-target-intake').textContent = '-- kcal/day';
        $('cd-deficit-bar').style.width = '0%';
        $('cd-deficit-bar').className = 'h-full rounded-full transition-all duration-300 ' + BAR_COLOR.none;
        updateComparisonTable(state.targetLossKg, state.tdee);
        return;
      }

      const safety = deficitSafetyLevel(dailyDeficit, state.tdee);
      const split = dietExerciseSplit(dailyDeficit, state.exerciseShare);
      const targetIntake = state.tdee - split.fromDiet;
      const deficitPct = (dailyDeficit / state.tdee) * 100;

      $('cd-deficit-value').textContent = Math.round(dailyDeficit).toLocaleString();
      $('cd-safety-badge').textContent = safety.label;
      $('cd-safety-badge').className = 'inline-block px-2 py-0.5 text-xs font-semibold rounded-full border ' + (BADGE_COLOR[safety.level] || BADGE_COLOR.none);
      $('cd-safety-note').textContent = safety.note;
      $('cd-eat').textContent = Math.round(split.fromDiet).toLocaleString() + ' kcal/day';
      $('cd-burn').textContent = Math.round(split.fromExercise).toLocaleString() + ' kcal/day';
      $('cd-target-intake').textContent = Math.round(targetIntake).toLocaleString() + ' kcal/day';

      // Bar fills 100% width when deficit hits 30% of TDEE.
      $('cd-deficit-bar').style.width = Math.min(100, (deficitPct / 30) * 100) + '%';
      $('cd-deficit-bar').className = 'h-full rounded-full transition-all duration-300 ' + (BAR_COLOR[safety.level] || BAR_COLOR.none);

      $('cd-split-readout').textContent = Math.round(state.exerciseShare * 100) + '% from exercise';

      updateComparisonTable(state.targetLossKg, state.tdee);
    }

    function updateComparisonTable(targetLossKg, tdee) {
      if (!tdee || !targetLossKg) {
        for (let i = 0; i < 3; i++) {
          const row = $('cd-row-' + i);
          if (!row) continue;
          row.querySelector('.cd-deficit-cell').textContent = '--';
          row.querySelector('.cd-weekly-cell').textContent = '--';
          row.querySelector('.cd-timeline-cell').textContent = '--';
        }
        return;
      }
      const levels = [0.10, 0.20, 0.25];
      levels.forEach(function (pct, i) {
        const deficit = tdee * pct;
        const weeks = timelineFromDeficit(targetLossKg, deficit);
        const weeklyKg = (deficit * 7) / 7700;
        const weeklyDisplay = state.units === 'imperial'
          ? (weeklyKg * 2.20462).toFixed(2) + ' lb/wk'
          : weeklyKg.toFixed(2) + ' kg/wk';
        const row = $('cd-row-' + i);
        if (!row) return;
        row.querySelector('.cd-deficit-cell').textContent = Math.round(deficit).toLocaleString() + ' kcal/day';
        row.querySelector('.cd-weekly-cell').textContent = weeklyDisplay;
        row.querySelector('.cd-timeline-cell').textContent = weeks ? weeks.toFixed(1) + ' weeks' : '--';
      });
    }

    function renderAffiliates() {
      const row = $('cd-affiliate-row');
      if (!row) return;
      row.innerHTML = CALORIE_DEFICIT_AFFILIATES.map(function (item) {
        const url = buildAmazonUrl(item.query);
        return '<a href="' + url + '" target="_blank" rel="sponsored noopener" class="group block bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-sm hover:border-brand-400 transition-colors">' +
          '<div class="aspect-[4/3] bg-slate-100 dark:bg-slate-800 overflow-hidden">' +
            '<img src="' + item.image + '" alt="' + item.title + '" loading="lazy" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />' +
          '</div>' +
          '<div class="p-3">' +
            '<p class="text-sm font-semibold leading-tight group-hover:text-brand-600 dark:group-hover:text-brand-400">' + item.title + '</p>' +
            '<p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">' + item.desc + '</p>' +
            '<p class="text-[10px] text-slate-400 mt-1.5 inline-flex items-center gap-1">View on Amazon' +
              '<svg class="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M7 17L17 7M7 7h10v10"/></svg>' +
            '</p>' +
          '</div>' +
        '</a>';
      }).join('');
    }

    function recompute() {
      readInputs();
      compute();
    }

    function setUnits(units) {
      if (units === state.units) return;
      const lossEl = $('cd-loss');
      const v = parseFloat(lossEl.value);
      if (!isNaN(v) && v > 0) {
        lossEl.value = units === 'metric' ? (v / 2.20462).toFixed(1) : (v * 2.20462).toFixed(1);
      }
      state.units = units;
      updateUnitDisplay();
      recompute();
      try { localStorage.setItem('vd_cd_units', units); } catch (e) {}
    }

    function init() {
      try {
        let savedUnits = 'imperial';
        try { savedUnits = localStorage.getItem('vd_cd_units') || 'imperial'; } catch (e) {}
        state.units = savedUnits;
        updateUnitDisplay();

        bindOne('cd-unit-imperial', 'click', function () { setUnits('imperial'); });
        bindOne('cd-unit-metric', 'click', function () { setUnits('metric'); });
        ['cd-tdee', 'cd-loss', 'cd-timeline', 'cd-split'].forEach(function (id) {
          bindOne(id, 'input', recompute);
          bindOne(id, 'change', recompute);
        });

        const themeBtn = document.getElementById('theme-toggle');
        if (themeBtn) themeBtn.addEventListener('click', function () {
          document.documentElement.classList.toggle('dark');
          try {
            const p = JSON.parse(localStorage.getItem('vd_prefs')) || {};
            p.theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
            localStorage.setItem('vd_prefs', JSON.stringify(p));
          } catch (e) {}
        });

        const yearEl = document.getElementById('year');
        if (yearEl) yearEl.textContent = new Date().getFullYear();

        recompute();
        renderAffiliates();
      } catch (err) {
        console.error('[calorie-deficit] init failed:', err);
      }
    }

    init();
  })();
  </script>
