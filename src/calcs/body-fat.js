  <script>
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
    }

    // This script sits at the end of <body>, after every element it touches,
    // so init() can run immediately. Don't wait for DOMContentLoaded: in some
    // cases (back-forward cache, slow Tailwind CDN load) DCL has already fired
    // by the time we get here, and the listener never runs.
    init();
  })();
  </script>
