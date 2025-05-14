document.addEventListener('DOMContentLoaded', () => {
  const datePicker = document.getElementById('date-picker');
  if (datePicker) {
    datePicker.addEventListener('change', e => {
      window.location.href = `/meals?date=${e.target.value}`;
    });
  }
  
  const loggedTbody = document.querySelector('.meals-table tbody');
  const loggedTfoot = document.querySelector('.meals-table tfoot tr');
  const savedTbody  = document.querySelector('#saved-meals-list');

  // helper to recompute & render totals (for logged meals)
  function refreshTotals() {
    const sums = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    loggedTbody.querySelectorAll('tr[data-id]').forEach(row => {
      sums.calories += Number(row.querySelector('input[data-field="calories"]').value) || 0;
      sums.protein  += Number(row.querySelector('input[data-field="protein"]').value)  || 0;
      sums.carbs    += Number(row.querySelector('input[data-field="carbs"]').value)    || 0;
      sums.fat      += Number(row.querySelector('input[data-field="fat"]').value)      || 0;
    });
    loggedTfoot.cells[1].textContent = sums.calories;
    loggedTfoot.cells[2].textContent = sums.protein;
    loggedTfoot.cells[3].textContent = sums.carbs;
    loggedTfoot.cells[4].textContent = sums.fat;
  }

  // generic inline‑edit handler factory
  function attachInlineEdit(tbody, basePath, btnEditClass, btnSaveClass, recalc) {
    tbody.addEventListener('click', async e => {
      const tr      = e.target.closest('tr[data-id]');
      if (!tr) return;
      const id      = tr.dataset.id;
      const btnEdit = tr.querySelector(`.${btnEditClass}`);
      const btnSave = tr.querySelector(`.${btnSaveClass}`);
      const inputs  = Array.from(tr.querySelectorAll('.meal-input'));

      const hasChanges = () => inputs.some(i => i.value !== i.defaultValue);

      // ENTER EDIT
      if (e.target === btnEdit) {
        tr.classList.add('editing');
        btnEdit.style.display = 'none';
        btnSave.style.display = '';     // unhide
        btnSave.disabled     = true;
        inputs.forEach((input, idx) => {
          input.readOnly = false;
          if (idx === 0) input.focus();
          input.addEventListener('input', () => {
            btnSave.disabled = !hasChanges();
          });
        });
      }

      // SAVE EDIT
      if (e.target === btnSave) {
        if (btnSave.disabled || !tr.classList.contains('editing')) return;
        const payload = {};
        inputs.forEach(input => {
          payload[input.dataset.field] = input.value;
        });
        try {
          const res = await fetch(`${basePath}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type':'application/json' },
            body: JSON.stringify(payload)
          });
          const json = await res.json();
          if (!json.success) throw new Error(json.error || 'Update failed');

          // lock inputs and clear state
          inputs.forEach(input => {
            input.defaultValue = input.value;
            input.readOnly     = true;
          });
          tr.classList.remove('editing');
          btnSave.style.display = 'none'; // hide again
          btnEdit.style.display = '';     // show Edit
          if (recalc) refreshTotals();
        } catch (err) {
          alert(err.message);
        }
      }
    });
  }

  // wire up logged meals (recalc totals after save)
  attachInlineEdit(loggedTbody, '/meals', 'btn-edit', 'btn-save', true);

  // wire up saved templates (no totals recalculation)
  attachInlineEdit(savedTbody, '/meals/saved', 'btn-edit-saved', 'btn-save-saved', false);

  // initialize totals on page load
  refreshTotals();
});
