(function(){
  const STORAGE_KEY = 'ds160-helper-data-v1';
  const CONFIRM_KEY = 'ds160-helper-confirmed-v1';

  // Navigation
  const navButtons = Array.from(document.querySelectorAll('.nav-btn'));
  const sections = Array.from(document.querySelectorAll('.form-section'));

  function showSection(id){
    sections.forEach(s=>s.classList.toggle('active', s.dataset.section===id));
    navButtons.forEach(b=>b.classList.toggle('active', b.dataset.target===id));
    if(id==='preview') renderPreview();
  }

  document.body.addEventListener('click', (e)=>{
    const btn = e.target.closest('button');
    if(!btn) return;
    if(btn.classList.contains('nav-btn')){
      showSection(btn.dataset.target);
    }
    if(btn.classList.contains('next')){
      showSection(btn.dataset.next);
    }
    if(btn.classList.contains('back')){
      showSection(btn.dataset.back);
    }
  });

  // Countries and States
  const countryList = [
    'AFGHANISTAN','ALBANIA','ALGERIA','ANDORRA','ANGOLA','ARGENTINA','ARMENIA','AUSTRALIA','AUSTRIA','AZERBAIJAN',
    'BAHAMAS','BAHRAIN','BANGLADESH','BARBADOS','BELARUS','BELGIUM','BELIZE','BENIN','BHUTAN','BOLIVIA',
    'BOSNIA AND HERZEGOVINA','BOTSWANA','BRAZIL','BRUNEI','BULGARIA','BURKINA FASO','BURUNDI','CAMBODIA','CAMEROON','CANADA',
    'CAPE VERDE','CENTRAL AFRICAN REPUBLIC','CHAD','CHILE','CHINA','COLOMBIA','COMOROS','CONGO','COSTA RICA','COTE D\'IVOIRE',
    'CROATIA','CUBA','CYPRUS','CZECHIA','DENMARK','DJIBOUTI','DOMINICA','DOMINICAN REPUBLIC','ECUADOR','EGYPT',
    'EL SALVADOR','ESTONIA','ESWATINI','ETHIOPIA','FIJI','FINLAND','FRANCE','GABON','GAMBIA','GEORGIA',
    'GERMANY','GHANA','GREECE','GUATEMALA','GUINEA','GUINEA-BISSAU','GUYANA','HAITI','HONDURAS','HUNGARY',
    'ICELAND','INDIA','INDONESIA','IRAN','IRAQ','IRELAND','ISRAEL','ITALY','JAMAICA','JAPAN',
    'JORDAN','KAZAKHSTAN','KENYA','KIRIBATI','KOREA, SOUTH','KUWAIT','KYRGYZSTAN','LAOS','LATVIA','LEBANON',
    'LESOTHO','LIBERIA','LIBYA','LIECHTENSTEIN','LITHUANIA','LUXEMBOURG','MADAGASCAR','MALAWI','MALAYSIA','MALDIVES',
    'MALI','MALTA','MARSHALL ISLANDS','MAURITANIA','MAURITIUS','MEXICO','MICRONESIA','MOLDOVA','MONACO','MONGOLIA',
    'MONTENEGRO','MOROCCO','MOZAMBIQUE','MYANMAR','NAMIBIA','NAURU','NEPAL','NETHERLANDS','NEW ZEALAND','NICARAGUA',
    'NIGER','NIGERIA','NORTH MACEDONIA','NORWAY','OMAN','PAKISTAN','PALAU','PANAMA','PAPUA NEW GUINEA','PARAGUAY',
    'PERU','PHILIPPINES','POLAND','PORTUGAL','QATAR','ROMANIA','RUSSIA','RWANDA','SAINT LUCIA','SAMOA',
    'SAN MARINO','SAO TOME AND PRINCIPE','SAUDI ARABIA','SENEGAL','SERBIA','SEYCHELLES','SIERRA LEONE','SINGAPORE','SLOVAKIA','SLOVENIA',
    'SOLOMON ISLANDS','SOMALIA','SOUTH AFRICA','SPAIN','SRI LANKA','SUDAN','SURINAME','SWEDEN','SWITZERLAND','SYRIA',
    'TAIWAN','TAJIKISTAN','TANZANIA','THAILAND','TIMOR-LESTE','TOGO','TONGA','TRINIDAD AND TOBAGO','TUNISIA','TURKEY',
    'TURKMENISTAN','TUVALU','UGANDA','UKRAINE','UNITED ARAB EMIRATES','UNITED KINGDOM','UNITED STATES','URUGUAY','UZBEKISTAN','VANUATU',
    'VENEZUELA','VIETNAM','YEMEN','ZAMBIA','ZIMBABWE'
  ];
  const datalist = document.getElementById('countries');
  datalist.innerHTML = countryList.map(c=>`<option value="${c}"></option>`).join('');

  const usStates = [
    'ALABAMA','ALASKA','ARIZONA','ARKANSAS','CALIFORNIA','COLORADO','CONNECTICUT','DELAWARE','DISTRICT OF COLUMBIA',
    'FLORIDA','GEORGIA','HAWAII','IDAHO','ILLINOIS','INDIANA','IOWA','KANSAS','KENTUCKY','LOUISIANA','MAINE',
    'MARYLAND','MASSACHUSETTS','MICHIGAN','MINNESOTA','MISSISSIPPI','MISSOURI','MONTANA','NEBRASKA','NEVADA','NEW HAMPSHIRE',
    'NEW JERSEY','NEW MEXICO','NEW YORK','NORTH CAROLINA','NORTH DAKOTA','OHIO','OKLAHOMA','OREGON','PENNSYLVANIA','RHODE ISLAND',
    'SOUTH CAROLINA','SOUTH DAKOTA','TENNESSEE','TEXAS','UTAH','VERMONT','VIRGINIA','WASHINGTON','WEST VIRGINIA','WISCONSIN','WYOMING'
  ];
  const stateSelect = document.getElementById('usState');
  stateSelect.innerHTML = `<option value=""></option>` + usStates.map(s=>`<option>${s}</option>`).join('');
  const usContactState = document.getElementById('usContactState');
  if(usContactState){ usContactState.innerHTML = `<option value=""></option>` + usStates.map(s=>`<option>${s}</option>`).join(''); }
  const sevisState = document.getElementById('sevisState');
  if(sevisState){ sevisState.innerHTML = `<option value=""></option>` + usStates.map(s=>`<option>${s}</option>`).join(''); }

  // Data handling
  const forms = sections.map(s=>s.tagName==='FORM'?s:null).filter(Boolean);

  function collectData(){
    const data = {};
    forms.forEach(form=>{
      const formData = new FormData(form);
      for(const [key,val] of formData.entries()){
        if(data[key]){
          if(Array.isArray(data[key])) data[key].push(val); else data[key] = [data[key], val];
        } else {
          data[key] = val;
        }
      }
    });
    return data;
  }

  // Prevent browser autofill and provide a way to fully clear inputs
  forms.forEach(f=>{ f.setAttribute('autocomplete','off'); });
  document.querySelectorAll('input, select, textarea').forEach(el=>{
    el.setAttribute('autocomplete','off');
  });

  function clearForms(){
    forms.forEach(form=>{
      Array.from(form.elements).forEach(el=>{
        if(!el.name) return;
        if(el.type==='checkbox' || el.type==='radio'){
          el.checked = false;
        } else if(el.tagName==='SELECT'){
          el.selectedIndex = 0;
        } else {
          el.value = '';
        }
      });
    });
  }

  // Repeatable rows (Add Another / Remove)
  document.addEventListener('click', (e)=>{
    const addBtn = e.target.closest('.add-row');
    if(addBtn){
      const repeat = addBtn.closest('.repeat');
      const items = repeat.querySelector('.items');
      const firstItem = items.querySelector('.item');
      const clone = firstItem.cloneNode(true);
      // clear inputs
      clone.querySelectorAll('input, select, textarea').forEach(el=>{ if(el.type==='radio' || el.type==='checkbox'){ el.checked=false; } else { el.value=''; } });
      items.appendChild(clone);
      save();
    }
    const removeBtn = e.target.closest('.remove-row');
    if(removeBtn){
      const item = removeBtn.closest('.item');
      const items = item.parentElement;
      if(items.children.length>1){
        item.remove();
        save();
      }
    }
  });

  function fillForms(data){
    if(!data) return;
    forms.forEach(form=>{
      Array.from(form.elements).forEach(el=>{
        if(!el.name) return;
        const v = data[el.name];
        if(v==null) return;
        if(el.type==='radio' || el.type==='checkbox'){
          el.checked = String(v) === el.value;
        }else{
          el.value = v;
        }
      });
    });
  }

  function save(){
    const data = collectData();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    renderPreview();
  }

  function isFreshMode(){
    const params = new URLSearchParams(location.search);
    // Default to fresh unless explicitly asked to load
    const explicitLoad = params.get('load') === '1' || params.get('mode') === 'load';
    const explicitFresh = params.has('fresh') || params.get('mode') === 'fresh' || params.get('blank') === '1';
    if(explicitLoad) return false;
    if(explicitFresh) return true;
    return true; // default fresh (do not auto-load)
  }

  function load(){
    if(isFreshMode()){
      // Ensure previous browser autofill is removed for shared links
      clearForms();
      return; // skip loading saved answers unless ?load=1 is present
    }
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      if(!raw) return;
      const data = JSON.parse(raw);
      fillForms(data);
    }catch(err){
      console.error(err);
    }
  }

  function renderPreview(){
    const pre = document.getElementById('summaryPre');
    const list = document.getElementById('kvList');
    const data = collectData();
    pre.textContent = JSON.stringify(data, null, 2);
    const confirmed = loadConfirmed();
    const groups = [];
    sections.forEach(s=>{
      if(s.dataset.section==='preview') return;
      const fields = Array.from(s.querySelectorAll('[name]'))
        .map(el=>el.name)
        .filter((v,i,a)=>a.indexOf(v)===i);
      if(fields.length){
        groups.push({ title: s.querySelector('h2')?.textContent || s.dataset.section, fields });
      }
    });
    list.innerHTML = groups.map(g=>{
      const rows = g.fields.map(k=>{
        const val = Array.isArray(data[k]) ? data[k].join(', ') : String(data[k] ?? '');
        const isConfirmed = !!confirmed[k];
        return `<div class="kv-row" data-key="${k}"><div class="kv-key">${k}</div><div class="kv-val">${val}</div><div class="kv-actions"><button class="btn-correct ${isConfirmed?'btn-confirmed':''}" data-key="${k}">${isConfirmed?'Correct✓':'Correct'}</button><button class="btn-edit" data-key="${k}">Edit</button><button class="copy-one" data-key="${k}">Copy</button></div></div>`;
      }).join('');
      return `<div class="group"><h4>${g.title}</h4><div class="kv-list">${rows}</div></div>`;
    }).join('');
  }

  // Autosave on input
  document.addEventListener('input', (e)=>{
    if(e.target.matches('input, select')){
      // If a field changed, clear its confirmed state
      const nm = e.target.name;
      if(nm){
        const conf = loadConfirmed();
        if(conf[nm]){ delete conf[nm]; saveConfirmed(conf); }
      }
      save();
    }
  });

  // Also clear on page load if browser auto-filled some values despite autocomplete=off
  window.addEventListener('DOMContentLoaded', ()=>{
    if(isFreshMode()){
      const hasAutoFilled = Array.from(document.querySelectorAll('input, select, textarea')).some(el=>{
        return !!el.value && el.type!=='radio' && el.type!=='checkbox';
      });
      if(hasAutoFilled){
        clearForms();
      }
    }
  });

  // Top buttons
  document.getElementById('saveBtn').addEventListener('click', save);
  document.getElementById('printBtn').addEventListener('click', ()=>{
    window.print();
  });
  document.getElementById('kvList').addEventListener('click', async (e)=>{
    const copyBtn = e.target.closest('.copy-one');
    const editBtn = e.target.closest('.btn-edit');
    const correctBtn = e.target.closest('.btn-correct');
    if(copyBtn){
      const data = collectData();
      const key = copyBtn.dataset.key;
      const val = data[key];
      await navigator.clipboard.writeText(Array.isArray(val)?val.join(', '):String(val ?? ''));
      return;
    }
    if(editBtn){
      const key = editBtn.dataset.key;
      const sectionId = findSectionForField(key);
      if(sectionId) showSection(sectionId);
      return;
    }
    if(correctBtn){
      const key = correctBtn.dataset.key;
      const conf = loadConfirmed();
      conf[key] = true;
      saveConfirmed(conf);
      renderPreview();
    }
  });

  function findSectionForField(fieldName){
    for(const s of sections){
      const els = s.querySelectorAll('[name]');
      for(const el of els){
        if(el.name === fieldName){
          return s.dataset.section;
        }
      }
    }
    return null;
  }

  function loadConfirmed(){
    try{ return JSON.parse(localStorage.getItem(CONFIRM_KEY) || '{}'); }catch{ return {}; }
  }
  function saveConfirmed(obj){
    localStorage.setItem(CONFIRM_KEY, JSON.stringify(obj||{}));
  }
  // remove import/reset handlers (no longer shown)

  // Initialize
  load();
  renderPreview();
})();


