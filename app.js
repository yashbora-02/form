(function(){
  const STORAGE_KEY = 'ds160-helper-data-v1';

  // Navigation
  const navButtons = Array.from(document.querySelectorAll('.nav-btn'));
  const sections = Array.from(document.querySelectorAll('.form-section'));

  function showSection(id){
    sections.forEach(s=>s.classList.toggle('active', s.dataset.section===id));
    navButtons.forEach(b=>b.classList.toggle('active', b.dataset.target===id));
    if(id==='summary') renderSummary();
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
    renderSummary();
  }

  function load(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      if(!raw) return;
      const data = JSON.parse(raw);
      fillForms(data);
    }catch(err){
      console.error(err);
    }
  }

  function renderSummary(){
    const pre = document.getElementById('summaryPre');
    const list = document.getElementById('kvList');
    const data = collectData();
    pre.textContent = JSON.stringify(data, null, 2);
    const entries = Object.entries(data);
    list.innerHTML = entries.map(([k,v])=>{
      const val = Array.isArray(v) ? v.join(', ') : String(v ?? '');
      return `<div class="kv-row"><div class="kv-key">${k}</div><div class="kv-val">${val}</div><div><button class="copy-one" data-key="${k}">Copy</button></div></div>`;
    }).join('');
  }

  // Autosave on input
  document.addEventListener('input', (e)=>{
    if(e.target.matches('input, select')){
      save();
    }
  });

  // Top buttons
  document.getElementById('saveBtn').addEventListener('click', save);
  document.getElementById('exportBtn').addEventListener('click', ()=>{
    const blob = new Blob([JSON.stringify(collectData(), null, 2)], {type:'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'ds160-data.json';
    a.click();
    URL.revokeObjectURL(a.href);
  });
  document.getElementById('copyJsonBtn').addEventListener('click', async ()=>{
    await navigator.clipboard.writeText(JSON.stringify(collectData(), null, 2));
    alert('JSON copied to clipboard');
  });
  document.getElementById('printBtn').addEventListener('click', ()=>{
    window.print();
  });
  document.getElementById('kvList').addEventListener('click', async (e)=>{
    const btn = e.target.closest('.copy-one');
    if(!btn) return;
    const data = collectData();
    const key = btn.dataset.key;
    const val = data[key];
    await navigator.clipboard.writeText(Array.isArray(val)?val.join(', '):String(val ?? ''));
  });
  document.getElementById('importInput').addEventListener('change', async (e)=>{
    const file = e.target.files && e.target.files[0];
    if(!file) return;
    const text = await file.text();
    const data = JSON.parse(text);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    fillForms(data);
    renderSummary();
    e.target.value = '';
  });
  document.getElementById('resetBtn').addEventListener('click', ()=>{
    if(confirm('Clear all saved data?')){
      localStorage.removeItem(STORAGE_KEY);
      window.location.reload();
    }
  });

  // Initialize
  load();
  renderSummary();
})();


