(function(){
  const STORAGE_KEY = 'ds160-helper-data-v1';
  const CONFIRM_KEY = 'ds160-helper-confirmed-v1';
  
  // Firebase integration
  let firebaseReady = false;
  let currentFormId = null;
  let currentUser = null;
  let pendingAdminAccess = false; // Flag to track admin access attempts
  
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
  
  // Admin authorization - only allow specific user
  function isAdmin(user) {
    if (!user) return false;
    
    // Only this email is authorized for admin access
    const adminEmails = ['yashbora.ai@gmail.com'];
    const adminUIDs = []; // Add your specific UIDs if known
    
    // Check by email
    if (user.email && adminEmails.includes(user.email.toLowerCase())) {
      return true;
    }
    
    // Check by UID (if you know your specific UID)
    if (user.uid && adminUIDs.includes(user.uid)) {
      return true;
    }
    
    return false;
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
    const signInPage = document.getElementById('signInPage');
    const mainApp = document.getElementById('mainApp');
    const appHeader = document.querySelector('.app-header');
    
    if (user) {
      // Check if this is a pending admin access attempt
      if (pendingAdminAccess) {
        console.log('🔍 Checking admin access for:', user.email);
        
        if (isAdmin(user)) {
          console.log('✅ Admin access granted to:', user.email);
          // Show main app and go directly to admin section
          signInPage.style.display = 'none';
          mainApp.style.display = 'flex';
          appHeader.style.display = 'flex';
          
          // Set UI for admin
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
          
          // Navigate to admin section
          setTimeout(() => {
            showSection('admin');
            loadAllForms();
          }, 500);
          
        } else {
          console.log('❌ Admin access denied to:', user.email || 'unknown user');
          alert('❌ Access Denied\n\nYou are not authorized to access the admin dashboard.\nOnly the application owner can access this section.');
          
          // Sign out immediately and stay on sign-in page
          signOutUser();
          return;
        }
        
        // Reset the flag
        pendingAdminAccess = false;
        return;
      }
      
      // Normal user sign-in - show main app
      console.log('✅ User authenticated - showing main app');
      signInPage.style.display = 'none';
      mainApp.style.display = 'flex';
      appHeader.style.display = 'flex';
      
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
      // User is signed out - show sign-in page
      console.log('🔒 User not authenticated - showing sign-in page');
      signInPage.style.display = 'flex';
      mainApp.style.display = 'none';
      appHeader.style.display = 'none';
      
      userInfo.style.display = 'none';
      authButtons.style.display = 'flex';
      signOutBtn.style.display = 'none';
    }
  }
  
  function clearUserForms() {
    // Clear current form when user signs out
    currentFormId = null;
    pendingAdminAccess = false; // Reset admin access flag
    console.log('🔒 User signed out - clearing all form data');
    clearForms();
    renderPreview();
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
    console.log('🔍 loadUserForms called', { firebaseReady, currentUser: !!currentUser, freshMode: isFreshMode() });
    
    if (!firebaseReady) {
      console.log('❌ Firebase not ready');
      return;
    }
    
    if (!currentUser) {
      console.log('❌ No current user');
      return;
    }
    
    if (isFreshMode()) {
      console.log('❌ Fresh mode - skipping data load');
      return;
    }
    
    try {
      console.log('🔍 Querying Firebase for user forms...');
      const q = window.firebase.query(
        window.firebase.collection(window.firebase.db, 'forms'),
        window.firebase.where('userId', '==', currentUser.uid)
      );
      const querySnapshot = await window.firebase.getDocs(q);
      
      console.log('🔍 Query result:', { empty: querySnapshot.empty, size: querySnapshot.size });
      
      if (!querySnapshot.empty) {
        // Sort docs by timestamp manually (most recent first)
        const sortedDocs = querySnapshot.docs.sort((a, b) => {
          const aTime = a.data().timestamp?.toMillis() || a.data().lastModified || 0;
          const bTime = b.data().timestamp?.toMillis() || b.data().lastModified || 0;
          return new Date(bTime) - new Date(aTime);
        });
        
        // Load the most recent form
        const doc = sortedDocs[0];
        const data = doc.data();
        currentFormId = doc.id;
        
        console.log('🔍 Loading form data:', { formId: currentFormId, hasData: !!data });
        
        // Load form data (excluding Firebase metadata)
        const { timestamp, lastModified, confirmed, userId, userEmail, userName, isShared, shareId, ...formData } = data;
        
        console.log('🔍 Form data keys:', Object.keys(formData));
        
        fillForms(formData);
        
        // Load confirmed states
        if (confirmed) {
          saveConfirmed(confirmed);
        }
        
        console.log('✅ User form loaded from Firebase:', currentFormId);
        renderPreview();
        updateProgress();
      } else {
        console.log('📝 No saved forms found for user');
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
      // Only save for authenticated users
      if (!currentUser) {
        console.log('🔒 No user signed in - data not saved');
        saveBtn.textContent = '🔒 Sign in to save';
        saveBtn.classList.remove('saving');
        saveBtn.classList.add('error');
        
        setTimeout(() => {
          saveBtn.textContent = originalText;
          saveBtn.disabled = false;
          saveBtn.classList.remove('error');
        }, 3000);
        return;
      }
      
      // Save to Firebase only (no localStorage for authenticated users)
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
    // Default to load saved data unless explicitly asked for fresh
    const explicitLoad = params.get('load') === '1' || params.get('mode') === 'load';
    const explicitFresh = params.has('fresh') || params.get('mode') === 'fresh' || params.get('blank') === '1';
    if(explicitFresh) return true;
    if(explicitLoad) return false;
    return false; // default to load saved data when user signs in
  }

  function load(){
    // Always clear forms for unauthenticated users
    if (!currentUser) {
      console.log('🔒 No user signed in - showing blank form');
      clearForms();
      return;
    }
    
    if(isFreshMode()){
      // Ensure previous browser autofill is removed for shared links
      clearForms();
      return; // skip loading saved answers unless ?load=1 is present
    }
    
    // Don't load from localStorage anymore - only Firebase data for authenticated users
    console.log('🔒 Authenticated user - data will be loaded from Firebase');
  }

  function updateProgress() {
    const data = collectData();
    const formSections = sections.filter(s => s.dataset.section !== 'preview' && s.dataset.section !== 'admin');
    
    let totalFields = 0;
    let filledFields = 0;
    
    formSections.forEach(section => {
      const fields = Array.from(section.querySelectorAll('[name]'))
        .map(el => el.name)
        .filter((v, i, a) => a.indexOf(v) === i);
      
      let sectionFilledFields = 0;
      totalFields += fields.length;
      fields.forEach(field => {
        const val = Array.isArray(data[field]) ? data[field].join(', ') : String(data[field] ?? '');
        if (val && val.trim() !== '') {
          filledFields++;
          sectionFilledFields++;
        }
      });
      
      // Update section completion indicator
      const sectionId = section.dataset.section;
      const navBtn = document.querySelector(`.nav-btn[data-target="${sectionId}"]`);
      if (navBtn) {
        const sectionPercentage = fields.length > 0 ? Math.round((sectionFilledFields / fields.length) * 100) : 0;
        
        // Remove existing status classes
        navBtn.classList.remove('section-empty', 'section-partial', 'section-complete');
        
        // Add new status class
        if (sectionPercentage === 0) {
          navBtn.classList.add('section-empty');
        } else if (sectionPercentage === 100) {
          navBtn.classList.add('section-complete');
        } else {
          navBtn.classList.add('section-partial');
        }
        
        // Update or add completion indicator
        let indicator = navBtn.querySelector('.completion-indicator');
        if (!indicator) {
          indicator = document.createElement('span');
          indicator.className = 'completion-indicator';
          navBtn.appendChild(indicator);
        }
        indicator.textContent = `${sectionPercentage}%`;
      }
    });
    
    const percentage = Math.round((filledFields / totalFields) * 100);
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    
    if (progressFill && progressText) {
      progressFill.style.width = `${percentage}%`;
      progressText.textContent = `${percentage}% Complete (${filledFields}/${totalFields} fields)`;
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

  // Validation functions
  function validateField(field) {
    const value = field.value.trim();
    const name = field.name;
    let isValid = true;
    let message = '';
    
    // Skip validation for empty optional fields
    if (!value && !field.required) {
      clearValidation(field);
      return;
    }
    
    // Email validation
    if (name.toLowerCase().includes('email') || field.type === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (value && !emailRegex.test(value)) {
        isValid = false;
        message = 'Please enter a valid email address';
      } else if (value) {
        message = 'Valid email address';
      }
    }
    
    // Phone number validation
    else if (name.toLowerCase().includes('phone') || name.toLowerCase().includes('tel')) {
      const phoneRegex = /^[\+]?[\d\s\-\(\)]{10,}$/;
      if (value && !phoneRegex.test(value)) {
        isValid = false;
        message = 'Please enter a valid phone number';
      } else if (value) {
        message = 'Valid phone number';
      }
    }
    
    // Date validation (DOB, arrival dates)
    else if (name.includes('Day') || name.includes('Year')) {
      if (name.includes('Day')) {
        const day = parseInt(value);
        if (value && (day < 1 || day > 31)) {
          isValid = false;
          message = 'Day must be between 1 and 31';
        }
      } else if (name.includes('Year')) {
        const year = parseInt(value);
        const currentYear = new Date().getFullYear();
        if (name.includes('dob')) {
          if (value && (year < 1900 || year > currentYear)) {
            isValid = false;
            message = `Year must be between 1900 and ${currentYear}`;
          }
        } else {
          if (value && (year < currentYear || year > currentYear + 10)) {
            isValid = false;
            message = `Year must be between ${currentYear} and ${currentYear + 10}`;
          }
        }
      }
    }
    
    // Passport number validation
    else if (name.toLowerCase().includes('passport')) {
      if (value && value.length < 6) {
        isValid = false;
        message = 'Passport number should be at least 6 characters';
      } else if (value) {
        message = 'Valid passport number format';
      }
    }
    
    // Social Security Number validation
    else if (name === 'usSsn') {
      const ssnRegex = /^\d{3}-?\d{2}-?\d{4}$/;
      if (value && !ssnRegex.test(value)) {
        isValid = false;
        message = 'Format: 123-45-6789';
      } else if (value) {
        message = 'Valid SSN format';
      }
    }
    
    // Required field validation
    else if (field.required && !value) {
      isValid = false;
      message = 'This field is required';
    }
    
    // Apply validation styling
    showValidation(field, isValid, message);
  }
  
  function showValidation(field, isValid, message) {
    // Remove existing classes
    field.classList.remove('valid', 'invalid');
    
    // Add new class
    if (message) {
      field.classList.add(isValid ? 'valid' : 'invalid');
    }
    
    // Update or create validation message
    let msgElement = field.parentElement.querySelector('.validation-message');
    if (message) {
      if (!msgElement) {
        msgElement = document.createElement('div');
        msgElement.className = 'validation-message';
        field.parentElement.appendChild(msgElement);
      }
      msgElement.textContent = message;
      msgElement.className = `validation-message ${isValid ? 'valid' : 'invalid'}`;
    } else if (msgElement) {
      msgElement.remove();
    }
  }
  
  function clearValidation(field) {
    field.classList.remove('valid', 'invalid');
    const msgElement = field.parentElement.querySelector('.validation-message');
    if (msgElement) {
      msgElement.remove();
    }
  }

  // Autosave on input
  document.addEventListener('input', (e)=>{
    if(e.target.matches('input, select')){
      // Apply input formatting
      if (e.target.matches('input[type="text"], input:not([type])')) {
        applyInputFormatting(e.target);
      }
      
      // Real-time validation
      if (e.target.matches('input')) {
        validateField(e.target);
      }
      
      // Apply conditional logic
      applyConditionalLogic();
      
      // If a field changed, clear its confirmed state
      const nm = e.target.name;
      if(nm){
        const conf = loadConfirmed();
        if(conf[nm]){ delete conf[nm]; saveConfirmed(conf); }
      }
      
      // Only auto-save for authenticated users
      if (!currentUser) {
        console.log('🔒 Input detected but no user signed in - not auto-saving');
        return;
      }
      
      // Show visual feedback for auto-save
      showAutoSaveIndicator();
      
      // Auto-save with debounce
      clearTimeout(autoSaveTimeout);
      autoSaveTimeout = setTimeout(() => {
        save();
        updateProgress();
      }, 500); // Save 500ms after user stops typing
    }
  });
  
  // Validate on blur for better UX
  document.addEventListener('blur', (e) => {
    if (e.target.matches('input')) {
      validateField(e.target);
    }
  }, true);

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
    // Check admin authorization
    if (!currentUser || !isAdmin(currentUser)) {
      console.error('❌ Unauthorized admin access attempt');
      alert('❌ Unauthorized Access\n\nAdmin functions are restricted to authorized users only.');
      return;
    }
    
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
    // Check admin authorization
    if (!currentUser || !isAdmin(currentUser)) {
      console.error('❌ Unauthorized delete attempt');
      alert('❌ Unauthorized Access\n\nOnly authorized users can delete forms.');
      return;
    }
    
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
    // Check admin authorization
    if (!currentUser || !isAdmin(currentUser)) {
      console.error('❌ Unauthorized export attempt');
      alert('❌ Unauthorized Access\n\nOnly authorized users can export data.');
      return;
    }
    
    try {
      const forms = await loadAllForms();
      if (!forms || forms.length === 0) {
        alert('No data to export.');
        return;
      }
      
      const dataStr = JSON.stringify(forms, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(dataBlob);
      link.download = `ds160-forms-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      
      console.log('✅ Data exported by admin:', currentUser.email);
    } catch (error) {
      console.error('❌ Error exporting data:', error);
      alert('Error exporting data. Please try again.');
    }
  }

  // Smart navigation function
  function findNextEmptySection() {
    const data = collectData();
    const formSections = sections.filter(s => s.dataset.section !== 'preview' && s.dataset.section !== 'admin');
    const currentSectionId = document.querySelector('.form-section.active')?.dataset.section;
    let currentIndex = formSections.findIndex(s => s.dataset.section === currentSectionId);
    
    // Start from next section or beginning if current not found
    if (currentIndex === -1) currentIndex = 0;
    else currentIndex = (currentIndex + 1) % formSections.length;
    
    // Check sections starting from current + 1
    for (let i = 0; i < formSections.length; i++) {
      const checkIndex = (currentIndex + i) % formSections.length;
      const section = formSections[checkIndex];
      const fields = Array.from(section.querySelectorAll('[name]'))
        .map(el => el.name)
        .filter((v, i, a) => a.indexOf(v) === i);
      
      let hasEmptyField = false;
      for (const field of fields) {
        const val = Array.isArray(data[field]) ? data[field].join(', ') : String(data[field] ?? '');
        if (!val || val.trim() === '') {
          hasEmptyField = true;
          break;
        }
      }
      
      if (hasEmptyField) {
        return section.dataset.section;
      }
    }
    
    return null; // All sections complete
  }

  // Top buttons
  document.getElementById('skipToEmptyBtn').addEventListener('click', () => {
    const nextEmptySection = findNextEmptySection();
    if (nextEmptySection) {
      showSection(nextEmptySection);
      
      // Show feedback
      const btn = document.getElementById('skipToEmptyBtn');
      const originalText = btn.textContent;
      btn.textContent = '✅ Jumped!';
      setTimeout(() => {
        btn.textContent = originalText;
      }, 1500);
    } else {
      // All sections complete
      const btn = document.getElementById('skipToEmptyBtn');
      const originalText = btn.textContent;
      btn.textContent = '🎉 All Complete!';
      setTimeout(() => {
        btn.textContent = originalText;
      }, 2000);
    }
  });
  
  // Shortcuts help
  document.getElementById('shortcutsBtn').addEventListener('click', () => {
    alert(`⌨️ Keyboard Shortcuts:

📋 Navigation:
• ← → Arrow Keys: Navigate between sections
• 1-9 Number Keys: Jump to specific sections

🔧 Actions:
• Ctrl+S: Save form
• Ctrl+P: Print/PDF
• Ctrl+E: Skip to next empty section

💡 Use these shortcuts to quickly navigate and manage your DS-160 form!`);
  });
  
  // Export functionality
  function exportToJSON() {
    const data = collectData();
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `ds160-form-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  }
  
  function exportToCSV() {
    const data = collectData();
    const headers = Object.keys(data);
    const values = headers.map(key => {
      const val = Array.isArray(data[key]) ? data[key].join('; ') : String(data[key] ?? '');
      return `"${val.replace(/"/g, '""')}"`;
    });
    
    const csv = `${headers.join(',')}\n${values.join(',')}`;
    const dataBlob = new Blob([csv], { type: 'text/csv' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `ds160-form-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  }
  
  function exportToText() {
    const data = collectData();
    let text = 'DS-160 FORM DATA\n';
    text += '================\n\n';
    
    const formSections = sections.filter(s => s.dataset.section !== 'preview' && s.dataset.section !== 'admin');
    formSections.forEach(section => {
      const sectionTitle = section.querySelector('h2')?.textContent || section.dataset.section;
      text += `${sectionTitle.toUpperCase()}\n`;
      text += '-'.repeat(sectionTitle.length) + '\n';
      
      const fields = Array.from(section.querySelectorAll('[name]'))
        .map(el => el.name)
        .filter((v, i, a) => a.indexOf(v) === i);
      
      fields.forEach(field => {
        const val = Array.isArray(data[field]) ? data[field].join(', ') : String(data[field] ?? '');
        if (val && val.trim() !== '') {
          text += `${field}: ${val}\n`;
        }
      });
      
      text += '\n';
    });
    
    const dataBlob = new Blob([text], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `ds160-form-${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
  }

  // Export dropdown functionality
  document.getElementById('exportBtn').addEventListener('click', (e) => {
    e.stopPropagation();
    const dropdown = document.querySelector('.export-dropdown');
    dropdown.classList.toggle('active');
  });
  
  // Close dropdown when clicking outside
  document.addEventListener('click', () => {
    const dropdown = document.querySelector('.export-dropdown');
    dropdown.classList.remove('active');
  });

  document.getElementById('saveBtn').addEventListener('click', save);
  document.getElementById('printPdfBtn').addEventListener('click', ()=>{
    window.print();
  });
  document.getElementById('exportJsonBtn').addEventListener('click', exportToJSON);
  document.getElementById('exportCsvBtn').addEventListener('click', exportToCSV);  
  document.getElementById('exportTxtBtn').addEventListener('click', exportToText);
  
  // Reset button with confirmation
  document.getElementById('resetBtn').addEventListener('click', ()=>{
    if (confirm('⚠️ Are you sure you want to reset all form fields?\n\nThis will clear all your entered data and cannot be undone.')) {
      console.log('🔄 User confirmed form reset');
      clearForms();
      renderPreview();
      
      // Clear confirmed states as well
      saveConfirmed({});
      
      // Show success message
      const resetBtn = document.getElementById('resetBtn');
      const originalText = resetBtn.textContent;
      resetBtn.textContent = '✅ Reset Complete';
      resetBtn.disabled = true;
      
      setTimeout(() => {
        resetBtn.textContent = originalText;
        resetBtn.disabled = false;
      }, 2000);
    }
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
  
  // Sign-in page event listeners
  document.getElementById('googleSignInBtn')?.addEventListener('click', signInWithGoogle);
  document.getElementById('anonymousSignInBtn')?.addEventListener('click', signInAnonymously);
  
  // Admin access from sign-in page
  document.getElementById('adminAccessBtn')?.addEventListener('click', async () => {
    // Check if Firebase is ready first
    if (!firebaseReady) {
      alert('Firebase is not ready yet. Please wait a moment and try again.');
      return;
    }
    
    // Check if current user is already signed in and is admin
    if (currentUser && isAdmin(currentUser)) {
      showSection('admin');
      loadAllForms();
      return;
    }
    
    // Set flag to indicate this is an admin access attempt
    pendingAdminAccess = true;
    
    // If not signed in or not admin, require Google sign-in
    alert('Admin access requires authentication. Please sign in with your authorized Google account.');
    
    try {
      await signInWithGoogle();
      // The authentication state change handler will check the pendingAdminAccess flag
      // and handle the authorization logic
      
    } catch (error) {
      console.error('❌ Error during admin authentication:', error);
      alert('Authentication failed. Please try again.');
      pendingAdminAccess = false; // Reset flag on error
    }
  });
  
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

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Only handle shortcuts when not typing in input fields
    if (e.target.matches('input, textarea, select')) return;
    
    // Ctrl/Cmd + S = Save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      save();
      return;
    }
    
    // Ctrl/Cmd + P = Print
    if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
      e.preventDefault();
      window.print();
      return;
    }
    
    // Ctrl/Cmd + E = Skip to Empty
    if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
      e.preventDefault();
      document.getElementById('skipToEmptyBtn').click();
      return;
    }
    
    // Arrow key navigation
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      const currentBtn = document.querySelector('.nav-btn.active');
      const allBtns = Array.from(document.querySelectorAll('.nav-btn'));
      const currentIndex = allBtns.indexOf(currentBtn);
      
      let newIndex;
      if (e.key === 'ArrowLeft') {
        newIndex = currentIndex > 0 ? currentIndex - 1 : allBtns.length - 1;
      } else {
        newIndex = currentIndex < allBtns.length - 1 ? currentIndex + 1 : 0;
      }
      
      allBtns[newIndex].click();
      return;
    }
    
    // Number keys 1-9 for direct section navigation
    if (e.key >= '1' && e.key <= '9') {
      const sectionIndex = parseInt(e.key) - 1;
      const allBtns = Array.from(document.querySelectorAll('.nav-btn'));
      if (sectionIndex < allBtns.length) {
        allBtns[sectionIndex].click();
      }
      return;
    }
  });

  // Field help data
  const fieldHelp = {
    'surnames': {
      title: 'Surnames (Family Names)',
      content: 'Enter your surname exactly as it appears on your passport. This is your family name or last name.',
      example: 'Smith, Johnson, García'
    },
    'givenNames': {
      title: 'Given Names (First Names)',
      content: 'Enter all your given names (first and middle names) exactly as they appear on your passport.',
      example: 'John William, María José'
    },
    'nativeAlphabetName': {
      title: 'Native Alphabet Name',
      content: 'If your name is written in a non-Latin alphabet (Arabic, Chinese, Cyrillic, etc.), enter your full name here.',
      example: '张伟, Мария Петрова, محمد أحمد'
    },
    'birthCity': {
      title: 'City of Birth',
      content: 'Enter the city where you were born, exactly as it appears on your birth certificate or passport.',
      example: 'New York, London, Mumbai'
    },
    'birthCountry': {
      title: 'Country of Birth',
      content: 'Select the country where you were born. Use the country name as it existed at the time of your birth.',
      example: 'If born in USSR, select the current country name'
    },
    'nationality': {
      title: 'Nationality',
      content: 'Select your current nationality/citizenship. This should match your passport.',
      example: 'The country that issued your passport'
    },
    'usSsn': {
      title: 'U.S. Social Security Number',
      content: 'Enter your SSN only if you have been issued one by the U.S. Social Security Administration.',
      example: '123-45-6789'
    },
    'usTin': {
      title: 'U.S. Taxpayer ID Number',
      content: 'Enter your Individual Taxpayer Identification Number (ITIN) if you have one.',
      example: '9XX-XX-XXXX format'
    },
    'purpose': {
      title: 'Purpose of Trip',
      content: 'Select the main purpose of your visit to the United States. This determines your visa category.',
      example: 'Tourism, Business, Study, Work'
    },
    'dobDay': {
      title: 'Date of Birth - Day',
      content: 'Enter the day you were born (1-31). Must match your passport exactly.',
      example: '15, 03, 28'
    },
    'dobMonth': {
      title: 'Date of Birth - Month',
      content: 'Select the month you were born. Must match your passport exactly.',
      example: 'JAN, FEB, MAR...'
    },
    'dobYear': {
      title: 'Date of Birth - Year',
      content: 'Enter the 4-digit year you were born. Must match your passport exactly.',
      example: '1985, 1990, 2000'
    }
  };

  // Function to add help tooltips
  function addHelpTooltips() {
    Object.keys(fieldHelp).forEach(fieldName => {
      const field = document.querySelector(`[name="${fieldName}"]`);
      if (field && !field.parentElement.querySelector('.help-tooltip')) {
        const help = fieldHelp[fieldName];
        const tooltip = document.createElement('span');
        tooltip.className = 'help-tooltip';
        tooltip.innerHTML = `
          <span class="help-icon">?</span>
          <div class="tooltip-content">
            <strong>${help.title}</strong><br>
            ${help.content}
            ${help.example ? `<div class="tooltip-example">Example: ${help.example}</div>` : ''}
          </div>
        `;
        
        // Insert tooltip after the field's label text
        const label = field.closest('label');
        if (label) {
          const labelText = label.firstChild;
          if (labelText && labelText.nodeType === 3) { // Text node
            labelText.after(tooltip);
          }
        }
      }
    });
  }

  // Input formatting functions
  function formatPhoneNumber(value) {
    // Remove all non-digits
    const cleaned = value.replace(/\D/g, '');
    
    // Format as (XXX) XXX-XXXX
    if (cleaned.length <= 3) {
      return cleaned;
    } else if (cleaned.length <= 6) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    } else {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
    }
  }
  
  function formatSSN(value) {
    // Remove all non-digits
    const cleaned = value.replace(/\D/g, '');
    
    // Format as XXX-XX-XXXX
    if (cleaned.length <= 3) {
      return cleaned;
    } else if (cleaned.length <= 5) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    } else {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 5)}-${cleaned.slice(5, 9)}`;
    }
  }
  
  function formatDate(value) {
    // Remove all non-digits
    const cleaned = value.replace(/\D/g, '');
    
    // Format as DD/MM/YYYY
    if (cleaned.length <= 2) {
      return cleaned;
    } else if (cleaned.length <= 4) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    } else {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4, 8)}`;
    }
  }
  
  function capitalizeWords(value) {
    return value.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  }
  
  function applyInputFormatting(field) {
    const name = field.name.toLowerCase();
    let value = field.value;
    
    // Store cursor position
    const cursorPos = field.selectionStart;
    const originalLength = value.length;
    
    // Apply formatting based on field type
    if (name.includes('phone') || name.includes('tel')) {
      value = formatPhoneNumber(value);
    } else if (name === 'usssn') {
      value = formatSSN(value);
    } else if (name.includes('date') && !name.includes('Day') && !name.includes('Month') && !name.includes('Year')) {
      value = formatDate(value);
    } else if (name.includes('name') || name.includes('city') || name.includes('street')) {
      value = capitalizeWords(value);
    }
    
    // Update field value
    if (value !== field.value) {
      field.value = value;
      
      // Restore cursor position, adjusting for formatting changes
      const lengthDiff = value.length - originalLength;
      field.setSelectionRange(cursorPos + lengthDiff, cursorPos + lengthDiff);
    }
  }

  // Conditional field logic
  const conditionalFields = {
    'usedOtherNames': {
      showWhen: 'yes',
      fields: ['otherNamesExplain'] // This field would need to be added to HTML
    },
    'maritalStatus': {
      showWhen: 'MARRIED',
      fields: ['spouseName', 'spouseBirthDate', 'spouseNationality'] // These would need to be added
    },
    'otherNationality': {
      showWhen: 'yes', 
      fields: ['otherNationalityCountry']
    },
    'permanentResidentElsewhere': {
      showWhen: 'yes',
      fields: ['permanentResidentCountry']
    },
    'specificPlans': {
      showWhen: 'yes',
      fields: ['flightNumber', 'arrivalPort']
    }
  };

  function applyConditionalLogic() {
    Object.keys(conditionalFields).forEach(triggerFieldName => {
      const triggerField = document.querySelector(`[name="${triggerFieldName}"]`);
      if (!triggerField) return;
      
      const config = conditionalFields[triggerFieldName];
      const isTriggered = triggerField.value === config.showWhen || 
                         (triggerField.type === 'radio' && 
                          document.querySelector(`[name="${triggerFieldName}"]:checked`)?.value === config.showWhen);
      
      config.fields.forEach(fieldName => {
        const dependentField = document.querySelector(`[name="${fieldName}"]`);
        if (dependentField) {
          const label = dependentField.closest('label');
          const fieldset = dependentField.closest('fieldset');
          const container = label || fieldset;
          
          if (container) {
            if (isTriggered) {
              container.style.display = '';
              container.classList.remove('conditionally-hidden');
            } else {
              container.style.display = 'none';
              container.classList.add('conditionally-hidden');
              // Clear the field when hidden
              if (dependentField.type === 'radio' || dependentField.type === 'checkbox') {
                dependentField.checked = false;
              } else {
                dependentField.value = '';
              }
            }
          }
        }
      });
    });
  }

  // Initialize
  window.addEventListener('firebaseReady', () => {
    console.log('🔥 Firebase initialization complete');
  });
  
  load();
  renderPreview();
  updateProgress();
  addHelpTooltips();
  applyConditionalLogic();
})();


