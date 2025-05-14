const calendarEl = document.getElementById('calendar');
const monthSelect = document.getElementById('month');
const yearSelect = document.getElementById('year');
const viewSelect = document.getElementById('calendarView');

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

function getFormattedDate(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function renderDayCell(year, month, day) {
  const cell = document.createElement('div');
  const dayNum = document.createElement('div');
  dayNum.className = 'day-number';
  dayNum.textContent = day;
  cell.appendChild(dayNum);

  const formattedDate = getFormattedDate(year, month, day);

  // Add workout groups
  if (workoutMap && workoutMap[formattedDate]) {
    const list = document.createElement('ul');
    list.className = 'workout-list';
    for (const group of workoutMap[formattedDate]) {
      const li = document.createElement('li');
      li.textContent = group;
      list.appendChild(li);
    }
    cell.appendChild(list);
  }

  const addBtn = document.createElement('button');
  addBtn.className = 'add-workout-btn';
  addBtn.textContent = '➕ Add Workout';
  addBtn.onclick = () => {
    window.location.href = `/calendar/selectWorkout?date=${formattedDate}`;
  };
  cell.appendChild(addBtn);
  return cell;
}

function generateMonthView(year, month) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let i = 0; i < firstDay; i++) {
    calendarEl.appendChild(document.createElement('div')); // Empty cell
  }

  for (let day = 1; day <= daysInMonth; day++) {
    calendarEl.appendChild(renderDayCell(year, month, day));
  }
}

function generateWeekView(year, month, baseDay) {
  const baseDate = new Date(year, month, baseDay);
  const baseWeekDay = baseDate.getDay(); // 0 (Sun) - 6 (Sat)
  const start = new Date(baseDate);
  start.setDate(baseDay - baseWeekDay); // Sunday

  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    calendarEl.appendChild(renderDayCell(d.getFullYear(), d.getMonth(), d.getDate()));
  }
}

function generateDayView(year, month, baseDay) {
  calendarEl.appendChild(renderDayCell(year, month, baseDay));
}

function generateCalendar() {
  calendarEl.innerHTML = ''; // Clear previous
  const year = parseInt(yearSelect.value);
  const month = parseInt(monthSelect.value);
  const viewType = viewSelect.value;

  if (viewType === 'month') {
    generateMonthView(year, month);
  } else if (viewType === 'week') {
    generateWeekView(year, month, today.getDate());
  } else if (viewType === 'day') {
    generateDayView(year, month, today.getDate());
  }
}

// Event listeners
monthSelect.addEventListener('change', generateCalendar);
yearSelect.addEventListener('change', generateCalendar);
viewSelect.addEventListener('change', generateCalendar);
window.addEventListener('DOMContentLoaded', generateCalendar);

