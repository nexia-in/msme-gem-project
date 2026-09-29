/* ==========================================================================
   Nexia Virtual Desk — MSME & GeM Registration Data Collection
   Application logic (vanilla JavaScript, no dependencies)
   ========================================================================== */
(function () {
  'use strict';

  /* ------------------------------------------------------------------
     Constants & element references
  ------------------------------------------------------------------ */
  var STORAGE_KEY = 'nexia_registration_form_v1';
  var WHATSAPP_NUMBER = '919961850698'; // +91 9961850698
  var SAVE_DEBOUNCE_MS = 400;

  var form = document.getElementById('registrationForm');
  var saveStatus = document.getElementById('saveStatus');
  var saveStatusText = document.getElementById('saveStatusText');
  var toastEl = document.getElementById('toast');

  var els = {
    aadhaar: document.getElementById('aadhaar'),
    nameAadhaar: document.getElementById('nameAadhaar'),
    pan: document.getElementById('pan'),
    namePan: document.getElementById('namePan'),
    dob: document.getElementById('dob'),
    enterprise: document.getElementById('enterprise'),
    orgType: document.getElementById('orgType'),
    mobile: document.getElementById('mobile'),
    email: document.getElementById('email'),
    socialCategory: document.getElementById('socialCategory'),
    gender: document.getElementById('gender'),
    bldg: document.getElementById('bldg'),
    street: document.getElementById('street'),
    town: document.getElementById('town'),
    pin: document.getElementById('pin'),
    district: document.getElementById('district'),
    state: document.getElementById('state'),
    commenceDate: document.getElementById('commenceDate'),
    majorActivity: document.getElementById('majorActivity'),
    natureOfWork: document.getElementById('natureOfWork'),
    investment: document.getElementById('investment'),
    turnover: document.getElementById('turnover'),
    maleEmp: document.getElementById('maleEmp'),
    femaleEmp: document.getElementById('femaleEmp'),
    totalEmp: document.getElementById('totalEmp'),
    bankName: document.getElementById('bankName'),
    accountNo: document.getElementById('accountNo'),
    ifsc: document.getElementById('ifsc'),
    gstin: document.getElementById('gstin'),
    gstinField: document.getElementById('gstinField'),
    declaration: document.getElementById('declaration')
  };

  // Named fields persisted in localStorage (text inputs, selects, dates, textarea)
  var PERSISTED_FIELDS = [
    'aadhaar', 'nameAadhaar', 'pan', 'namePan', 'dob',
    'enterprise', 'orgType', 'mobile', 'email', 'socialCategory', 'gender',
    'bldg', 'street', 'town', 'pin', 'district', 'state',
    'commenceDate', 'majorActivity', 'natureOfWork', 'investment', 'turnover',
    'maleEmp', 'femaleEmp', 'bankName', 'accountNo', 'ifsc', 'gstin'
  ];

  // Human-readable labels used for TXT files and WhatsApp messages
  var LABELS = {
    aadhaar: 'Aadhaar Number',
    nameAadhaar: 'Name as per Aadhaar',
    pan: 'PAN Card Number',
    namePan: 'Name as per PAN',
    dob: 'Date of Birth (PAN)',
    enterprise: 'Enterprise / Business Name',
    orgType: 'Type of Organization',
    mobile: 'Mobile Number (Aadhaar linked)',
    email: 'Email ID',
    socialCategory: 'Social Category',
    gender: 'Gender',
    speciallyAbled: 'Specially Abled',
    bldg: 'Building Name / Number',
    street: 'Street',
    town: 'Town',
    pin: 'PIN',
    district: 'District',
    state: 'State',
    commenceDate: 'Commencement of Business',
    majorActivity: 'Major Activity',
    natureOfWork: 'Nature of Work / Details',
    investment: 'Investment Amount (Rs)',
    turnover: 'Annual Turnover (Rs)',
    maleEmp: 'Male Employees',
    femaleEmp: 'Female Employees',
    totalEmp: 'Total Employees',
    bankName: 'Bank Name',
    accountNo: 'Account Number',
    ifsc: 'IFSC Code',
    gst: 'GSTIN Available',
    gstin: 'GSTIN Number',
    docs: 'Documents Selected',
    declaration: 'Declaration Accepted',
    service: 'Service Required'
  };

  /* ------------------------------------------------------------------
     Small helpers
  ------------------------------------------------------------------ */
  function $(id) { return document.getElementById(id); }

  function debounce(fn, wait) {
    var timer;
    return function () {
      var ctx = this, args = arguments;
      clearTimeout(timer);
      timer = setTimeout(function () { fn.apply(ctx, args); }, wait);
    };
  }

  function getRadioValue(name) {
    var radio = form.querySelector('input[name="' + name + '"]:checked');
    return radio ? radio.value : '';
  }

  function getSelectedDocs() {
    var boxes = form.querySelectorAll('input[name="docs"]:checked');
    var values = [];
    for (var i = 0; i < boxes.length; i++) values.push(boxes[i].value);
    return values;
  }

  function formatDateDDMMYYYY(date) {
    var d = String(date.getDate()).padStart(2, '0');
    var m = String(date.getMonth() + 1).padStart(2, '0');
    var y = date.getFullYear();
    return d + '-' + m + '-' + y;
  }

  function formatDateTimeIN(date) {
    var days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var day = String(date.getDate()).padStart(2, '0');
    var mon = String(date.getMonth() + 1).padStart(2, '0');
    var yr = date.getFullYear();
    var h = date.getHours();
    var min = String(date.getMinutes()).padStart(2, '0');
    var ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12; if (h === 0) h = 12;
    return day + '-' + mon + '-' + yr + ', ' + days[date.getDay()] + ' ' +
      h + ':' + min + ' ' + ampm;
  }

  /* ------------------------------------------------------------------
     State: collect / save / restore / clear (localStorage)
  ------------------------------------------------------------------ */
  function collectState() {
    var values = {};
    for (var i = 0; i < PERSISTED_FIELDS.length; i++) {
      var key = PERSISTED_FIELDS[i];
      values[key] = els[key] ? els[key].value : '';
    }
    return {
      service: getRadioValue('service'),
      speciallyAbled: getRadioValue('speciallyAbled'),
      gst: getRadioValue('gst'),
      docs: getSelectedDocs(),
      declaration: els.declaration.checked,
      values: values
    };
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(collectState()));
      setSaveStatus(true);
    } catch (e) {
      // Storage may be unavailable (private mode etc.) — fail silently.
    }
  }

  var saveStateDebounced = debounce(saveState, SAVE_DEBOUNCE_MS);

  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function clearSavedState() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) { /* ignore */ }
  }

  function restoreState(state) {
    if (!state) return;

    // Restore text/select/date/textarea values
    var values = state.values || {};
    for (var i = 0; i < PERSISTED_FIELDS.length; i++) {
      var key = PERSISTED_FIELDS[i];
      if (els[key] && typeof values[key] === 'string') {
        els[key].value = values[key];
      }
    }

    // Restore radio groups
    restoreRadio('service', state.service);
    restoreRadio('speciallyAbled', state.speciallyAbled);
    restoreRadio('gst', state.gst);

    // Restore document checkboxes
    if (Array.isArray(state.docs)) {
      var boxes = form.querySelectorAll('input[name="docs"]');
      for (var b = 0; b < boxes.length; b++) {
        boxes[b].checked = state.docs.indexOf(boxes[b].value) !== -1;
      }
    }

    // Restore declaration
    els.declaration.checked = !!state.declaration;
  }

  function restoreRadio(name, value) {
    if (!value) return;
    var radio = form.querySelector('input[name="' + name + '"][value="' + value + '"]');
    if (radio) radio.checked = true;
  }

  /* ------------------------------------------------------------------
     UI updates
  ------------------------------------------------------------------ */
  function setSaveStatus(saved) {
    if (saved) {
      saveStatus.classList.add('saved');
      saveStatusText.textContent = '✓ Saved in this browser';
      $('saveIconReady').hidden = true;
      $('saveIconSaved').hidden = false;
    } else {
      saveStatus.classList.remove('saved');
      saveStatusText.textContent = 'Ready to collect details';
      $('saveIconReady').hidden = false;
      $('saveIconSaved').hidden = true;
    }
  }

  var toastTimer;
  function showToast(message) {
    toastEl.textContent = message;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.classList.remove('show');
    }, 2600);
  }

  function updateServiceCards() {
    var cards = form.querySelectorAll('.service-card');
    for (var i = 0; i < cards.length; i++) {
      var input = cards[i].querySelector('input[type="radio"]');
      cards[i].classList.toggle('selected', input.checked);
    }
  }

  function updateRadioPills() {
    var groups = ['speciallyAbled', 'gst'];
    groups.forEach(function (name) {
      var pills = form.querySelectorAll('.radio-pill input[name="' + name + '"]');
      for (var i = 0; i < pills.length; i++) {
        pills[i].closest('.radio-pill').classList.toggle('selected', pills[i].checked);
      }
    });
  }

  function updateDocItems() {
    var items = form.querySelectorAll('.check-item');
    for (var i = 0; i < items.length; i++) {
      var input = items[i].querySelector('input[type="checkbox"]');
      if (input) items[i].classList.toggle('checked', input.checked);
    }
  }

  function updateGstConditional() {
    var hasGst = getRadioValue('gst') === 'yes';
    els.gstinField.classList.toggle('open', hasGst);
    if (!hasGst) {
      els.gstin.value = '';
      clearFieldError('gstin');
    }
  }

  function updateEmployeeTotal() {
    var male = parseInt(els.maleEmp.value, 10);
    var female = parseInt(els.femaleEmp.value, 10);
    if (isNaN(male) || male < 0) male = 0;
    if (isNaN(female) || female < 0) female = 0;
    els.totalEmp.value = String(male + female);
  }

  /* ------------------------------------------------------------------
     Inline field errors
  ------------------------------------------------------------------ */
  function setFieldError(inputId, message) {
    var input = $(inputId);
    var errorEl = $('err-' + inputId);
    if (!input || !errorEl) return;
    if (message) {
      errorEl.textContent = message;
      errorEl.classList.add('show');
      input.classList.add('invalid');
      input.setAttribute('aria-invalid', 'true');
      input.setAttribute('aria-describedby', 'err-' + inputId);
    } else {
      clearFieldError(inputId);
    }
  }

  function clearFieldError(inputId) {
    var input = $(inputId);
    var errorEl = $('err-' + inputId);
    if (!input || !errorEl) return;
    errorEl.textContent = '';
    errorEl.classList.remove('show');
    input.classList.remove('invalid');
    input.removeAttribute('aria-invalid');
  }

  function clearAllErrors() {
    var errors = form.querySelectorAll('.field-error.show');
    for (var i = 0; i < errors.length; i++) {
      errors[i].classList.remove('show');
      errors[i].textContent = '';
    }
    var invalid = form.querySelectorAll('.invalid');
    for (var j = 0; j < invalid.length; j++) {
      invalid[j].classList.remove('invalid');
      invalid[j].removeAttribute('aria-invalid');
    }
  }

  /* ------------------------------------------------------------------
     Input formatting & constraints
  ------------------------------------------------------------------ */
  function digitsOnly(value) {
    return value.replace(/\D/g, '');
  }

  /**
   * PAN mask: 5 letters + 4 digits + 1 letter (e.g. ABCDE1234F).
   * Keeps the character the user typed only if it is valid for that position,
   * so digits are accepted in slots 6–9 and rejected elsewhere.
   */
  function formatPan(value) {
    var clean = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    var out = '';
    for (var i = 0; i < clean.length && out.length < 10; i++) {
      var ch = clean[i];
      var pos = out.length;
      if (pos < 5) {
        if (/[A-Z]/.test(ch)) out += ch;      // slots 1–5: letters
      } else if (pos < 9) {
        if (/[0-9]/.test(ch)) out += ch;      // slots 6–9: digits
      } else if (/[A-Z]/.test(ch)) {
        out += ch;                            // slot 10: letter
      }
    }
    return out;
  }

  // Brief shake so the user notices a rejected keystroke instead of wondering
  function rejectFeedback(el) {
    el.classList.remove('shake');
    void el.offsetWidth; // restart the animation
    el.classList.add('shake');
    setTimeout(function () { el.classList.remove('shake'); }, 380);
  }

  function handleInputFormatting(e) {
    var el = e.target;
    var id = el.id;

    switch (id) {
      case 'aadhaar':
        el.value = digitsOnly(el.value).slice(0, 12);
        break;
      case 'pan': {
        var cleaned = el.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        var masked = formatPan(el.value);
        if (masked.length < cleaned.length) rejectFeedback(el);
        el.value = masked;
        break;
      }
      case 'mobile':
        el.value = digitsOnly(el.value).slice(0, 10);
        break;
      case 'pin':
        el.value = digitsOnly(el.value).slice(0, 6);
        break;
      case 'investment':
      case 'turnover':
        el.value = digitsOnly(el.value).slice(0, 12);
        break;
      case 'maleEmp':
      case 'femaleEmp':
        el.value = digitsOnly(el.value).slice(0, 6);
        updateEmployeeTotal();
        break;
      case 'ifsc':
        el.value = el.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11);
        break;
      case 'gstin':
        el.value = el.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15);
        break;
      default:
        break;
    }
  }

  /* ------------------------------------------------------------------
     Validation
  ------------------------------------------------------------------ */
  var PATTERNS = {
    aadhaar: /^\d{12}$/,
    pan: /^[A-Z]{5}[0-9]{4}[A-Z]$/,
    mobile: /^[6-9]\d{9}$/,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
    pin: /^\d{6}$/,
    gstin: /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/
  };

  var PATTERN_MESSAGES = {
    aadhaar: 'Please enter a valid 12-digit Aadhaar number.',
    pan: 'Please enter a valid PAN (e.g. ABCDE1234F).',
    mobile: 'Please enter a valid 10-digit Indian mobile number.',
    email: 'Please enter a valid email address.',
    pin: 'Please enter a valid 6-digit PIN code.',
    gstin: 'Please enter a valid 15-character GSTIN.'
  };

  function validateField(id) {
    var value = els[id] ? els[id].value.trim() : '';

    if (value === '') return ''; // optional when empty

    if (PATTERNS[id]) {
      if (!PATTERNS[id].test(value)) return PATTERN_MESSAGES[id];
    }
    return '';
  }

  /**
   * Runs full validation.
   * @param {boolean} forWhatsApp - when true, also validates documents + declaration
   * @returns {Array<{id: string, message: string}>}
   */
  function validateAll(forWhatsApp) {
    var errors = [];
    var i;

    // Required: service selection
    if (!getRadioValue('service')) {
      errors.push({ id: 'svc-msme', errorId: 'err-service', message: 'Please select the registration you need.' });
    }

    // Required: name as per Aadhaar
    if (els.nameAadhaar.value.trim() === '') {
      errors.push({ id: 'nameAadhaar', message: 'Name as per Aadhaar is required.' });
    }

    // Required: enterprise name
    if (els.enterprise.value.trim() === '') {
      errors.push({ id: 'enterprise', message: 'Enterprise / Business name is required.' });
    }

    // Pattern validations (when value provided)
    var patternFields = ['aadhaar', 'pan', 'mobile', 'email', 'pin', 'gstin'];
    for (i = 0; i < patternFields.length; i++) {
      var id = patternFields[i];
      // GSTIN only applies when "Yes" selected
      if (id === 'gstin' && getRadioValue('gst') !== 'yes') continue;
      var msg = validateField(id);
      if (msg) errors.push({ id: id, message: msg });
    }

    // GST answer itself is required
    if (!getRadioValue('gst')) {
      errors.push({ id: 'gstinField', errorId: 'err-gst', message: 'Please answer the GSTIN question.' });
    }

    // WhatsApp-only requirements
    if (forWhatsApp) {
      if (getSelectedDocs().length === 0) {
        errors.push({ id: 'docAadhaar', message: 'Please select at least one document to send.' });
      }
      if (!els.declaration.checked) {
        errors.push({ id: 'declaration', message: 'Please accept the declaration to proceed.' });
      }
    }

    return errors;
  }

  function displayErrors(errors) {
    clearAllErrors();
    for (var i = 0; i < errors.length; i++) {
      var error = errors[i];
      var input = $(error.id);
      var errorEl = error.errorId ? $(error.errorId) : $('err-' + error.id);
      if (errorEl) {
        errorEl.textContent = error.message;
        errorEl.classList.add('show');
      }
      if (input && input.classList) {
        input.classList.add('invalid');
        input.setAttribute('aria-invalid', 'true');
      }
    }
  }

  function scrollToFirstError(errors) {
    if (!errors.length) return;
    var target = $(errors[0].id) || $(errors[0].errorId);
    if (!target) return;
    // Focus the first invalid control, then smoothly scroll it into view
    if (typeof target.focus === 'function' && !target.readOnly) {
      target.focus({ preventScroll: true });
    }
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  /* ------------------------------------------------------------------
     Data builders (TXT download + WhatsApp message)
  ------------------------------------------------------------------ */
  function getValue(id) {
    return els[id] ? els[id].value.trim() : '';
  }

  function buildRows() {
    var rows = [];
    rows.push(['Service Required', getRadioValue('service') || '—']);
    rows.push(['Name as per Aadhaar', getValue('nameAadhaar')]);
    rows.push(['Aadhaar Number', getValue('aadhaar')]);
    rows.push(['PAN Card Number', getValue('pan')]);
    rows.push(['Name as per PAN', getValue('namePan')]);
    rows.push(['Date of Birth (PAN)', getValue('dob')]);
    rows.push(['Enterprise / Business Name', getValue('enterprise')]);
    rows.push(['Type of Organization', getValue('orgType')]);
    rows.push(['Mobile Number', getValue('mobile')]);
    rows.push(['Email ID', getValue('email')]);
    rows.push(['Social Category', getValue('socialCategory')]);
    rows.push(['Gender', getValue('gender')]);
    rows.push(['Specially Abled', getRadioValue('speciallyAbled')]);
    rows.push(['Building Name / Number', getValue('bldg')]);
    rows.push(['Street', getValue('street')]);
    rows.push(['Town', getValue('town')]);
    rows.push(['PIN', getValue('pin')]);
    rows.push(['District', getValue('district')]);
    rows.push(['State', getValue('state')]);
    rows.push(['Date of Commencement', getValue('commenceDate')]);
    rows.push(['Major Activity', getValue('majorActivity')]);
    rows.push(['Nature of Work', getValue('natureOfWork')]);
    rows.push(['Investment Amount (Rs)', getValue('investment')]);
    rows.push(['Annual Turnover (Rs)', getValue('turnover')]);
    rows.push(['Male Employees', getValue('maleEmp')]);
    rows.push(['Female Employees', getValue('femaleEmp')]);
    rows.push(['Total Employees', getValue('totalEmp')]);
    rows.push(['Bank Name', getValue('bankName')]);
    rows.push(['Account Number', getValue('accountNo')]);
    rows.push(['IFSC Code', getValue('ifsc')]);
    rows.push(['GSTIN Available', getRadioValue('gst') ? getRadioValue('gst').toUpperCase() : '']);
    rows.push(['GSTIN Number', getRadioValue('gst') === 'yes' ? getValue('gstin') : '']);
    var docs = getSelectedDocs();
    rows.push(['Documents Selected', docs.length ? docs.join(', ') : '']);
    rows.push(['Declaration Accepted', els.declaration.checked ? 'Yes' : 'No']);
    return rows;
  }

  function sanitizeFileName(name) {
    var clean = (name || '')
      .replace(/[\\/:*?"<>|]/g, '')      // illegal filesystem characters
      .replace(/\s+/g, '_')               // whitespace → underscore
      .replace(/_+/g, '_')                // collapse repeats
      .replace(/^_+|_+$/g, '')            // trim edges
      .slice(0, 40);
    return clean || 'Customer';
  }

  function serviceFilePrefix(service) {
    if (service === 'MSME Registration') return 'MSME';
    if (service === 'GeM Registration') return 'GeM';
    return 'MSME_GeM';
  }

  function buildTextFile() {
    var now = new Date();
    var rows = buildRows();
    var lines = [];

    lines.push('NEXIA VIRTUAL DESK');
    lines.push('MSME & GeM REGISTRATION DETAILS');
    lines.push('==================================================');
    lines.push('Date & Time of Collection : ' + formatDateTimeIN(now));
    lines.push('==================================================');
    lines.push('');

    var currentSection = '';
    for (var i = 0; i < rows.length; i++) {
      var label = rows[i][0];
      var value = rows[i][1];
    // Skip optional rows left empty (Service Required always shown)
    if (value === '' && label !== 'Service Required') continue;

      // Section grouping based on label ranges
      var section = sectionForLabel(label);
      if (section && section !== currentSection) {
        currentSection = section;
        lines.push('');
        lines.push(section);
        lines.push('--------------------------------------------------');
      }
      lines.push('  ' + pad(label) + ' : ' + value);
    }

    lines.push('');
    lines.push('==================================================');
    lines.push('End of details — generated via Nexia Virtual Desk');
    lines.push('==================================================');
    return lines.join('\n');
  }

  function sectionForLabel(label) {
    var personal = ['Name as per Aadhaar', 'Aadhaar Number', 'PAN Card Number', 'Name as per PAN', 'Date of Birth (PAN)'];
    var business = ['Enterprise / Business Name', 'Type of Organization', 'Mobile Number', 'Email ID', 'Social Category', 'Gender', 'Specially Abled'];
    var address = ['Building Name / Number', 'Street', 'Town', 'PIN', 'District', 'State'];
    var bizInfo = ['Date of Commencement', 'Major Activity', 'Nature of Work', 'Investment Amount (Rs)', 'Annual Turnover (Rs)'];
    var employees = ['Male Employees', 'Female Employees', 'Total Employees'];
    var bank = ['Bank Name', 'Account Number', 'IFSC Code'];
    var gst = ['GSTIN Available', 'GSTIN Number'];
    var docs = ['Documents Selected', 'Declaration Accepted'];

    if (label === 'Service Required') return 'SERVICE REQUIRED';
    if (personal.indexOf(label) !== -1) return 'PERSONAL & IDENTITY DETAILS';
    if (business.indexOf(label) !== -1) return 'BUSINESS DETAILS';
    if (address.indexOf(label) !== -1) return 'OFFICIAL ADDRESS';
    if (bizInfo.indexOf(label) !== -1) return 'BUSINESS INFORMATION';
    if (employees.indexOf(label) !== -1) return 'EMPLOYEE DETAILS';
    if (bank.indexOf(label) !== -1) return 'BANK DETAILS';
    if (gst.indexOf(label) !== -1) return 'GST DETAILS';
    if (docs.indexOf(label) !== -1) return 'DOCUMENTS & DECLARATION';
    return '';
  }

  function pad(str) {
    var s = String(str);
    while (s.length < 27) s += ' ';
    return s;
  }

  function downloadTextFile() {
    var errors = validateAll(false);
    if (errors.length) {
      displayErrors(errors);
      scrollToFirstError(errors);
      showToast('Please fix the highlighted fields.');
      return;
    }

    var content = buildTextFile();
    var now = new Date();
    var nameSource = getValue('nameAadhaar') || getValue('namePan') || getValue('enterprise') || 'Customer';
    var safeName = sanitizeFileName(nameSource);
    var prefix = serviceFilePrefix(getRadioValue('service'));
    var fileName = prefix + '_' + safeName + '_' + formatDateDDMMYYYY(now) + '.txt';

    var blob = new Blob(['\uFEFF' + content], { type: 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);

    showToast('Details downloaded: ' + fileName);
  }

  function buildWhatsAppMessage() {
    var now = new Date();
    var rows = buildRows();
    var lines = [];

    lines.push('NEXIA VIRTUAL DESK');
    lines.push('MSME & GeM REGISTRATION DATA');
    lines.push('');
    lines.push('Date: ' + formatDateTimeIN(now));
    lines.push('');

    var currentSection = '';
    for (var i = 0; i < rows.length; i++) {
      var label = rows[i][0];
      var value = rows[i][1];
      if (value === '') continue; // omit empty values in WhatsApp message

      var section = sectionForLabel(label);
      if (section && section !== currentSection) {
        currentSection = section;
        lines.push(section);
      }
      lines.push(label + ': ' + value);
    }

    lines.push('');
    lines.push('DECLARATION: ' + (els.declaration.checked ? 'Accepted' : 'Not Accepted'));
    lines.push('');
    lines.push('Submitted through:');
    lines.push('Nexia Virtual Desk');
    lines.push('Your online application supporting team');

    return lines.join('\n');
  }

  function sendViaWhatsApp() {
    var errors = validateAll(true);
    if (errors.length) {
      displayErrors(errors);
      scrollToFirstError(errors);
      showToast('Please fix the highlighted fields.');
      return;
    }

    var message = buildWhatsAppMessage();
    var url = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(message);
    window.open(url, '_blank', 'noopener');
  }

  /* ------------------------------------------------------------------
     Reset form (custom modal)
  ------------------------------------------------------------------ */
  var modal = $('resetModal');
  var modalCard = modal ? modal.querySelector('.modal-card') : null;
  var lastFocused = null;

  function openResetModal() {
    if (!modal) return;
    lastFocused = document.activeElement;
    modal.hidden = false;
    // Force reflow so the transition runs
    void modal.offsetWidth;
    modal.classList.add('open');
    var cancelBtn = $('modalCancel');
    if (cancelBtn) cancelBtn.focus();
  }

  function closeResetModal() {
    if (!modal) return;
    modal.classList.remove('open');
    setTimeout(function () {
      modal.hidden = true;
      if (lastFocused && lastFocused.focus) lastFocused.focus();
    }, 220);
  }

  function confirmReset() {
    form.reset();               // restores defaults (state → Kerala, radios cleared, etc.)
    clearAllErrors();
    updateServiceCards();
    updateRadioPills();
    updateDocItems();
    updateGstConditional();
    updateEmployeeTotal();
    els.state.value = 'Kerala'; // explicit safety for default
    clearSavedState();
    setSaveStatus(false);
    closeResetModal();
    showToast('Form has been reset.');
    // Move focus back to top of the form for convenience
    var firstService = $('svc-msme');
    if (firstService) firstService.focus();
  }

  /* ------------------------------------------------------------------
     Event wiring
  ------------------------------------------------------------------ */
  function initEvents() {
    // Live input formatting + auto-save
    form.addEventListener('input', function (e) {
      handleInputFormatting(e);
      saveStateDebounced();
    });

    // Radios / checkboxes / selects: update UI + save
    form.addEventListener('change', function (e) {
      var id = e.target.id;
      if (e.target.name === 'service') updateServiceCards();
      if (e.target.name === 'speciallyAbled' || e.target.name === 'gst') updateRadioPills();
      if (e.target.name === 'gst') updateGstConditional();
      if (e.target.name === 'docs') updateDocItems();
      if (id === 'declaration') updateDocItems();
      if (id === 'maleEmp' || id === 'femaleEmp') updateEmployeeTotal();
      saveStateDebounced();
    });

    // Validate a field when the user leaves it
    var validatedOnBlur = ['aadhaar', 'pan', 'mobile', 'email', 'pin', 'gstin'];
    form.addEventListener('focusout', function (e) {
      var id = e.target.id;
      if (validatedOnBlur.indexOf(id) !== -1) {
        if (id === 'gstin' && getRadioValue('gst') !== 'yes') return;
        var msg = validateField(id);
        setFieldError(id, msg);
      }
      // Required text fields
      if (id === 'nameAadhaar' || id === 'enterprise') {
        setFieldError(id, e.target.value.trim() === '' ? LABELS[id] + ' is required.' : '');
      }
    });

    // Action buttons
    $('btnDownload').addEventListener('click', downloadTextFile);
    $('btnWhatsApp').addEventListener('click', sendViaWhatsApp);
    $('btnReset').addEventListener('click', openResetModal);

    // Modal buttons
    $('modalCancel').addEventListener('click', closeResetModal);
    $('modalConfirm').addEventListener('click', confirmReset);

    // Close modal on overlay click / Escape
    modal.addEventListener('click', function (e) {
      if (e.target === modal) closeResetModal();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !modal.hidden) closeResetModal();
    });
  }

  /* ------------------------------------------------------------------
     Initialization
  ------------------------------------------------------------------ */
  function init() {
    var state = loadState();
    if (state) {
      restoreState(state);
      setSaveStatus(true); // restored from browser storage
    }

    // Ensure UI reflects restored state
    updateServiceCards();
    updateRadioPills();
    updateDocItems();
    updateGstConditional();
    updateEmployeeTotal();

    initEvents();
  }

  // Boot when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
