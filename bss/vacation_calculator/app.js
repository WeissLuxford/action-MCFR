(function(){
  "use strict";

  // ===== Utils =====
  const fmt = new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const clampNonNegative = (v) => isFinite(v) ? Math.max(0, v) : 0;
  const q = (sel) => document.querySelector(sel);
  const ce = (tag, props={}) => Object.assign(document.createElement(tag), props);

  const MONTHS = ["январь","февраль","март","апрель","май","июнь","июль","август","сентябрь","октябрь","ноябрь","декабрь"];

  // ===== State =====
  const state = {
    monthsCount: 12,
    months: [], // динамический массив по monthsCount
    bonuses: 0,
    startDate: null,
    endDate: null,
    autoDays: false,
    holidays: new Set(),
    divisorDaily: 25.3
  };

  // ===== Elements =====
  const el = {
    startDate: q('#startDate'),
    endDate: q('#endDate'),
    monthsCount: q('#monthsCount'),
    monthsList: q('#monthsList'),
    bonuses: q('#bonuses'),
    autoDays: q('#autoDays'),
    holidays: q('#holidays'),
    paidDays: q('#paidDays'),

    totalIncome: q('#totalIncome'),
    avgMonthly: q('#avgMonthly'),
    avgDaily: q('#avgDaily'),
    vacationPay: q('#vacationPay'),
    errors: q('#errors'),

    resetBtn: q('#resetBtn'),
    exportCsvBtn: q('#exportCsvBtn'),
    printBtn: q('#printBtn'),
    incomeCard: q('#incomeCard')
  };

  function toCsvRow(arr){
  // Экранируем запятые/кавычки по CSV-правилам
  return arr.map(v=>{
    const s = String(v ?? '');
    return /[",;\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s;
  }).join(';'); // ; чтобы не конфликтовать с локалью
}

function buildCsv(){
  // собираем текущее состояние и итоги
  const header = [
    'Дата начала','Дата окончания','Период (мес.)','Премии',
    ...Array.from({length:12},(_,i)=>`Месяц ${i+1}`),
    'Оплачиваемые дни','Общая сумма','Среднемесячный','Среднедневной','Отпускные'
  ];
  const totals = [
    state.startDate || '',
    state.endDate || '',
    state.monthsCount,
    state.bonuses,
    ...state.months,
    Number(el.paidDays.value || 0),
    // в CSV кладём «сырые» числа без локального форматирования
    (()=> {
      const sumMonths = state.months.reduce((a,b)=>a+(isFinite(b)?b:0),0);
      return sumMonths + state.bonuses;
    })(),
    (()=> {
      const total = state.months.reduce((a,b)=>a+(isFinite(b)?b:0),0) + state.bonuses;
      return total / state.monthsCount;
    })(),
    (()=> {
      const total = state.months.reduce((a,b)=>a+(isFinite(b)?b:0),0) + state.bonuses;
      const avgMonthly = total / state.monthsCount;
      return avgMonthly / state.divisorDaily;
    })(),
    (()=> {
      const total = state.months.reduce((a,b)=>a+(isFinite(b)?b:0),0) + state.bonuses;
      const avgMonthly = total / state.monthsCount;
      const avgDaily = avgMonthly / state.divisorDaily;
      const days = Number(el.paidDays.value || 0);
      return days * avgDaily;
    })()
  ];

  const lines = [
    toCsvRow(header),
    toCsvRow(totals)
  ];
  return lines.join('\n');
}

function downloadCsv(){
  const csv = buildCsv();
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'vacation-calculator.csv';
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(url);
  a.remove();
}

  // ===== Helpers for month labels =====
  // Генерируем массив из monthsCount подписей, заканчивая месяцем начала (включительно).
  // От самого раннего к самому позднему.
  function generateMonthYearLabels(startDateStr, monthsCount){
    const labels = [];
    if(!startDateStr || monthsCount < 1) return labels;

    const start = new Date(startDateStr);
    if(isNaN(start)) return labels;

    // Конечная точка — месяц начала отпуска (включаем)
    const endMonth = start.getMonth();      // 0..11
    const endYear  = start.getFullYear();

    // Старейший месяц = (end - (monthsCount - 1))
    let m = endMonth - (monthsCount - 1);
    let y = endYear;
    while(m < 0){ m += 12; y -= 1; }

    for(let i=0;i<monthsCount;i++){
      const name = MONTHS[(m + i) % 12];
      const year = y + Math.floor((m + i) / 12);
      labels.push(`${name} ${year}`);
    }
    return labels;
  }

  // Убедиться, что массив state.months имеет длину monthsCount.
  // Сохраняем уже введённые значения по возможности.
  function ensureMonthsLength(count){
    const old = state.months.slice();
    const next = new Array(count).fill(0);
    for(let i=0;i<count;i++){
      next[i] = old[i] ?? 0;
    }
    state.months = next;
  }

  // ===== Build month rows =====
  function buildMonthRows(){
    el.monthsList.innerHTML = '';
    const count = state.monthsCount;
    const labels = generateMonthYearLabels(state.startDate, count);

    for(let i=0;i<count;i++){
      const row = ce('div',{className:'month-row'});
      const label = ce('div',{className:'label', textContent: labels[i] || `Месяц ${i+1}`});
      const input = ce('input',{type:'number', min:'0', step:'0.01', value: String(state.months[i] ?? 0)});
      input.dataset.index = i;
      input.addEventListener('input', onMonthInput);
      row.append(label,input);
      el.monthsList.append(row);
    }
  }

  function onMonthInput(e){
    const i = Number(e.target.dataset.index);
    const val = parseFloat(e.target.value.replace(',', '.'));
    state.months[i] = clampNonNegative(val);
    validateField(e.target, isFinite(val) && val>=0);
    recalc();
  }

  // ===== Holidays parsing =====
  function parseHolidays(str){
    const set = new Set();
    if(!str) return set;
    str.split(',').map(s=>s.trim()).forEach(s=>{
      if(/^\d{4}-\d{2}-\d{2}$/.test(s)) set.add(s);
    });
    return set;
  }

  function isSunday(date){ return date.getDay() === 0; }

  function countPaidDays(start, end, holidays){
    if(!(start instanceof Date) || !(end instanceof Date)) return 0;
    if(isNaN(start) || isNaN(end) || end < start) return 0;

    let count = 0;
    const cur = new Date(start);
    while(cur <= end){
      const iso = cur.toISOString().slice(0,10);
      if(!isSunday(cur) && !holidays.has(iso)){ count++; }
      cur.setDate(cur.getDate()+1);
    }
    return count;
  }

  // ===== Validation/Helpers =====
  function validateField(input, ok){
    input.classList.toggle('invalid', !ok);
  }

  function setReadOnlyDays(readOnly){
    el.paidDays.readOnly = readOnly;
    el.paidDays.disabled = readOnly;
  }

  function numberOrZero(elm){
    const v = parseFloat((elm.value||"").toString().replace(',', '.'));
    return isFinite(v) ? v : 0;
  }

  function updateIncomeVisibility(){
    const visible = Boolean(state.startDate) && state.monthsCount >= 1;
    el.incomeCard.classList.toggle('hidden', !visible);
  }

  // ===== Recalc =====
  function recalc(){
    const errs = [];

    // monthsCount
    let mc = Math.floor(numberOrZero(el.monthsCount));
    if(mc < 1) mc = 1;
    if(mc > 36) mc = 36;
    if(mc !== state.monthsCount){
      state.monthsCount = mc;
      ensureMonthsLength(state.monthsCount);
      buildMonthRows();
    }
    el.monthsCount.value = state.monthsCount;

    // total income
    const sumMonths = state.months.reduce((a,b)=>a+(isFinite(b)?b:0),0);
    const bonusesVal = clampNonNegative(numberOrZero(el.bonuses));
    state.bonuses = bonusesVal;
    const total = clampNonNegative(sumMonths + bonusesVal);

    // avg monthly
    let avgMonthly = 0;
    if(state.monthsCount === 0){
      errs.push("Расчётный период не может быть 0.");
    } else {
      avgMonthly = total / state.monthsCount;
    }

    // avg daily
    let avgDaily = 0;
    if(state.divisorDaily === 0){
      errs.push("Делитель для среднего дневного равен 0.");
    } else {
      avgDaily = avgMonthly / state.divisorDaily;
    }

    // paid days
    let paidDays = 0;
    if(state.autoDays){
      const s = state.startDate ? new Date(state.startDate) : null;
      const e = state.endDate ? new Date(state.endDate) : null;
      if(!s || !e){
        errs.push("Для автосчёта дней укажите даты начала и окончания.");
      } else {
        paidDays = countPaidDays(s, e, state.holidays);
      }
      el.paidDays.value = paidDays;
    } else {
      paidDays = Math.max(0, Math.floor(numberOrZero(el.paidDays)));
      el.paidDays.value = paidDays;
    }

    const vacationPay = paidDays * avgDaily;

    // Render
    el.totalIncome.textContent = isFinite(total) ? fmt.format(total) : '—';
    el.avgMonthly.textContent = isFinite(avgMonthly) ? fmt.format(avgMonthly) : '—';
    el.avgDaily.textContent = isFinite(avgDaily) ? fmt.format(avgDaily) : '—';
    el.vacationPay.textContent = isFinite(vacationPay) ? fmt.format(vacationPay) : '—';

    // errors
    el.errors.textContent = errs.join(' ');

    // visibility
    updateIncomeVisibility();
  }

  // ===== Events =====
  function bindEvents(){
    el.startDate.addEventListener('change', ()=>{
      state.startDate = el.startDate.value || null;
      ensureMonthsLength(state.monthsCount);
      buildMonthRows();
      recalc();
    });

    el.endDate.addEventListener('change', ()=>{
      state.endDate = el.endDate.value || null;
      recalc();
    });

    el.monthsCount.addEventListener('input', ()=>{
      const v = numberOrZero(el.monthsCount);
      validateField(el.monthsCount, v>=1 && v<=36);
      recalc();
    });

    el.bonuses.addEventListener('input', ()=>{
      const v = numberOrZero(el.bonuses);
      validateField(el.bonuses, v>=0);
      recalc();
    });

    el.autoDays.addEventListener('change', ()=>{
      state.autoDays = el.autoDays.checked;
      setReadOnlyDays(state.autoDays);
      recalc();
    });

    el.holidays.addEventListener('input', ()=>{
      state.holidays = parseHolidays(el.holidays.value);
      recalc();
    });

    el.paidDays.addEventListener('input', ()=>{
      if(state.autoDays) return;
      const v = numberOrZero(el.paidDays);
      validateField(el.paidDays, v>=0);
      recalc();
    });

    el.resetBtn.addEventListener('click', ()=>{
      el.startDate.value = '';
      el.endDate.value = '';
      el.monthsCount.value = 12;
      el.bonuses.value = '0';
      el.autoDays.checked = false;
      el.holidays.value = '';
      el.paidDays.value = '0';

      Object.assign(state, {
        monthsCount:12,
        months:[],
        bonuses:0,
        startDate:null,
        endDate:null,
        autoDays:false,
        holidays:new Set(),
        divisorDaily:25.3
      });
      ensureMonthsLength(state.monthsCount);
      buildMonthRows();
      setReadOnlyDays(false);
      recalc();
    });

    el.exportCsvBtn.addEventListener('click', downloadCsv);
    el.printBtn.addEventListener('click', ()=> window.print());
  }

  // ===== Init (заполним примером после выбора даты) =====
  function initWithExcelSampleIfReady(){
    // Заполняем пример только если есть дата старта, чтобы метки соответствовали периоду.
    if(!state.startDate) return;
    const sample = [
      818181.82, 1500000, 3000000, 1500000, 1500000, 3000000,
      1500000, 3000000, 1500000, 1500000, 1500000, 1500000
    ];
    const n = state.monthsCount;
    for(let i=0;i<n;i++){
      state.months[i] = sample[i] ?? 0;
    }
    el.bonuses.value = '2000000';
    recalc();
    // залить значения в инпуты
    el.monthsList.querySelectorAll('input[type="number"]').forEach((inp, idx)=>{
      if(idx < n) inp.value = String(state.months[idx]);
    });
  }

  // Boot
  ensureMonthsLength(state.monthsCount);
  buildMonthRows();
  bindEvents();
  recalc();

  // Если нужно — раскомментируйте, чтобы сразу заполнять пример после выбора даты:
  // el.startDate.addEventListener('change', initWithExcelSampleIfReady);
})();
