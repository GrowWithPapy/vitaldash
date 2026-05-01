  <script>
  const AMAZON_TAG_PI = 'growwithpas0e-20';
  function buildAmazonUrlPI(query) {
    return 'https://www.amazon.com/s?k=' + encodeURIComponent(query) + '&tag=' + AMAZON_TAG_PI;
  }
  const PROTEIN_AFFILIATES = [
    {
      title: 'Whey protein isolate',
      desc: 'The most efficient way to add 25g of protein to any meal or shake.',
      query: 'whey protein isolate unflavored 5lb',
      image: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=300&q=80',
    },
    {
      title: 'Casein protein',
      desc: 'Slow-release protein. Drink at night to support overnight muscle protein synthesis.',
      query: 'casein protein powder',
      image: 'https://images.unsplash.com/photo-1505576391880-b3f9d713dc4f?w=300&q=80',
    },
    {
      title: 'High-protein snack pack',
      desc: 'Beef jerky, Greek yogurt cups, or protein bars for hitting the target on busy days.',
      query: 'high protein snack variety pack',
      image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=300&q=80',
    },
    {
      title: 'Frozen protein meals',
      desc: 'When meal prep falls apart, pre-portioned high-protein meals fill the gap.',
      query: 'frozen high protein meals delivery',
      image: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=300&q=80',
    },
  ];

  (function () {
    const state = {
      units: 'imperial',
      weightKg: 80,
      age: 30,
      status: 'active',
      goal: 'maintain',
      mealsPerDay: 4,
    };

    function $(id) { return document.getElementById(id); }

    function bindOne(id, event, handler) {
      const el = $(id);
      if (!el) { console.warn('[protein-intake] missing element:', id); return; }
      el.addEventListener(event, handler);
    }

    function readInputs() {
      const w = parseFloat($('pi-weight').value) || 0;
      state.weightKg = state.units === 'imperial' ? w / 2.20462 : w;
      state.age = parseFloat($('pi-age').value) || 0;
    }

    function updateUnitDisplay() {
      const unit = state.units === 'imperial' ? 'lb' : 'kg';
      $('pi-weight-unit').textContent = unit;
      $('pi-unit-imperial').className = 'px-3 py-1.5 rounded-md transition-all ' + (state.units === 'imperial' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-500');
      $('pi-unit-metric').className = 'px-3 py-1.5 rounded-md transition-all ' + (state.units === 'metric' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-500');
    }

    function updateStatusDisplay() {
      document.querySelectorAll('.pi-status-btn').forEach(function (b) {
        const isCutting = b.dataset.piStatus === 'cutting';
        const active = (isCutting && state.goal === 'cut') || (!isCutting && state.status === b.dataset.piStatus && state.goal !== 'cut');
        b.className = 'pi-status-btn px-3 py-2 rounded-md transition-all text-xs ' + (active ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700');
      });
    }

    function updateMealsDisplay() {
      document.querySelectorAll('.pi-meal-btn').forEach(function (b) {
        const active = parseInt(b.dataset.piMeals, 10) === state.mealsPerDay;
        b.className = 'pi-meal-btn px-4 py-2 rounded-md transition-all text-sm ' + (active ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700');
      });
    }

    function setStatus(status) {
      // The "cutting" button is shorthand for "strength training in a cut".
      if (status === 'cutting') {
        state.status = 'strength';
        state.goal = 'cut';
      } else {
        state.status = status;
        state.goal = 'maintain';
      }
      updateStatusDisplay();
      recompute();
    }

    function setMeals(n) {
      state.mealsPerDay = n;
      updateMealsDisplay();
      recompute();
    }

    function setUnits(units) {
      if (units === state.units) return;
      const wEl = $('pi-weight');
      const v = parseFloat(wEl.value);
      if (!isNaN(v) && v > 0) {
        wEl.value = units === 'metric' ? (v / 2.20462).toFixed(1) : (v * 2.20462).toFixed(1);
      }
      state.units = units;
      updateUnitDisplay();
      recompute();
      try { localStorage.setItem('vd_pi_units', units); } catch (e) {}
    }

    function compute() {
      const range = proteinIntakeRange(state.weightKg, state.status, state.goal, state.age);
      if (!range) {
        $('pi-target').textContent = '--';
        $('pi-range').textContent = 'Enter weight';
        $('pi-per-meal').textContent = '--';
        for (let i = 0; i < 4; i++) {
          const el = $('pi-food-' + i);
          if (el) el.querySelector('.pi-food-servings').textContent = '--';
        }
        return;
      }

      $('pi-target').textContent = Math.round(range.target);
      $('pi-range').textContent = 'Range: ' + Math.round(range.low) + ' to ' + Math.round(range.high) + ' g/day';

      const perMeal = proteinPerMeal(range.target, state.mealsPerDay);
      $('pi-per-meal').textContent = Math.round(perMeal) + 'g per meal across ' + state.mealsPerDay + ' meals';

      const eq = proteinFoodEquivalents(range.target);
      eq.forEach(function (item, i) {
        const el = $('pi-food-' + i);
        if (!el) return;
        el.querySelector('.pi-food-servings').textContent = item.servings.toFixed(1);
      });
    }

    function recompute() {
      readInputs();
      compute();
    }

    function renderAffiliates() {
      const row = $('pi-affiliate-row');
      if (!row) return;
      row.innerHTML = PROTEIN_AFFILIATES.map(function (item) {
        const url = buildAmazonUrlPI(item.query);
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

    function init() {
      try {
        let savedUnits = 'imperial';
        try { savedUnits = localStorage.getItem('vd_pi_units') || 'imperial'; } catch (e) {}
        state.units = savedUnits;
        updateUnitDisplay();

        bindOne('pi-unit-imperial', 'click', function () { setUnits('imperial'); });
        bindOne('pi-unit-metric', 'click', function () { setUnits('metric'); });

        ['pi-weight', 'pi-age'].forEach(function (id) {
          bindOne(id, 'input', recompute);
          bindOne(id, 'change', recompute);
        });

        document.querySelectorAll('.pi-status-btn').forEach(function (b) {
          b.addEventListener('click', function () { setStatus(b.dataset.piStatus); });
        });
        document.querySelectorAll('.pi-meal-btn').forEach(function (b) {
          b.addEventListener('click', function () { setMeals(parseInt(b.dataset.piMeals, 10)); });
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

        updateStatusDisplay();
        updateMealsDisplay();
        renderAffiliates();
        recompute();
      } catch (err) {
        console.error('[protein-intake] init failed:', err);
      }
    }

    init();
  })();
  </script>
