const calendarEl = document.getElementById('calendar');
const monthSelect = document.getElementById('month');
const yearSelect = document.getElementById('year');

// Populate month and year dropdowns
const today = new Date();
const currentMonth = today.getMonth();
const currentYear = today.getFullYear();

for (let m = 0; m < 12; m++) {
  const option = document.createElement('option');
  option.value = m;
  option.text = new Date(0, m).toLocaleString('default', { month: 'long' });
  if (m === currentMonth) option.selected = true;
  monthSelect.appendChild(option);
}

for (let y = currentYear - 5; y <= currentYear + 5; y++) {
  const option = document.createElement('option');
  option.value = y;
  option.text = y;
  if (y === currentYear) option.selected = true;
  yearSelect.appendChild(option);
}

// Generate a basic calendar
function generateCalendar() {
  calendarEl.innerHTML = ''; // Clear previous calendar

  const year = parseInt(yearSelect.value);
  const month = parseInt(monthSelect.value);
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Add empty cells for days before the 1st
  for (let i = 0; i < firstDay; i++) {
    const cell = document.createElement('div');
    calendarEl.appendChild(cell);
  }

  // Add actual day cells
  for (let day = 1; day <= daysInMonth; day++) {
    const cell = document.createElement('div');
    const dayNum = document.createElement('div');
    dayNum.className = 'day-number';
    dayNum.textContent = day;
    cell.appendChild(dayNum);
    calendarEl.appendChild(cell);
  }
}

// Rerender calendar when dropdowns change
monthSelect.addEventListener('change', generateCalendar);
yearSelect.addEventListener('change', generateCalendar);
window.addEventListener('DOMContentLoaded', generateCalendar);
