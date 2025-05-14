// public/js/meal-edit.js
document.addEventListener('DOMContentLoaded', () => {

  const dp = document.getElementById('date-picker');
  if (dp) {
    dp.addEventListener('change', e => {
      window.location.href = `/meals?date=${encodeURIComponent(e.target.value)}`;
    });
  }

  const loggedTbody = document.querySelector('#meals-list tbody');
  if (loggedTbody) {
    loggedTbody.addEventListener('click', async e => {
      const btn = e.target.closest('button.btn-toggle');
      if (!btn) return;

      const row    = btn.closest('tr[data-id]');
      const inputs = Array.from(row.querySelectorAll('input.meal-input'));

      // ENTER EDIT
      if (btn.textContent === 'Edit') {
        inputs.forEach((i, idx) => {
          i.readOnly = false;
          if (idx === 0) i.focus();
        });
        btn.textContent = 'Save';
        return;
      }

      // SAVE
      const payload = {};
      inputs.forEach(i => payload[i.dataset.field] = i.value);

      try {
        const res  = await fetch(`/meals/${row.dataset.id}`, {
          method:  'PUT',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(payload)
        });
        const body = await res.json();
        if (!body.success) throw new Error(body.error || 'Update failed');

        inputs.forEach(i => {
          i.defaultValue = i.value;
          i.readOnly     = true;
        });
        btn.textContent = 'Edit';

        const footerRow = document.querySelector('#meals-list tfoot tr');
        if (footerRow) {
          const sums = { calories:0, protein:0, carbs:0, fat:0 };
          loggedTbody.querySelectorAll('tr[data-id]').forEach(r => {
            sums.calories += +r.querySelector('input[data-field="calories"]').value || 0;
            sums.protein  += +r.querySelector('input[data-field="protein"]').value  || 0;
            sums.carbs    += +r.querySelector('input[data-field="carbs"]').value    || 0;
            sums.fat      += +r.querySelector('input[data-field="fat"]').value      || 0;
          });
          footerRow.cells[1].textContent = sums.calories;
          footerRow.cells[2].textContent = sums.protein;
          footerRow.cells[3].textContent = sums.carbs;
          footerRow.cells[4].textContent = sums.fat;
        }

      } catch (err) {
        alert(`Save failed: ${err.message}`);
      }
    });
  }

  const savedTbody = document.querySelector('#saved-meals-list');
if (savedTbody) {
  savedTbody.addEventListener('click', async e => {
    const btn = e.target.closest('button.btn-toggle-saved');
    if (!btn) return;

    const row    = btn.closest('tr[data-id]');
    const inputs = Array.from(row.querySelectorAll('input.saved-input'));

    // ENTER EDIT
    if (btn.textContent === 'Edit') {
      inputs.forEach((i, idx) => {
        i.readOnly = false;
        if (idx === 0) i.focus();
      });
      btn.textContent = 'Save';
      return;
    }

    // SAVE
    if (btn.textContent === 'Save') {
      const payload = {};
      inputs.forEach(i => payload[i.dataset.field] = i.value);

      try {
        const res  = await fetch(`/meals/saved/${row.dataset.id}`, {
          method:  'PUT',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(payload)
        });
        const body = await res.json();
        if (!body.success) throw new Error(body.error || 'Update failed');

        inputs.forEach(i => {
          i.defaultValue = i.value;
          i.readOnly     = true;
        });
        btn.textContent = 'Edit';
      } catch (err) {
        alert(`Save failed: ${err.message}`);
      }
    }
  });
}

  const saveErrorEl = document.getElementById('save-error');
  if (saveErrorEl) {
    document.addEventListener('click', e => {
      if (e.target.tagName === 'BUTTON') {
        saveErrorEl.remove();
      }
    });
  }
});
