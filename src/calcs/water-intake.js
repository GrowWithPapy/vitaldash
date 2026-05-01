  <script>
  const AMAZON_TAG_WI = 'growwithpas0e-20';
  function buildAmazonUrlWI(query) {
    return 'https://www.amazon.com/s?k=' + encodeURIComponent(query) + '&tag=' + AMAZON_TAG_WI;
  }
  const WATER_AFFILIATES = [
    {
      title: 'Insulated water bottle',
      desc: '24 to 32 oz capacity. Carries half a day\'s target in one fill, keeps it cold for hours.',
      query: 'insulated water bottle 32oz',
      image: 'https://images.unsplash.com/photo-1553787499-6f9133860278?w=300&q=80',
    },
    {
      title: 'Smart water bottle with tracker',
      desc: 'Logs each sip and reminds you to drink. The most effective behavior tool if you forget to hydrate.',
      query: 'smart water bottle bluetooth tracker',
      image: 'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=300&q=80',
    },
    {
      title: 'Electrolyte powder packets',
      desc: 'For workouts over 60 min or hot climates. Sodium, potassium, magnesium without the sugar.',
      query: 'electrolyte powder packets sugar free',
      image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=300&q=80',
    },
    {
      title: 'Filtered water pitcher',
      desc: 'Better-tasting water means more water consumed. The cheapest hydration upgrade most people skip.',
      query: 'water filter pitcher brita',
      image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&q=80',
    },
  ];

  (function () {
    const state = {
      units: 'imperial',
      weightKg: 80,
      activityHours: 0.5,
      climate: 'temperate',
      lifeStage: 'normal',
      altitude: 'normal',
    };

    function $(id) { return document.getElementById(id); }

    function bindOne(id, event, handler) {
      const el = $(id);
      if (!el) { console.warn('[water-intake] missing element:', id); return; }
      el.addEventListener(event, handler);
    }

    function readInputs() {
      const w = parseFloat($('wi-weight').value) || 0;
      state.weightKg = state.units === 'imperial' ? w / 2.20462 : w;
      state.activityHours = parseFloat($('wi-activity').value) || 0;
    }

    function updateUnitDisplay() {
      $('wi-weight-unit').textContent = state.units === 'imperial' ? 'lb' : 'kg';
      $('wi-unit-imperial').className = 'px-3 py-1.5 rounded-md transition-all ' + (state.units === 'imperial' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-500');
      $('wi-unit-metric').className = 'px-3 py-1.5 rounded-md transition-all ' + (state.units === 'metric' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-500');
    }

    const ACTIVE_CLASSES = 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white';
    const INACTIVE_CLASSES = 'text-slate-500 dark:text-slate-400 hover:text-slate-700';

    function updateGroupDisplay(prefix, activeValue) {
      document.querySelectorAll('[data-' + prefix + ']').forEach(function (b) {
        const active = b.getAttribute('data-' + prefix) === activeValue;
        // Strip both class chunks, then re-add the right one. Keeps base classes intact.
        const stripped = b.className
          .replace(ACTIVE_CLASSES, '')
          .replace(INACTIVE_CLASSES, '')
          .replace(/\s+/g, ' ')
          .trim();
        b.className = stripped + ' ' + (active ? ACTIVE_CLASSES : INACTIVE_CLASSES);
      });
    }

    function setUnits(units) {
      if (units === state.units) return;
      const wEl = $('wi-weight');
      const v = parseFloat(wEl.value);
      if (!isNaN(v) && v > 0) {
        wEl.value = units === 'metric' ? (v / 2.20462).toFixed(1) : (v * 2.20462).toFixed(1);
      }
      state.units = units;
      updateUnitDisplay();
      recompute();
      try { localStorage.setItem('vd_wi_units', units); } catch (e) {}
    }

    function setClimate(c) { state.climate = c; updateGroupDisplay('wi-climate', c); recompute(); }
    function setLifeStage(ls) { state.lifeStage = ls; updateGroupDisplay('wi-life', ls); recompute(); }
    function setAltitude(a) { state.altitude = a; updateGroupDisplay('wi-alt', a); recompute(); }

    function setText(id, val) {
      const el = $(id);
      if (el) el.textContent = val;
    }

    function compute() {
      const result = waterIntakeRecommendation(state.weightKg, state.activityHours, state.climate, state.lifeStage, state.altitude);
      if (!result) {
        $('wi-target-l').textContent = '--';
        $('wi-target-oz').textContent = '--';
        $('wi-target-summary').textContent = 'Enter weight';
        ['wi-cups', 'wi-bottles-500', 'wi-bottles-750', 'wi-floz'].forEach(function (id) { setText(id, '--'); });
        return;
      }

      const units = waterInPracticalUnits(result.drinksLiters);

      $('wi-target-l').textContent = result.drinksLiters.toFixed(1) + ' L';
      $('wi-target-oz').textContent = Math.round(units.fluidOunces) + ' fl oz';
      $('wi-target-summary').textContent = 'About ' + units.bottles_500ml.toFixed(1) + ' bottles (500 mL) or ' + units.glasses_250ml.toFixed(1) + ' glasses (250 mL)';

      setText('wi-cups', units.cups.toFixed(1));
      setText('wi-bottles-500', units.bottles_500ml.toFixed(1));
      setText('wi-bottles-750', units.bottles_750ml.toFixed(1));
      setText('wi-floz', Math.round(units.fluidOunces));
    }

    function recompute() {
      readInputs();
      compute();
    }

    function renderAffiliates() {
      const row = $('wi-affiliate-row');
      if (!row) return;
      row.innerHTML = WATER_AFFILIATES.map(function (item) {
        const url = buildAmazonUrlWI(item.query);
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
        try { savedUnits = localStorage.getItem('vd_wi_units') || 'imperial'; } catch (e) {}
        state.units = savedUnits;
        updateUnitDisplay();

        bindOne('wi-unit-imperial', 'click', function () { setUnits('imperial'); });
        bindOne('wi-unit-metric', 'click', function () { setUnits('metric'); });

        ['wi-weight', 'wi-activity'].forEach(function (id) {
          bindOne(id, 'input', recompute);
          bindOne(id, 'change', recompute);
        });

        document.querySelectorAll('[data-wi-climate]').forEach(function (b) {
          b.addEventListener('click', function () { setClimate(b.getAttribute('data-wi-climate')); });
        });
        document.querySelectorAll('[data-wi-life]').forEach(function (b) {
          b.addEventListener('click', function () { setLifeStage(b.getAttribute('data-wi-life')); });
        });
        document.querySelectorAll('[data-wi-alt]').forEach(function (b) {
          b.addEventListener('click', function () { setAltitude(b.getAttribute('data-wi-alt')); });
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

        updateGroupDisplay('wi-climate', state.climate);
        updateGroupDisplay('wi-life', state.lifeStage);
        updateGroupDisplay('wi-alt', state.altitude);

        renderAffiliates();
        recompute();
      } catch (err) {
        console.error('[water-intake] init failed:', err);
      }
    }

    init();
  })();
  </script>
