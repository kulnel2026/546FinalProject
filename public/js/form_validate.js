export function validateAlphabet(str) {
    if (typeof str !== 'string') return false;
    let idx = 0;
    if (str.length === 0) return true;
    do {
      const code = str.charCodeAt(idx);
      if (code < 65 || (code > 90 && code < 97) || code > 122) {
        return false;
      }
      idx++;
    } while (idx < str.length);
    return true;
}

export function validatePasswordComplexity(pw) {
    if (typeof pw !== 'string' || pw.includes(' ') || pw.length < 8) {
      return false;
    }
    let hasUpper = false;
    let hasDigit = false;
    let hasSpecial = false;
    let i = 0;
    do {
      const code = pw.charCodeAt(i);
      if (code >= 65 && code <= 90) hasUpper = true;
      else if (code >= 48 && code <= 57) hasDigit = true;
      else hasSpecial = true;
      i++;
    } while (i < pw.length);
    return hasUpper && hasDigit && hasSpecial;
}

export function showErrors(form, errors) {
    let errorList = form.querySelector('.error-list');
    if (!errorList) {
      errorList = document.createElement('ul');
      errorList.className = 'error-list';
      form.prepend(errorList);
    }
    errorList.innerHTML = '';
    errors.forEach(msg => {
      const li = document.createElement('li');
      li.textContent = msg;
      errorList.appendChild(li);
    });
}

export const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', function(e) {
      try {
        const fn = this.elements['firstName'].value.trim();
        if (!fn || fn.length < 2 || fn.length > 20 || !validateAlphabet(fn)) {
          throw new Error('First name must be 2–20 letters only.');
        }
        const ln = this.elements['lastName'].value.trim();
        if (!ln || ln.length < 2 || ln.length > 20 || !validateAlphabet(ln)) {
          throw new Error('Last name must be 2–20 letters only.');
        }
        const uid = this.elements['userId'].value.trim();
        if (!uid || uid.length < 5 || uid.length > 10) {
          throw new Error('User ID must be 5–10 alphanumeric characters.');
        }
        let idx = 0;
        do {
          const code = uid.charCodeAt(idx);
          const valid = (code >= 48 && code <= 57) || (code >= 65 && code <= 90) || (code >= 97 && code <= 122);
          if (!valid) {
            throw new Error('User ID must contain only letters and numbers.');
          }
          idx++;
        } while (idx < uid.length);
        const pw = this.elements['password'].value;
        if (!pw || pw.includes(' ') || pw.length < 8) {
          throw new Error('Password must be at least 8 chars and no spaces.');
        }
        let hasU=false;
        let hasD=false;
        let hasS=false;
        idx = 0;
        do {
          const code = pw.charCodeAt(idx);
          if (code >= 65 && code <= 90) hasU = true;
          else if (code >= 48 && code <= 57) hasD = true;
          else hasS = true;
          idx++;
        } while (idx < pw.length);
        if (!hasU || !hasD || !hasS) {
          throw new Error('Password must include uppercase, number, and special.');
        }
        const cpw = this.elements['confirmPassword'].value;
        if (pw !== cpw) {
          throw new Error('Password and confirmation do not match.');
        }
        const fq = this.elements['favoriteQuote'].value.trim();
        if (!fq || fq.length < 20 || fq.length > 255) {
          throw new Error('Favorite quote must be 20–255 characters.');
        }
        const bg = this.elements['backgroundColor'].value;
        const fg = this.elements['fontColor'].value;
        if (!validateHexColor(bg) || !validateHexColor(fg)) {
          throw new Error('Colors must be valid hex codes.');
        }
        if (bg.toLowerCase() === fg.toLowerCase()) {
          throw new Error('Background and font colors cannot match.');
        }
        const role = this.elements['role'].value;
        if (!['user'].includes(role.toLowerCase())) {
          throw new Error('Role must be user.');
        }
      } catch (err) {
        e.preventDefault();
        showErrors(this, [err.message]);
      }
    });
  }

  export const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', function(e) {
    try {
      const uid = this.elements['userId'].value.trim();
      if (!uid || uid.length < 5 || uid.length > 10) {
        throw new Error('User ID must be 5–10 alphanumeric characters.');
      }
      let i = 0;
      do {
        const code = uid.charCodeAt(i);
        const valid = (code >= 48 && code <= 57) || (code >= 65 && code <= 90) || (code >= 97 && code <= 122);
        if (!valid) throw new Error('User ID must contain only letters and numbers.');
        i++;
      } while (i < uid.length);
      const pw = this.elements['password'].value;
      if (!validatePasswordComplexity(pw)) {
        throw new Error('Password must be ≥8 chars, include uppercase, number, and special.');
      }
      // all client-side checks passed; form will submit
    } catch (err) {
      e.preventDefault();
      showErrors(this, [err.message]);
    }
  });
}