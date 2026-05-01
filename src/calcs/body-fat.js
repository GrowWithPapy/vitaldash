  <script>
  const AMAZON_TAG_BF = 'growwithpas0e-20';
  function buildAmazonUrlBF(query) {
    return 'https://www.amazon.com/s?k=' + encodeURIComponent(query) + '&tag=' + AMAZON_TAG_BF;
  }
  const BODY_FAT_AFFILIATES = [
    {
      title: 'Flexible measuring tape',
      desc: 'Self-retracting tape with mm markings. The Navy method only works with consistent technique; a quality tape removes one variable.',
      query: 'myotape body measuring tape self retracting',
      image: 'https://images.unsplash.com/photo-1590650153855-d9e808231d41?w=300&q=80',
    },
    {
      title: 'Body fat calipers',
      desc: 'For higher accuracy than the Navy method. Skinfold calipers used correctly hit ±3% accuracy.',
      query: 'body fat calipers skinfold accumeasure',
      image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=300&q=80',
    },
    {
      title: 'Smart bathroom scale with body fat',
      desc: 'Daily BIA readings. Less accurate than calipers but useful for tracking trends over weeks.',
      query: 'smart bathroom scale body fat bioimpedance',
      image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=300&q=80',
    },
    {
      title: 'Full-length mirror',
      desc: 'Visual progress tracking is the most underrated body fat method. The mirror sees what numbers miss.',
      query: 'full length floor mirror standing',
      image: 'https://images.unsplash.com/photo-1618220179428-22790b461013?w=300&q=80',
    },
  ];

  (function () {
    const state = {
      units: 'imperial',
      gender: 'male',
      heightIn: 0,
      neckIn: 0,
      waistIn: 0,
      hipIn: 0,
      weightLb: 0,
    };

    function $(id) { return document.getElementById(id); }

    function updateUnitDisplay() {
      const unitText = state.units === 'metric' ? '(cm)' : '(in)';
      const weightUnit = state.units === 'metric' ? '(kg)' : '(lb)';
      $('bf-height-unit').textContent = unitText;
      $('bf-neck-unit').textContent = unitText;
      $('bf-waist-unit').textContent = unitText;
      $('bf-hip-unit').textContent = unitText;
      $('bf-weight-unit').textContent = weightUnit;

      $('bf-unit-imperial').className = 'px-3 py-1.5 rounded-md transition-all ' + (state.units === 'imperial' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-500');
      $('bf-unit-metric').className = 'px-3 py-1.5 rounded-md transition-all ' + (state.units === 'metric' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-500');
    }

    function updateGenderDisplay() {
      document.querySelectorAll('.bf-gender-btn').forEach(function (b) {
        const active = b.dataset.bfGender === state.gender;
        b.className = 'bf-gender-btn px-2 py-2 rounded-md transition-all ' + (active ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700');
      });
      $('bf-hip-row').style.display = state.gender === 'female' ? 'block' : 'none';
      $('bf-waist-help').textContent = state.gender === 'male' ? 'Men: at the navel.' : 'Women: at the narrowest point.';
    }

    function readInputs() {
      const factor = state.units === 'metric' ? cmToIn : function (n) { return n; };
      state.heightIn = factor(parseFloat($('bf-height').value) || 0);
      state.neckIn = factor(parseFloat($('bf-neck').value) || 0);
      state.waistIn = factor(parseFloat($('bf-waist').value) || 0);
      state.hipIn = factor(parseFloat($('bf-hip').value) || 0);

      const weightVal = parseFloat($('bf-weight').value) || 0;
      state.weightLb = state.units === 'metric' ? kgToLb(weightVal) : weightVal;
    }

    function compute() {
      let bf = null;
      if (state.gender === 'male') {
        if (state.heightIn > 0 && state.neckIn > 0 && state.waistIn > 0) {
          bf = navyBodyFatMale(state.waistIn, state.neckIn, state.heightIn);
        }
      } else {
        if (state.heightIn > 0 && state.neckIn > 0 && state.waistIn > 0 && state.hipIn > 0) {
          bf = navyBodyFatFemale(state.waistIn, state.hipIn, state.neckIn, state.heightIn);
        }
      }

      if (bf === null || isNaN(bf) || bf < 0 || bf > 60) {
        $('bf-result').textContent = '—';
        $('bf-category').textContent = 'Enter your measurements';
        $('bf-mass').textContent = state.units === 'metric' ? '— kg' : '— lb';
        $('bf-warning').classList.add('hidden');
        return;
      }

      $('bf-result').textContent = bf.toFixed(1);
      $('bf-category').textContent = bodyFatCategory(bf, state.gender);

      if (state.weightLb > 0) {
        const fatMassLb = state.weightLb * (bf / 100);
        if (state.units === 'metric') {
          $('bf-mass').textContent = (fatMassLb / 2.20462).toFixed(1) + ' kg';
        } else {
          $('bf-mass').textContent = fatMassLb.toFixed(1) + ' lb';
        }
      } else {
        $('bf-mass').textContent = state.units === 'metric' ? '— kg' : '— lb';
      }

      const lowExtreme = state.gender === 'male' ? 10 : 18;
      if (bf < lowExtreme || bf > 35) {
        $('bf-warning').classList.remove('hidden');
      } else {
        $('bf-warning').classList.add('hidden');
      }
    }

    function recompute() {
      readInputs();
      compute();
    }

    function renderAffiliates() {
      const row = $('bf-affiliate-row');
      if (!row) return;
      row.innerHTML = BODY_FAT_AFFILIATES.map(function (item) {
        const url = buildAmazonUrlBF(item.query);
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

    function setUnits(units) {
      if (units === state.units) return;
      // Convert displayed values so the user doesn't retype
      const fields = ['bf-height', 'bf-neck', 'bf-waist', 'bf-hip', 'bf-weight'];
      fields.forEach(function (id) {
        const el = $(id);
        const v = parseFloat(el.value);
        if (!isNaN(v) && v > 0) {
          if (id === 'bf-weight') {
            el.value = units === 'metric' ? (v / 2.20462).toFixed(1) : (v * 2.20462).toFixed(1);
          } else {
            el.value = units === 'metric' ? (v * 2.54).toFixed(1) : (v / 2.54).toFixed(1);
          }
        }
      });
      state.units = units;
      updateUnitDisplay();
      recompute();
      try { localStorage.setItem('vd_bf_units', units); } catch (e) {}
    }

    function setGender(gender) {
      state.gender = gender;
      updateGenderDisplay();
      recompute();
      try { localStorage.setItem('vd_bf_gender', gender); } catch (e) {}
    }

    function bindOne(id, evt, fn) {
      const el = $(id);
      if (!el) { console.warn('[body-fat] missing element:', id); return; }
      el.addEventListener(evt, fn);
    }

    function bind() {
      bindOne('bf-unit-imperial', 'click', function () { setUnits('imperial'); });
      bindOne('bf-unit-metric', 'click', function () { setUnits('metric'); });
      const genderBtns = document.querySelectorAll('.bf-gender-btn');
      if (genderBtns.length === 0) console.warn('[body-fat] no .bf-gender-btn elements');
      genderBtns.forEach(function (b) {
        b.addEventListener('click', function () { setGender(b.dataset.bfGender); });
      });
      ['bf-height', 'bf-neck', 'bf-waist', 'bf-hip', 'bf-weight'].forEach(function (id) {
        // Bind both 'input' and 'change' for max browser coverage on type=number
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
    }

    function init() {
      let savedUnits = 'imperial', savedGender = 'male';
      try {
        savedUnits = localStorage.getItem('vd_bf_units') || 'imperial';
        savedGender = localStorage.getItem('vd_bf_gender') || 'male';
      } catch (e) {}
      state.units = savedUnits;
      state.gender = savedGender;
      try {
        updateUnitDisplay();
        updateGenderDisplay();
        bind();
      } catch (e) {
        console.error('[body-fat] init failed:', e);
        return;
      }
      const yearEl = document.getElementById('year');
      if (yearEl) yearEl.textContent = new Date().getFullYear();
      // Run an initial compute in case the inputs already have values (browser autofill, back-forward cache).
      recompute();
      renderAffiliates();
    }

    // This script sits at the end of <body>, after every element it touches,
    // so init() can run immediately. Don't wait for DOMContentLoaded: in some
    // cases (back-forward cache, slow Tailwind CDN load) DCL has already fired
    // by the time we get here, and the listener never runs.
    init();
  })();
  </script>
