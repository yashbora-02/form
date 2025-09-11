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
    
    // Set up authentication state listener
    window.firebase.onAuthStateChanged(window.firebase.auth, (user) => {
      currentUser = user;
      updateUserUI(user);
      if (user) {
        loadUserForms();
      } else {
        clearUserForms();
      }
    });
  });
  
  
  // Admin authorization - only allow specific user
  function isAdmin(user) {
    if (!user) return false;
    
    // Only these emails are authorized for admin access
    const adminEmails = ['yashbora.ai@gmail.com', 'vaibhav@chhajed.ai'];
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
  
  // UI utility functions
  function setUIState(config) {
    Object.entries(config).forEach(([selector, display]) => {
      const element = document.getElementById(selector) || document.querySelector(selector);
      if (element) element.style.display = display;
    });
  }

  function setSaveButtonState(state, text = '', duration = 0) {
    const saveBtn = document.getElementById('saveBtn');
    if (!saveBtn) return;
    
    const originalText = saveBtn.getAttribute('data-original-text') || saveBtn.textContent;
    if (!saveBtn.getAttribute('data-original-text')) {
      saveBtn.setAttribute('data-original-text', originalText);
    }
    
    saveBtn.classList.remove('saving', 'saved', 'error');
    saveBtn.disabled = false;
    
    switch (state) {
      case 'saving':
        saveBtn.classList.add('saving');
        saveBtn.disabled = true;
        break;
      case 'saved':
        saveBtn.classList.add('saved');
        if (duration > 0) {
          setTimeout(() => {
            saveBtn.textContent = originalText;
            saveBtn.disabled = false;
            saveBtn.classList.remove('saved');
          }, duration);
        }
        break;
      case 'error':
        saveBtn.classList.add('error');
        if (duration > 0) {
          setTimeout(() => {
            saveBtn.textContent = originalText;
            saveBtn.disabled = false;
            saveBtn.classList.remove('error');
          }, duration);
        }
        break;
    }
    
    if (text) saveBtn.textContent = text;
  }

  // Authentication functions
  async function signInWithGoogle() {
    try {
      const result = await window.firebase.signInWithPopup(window.firebase.auth, window.firebase.googleProvider);
    } catch (error) {
      console.error('❌ Google sign in error:', error);
      alert('Sign in failed. Please try again.');
    }
  }
  
  async function signInAnonymously() {
    try {
      const result = await window.firebase.signInAnonymously(window.firebase.auth);
    } catch (error) {
      console.error('❌ Anonymous sign in error:', error);
      alert('Anonymous sign in failed. Please try again.');
    }
  }
  
  async function signInWithEmail(email, password) {
    
    if (!firebaseReady) {
      alert('Please wait for Firebase to initialize and try again.');
      return;
    }
    
    try {
      const result = await window.firebase.signInWithEmailAndPassword(window.firebase.auth, email, password);
    } catch (error) {
      console.error('❌ Email sign in error:', error);
      console.error('❌ Error code:', error.code);
      console.error('❌ Error message:', error.message);
      
      // Handle specific error cases
      let errorMessage = 'Sign in failed. Please try again.';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email. Please create an account first or check your email address.';
      } else if (error.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid email or password. Please check your credentials and try again.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password. Please try again.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password should be at least 6 characters.';
      } else {
        errorMessage = `Sign in failed: ${error.message}`;
      }
      
      alert(errorMessage);
    }
  }

  async function createNewAccount(email, password) {
    
    if (!firebaseReady) {
      alert('Please wait for Firebase to initialize and try again.');
      return;
    }
    
    try {
      const result = await window.firebase.createUserWithEmailAndPassword(window.firebase.auth, email, password);
      alert(`✅ Account Created Successfully!\n\nWelcome! Your account has been created and you're now signed in.\n\nYou can now start filling out your DS-160 form.`);
    } catch (error) {
      console.error('❌ Account creation error:', error);
      console.error('❌ Error code:', error.code);
      console.error('❌ Error message:', error.message);
      
      let errorMessage = 'Failed to create account.';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'An account with this email already exists. Please sign in instead or use a different email address.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please use at least 6 characters with a mix of letters and numbers.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      } else {
        errorMessage = `Account creation failed: ${error.message}`;
      }
      
      alert(errorMessage);
    }
  }

  async function resetPassword(email) {
    
    if (!firebaseReady) {
      alert('Please wait for Firebase to initialize and try again.');
      return;
    }
    
    if (!email) {
      alert('Please enter your email address first.');
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert('Please enter a valid email address.');
      return;
    }
    
    try {
      await window.firebase.sendPasswordResetEmail(window.firebase.auth, email);
      alert(`✅ Password Reset Email Sent!\n\nWe've sent a password reset link to ${email}.\n\nPlease check your email (including spam folder) and click the link to reset your password.`);
    } catch (error) {
      console.error('❌ Password reset error:', error);
      console.error('❌ Error code:', error.code);
      console.error('❌ Error message:', error.message);
      
      let errorMessage = 'Failed to send password reset email.';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address. Please check your email or create a new account.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many password reset requests. Please wait a few minutes before trying again.';
      } else {
        errorMessage = `Password reset failed: ${error.message}`;
      }
      
      alert(errorMessage);
    }
  }

  async function signOutUser() {
    try {
      await window.firebase.signOut(window.firebase.auth);
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
    const adminDashboardBtn = document.getElementById('adminDashboardBtn');
    
    if (user) {
      // Check if this is a pending admin access attempt
      if (pendingAdminAccess) {
        
        if (isAdmin(user)) {
          // Show main app and go directly to admin section
          setUIState({
            signInPage: 'none',
            mainApp: 'flex',
            '.app-header': 'flex',
            userInfo: 'flex',
            authButtons: 'none',
            signOutBtn: 'block'
          });
          
          if (user.photoURL) {
            userAvatar.src = user.photoURL;
            userAvatar.style.display = 'block';
          } else {
            userAvatar.style.display = 'none';
          }
          
          userName.textContent = user.displayName || user.email || `Anonymous User`;
          
          // Navigate to admin section
          setTimeout(() => {
            showSection('admin');
            loadAllForms();
          }, 500);
          
        } else {
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
      setUIState({
        signInPage: 'none',
        mainApp: 'flex',
        '.app-header': 'flex',
        userInfo: 'flex',
        authButtons: 'none',
        signOutBtn: 'block'
      });
      
      if (user.photoURL) {
        userAvatar.src = user.photoURL;
        userAvatar.style.display = 'block';
      } else {
        userAvatar.style.display = 'none';
      }
      
      userName.textContent = user.displayName || user.email || `Anonymous User`;
      
      // Show/hide admin dashboard button in header based on admin status
      if (adminDashboardBtn) {
        if (isAdmin(user)) {
          adminDashboardBtn.style.display = 'block';
        } else {
          adminDashboardBtn.style.display = 'none';
        }
      }
    } else {
      // User is signed out - show sign-in page
      setUIState({
        signInPage: 'flex',
        mainApp: 'none',
        '.app-header': 'none',
        userInfo: 'none',
        authButtons: 'flex',
        signOutBtn: 'none'
      });
      
      // Hide admin dashboard button when signed out
      if (adminDashboardBtn) {
        adminDashboardBtn.style.display = 'none';
      }
    }
  }
  
  function clearUserForms() {
    // Clear current form when user signs out
    currentFormId = null;
    pendingAdminAccess = false; // Reset admin access flag
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
    if(id==='admin') {
      // Ensure admin section is properly visible
      const adminSection = document.getElementById('section-admin');
      if (adminSection) {
        adminSection.style.display = 'block';
      }
      
      // Automatically load forms data when admin section is shown
      if (currentUser && isAdmin(currentUser)) {
        loadAllForms();
      } else {
        // Show unauthorized message in admin dashboard
        const statsDiv = document.getElementById('adminStats');
        const formsListDiv = document.getElementById('adminFormsList');
        if (statsDiv) {
          statsDiv.innerHTML = '<div class="no-forms"><h3>Access Denied</h3><p>You must be signed in as an admin to view this section.</p></div>';
        }
        if (formsListDiv) {
          formsListDiv.innerHTML = '';
        }
      }
    }
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
      } else {
        // Create new form
        const docRef = await window.firebase.addDoc(window.firebase.collection(window.firebase.db, 'forms'), formData);
        currentFormId = docRef.id;
      }
      return true;
    } catch (error) {
      console.error('❌ Error saving to Firebase:', error);
      console.error('Error details:', error.code, error.message);
      return false;
    }
  }
  
  async function loadUserForms() {
    
    if (!firebaseReady) {
      return;
    }
    
    if (!currentUser) {
      return;
    }
    
    if (isFreshMode()) {
      return;
    }
    
    try {
      const q = window.firebase.query(
        window.firebase.collection(window.firebase.db, 'forms'),
        window.firebase.where('userId', '==', currentUser.uid)
      );
      const querySnapshot = await window.firebase.getDocs(q);
      
      
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
        
        
        // Load form data (excluding Firebase metadata)
        const { timestamp, lastModified, confirmed, userId, userEmail, userName, isShared, shareId, ...formData } = data;
        
        
        fillForms(formData);
        
        // Load confirmed states
        if (confirmed) {
          saveConfirmed(confirmed);
        }
        
        renderPreview();
      } else {
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
    
    setSaveButtonState('saving', '💾 Saving...');
    
    try {
      // Only save for authenticated users
      if (!currentUser) {
        setSaveButtonState('error', '🔒 Sign in to save', 3000);
        return;
      }
      
      // Save to Firebase only (no localStorage for authenticated users)
      const firebaseSaved = await saveToFirebase(data);
      
      renderPreview();
      setSaveButtonState('saved', '✅ Saved!', 2000);
      
    } catch (error) {
      setSaveButtonState('error', '❌ Error', 3000);
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
      clearForms();
      return;
    }
    
    if(isFreshMode()){
      // Ensure previous browser autofill is removed for shared links
      clearForms();
      return; // skip loading saved answers unless ?load=1 is present
    }
    
    // Don't load from localStorage anymore - only Firebase data for authenticated users
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
    // Skip validation for radio buttons and checkboxes
    if (field.type === 'radio' || field.type === 'checkbox') {
      clearValidation(field);
      return;
    }
    
    const value = field.value.trim();
    const name = field.name;
    let isValid = true;
    let message = '';
    
    // Skip validation for fields in hidden conditional containers or disabled validation
    const hiddenContainer = field.closest('.conditional-container[style*="display: none"]');
    const validationDisabled = field.hasAttribute('data-validation-disabled');
    if (hiddenContainer || validationDisabled) {
      clearValidation(field);
      return;
    }
    
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

  // Prevent browser validation popup messages
  document.addEventListener('invalid', (e) => {
    e.preventDefault();
  }, true);
  
  // Autosave on input
  document.addEventListener('input', (e)=>{
    if(e.target.matches('input, select')){
      // Apply input formatting
      if (e.target.matches('input[type="text"], input:not([type])')) {
        applyInputFormatting(e.target);
      }
      
      // Real-time validation (skip radio buttons and checkboxes)
      if (e.target.matches('input') && e.target.type !== 'radio' && e.target.type !== 'checkbox') {
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
        return;
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
      // Show loading state in admin dashboard
      const statsDiv = document.getElementById('adminStats');
      const formsListDiv = document.getElementById('adminFormsList');
      if (statsDiv) {
        statsDiv.innerHTML = '<div class="loading">Firebase is connecting...</div>';
      }
      if (formsListDiv) {
        formsListDiv.innerHTML = '<div class="loading">Loading forms data...</div>';
      }
      return;
    }
    
    // Show loading state
    const statsDiv = document.getElementById('adminStats');
    const formsListDiv = document.getElementById('adminFormsList');
    if (statsDiv) {
      statsDiv.innerHTML = '<div class="loading">Loading statistics...</div>';
    }
    if (formsListDiv) {
      formsListDiv.innerHTML = '<div class="loading">Loading forms...</div>';
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
    }
  }
  
  function renderAdminDashboard(forms) {
    const statsDiv = document.getElementById('adminStats');
    const formsListDiv = document.getElementById('adminFormsList');
    
    if (!statsDiv || !formsListDiv) {
      console.error('❌ Admin dashboard elements not found!');
      return;
    }
    
    // Render stats
    const totalForms = forms.length;
    const recentForms = forms.filter(f => {
      const formDate = f.lastModified ? new Date(f.lastModified) : new Date();
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return formDate > dayAgo;
    }).length;
    
    const statsHTML = `
      <div class="admin-stat-card">
        <div class="stat-number">${totalForms}</div>
        <div class="stat-label">Total Forms</div>
      </div>
      <div class="admin-stat-card">
        <div class="stat-number">${recentForms}</div>
        <div class="stat-label">Last 24h</div>
      </div>
    `;
    
    statsDiv.innerHTML = statsHTML;
    
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
    
    const formsListHTML = forms.map((form, index) => {
      const date = form.lastModified ? new Date(form.lastModified).toLocaleString() : 'Unknown';
      const { timestamp, lastModified, confirmed, userId, userEmail, userName, isShared, shareId, ...formData } = form;
      const fieldsCount = Object.keys(formData).length;
      const filledFields = Object.values(formData).filter(val => val && String(val).trim() !== '').length;
      
      // Determine display name priority: form name > user name > email > anonymous
      let displayName = 'Anonymous User';
      if (formData.surnames && formData.givenNames) {
        displayName = `${formData.givenNames} ${formData.surnames}`;
      } else if (formData.surnames) {
        displayName = formData.surnames;
      } else if (userName && userName !== 'Anonymous User') {
        displayName = userName;
      } else if (userEmail) {
        displayName = userEmail.split('@')[0]; // Use email username part
      }
      
      return `
        <div class="admin-form-card" data-form-id="${form.id}">
          <div class="form-header">
            <h4>${displayName}</h4>
            <div class="form-actions">
              <button class="view-form" data-form-id="${form.id}">View Details</button>
              <button class="delete-form danger" data-form-id="${form.id}">Delete</button>
            </div>
          </div>
          <div class="form-details">
            <span>Email: ${userEmail || 'No email provided'}</span>
            <span>Date: ${date}</span>
            <span>Progress: ${filledFields}/${fieldsCount} fields</span>
            <span>ID: ${form.id.substring(0, 8)}...</span>
          </div>
          <div class="form-preview">
            ${formData.surnames ? `<span><strong>Applicant:</strong> ${formData.surnames}, ${formData.givenNames || 'N/A'}</span>` : ''}
            ${formData.nationality ? `<span><strong>Nationality:</strong> ${formData.nationality}</span>` : ''}
            ${formData.purpose ? `<span><strong>Purpose:</strong> ${formData.purpose}</span>` : ''}
          </div>
        </div>
      `;
    }).join('');
    
    formsListDiv.innerHTML = formsListHTML;
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
  const skipToEmptyBtn = document.getElementById('skipToEmptyBtn');
  if (skipToEmptyBtn) {
    skipToEmptyBtn.addEventListener('click', () => {
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
  }
  
  // Shortcuts help (guarded)
  (function(){
    const shortcutsBtn = document.getElementById('shortcutsBtn');
    if (!shortcutsBtn) return;
    shortcutsBtn.addEventListener('click', () => {
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
  })();
  
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

  // Export PDF functionality - will be set up at the end

  const saveBtn = document.getElementById('saveBtn');
  if (saveBtn) saveBtn.addEventListener('click', save);
  
  const printPdfBtn = document.getElementById('printPdfBtn');
  if (printPdfBtn) printPdfBtn.addEventListener('click', ()=>{ window.print(); });
  
  const exportJsonBtn = document.getElementById('exportJsonBtn');
  if (exportJsonBtn) exportJsonBtn.addEventListener('click', exportToJSON);
  
  const exportCsvBtn = document.getElementById('exportCsvBtn');
  if (exportCsvBtn) exportCsvBtn.addEventListener('click', exportToCSV);
  
  const exportTxtBtn = document.getElementById('exportTxtBtn');
  if (exportTxtBtn) exportTxtBtn.addEventListener('click', exportToText);
  
  // Reset button with confirmation
  const resetBtn = document.getElementById('resetBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', ()=>{
      if (confirm('⚠️ Are you sure you want to reset all form fields?\n\nThis will clear all your entered data and cannot be undone.')) {
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
  }
  const kvList = document.getElementById('kvList');
  if (kvList) {
    kvList.addEventListener('click', async (e)=>{
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
  }

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
        const { timestamp, lastModified, confirmed, userId, userEmail, userName, isShared, shareId, ...cleanData } = formData;
        
        // Determine display name using same logic as admin dashboard
        let displayName = 'Anonymous User';
        if (cleanData.surnames && cleanData.givenNames) {
          displayName = `${cleanData.givenNames} ${cleanData.surnames}`;
        } else if (cleanData.surnames) {
          displayName = cleanData.surnames;
        } else if (userName && userName !== 'Anonymous User') {
          displayName = userName;
        } else if (userEmail) {
          displayName = userEmail.split('@')[0];
        }
        
        // Organize form data by sections
        const sections = organizeFormDataBySections(cleanData);
        
        // Create a popup window with organized form data
        const popup = window.open('', '_blank', 'width=1000,height=700,scrollbars=yes');
        
        popup.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>DS-160 Form - ${userName || 'Form Submission'}</title>
            <meta charset="utf-8">
            <style>
              * { box-sizing: border-box; margin: 0; padding: 0; }
              body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                line-height: 1.6; 
                color: #333; 
                background: #f8f9fa;
                padding: 20px;
              }
              .container { max-width: 900px; margin: 0 auto; }
              .header { 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white; 
                padding: 30px; 
                border-radius: 12px; 
                margin-bottom: 30px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
              }
              .header h1 { font-size: 28px; margin-bottom: 15px; }
              .header-info { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
              .header-info p { margin: 5px 0; opacity: 0.95; }
              .section { 
                background: white; 
                margin-bottom: 25px; 
                border-radius: 10px; 
                overflow: hidden;
                box-shadow: 0 2px 10px rgba(0,0,0,0.08);
              }
              .section-header { 
                background: #4f46e5; 
                color: white; 
                padding: 15px 25px; 
                font-weight: 600;
                font-size: 18px;
              }
              .section-content { padding: 25px; }
              .field-grid { 
                display: grid; 
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); 
                gap: 20px; 
              }
              .field { 
                border-left: 4px solid #e5e7eb; 
                padding: 15px; 
                background: #f9fafb;
                border-radius: 0 6px 6px 0;
                transition: all 0.2s ease;
              }
              .field:hover { 
                border-left-color: #4f46e5; 
                background: #f3f4f6; 
              }
              .field-label { 
                font-weight: 600; 
                color: #374151; 
                margin-bottom: 8px;
                text-transform: capitalize;
              }
              .field-value { 
                color: #6b7280; 
                font-size: 15px;
                word-break: break-word;
              }
              .field-value.filled { color: #111827; font-weight: 500; }
              .field-value.empty { 
                color: #9ca3af; 
                font-style: italic; 
                opacity: 0.7;
              }
              .stats { 
                display: flex; 
                justify-content: space-around; 
                background: white; 
                padding: 20px; 
                border-radius: 10px; 
                margin-bottom: 20px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.08);
              }
              .stat { text-align: center; }
              .stat-number { 
                font-size: 24px; 
                font-weight: bold; 
                color: #4f46e5; 
              }
              .stat-label { 
                color: #6b7280; 
                font-size: 14px; 
                margin-top: 5px;
              }
              .print-btn {
                position: fixed;
                top: 20px;
                right: 20px;
                background: #4f46e5;
                color: white;
                border: none;
                padding: 12px 20px;
                border-radius: 6px;
                cursor: pointer;
                font-weight: 500;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              }
              .print-btn:hover { background: #4338ca; }
              @media print {
                body { background: white; padding: 0; }
                .print-btn { display: none; }
                .section { break-inside: avoid; }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <button class="print-btn" onclick="window.print()">Print</button>
              
              <div class="header">
                <h1>DS-160 Form Submission</h1>
                <div class="header-info">
                  <div>
                    <p><strong>Applicant:</strong> ${displayName}</p>
                    <p><strong>Email:</strong> ${userEmail || 'Not provided'}</p>
                  </div>
                  <div>
                    <p><strong>Last Modified:</strong> ${new Date(lastModified).toLocaleString()}</p>
                    <p><strong>Form ID:</strong> ${formId}</p>
                  </div>
                </div>
              </div>
              
              ${generateStatsSection(cleanData)}
              
              ${sections.map(section => `
                <div class="section">
                  <div class="section-header">
                    ${section.title}
                  </div>
                  <div class="section-content">
                    <div class="field-grid">
                      ${section.fields.map(field => `
                        <div class="field">
                          <div class="field-label">${formatFieldLabel(field.key)}</div>
                          <div class="field-value ${field.value ? 'filled' : 'empty'}">
                            ${field.value || 'Not provided'}
                          </div>
                        </div>
                      `).join('')}
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
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
  
  // Helper functions for form view
  function organizeFormDataBySections(formData) {
    const sections = [
      {
        title: 'Personal Information',
        fields: ['surnames', 'givenNames', 'nativeAlphabetName', 'usedOtherNames', 'gender', 'maritalStatus', 'dobDay', 'dobMonth', 'dobYear', 'birthCity', 'birthCountry', 'nationality', 'otherNationality', 'nationalIdNumber', 'usSsn', 'usTin']
      },
      {
        title: 'Travel Information',
        fields: ['purpose', 'specificPlans', 'arrivalDate', 'departureDate', 'stayDuration', 'visitedUsBefore', 'previousVisitDetails', 'usVisaRefused', 'refusalReason']
      },
      {
        title: 'Address & Contact Information',
        fields: ['homeAddress', 'homeCity', 'homeState', 'homePostal', 'homeCountry', 'homePhone', 'workPhone', 'cellPhone', 'email', 'mailingAddress']
      },
      {
        title: 'Passport Information',
        fields: ['passportNumber', 'passportType', 'passportIssueDate', 'passportExpDate', 'passportIssueCountry', 'passportIssueCity', 'passportLostStolen']
      },
      {
        title: 'U.S. Contact Information',
        fields: ['usContactName', 'usContactOrg', 'usContactAddress', 'usContactCity', 'usContactState', 'usContactZip', 'usContactPhone', 'usContactEmail', 'usContactRelation']
      },
      {
        title: 'Family Information',
        fields: ['fatherName', 'fatherDob', 'fatherBirthCountry', 'fatherCountry', 'motherName', 'motherDob', 'motherBirthCountry', 'motherCountry', 'spouseName', 'spouseDob', 'spouseBirthCountry', 'spouseCountry']
      },
      {
        title: 'Work & Education History',
        fields: ['currentOccupation', 'currentEmployer', 'currentWorkAddress', 'currentSalary', 'workStartDate', 'previousWork', 'education', 'schoolName', 'schoolAddress', 'courseOfStudy', 'attendanceDate']
      },
      {
        title: 'Travel Companions',
        fields: ['travelingWithOthers', 'companionName', 'companionRelation', 'groupTravel', 'groupName']
      },
      {
        title: 'Security Questions',
        fields: ['criminalActivity', 'drugTrafficking', 'espionage', 'genocide', 'terrorism', 'moneyLaundering', 'humanTrafficking', 'assistingTerrorist', 'unlawfulActivity', 'fraud', 'childAbduction', 'deportation', 'visaViolation', 'mentalDisorder', 'drugAbuse', 'communicableDisease', 'publicCharge']
      },
      {
        title: 'Student Information',
        fields: ['studentExchange', 'sevisId', 'programNumber', 'schoolName', 'schoolAddress', 'courseOfStudy', 'academicTerm', 'fundingSource']
      }
    ];
    
    return sections.map(section => ({
      ...section,
      fields: section.fields.map(fieldName => ({
        key: fieldName,
        value: formData[fieldName]
      })).filter(field => field.value) // Only show fields with values
    })).filter(section => section.fields.length > 0); // Only show sections with data
  }
  
  function formatFieldLabel(fieldName) {
    // Convert camelCase to readable labels
    const labelMap = {
      'surnames': 'Surnames (Family Names)',
      'givenNames': 'Given Names (First Names)', 
      'nativeAlphabetName': 'Name in Native Alphabet',
      'usedOtherNames': 'Used Other Names',
      'dobDay': 'Birth Day',
      'dobMonth': 'Birth Month', 
      'dobYear': 'Birth Year',
      'birthCity': 'City of Birth',
      'birthCountry': 'Country of Birth',
      'otherNationality': 'Other Nationality',
      'nationalIdNumber': 'National ID Number',
      'usSsn': 'U.S. Social Security Number',
      'usTin': 'U.S. Taxpayer ID Number',
      'homeAddress': 'Home Address',
      'homeCity': 'Home City',
      'homeState': 'Home State/Province',
      'homePostal': 'Home Postal Code', 
      'homeCountry': 'Home Country',
      'homePhone': 'Home Phone',
      'workPhone': 'Work Phone',
      'cellPhone': 'Cell Phone',
      'mailingAddress': 'Mailing Address',
      'passportNumber': 'Passport Number',
      'passportType': 'Passport Type',
      'passportIssueDate': 'Passport Issue Date',
      'passportExpDate': 'Passport Expiration Date',
      'passportIssueCountry': 'Passport Issuing Country',
      'passportIssueCity': 'Passport Issuing City',
      'passportLostStolen': 'Passport Lost/Stolen',
      'usContactName': 'U.S. Contact Name',
      'usContactOrg': 'U.S. Contact Organization',
      'usContactAddress': 'U.S. Contact Address',
      'usContactCity': 'U.S. Contact City',
      'usContactState': 'U.S. Contact State',
      'usContactZip': 'U.S. Contact ZIP Code',
      'usContactPhone': 'U.S. Contact Phone',
      'usContactEmail': 'U.S. Contact Email',
      'usContactRelation': 'Relationship to U.S. Contact',
      'fatherName': 'Father\'s Name',
      'fatherDob': 'Father\'s Date of Birth',
      'fatherBirthCountry': 'Father\'s Country of Birth',
      'fatherCountry': 'Father\'s Current Country',
      'motherName': 'Mother\'s Name',
      'motherDob': 'Mother\'s Date of Birth',
      'motherBirthCountry': 'Mother\'s Country of Birth',
      'motherCountry': 'Mother\'s Current Country',
      'spouseName': 'Spouse\'s Name',
      'spouseDob': 'Spouse\'s Date of Birth',
      'spouseBirthCountry': 'Spouse\'s Country of Birth',
      'spouseCountry': 'Spouse\'s Current Country',
      'currentOccupation': 'Current Occupation',
      'currentEmployer': 'Current Employer',
      'currentWorkAddress': 'Current Work Address',
      'currentSalary': 'Current Salary',
      'workStartDate': 'Work Start Date',
      'previousWork': 'Previous Work Experience',
      'schoolName': 'School Name',
      'schoolAddress': 'School Address',
      'courseOfStudy': 'Course of Study',
      'attendanceDate': 'Attendance Date',
      'travelingWithOthers': 'Traveling with Others',
      'companionName': 'Companion Name',
      'companionRelation': 'Companion Relationship',
      'groupTravel': 'Group Travel',
      'groupName': 'Group Name',
      'sevisId': 'SEVIS ID',
      'programNumber': 'Program Number',
      'academicTerm': 'Academic Term',
      'fundingSource': 'Funding Source'
    };
    
    return labelMap[fieldName] || fieldName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  }
  
  function generateStatsSection(formData) {
    const totalFields = Object.keys(formData).length;
    const filledFields = Object.values(formData).filter(val => val && String(val).trim() !== '').length;
    const completionPercentage = Math.round((filledFields / totalFields) * 100);
    
    return `
      <div class="stats">
        <div class="stat">
          <div class="stat-number">${totalFields}</div>
          <div class="stat-label">Total Fields</div>
        </div>
        <div class="stat">
          <div class="stat-number">${filledFields}</div>
          <div class="stat-label">Fields Completed</div>
        </div>
        <div class="stat">
          <div class="stat-number">${completionPercentage}%</div>
          <div class="stat-label">Completion Rate</div>
        </div>
      </div>
    `;
  }
  
  // Authentication event listeners
  const signInBtn = document.getElementById('signInBtn');
  if (signInBtn) signInBtn.addEventListener('click', signInWithGoogle);
  
  const anonymousBtn = document.getElementById('anonymousBtn');
  if (anonymousBtn) anonymousBtn.addEventListener('click', signInAnonymously);
  
  const signOutBtn = document.getElementById('signOutBtn');
  if (signOutBtn) signOutBtn.addEventListener('click', signOutUser);
  
  const shareBtn = document.getElementById('shareBtn');
  if (shareBtn) shareBtn.addEventListener('click', shareCurrentForm);
  
  // User dropdown functionality - will be set up at the end
  
  // Sign-in page event listeners
  document.getElementById('googleSignInBtn')?.addEventListener('click', signInWithGoogle);
  document.getElementById('anonymousSignInBtn')?.addEventListener('click', signInAnonymously);
  
  // Tab switching functionality
  document.getElementById('signInTab')?.addEventListener('click', () => {
    // Switch tabs
    document.getElementById('signInTab').classList.add('active');
    document.getElementById('createAccountTab').classList.remove('active');
    
    // Switch forms
    document.getElementById('emailSignInForm').classList.add('active');
    document.getElementById('emailCreateForm').classList.remove('active');
  });
  
  document.getElementById('createAccountTab')?.addEventListener('click', () => {
    // Switch tabs
    document.getElementById('createAccountTab').classList.add('active');
    document.getElementById('signInTab').classList.remove('active');
    
    // Switch forms
    document.getElementById('emailCreateForm').classList.add('active');
    document.getElementById('emailSignInForm').classList.remove('active');
  });

  // Email sign-in form handler
  document.getElementById('emailSignInForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('signInEmailInput').value.trim();
    const password = document.getElementById('signInPasswordInput').value;
    
    
    if (!email || !password) {
      alert('Please enter both email and password.');
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert('Please enter a valid email address.');
      return;
    }
    
    await signInWithEmail(email, password);
  });
  
  // Email create account form handler
  document.getElementById('emailCreateForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('createEmailInput').value.trim();
    const password = document.getElementById('createPasswordInput').value;
    const confirmPassword = document.getElementById('confirmPasswordInput').value;
    
    
    if (!email || !password || !confirmPassword) {
      alert('Please fill in all fields.');
      return;
    }
    
    if (password.length < 6) {
      alert('Password must be at least 6 characters long.');
      return;
    }
    
    if (password !== confirmPassword) {
      alert('Passwords do not match. Please try again.');
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert('Please enter a valid email address.');
      return;
    }
    
    await createNewAccount(email, password);
  });
  
  // Forgot password handler
  document.getElementById('forgotPasswordBtn')?.addEventListener('click', async () => {
    const email = document.getElementById('signInEmailInput').value.trim();
    
    if (!email) {
      alert('Please enter your email address first, then click "Forgot Password?"');
      document.getElementById('signInEmailInput').focus();
      return;
    }
    
    const confirmed = confirm(`Send password reset email to:\n${email}\n\nAre you sure?`);
    if (confirmed) {
      await resetPassword(email);
    }
  });
  
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
  
  // Admin dashboard button in header
  document.getElementById('adminDashboardBtn')?.addEventListener('click', () => {
    showSection('admin');
    loadAllForms();
  });
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
  });
  
  // Conditional field toggling function
  window.toggleConditionalField = function(containerId, show) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    if (show) {
      container.style.display = 'block';
      container.classList.add('show');
      container.classList.remove('hide');
      // Re-enable validation for fields in shown container
      container.querySelectorAll('input, select, textarea').forEach(el => {
        el.removeAttribute('data-validation-disabled');
        clearValidation(el);
      });
    } else {
      container.style.display = 'none';
      container.classList.add('hide');
      container.classList.remove('show');
      // Clear inputs and disable validation in hidden container
      container.querySelectorAll('input, select, textarea').forEach(el => {
        if (el.type === 'radio' || el.type === 'checkbox') {
          el.checked = false;
        } else {
          el.value = '';
        }
        // Disable validation for hidden fields
        el.setAttribute('data-validation-disabled', 'true');
        clearValidation(el);
      });
    }
  };
  
  // Special handler for Previous Work/Education section
  window.togglePreviousWorkEducation = function() {
    const prevEmployed = document.querySelector('input[name="prevEmployed"]:checked')?.value === 'yes';
    const attendedSecondary = document.querySelector('input[name="attendedSecondary"]:checked')?.value === 'yes';
    
    // Show container if either question is answered "yes"
    const shouldShow = prevEmployed || attendedSecondary;
    toggleConditionalField('previousWorkEducationContainer', shouldShow);
  };

  load();
  renderPreview();
  applyConditionalLogic();
  
  // Set up event listeners for elements that might not exist yet
  function setupEventListeners() {
    
    // Export PDF functionality
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
      exportBtn.addEventListener('click', (e) => {
        e.preventDefault();
        window.print();
      });
    }
    
    // User dropdown functionality
    const userInfo = document.getElementById('userInfo');
    if (userInfo) {
      userInfo.addEventListener('click', (e) => {
        e.stopPropagation();
        const userDropdown = document.querySelector('.user-dropdown');
        if (userDropdown) {
          userDropdown.classList.toggle('active');
        }
      });
    }
    
    // Close user dropdown when clicking outside
    document.addEventListener('click', (e) => {
      const userDropdown = document.querySelector('.user-dropdown');
      if (userDropdown && !e.target.closest('#userInfo')) {
        userDropdown.classList.remove('active');
      }
    });
  }
  
  // Set up event listeners when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupEventListeners);
  } else {
    setupEventListeners();
  }
})();


// Bulb hint toggle
(function(){
  const hint = document.querySelector('.shortcut-hint');
  if(!hint) return;
  hint.addEventListener('click', ()=>{
    hint.classList.toggle('active');
  });
})();

