/* OLEACARB · modelo económico revisado (traducción literal de work/model.py, escenario sin apalancar) */
(function (root) {
  const YEARS = []; for (let y = 2027; y <= 2051; y++) YEARS.push(y);
  const NY = YEARS.length, T0 = 2026;
  const BASE = {
    price_hc: 6.0, yield_hc: 0.14, aid_ier: 0.0, aid_test: 0.0,
    r_real: 0.08, tax: 0.25, tax_new: 0.15, start: 2032, delay: 0,
    ms: 21500.0, ms_frac: 0.89, p_bone: 150.0, p_bone_host: 140.0, host_share: 0.25, freight: 12.6,
    reject: 0.02, char_yield: 0.205, ash_wash: 0.03, carb_loss: 0.17, act_yield: 0.41,
    p_offspec: 2.0, p_ac: 1.6, other_inc: 0.05,
    e_hc: 3.9, e_ms: 0.04, e_ac: 0.6, orc_mwh_ms: 0.37, orc_cap: 0.8, hours: 8000,
    orc_cost_mw: 2.5, orc_om: 0.15, p_el: 110.0, el_disc: 25.0, gas_mwh: 1000.0, p_gas: 80.0,
    fv_mwp: 0.8, fv_yield: 1650.0,
    cons_hc: 0.50, logi_hc: 0.12, cons_ac: 0.10, p_water: 2.6, water_ms: 1.5,
    staff: 55, cost_staff: 47000.0, struct: 1.25, maint: 0.03, insur: 0.007, repl: 0.02,
    capex_f: 1.0, surface: 0.5, eng: 0.08, lic: 0.015, cont: 0.15, start_up: 0.03,
    ph0: 0.6, test_eq: 0.4, samples: 0.6, samples_inc: 0.05, basic_eng: 1.2, permits: 0.4,
    d_clients: 60, d_stock_bone: 45, d_stock_prod: 30, d_cash: 15, d_suppliers: 45, spares: 0.40,
    ramp: [0.5, 0.8, 1.0], offspec: [0.30, 0.15, 0.05],
    civil_pec: null
  };
  // [nombre, ref M€, escala, exponente, tipo, ahorro por co-ubicación]
  const ITEMS = [
    ["Obra civil, urbanización y naves", 10.0, "ms", 0.6, "civil", 0.10],
    ["Recepción, almacenamiento, limpieza y secado", 2.5, "ms", 0.6, "equipo", 0.20],
    ["Pirólisis, oxidador térmico y caldera", 7.0, "ms", 0.6, "equipo", 0.00],
    ["Lavado ácido y secado del carbonizado", 3.0, "hc", 0.6, "equipo", 0.00],
    ["Carbonización a 1.300 °C y planta de N₂", 10.0, "hc", 0.7, "equipo", 0.00],
    ["Molienda, clasificación y envasado", 4.5, "hc", 0.6, "equipo", 0.00],
    ["Activación de finos", 1.0, "hc", 0.6, "equipo", 0.00],
    ["Aguas, neutralización y sales", 1.5, "ms", 0.6, "equipo", 0.15],
    ["Energía: acometida, subestación y FV", 2.9, "ms", 0.6, "equipo", 0.25],
    ["Automatización, MES y laboratorio", 3.5, "ms", 0.4, "equipo", 0.00],
    ["Seguridad: PCI, ATEX y químicos", 1.5, "ms", 0.6, "equipo", 0.10]
  ];

  function balance(p) {
    const ms = p.ms, recv = ms / p.ms_frac, rej = ms * p.reject, pyro_in = ms - rej;
    const char = pyro_in * p.char_yield, minerals = char * p.ash_wash, washed = char - minerals;
    const carb_gas = washed * p.carb_loss, carb = washed - carb_gas, hc = ms * p.yield_hc;
    const fines = Math.max(carb - hc, 1e-9), ac = fines * p.act_yield;
    return { recv, ms, rej, pyro_in, char, vol: pyro_in - char, minerals, washed, carb_gas, carb, hc, fines, ac };
  }

  function capex(p) {
    const b = balance(p);
    const items = ITEMS.map(([name, ref, sc, ex, typ, sav]) => {
      const ratio = sc === "ms" ? p.ms / 21500 : b.hc / 3000;
      let cost = ref * Math.pow(ratio, ex) * p.capex_f * (1 - sav);
      if (typ === "civil" && p.civil_pec) cost = p.civil_pec * p.capex_f * Math.pow(p.ms / 21500, 0.6);
      return { name, type: typ, cost };
    });
    const orc_mw = p.orc_mwh_ms * p.ms / p.hours;
    items.push({ name: "Cogeneración ORC", type: "equipo", cost: p.orc_cost_mw * orc_mw * p.capex_f });
    const direct = items.reduce((s, i) => s + i.cost, 0);
    const civil_d = items.filter(i => i.type === "civil").reduce((s, i) => s + i.cost, 0);
    const ind = { eng: p.eng * direct, lic: p.lic * direct, cont: p.cont * direct, start_up: p.start_up * direct };
    const ind_tot = ind.eng + ind.lic + ind.cont + ind.start_up;
    const total = direct + ind_tot + p.surface;
    const civil = civil_d * (1 + ind_tot / direct);
    const equip = direct + ind_tot - civil;
    return { items, direct, civil_d, equip_d: direct - civil_d, ind, total, civil, equip, phys: direct + ind.cont, orc_mw };
  }

  function taxSchedule(bai, sales, p) {
    const tax = new Array(NY).fill(0);
    let losses = 0, pos = 0;
    for (let i = 0; i < NY; i++) {
      const x = bai[i];
      if (x <= 0) { losses += -x; continue; }
      pos += 1;
      let lim;
      if (pos <= 3) lim = x;
      else { const pct = (i > 0 && sales[i - 1] >= 20.0) ? 0.5 : 0.7; lim = Math.max(Math.min(x, 1.0), x * pct); }
      const c = Math.min(losses, lim);
      losses -= c;
      const rate = pos <= 2 ? p.tax_new : p.tax;
      tax[i] = -(x - c) * rate;
    }
    return tax;
  }

  function run(over) {
    const p = Object.assign({}, BASE, over || {});
    const b = balance(p), cx = capex(p), start = p.start + p.delay;
    const z = () => new Array(NY).fill(0);
    const R = {}; ["util", "offspec", "hc", "hc_spec", "ac", "sales", "c_bone", "c_el", "c_gas", "c_cons", "c_water", "c_staff",
      "c_maint", "c_ins", "c_struct", "opex", "ebitda", "amort", "ph", "inv_land", "inv_plant", "inv_pre", "inv_repl", "aid",
      "cc", "dcc", "vr", "s_hc", "s_off", "s_ac", "s_oth", "el_grid"].forEach(k => R[k] = z());
    const host_cost = (p.host_share * p.p_bone_host + (1 - p.host_share) * (p.p_bone + p.freight)) / p.ms_frac;
    const p_el_eff = p.p_el - p.el_disc;
    for (let i = 0; i < NY; i++) {
      const y = YEARS[i], op = y - start;
      let u = 0, off = 0;
      if (op >= 0) { const k = Math.min(op, 2); u = p.ramp[k]; off = p.offspec[k]; }
      R.util[i] = u; R.offspec[i] = off;
      const ms = p.ms * u, hc = b.hc * u, ac = b.ac * u;
      R.hc[i] = hc; R.ac[i] = ac; R.hc_spec[i] = hc * (1 - off);
      const cons = hc * p.e_hc + ms * p.e_ms + ac * p.e_ac;
      const orc = Math.min(p.orc_mwh_ms * ms, p.orc_cap * cons);
      const fv = op >= 0 ? Math.min(p.fv_mwp * p.fv_yield, Math.max(cons - orc, 0)) : 0;
      R.el_grid[i] = cons - orc - fv;
      R.s_hc[i] = R.hc_spec[i] * p.price_hc / 1000;
      R.s_off[i] = hc * off * p.p_offspec / 1000;
      R.s_ac[i] = ac * p.p_ac / 1000;
      R.s_oth[i] = p.other_inc * u;
      if (op >= 0) {
        R.c_bone[i] = ms * host_cost / 1e6;
        R.c_el[i] = R.el_grid[i] * p_el_eff / 1e6 + p.orc_om * Math.pow(p.ms / 21500, 0.6);
        R.c_gas[i] = p.gas_mwh * u * p.p_gas / 1e6;
        R.c_cons[i] = (hc * (p.cons_hc + p.logi_hc) + ac * p.cons_ac) / 1000;
        R.c_water[i] = ms * p.water_ms * p.p_water / 1e6;
        R.c_staff[i] = p.staff * p.cost_staff / 1e6;
        R.c_maint[i] = cx.phys * p.maint * (op === 0 ? 0.6 : 1.0);
        R.c_ins[i] = cx.phys * p.insur;
        R.c_struct[i] = p.struct;
        if (op >= 10) R.inv_repl[i] = -cx.equip_d * p.repl;
      }
      const test_net = p.test_eq * p.capex_f;
      if (y === 2027) R.ph[i] = -p.ph0;
      if (y === 2028 || y === 2029) R.ph[i] = -(p.samples - p.samples_inc);
      if (y === 2028) { R.inv_pre[i] = -test_net - p.basic_eng / 2; R.aid[i] += p.aid_test * test_net; }
      if (y === 2029) R.inv_pre[i] = -p.basic_eng / 2 - p.permits;
      const plant = cx.total - p.surface;
      if (y === start - 2) { R.inv_plant[i] = -0.4 * plant; R.inv_land[i] = -p.surface; }
      if (y === start - 1) R.inv_plant[i] = -0.6 * plant;
      if (y === start) R.aid[i] += p.aid_ier * plant;
    }
    for (let i = 0; i < NY; i++) {
      R.sales[i] = R.s_hc[i] + R.s_off[i] + R.s_ac[i] + R.s_oth[i];
      R.opex[i] = R.c_bone[i] + R.c_el[i] + R.c_gas[i] + R.c_cons[i] + R.c_water[i] + R.c_staff[i] + R.c_maint[i] + R.c_ins[i] + R.c_struct[i];
      R.ebitda[i] = R.sales[i] - R.opex[i];
    }
    const pre = p.basic_eng + p.permits;
    const civil_base = cx.civil + pre * cx.civil / (cx.civil + cx.equip);
    const equip_base = cx.equip + pre * cx.equip / (cx.civil + cx.equip);
    const civil_net = civil_base * (1 - p.aid_ier), equip_net = equip_base * (1 - p.aid_ier);
    const test_base = p.test_eq * p.capex_f * (1 - p.aid_test);
    const n_op = YEARS[NY - 1] - start + 1;
    for (let i = 0; i < NY; i++) {
      const y = YEARS[i], op = y - start;
      let a = 0;
      if (op >= 0) { if (op < 34) a += civil_net / 34; if (op < 10) a += equip_net / 10; a += p.surface / n_op; }
      if (y >= 2028 && y < 2038) a += test_base / 10;
      for (let j = 0; j < i; j++) if (R.inv_repl[j] < 0 && i - j >= 1 && i - j <= 10) a += -R.inv_repl[j] / 10;
      R.amort[i] = a;
    }
    let repl_left = 0;
    for (let j = 0; j < NY; j++) if (R.inv_repl[j] < 0) repl_left += -R.inv_repl[j] * Math.max(10 - (NY - 1 - j), 0) / 10;
    R.vr[NY - 1] = civil_net * Math.max(34 - n_op, 0) / 34 + repl_left;
    for (let i = 0; i < NY; i++) {
      if (R.util[i] <= 0) continue;
      const purch = R.c_bone[i] + R.c_cons[i] + R.c_el[i] + R.c_gas[i] + R.c_water[i];
      R.cc[i] = R.sales[i] * p.d_clients / 360 + R.c_bone[i] * p.d_stock_bone / 365 + R.opex[i] * p.d_stock_prod / 365
        + R.opex[i] * p.d_cash / 360 + p.spares - purch * p.d_suppliers / 360;
    }
    for (let i = 0; i < NY; i++) R.dcc[i] = -(R.cc[i] - (i ? R.cc[i - 1] : 0));
    R.dcc[NY - 1] += R.cc[NY - 1];
    const bai = R.ebitda.map((v, i) => v + R.ph[i] - R.amort[i]);
    const tax = taxSchedule(bai, R.sales, p);
    const inv = R.inv_land.map((v, i) => v + R.inv_plant[i] + R.inv_pre[i] + R.inv_repl[i]);
    const fc = R.ebitda.map((v, i) => v + R.ph[i] + tax[i] + inv[i] + R.aid[i] + R.dcc[i] + R.vr[i]);
    const cum = []; fc.reduce((s, v, i) => (cum[i] = s + v), 0);
    const k = YEARS.indexOf(2037);
    return { p, b, cx, start, fc, cum, tax, bai, R,
      npv: npv(p.r_real, fc), irr: irr(fc), pb: payback(fc, start), capex: cx.total,
      sales37: R.sales[k], opex37: R.opex[k], ebitda37: R.ebitda[k], minCash: Math.min.apply(null, cum) };
  }

  function npv(r, f) { let s = 0; for (let i = 0; i < NY; i++) s += f[i] / Math.pow(1 + r, YEARS[i] - T0); return s; }
  function irr(f) {
    const g = r => f.reduce((s, c, k) => s + c / Math.pow(1 + r, k), 0);
    let lo = -0.3, hi = 1.0;
    if (g(lo) * g(hi) > 0) return NaN;
    for (let it = 0; it < 200; it++) { const m = (lo + hi) / 2; if (g(lo) * g(m) <= 0) hi = m; else lo = m; }
    return (lo + hi) / 2;
  }
  function payback(f, ref) {
    let acc = 0;
    for (let i = 0; i < NY; i++) { const prev = acc; acc += f[i]; if (YEARS[i] > ref && prev < 0 && acc >= 0) return (YEARS[i] - 1 - prev / f[i]) - (ref - 1); }
    return NaN;
  }
  function breakeven(over) {
    let lo = 2, hi = 14;
    for (let it = 0; it < 60; it++) { const m = (lo + hi) / 2; if (run(Object.assign({}, over, { price_hc: m })).npv > 0) hi = m; else lo = m; }
    return (lo + hi) / 2;
  }
  const api = { run, breakeven, BASE, YEARS };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else root.OleaModel = api;
})(this);
