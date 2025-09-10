:root{
  
  --text:#212529;
  --primary:#0d6efd;
  --white:#ffffff;
  --light:#f8f9fa;
  --error:#b02a37;
}

*{box-sizing:border-box}
html,body{margin:0;padding:0}
body{
  font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,'Noto Sans','Helvetica Neue',Arial,'Apple Color Emoji','Segoe UI Emoji';
  color:var(--text);
  line-height:1.5;
  background:
    radial-gradient(1000px 400px at 10% -10%, rgba(13,110,253,.07), transparent 60%),
    radial-gradient(800px 300px at 90% 110%, rgba(13,110,253,.06), transparent 60%),
    #fbfbfd;
}

.container{max-width:960px;margin:0 auto;padding:16px}
h1{margin:12px 0 8px}
h2{margin:0 0 12px;font-size:1.1rem}
.muted{color:#6c757d}
.small{font-size:.9rem}

.card{
  background:var(--white);
  border:1px solid #e9ecef;
  border-radius:8px;
  padding:16px;
  margin:12px 0;
  box-shadow:0 1px 1px rgba(0,0,0,.03);
}

.grid{
  display:grid;
  grid-template-columns:repeat(2,minmax(0,1fr));
  gap:12px;
}
@media (max-width:600px){
  .grid{grid-template-columns:1fr}
}

.field label{display:block;font-weight:600;margin-bottom:6px}
.field input[type="number"],
.field input[type="date"],
.field textarea{
  width:100%;
  padding:10px 12px;
  border:1px solid #ced4da;
  border-radius:6px;
  background:var(--light);
}
.field input:disabled{opacity:.7}
.help{color:#6c757d;font-size:.85rem;margin-top:4px}

.months-header{
  display:grid;
  grid-template-columns:1fr 1fr;
  font-weight:600;
  padding:0 4px 8px;
}
.months-list{display:grid;grid-template-columns:1fr;gap:8px}
.month-row{
  display:grid; grid-template-columns:1fr 1fr; gap:8px;
}
.month-row .label{
  align-self:center; padding-left:4px;
}
.month-row input{
  width:100%; padding:10px 12px; border:1px solid #ced4da; border-radius:6px; background:var(--light);
}

.results-grid{
  display:grid;
  grid-template-columns:repeat(2,minmax(0,1fr));
  gap:12px;
}
@media (min-width:900px){
  .results-grid{grid-template-columns:repeat(4,minmax(0,1fr))}
}
.results .label{font-size:.9rem;color:#6c757d}
.results .value{font-size:1.25rem;font-variant-numeric:tabular-nums}
.results .value.strong{font-weight:700}
.results .unit{font-size:.85rem;color:#6c757d}

.actions{display:flex;gap:8px;margin-top:12px}
.btn{
  appearance:none; border:1px solid var(--primary); background:transparent; color:var(--primary);
  padding:10px 14px; border-radius:6px; cursor:pointer; font-weight:600;
}
.btn:hover{filter:brightness(.95)}
.btn-primary{background:var(--primary); color:var(--white)}
.btn:disabled{opacity:.6; cursor:not-allowed}

.errors{margin-top:8px; color:var(--error); font-weight:600; min-height:1.2em}
.invalid{border-color:var(--error)!important; outline:0}

details.map summary{cursor:pointer; color:var(--primary); margin-top:12px}
details.map table{width:100%; border-collapse:collapse; margin-top:8px}
details.map th, details.map td{border:1px solid #e9ecef; padding:6px 8px; text-align:left}
.footer{padding-bottom:24px}

.hidden{display:none}

/* Заголовок с иконкой вопроса */
.with-qmark{
  display:flex; align-items:center; gap:8px;
}

/* Кружок с вопросительным знаком */
.qmark{
  position:relative;
  display:inline-flex;
  justify-content:center; align-items:center;
  width:20px; height:20px;
  border:1px solid var(--primary);
  border-radius:50%;
  color:var(--primary);
  font-weight:700;
  line-height:1;
  cursor:help;
  user-select:none;
  outline:none;
}
.qmark:focus{ box-shadow:0 0 0 3px rgba(13,110,253,.2); }

/* Тултип */
.qtip{
  position:absolute;
  top:120%; left:50%;
  transform:translateX(-50%);
  width:min(420px, 80vw);
  background:var(--white);
  color:var(--text);
  border:1px solid #e9ecef;
  border-radius:6px;
  padding:10px 12px;
  box-shadow:0 6px 18px rgba(0,0,0,.08);
  font-size:.92rem;
  line-height:1.4;

  visibility:hidden; opacity:0; transition:opacity .12s ease-in-out;
  z-index:20;
}

/* Маленькая стрелка */
.qtip::before{
  content:"";
  position:absolute;
  top:-6px; left:50%; transform:translateX(-50%);
  border:6px solid transparent;
  border-bottom-color:#e9ecef;
}
.qtip::after{
  content:"";
  position:absolute;
  top:-5px; left:50%; transform:translateX(-50%);
  border:5px solid transparent;
  border-bottom-color:var(--white);
}

/* Показ по hover и по клавиатурному фокусу */
.qmark:hover .qtip,
.qmark:focus .qtip,
.qmark:focus-within .qtip{
  visibility:visible; opacity:1;
}

/* На очень узких экранах смещаем к краю, чтобы не обрезалось */
@media (max-width:360px){
  .qtip{ left:auto; right:0; transform:none; }
  .qtip::before, .qtip::after{ left:auto; right:12px; transform:none; }
}

@media print{
  .actions, .help, .errors, .qmark { display: none !important; }
  .card { box-shadow: none; border-color: #bbb; }
  body { background: #fff; }
}


