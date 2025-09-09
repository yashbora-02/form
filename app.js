(function(){
  const STORAGE_KEY = 'ds160-helper-data-v1';
  const CONFIRM_KEY = 'ds160-helper-confirmed-v1';
  
  // Firebase integration
  let firebaseReady = false;
  let currentFormId = null;
  let currentUser = null;
  
  // Wait for Firebase to be ready
  window.addEventListener('firebaseReady', () => {
    firebaseReady = true;
    console.log('🔥 Firebase is ready!');
    updateFirebaseStatus('✅ Connected to Firebase', 'connected');
    
    // Set up authentication state listener
    window.firebase.onAuthStateChanged(window.firebase.auth, (user) => {
      currentUser = user;
      updateUserUI(user);
      if (user) {
        console.log('✅ User signed in:', user.displayName || user.uid);
        loadUserForms();
      } else {
        console.log('❌ User signed out');
        clearUserForms();
      }
    });
  });
  
  // Update Firebase status indicator
  function updateFirebaseStatus(message, status = '') {
    const statusEl = document.getElementById('firebaseStatus');
    if (statusEl) {
      statusEl.textContent = message;
      statusEl.className = `firebase-status ${status}`;
    }
  }
  
  // Authentication functions
  async function signInWithGoogle() {
    try {
      const result = await window.firebase.signInWithPopup(window.firebase.auth, window.firebase.googleProvider);
      console.log('✅ Google sign in successful:', result.user.displayName);
    } catch (error) {
      console.error('❌ Google sign in error:', error);
      alert('Sign in failed. Please try again.');
    }
  }
  
  async function signInAnonymously() {
    try {
      const result = await window.firebase.signInAnonymously(window.firebase.auth);
      console.log('✅ Anonymous sign in successful:', result.user.uid);
    } catch (error) {
      console.error('❌ Anonymous sign in error:', error);
      alert('Anonymous sign in failed. Please try again.');
    }
  }
  
  async function signOutUser() {
    try {
      await window.firebase.signOut(window.firebase.auth);
      console.log('✅ User signed out');
    } catch (error) {
      console.error('❌ Sign out error:', error);
    }
  }
  
  function updateUserUI(user) {
    const userInfo = document.getElementById('userInfo');
    const authButtons = document.getElementById('authButtons');
    const signOutBtn = document.getElementById('signOutBtn');
    const userName = document.getElementById('userName');
    const userAvatar = document.getElementById('userAvatar');
    
    if (user) {
      // User is signed in
      userInfo.style.display = 'flex';
      authButtons.style.display = 'none';
      signOutBtn.style.display = 'block';
      
      if (user.photoURL) {
        userAvatar.src = user.photoURL;
        userAvatar.style.display = 'block';
      } else {
        userAvatar.style.display = 'none';
      }
      
      userName.textContent = user.displayName || `Anonymous User`;
    } else {
      // User is signed out
      userInfo.style.display = 'none';
      authButtons.style.display = 'flex';
      signOutBtn.style.display = 'none';
    }
  }
  
  function clearUserForms() {
    // Clear current form when user signs out
    currentFormId = null;
    if (isFreshMode()) {
      clearForms();
    }
  }

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
          el.selectedIndex = -1; // This ensures no option is selected
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
      clone.querySelectorAll('input, select, textarea').forEach(el=>{ 
        if(el.type==='radio' || el.type==='checkbox'){ 
          el.checked=false; 
        } else if(el.tagName==='SELECT'){ 
          el.selectedIndex = -1; 
        } else { 
          el.value=''; 
        } 
      });
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

  // Firebase functions
  async function saveToFirebase(data) {
    if (!firebaseReady) {
      console.error('❌ Firebase not ready');
      return false;
    }
    
    if (!currentUser) {
      console.error('❌ No current user');
      return false;
    }
    
    try {
      console.log('💾 Attempting to save to Firebase...', { userId: currentUser.uid });
      
      const formData = {
        ...data,
        userId: currentUser.uid,
        userEmail: currentUser.email || null,
        userName: currentUser.displayName || 'Anonymous User',
        timestamp: window.firebase.serverTimestamp(),
        lastModified: new Date().toISOString(),
        confirmed: loadConfirmed()
      };
      
      if (currentFormId) {
        // Update existing form
        const docRef = window.firebase.doc(window.firebase.db, 'forms', currentFormId);
        await window.firebase.updateDoc(docRef, formData);
        console.log('✅ Form updated in Firebase:', currentFormId);
      } else {
        // Create new form
        const docRef = await window.firebase.addDoc(window.firebase.collection(window.firebase.db, 'forms'), formData);
        currentFormId = docRef.id;
        console.log('✅ Form saved to Firebase:', currentFormId);
      }
      return true;
    } catch (error) {
      console.error('❌ Error saving to Firebase:', error);
      console.error('Error details:', error.code, error.message);
      return false;
    }
  }
  
  async function loadUserForms() {
    if (!firebaseReady || !currentUser || isFreshMode()) return;
    
    try {
      const q = window.firebase.query(
        window.firebase.collection(window.firebase.db, 'forms'),
        window.firebase.where('userId', '==', currentUser.uid),
        window.firebase.orderBy('timestamp', 'desc')
      );
      const querySnapshot = await window.firebase.getDocs(q);
      
      if (!querySnapshot.empty) {
        // Load the most recent form
        const doc = querySnapshot.docs[0];
        const data = doc.data();
        currentFormId = doc.id;
        
        // Load form data (excluding Firebase metadata)
        const { timestamp, lastModified, confirmed, userId, userEmail, userName, isShared, shareId, ...formData } = data;
        fillForms(formData);
        
        // Load confirmed states
        if (confirmed) {
          saveConfirmed(confirmed);
        }
        
        console.log('✅ User form loaded from Firebase:', currentFormId);
        renderPreview();
      }
    } catch (error) {
      console.error('❌ Error loading user forms:', error);
    }
  }
  
  // Legacy function for backward compatibility
  async function loadFromFirebase() {
    return loadUserForms();
  }


  async function save(){
    const data = collectData();
    const saveBtn = document.getElementById('saveBtn');
    
    // Show saving state
    const originalText = saveBtn.textContent;
    saveBtn.textContent = '💾 Saving...';
    saveBtn.disabled = true;
    saveBtn.classList.add('saving');
    
    try {
      // Always save to localStorage as backup
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      
      // Save to Firebase if available
      const firebaseSaved = await saveToFirebase(data);
      
      renderPreview();
      
      // Show success state
      saveBtn.textContent = '✅ Saved!';
      saveBtn.classList.remove('saving');
      saveBtn.classList.add('saved');
      
      // Reset button after 2 seconds
      setTimeout(() => {
        saveBtn.textContent = originalText;
        saveBtn.disabled = false;
        saveBtn.classList.remove('saved');
      }, 2000);
      
    } catch (error) {
      // Show error state
      saveBtn.textContent = '❌ Error';
      saveBtn.classList.remove('saving');
      saveBtn.classList.add('error');
      
      setTimeout(() => {
        saveBtn.textContent = originalText;
        saveBtn.disabled = false;
        saveBtn.classList.remove('error');
      }, 3000);
    }
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
    const statsDiv = document.getElementById('previewStats');
    const data = collectData();
    pre.textContent = JSON.stringify(data, null, 2);
    const confirmed = loadConfirmed();
    
    // Collect all fields and calculate stats
    let totalFields = 0;
    let filledFields = 0;
    let confirmedFields = 0;
    
    const groups = [];
    sections.forEach(s=>{
      if(s.dataset.section==='preview') return;
      const fields = Array.from(s.querySelectorAll('[name]'))
        .map(el=>el.name)
        .filter((v,i,a)=>a.indexOf(v)===i);
      if(fields.length){
        groups.push({ title: s.querySelector('h2')?.textContent || s.dataset.section, fields });
        totalFields += fields.length;
        fields.forEach(field => {
          const val = Array.isArray(data[field]) ? data[field].join(', ') : String(data[field] ?? '');
          if(val && val.trim() !== '') filledFields++;
          if(confirmed[field]) confirmedFields++;
        });
      }
    });
    
    // Render stats
    const emptyFields = totalFields - filledFields;
    const completionPercent = Math.round((filledFields / totalFields) * 100);
    const confirmationPercent = Math.round((confirmedFields / filledFields) * 100) || 0;
    
    statsDiv.innerHTML = `
      <div class="stat-card">
        <div class="stat-number stat-filled">${filledFields}</div>
        <div class="stat-label">Fields Filled</div>
      </div>
      <div class="stat-card">
        <div class="stat-number stat-empty">${emptyFields}</div>
        <div class="stat-label">Fields Empty</div>
      </div>
      <div class="stat-card">
        <div class="stat-number stat-confirmed">${confirmedFields}</div>
        <div class="stat-label">Confirmed</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">${completionPercent}%</div>
        <div class="stat-label">Complete</div>
      </div>
    `;
    list.innerHTML = groups.map(g=>{
      const rows = g.fields.map(k=>{
        const val = Array.isArray(data[k]) ? data[k].join(', ') : String(data[k] ?? '');
        const isConfirmed = !!confirmed[k];
        const hasValue = val && val.trim() !== '';
        const correctButtonText = isConfirmed ? '✓ Confirmed' : 'Mark Correct';
        const correctButtonClass = isConfirmed ? 'btn-correct btn-confirmed' : 'btn-correct';
        const correctButton = hasValue ? `<button class="${correctButtonClass}" data-key="${k}">${correctButtonText}</button>` : '';
        return `<div class="kv-row ${hasValue ? 'has-value' : 'empty-value'}" data-key="${k}">
          <div class="kv-key">${k}</div>
          <div class="kv-val">${hasValue ? val : '<span class="empty-text">Not filled</span>'}</div>
          <div class="kv-actions">
            ${correctButton}
            <button class="btn-edit" data-key="${k}">Edit</button>
            ${hasValue ? `<button class="copy-one" data-key="${k}">Copy</button>` : ''}
          </div>
        </div>`;
      }).join('');
      return `<div class="group"><h4>${g.title}</h4><div class="kv-list">${rows}</div></div>`;
    }).join('');
  }

  // Auto-save indicator
  let autoSaveTimeout;
  function showAutoSaveIndicator() {
    const saveBtn = document.getElementById('saveBtn');
    if (saveBtn && !saveBtn.disabled) {
      saveBtn.style.boxShadow = '0 0 15px rgba(16,185,129,0.6)';
      
      clearTimeout(autoSaveTimeout);
      autoSaveTimeout = setTimeout(() => {
        saveBtn.style.boxShadow = '';
      }, 1000);
    }
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
      
      // Show visual feedback for auto-save
      showAutoSaveIndicator();
      
      // Auto-save with debounce
      clearTimeout(autoSaveTimeout);
      autoSaveTimeout = setTimeout(() => {
        save();
      }, 500); // Save 500ms after user stops typing
    }
  });

  // Also clear on page load if browser auto-filled some values despite autocomplete=off
  function aggressiveClearAutofill(){
    if(!isFreshMode()) return;
    
    const hasAutoFilled = Array.from(document.querySelectorAll('input, select, textarea')).some(el=>{
      return (el.value && el.type!=='radio' && el.type!=='checkbox') || 
             (el.tagName==='SELECT' && el.selectedIndex > 0);
    });
    
    if(hasAutoFilled){
      clearForms();
    }
  }

  window.addEventListener('DOMContentLoaded', aggressiveClearAutofill);
  
  // Clear multiple times to handle delayed browser autofill
  window.addEventListener('load', ()=>{
    setTimeout(aggressiveClearAutofill, 50);
    setTimeout(aggressiveClearAutofill, 200);
    setTimeout(aggressiveClearAutofill, 500);
  });

  // Admin Dashboard Functions
  async function loadAllForms() {
    if (!firebaseReady) {
      updateFirebaseStatus('❌ Firebase not ready', 'error');
      return;
    }
    
    try {
      const q = window.firebase.query(
        window.firebase.collection(window.firebase.db, 'forms'),
        window.firebase.orderBy('timestamp', 'desc')
      );
      const querySnapshot = await window.firebase.getDocs(q);
      
      const forms = [];
      querySnapshot.forEach((doc) => {
        forms.push({ id: doc.id, ...doc.data() });
      });
      
      renderAdminDashboard(forms);
      return forms;
    } catch (error) {
      console.error('❌ Error loading forms:', error);
      updateFirebaseStatus('❌ Error loading forms', 'error');
    }
  }
  
  function renderAdminDashboard(forms) {
    const statsDiv = document.getElementById('adminStats');
    const formsListDiv = document.getElementById('adminFormsList');
    
    // Render stats
    const totalForms = forms.length;
    const recentForms = forms.filter(f => {
      const formDate = f.lastModified ? new Date(f.lastModified) : new Date();
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return formDate > dayAgo;
    }).length;
    
    statsDiv.innerHTML = `
      <div class="admin-stat-card">
        <div class="stat-number">${totalForms}</div>
        <div class="stat-label">Total Forms</div>
      </div>
      <div class="admin-stat-card">
        <div class="stat-number">${recentForms}</div>
        <div class="stat-label">Last 24h</div>
      </div>
    `;
    
    // Render forms list
    if (forms.length === 0) {
      formsListDiv.innerHTML = `
        <div class="no-forms">
          <h3>No forms found</h3>
          <p>Forms saved to Firebase will appear here.</p>
        </div>
      `;
      return;
    }
    
    formsListDiv.innerHTML = forms.map((form, index) => {
      const date = form.lastModified ? new Date(form.lastModified).toLocaleString() : 'Unknown';
      const fieldsCount = Object.keys(form).filter(key => 
        !['id', 'timestamp', 'lastModified', 'confirmed'].includes(key)
      ).length;
      
      return `
        <div class="admin-form-card" data-form-id="${form.id}">
          <div class="form-header">
            <h4>Form #${index + 1}</h4>
            <div class="form-actions">
              <button class="view-form" data-form-id="${form.id}">👁️ View</button>
              <button class="delete-form danger" data-form-id="${form.id}">🗑️ Delete</button>
            </div>
          </div>
          <div class="form-details">
            <span>📅 ${date}</span>
            <span>📝 ${fieldsCount} fields</span>
            <span>ID: ${form.id.substring(0, 8)}...</span>
          </div>
        </div>
      `;
    }).join('');
  }
  
  async function deleteForm(formId) {
    if (!confirm('Are you sure you want to delete this form? This action cannot be undone.')) {
      return;
    }
    
    try {
      await window.firebase.deleteDoc(window.firebase.doc(window.firebase.db, 'forms', formId));
      console.log('✅ Form deleted:', formId);
      loadAllForms(); // Refresh the list
    } catch (error) {
      console.error('❌ Error deleting form:', error);
      alert('Error deleting form. Please try again.');
    }
  }
  
  async function exportAllData() {
    try {
      const forms = await loadAllForms();
      const dataStr = JSON.stringify(forms, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(dataBlob);
      link.download = `ds160-forms-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
    } catch (error) {
      console.error('❌ Error exporting data:', error);
      alert('Error exporting data. Please try again.');
    }
  }

  // Top buttons
  document.getElementById('saveBtn').addEventListener('click', save);
  document.getElementById('printBtn').addEventListener('click', ()=>{
    window.print();
  });
  document.getElementById('adminBtn').addEventListener('click', ()=>{
    showSection('admin');
    loadAllForms();
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
      // Toggle the confirmed state
      if(conf[key]){
        delete conf[key]; // Unconfirm
      } else {
        conf[key] = true; // Confirm
      }
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

  // Admin dashboard event listeners
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('delete-form')) {
      const formId = e.target.dataset.formId;
      deleteForm(formId);
    }
    
    if (e.target.classList.contains('view-form')) {
      const formId = e.target.dataset.formId;
      viewForm(formId);
    }
  });
  
  async function viewForm(formId) {
    try {
      const docRef = window.firebase.doc(window.firebase.db, 'forms', formId);
      const docSnap = await window.firebase.getDocs(window.firebase.query(window.firebase.collection(window.firebase.db, 'forms')));
      
      // Find the specific form
      let formData = null;
      docSnap.forEach((doc) => {
        if (doc.id === formId) {
          formData = doc.data();
        }
      });
      
      if (formData) {
        // Create a popup window with form data
        const popup = window.open('', '_blank', 'width=800,height=600,scrollbars=yes');
        const { timestamp, lastModified, confirmed, userId, userEmail, userName, isShared, shareId, ...cleanData } = formData;
        
        popup.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Form View - ${userName}</title>
            <style>
              body { font-family: system-ui, sans-serif; padding: 20px; }
              .header { background: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
              .field { margin: 10px 0; padding: 8px; border-left: 3px solid #2563eb; background: #f8fafc; }
              .label { font-weight: bold; color: #374151; }
              .value { margin-top: 4px; }
              .empty { color: #9ca3af; font-style: italic; }
            </style>
          </head>
          <body>
            <div class="header">
              <h2>📋 Form Submission</h2>
              <p><strong>User:</strong> ${userName}</p>
              <p><strong>Email:</strong> ${userEmail || 'Not provided'}</p>
              <p><strong>Last Modified:</strong> ${new Date(lastModified).toLocaleString()}</p>
              <p><strong>Form ID:</strong> ${formId}</p>
            </div>
            ${Object.entries(cleanData).map(([key, value]) => `
              <div class="field">
                <div class="label">${key}</div>
                <div class="value ${!value ? 'empty' : ''}">${value || 'Not filled'}</div>
              </div>
            `).join('')}
          </body>
          </html>
        `);
        popup.document.close();
      } else {
        alert('Form not found.');
      }
    } catch (error) {
      console.error('❌ Error viewing form:', error);
      alert('Error viewing form. Please try again.');
    }
  }
  
  // Authentication event listeners
  document.getElementById('signInBtn')?.addEventListener('click', signInWithGoogle);
  document.getElementById('anonymousBtn')?.addEventListener('click', signInAnonymously);
  document.getElementById('signOutBtn')?.addEventListener('click', signOutUser);
  document.getElementById('shareBtn')?.addEventListener('click', shareCurrentForm);
  
  // Admin control buttons
  document.getElementById('refreshFormsBtn')?.addEventListener('click', loadAllForms);
  document.getElementById('exportAllBtn')?.addEventListener('click', exportAllData);
  document.getElementById('clearAllBtn')?.addEventListener('click', async () => {
    if (!confirm('⚠️ WARNING: This will delete ALL forms from Firebase. This action cannot be undone!\n\nAre you absolutely sure?')) {
      return;
    }
    
    try {
      const forms = await loadAllForms();
      for (const form of forms) {
        await window.firebase.deleteDoc(window.firebase.doc(window.firebase.db, 'forms', form.id));
      }
      loadAllForms(); // Refresh
      alert('✅ All forms have been deleted.');
    } catch (error) {
      console.error('❌ Error clearing data:', error);
      alert('Error clearing data. Please try again.');
    }
  });

  // Initialize
  window.addEventListener('firebaseReady', () => {
    // Check for shared form first
    loadSharedForm();
  });
  
  load();
  renderPreview();
})();


