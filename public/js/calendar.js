const calendarEl   = document.getElementById('calendar');
const monthSelect  = document.getElementById('month');
const yearSelect   = document.getElementById('year');
const viewSelect   = document.getElementById('calendarView');

const today        = new Date();
const currentMonth = today.getMonth();
const currentYear  = today.getFullYear();


function sanitizeComment(inputComment) {
  return filterXSS(inputComment);
}

// Populate month selector
for (let m = 0; m < 12; m++) {
  const opt = document.createElement('option');
  opt.value = m;
  opt.text  = new Date(0, m).toLocaleString('default', { month: 'long' });
  if (m === currentMonth) opt.selected = true;
  monthSelect.appendChild(opt);
}

// Populate year selector
for (let y = currentYear - 5; y <= currentYear + 5; y++) {
  const opt = document.createElement('option');
  opt.value = y;
  opt.text  = y;
  if (y === currentYear) opt.selected = true;
  yearSelect.appendChild(opt);
}

function getFormattedDate(year, month, day) {
  return `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
}

function renderDayCell(year, month, day) {
  const cell = document.createElement('div');
  const num  = document.createElement('div');
  num.className   = 'day-number';
  num.textContent = day;
  cell.appendChild(num);

  const dateKey = getFormattedDate(year, month, day);

  // Your workouts
  if (window.workoutMap && workoutMap[dateKey]) {
    const ul = document.createElement('ul');
    ul.className = 'workout-list';
    for (const w of workoutMap[dateKey]) {
      const li = document.createElement('li');
      li.textContent = w;
      ul.appendChild(li);
    }
    cell.appendChild(ul);
  }

  // Your meals
  if (window.mealMap && mealMap[dateKey]) {
    const ul = document.createElement('ul');
    ul.className = 'meal-list';
    for (const m of mealMap[dateKey]) {
      const li = document.createElement('li');
      li.textContent = m;
      ul.appendChild(li);
    }
    cell.appendChild(ul);
  }


  
if(!window.readOnly){
  // Add Workout button
  const workoutBtn = document.createElement('button');
  workoutBtn.className   = 'add-workout-btn';
  workoutBtn.textContent = '➕ Add Workout';
  workoutBtn.onclick     = () => {
    window.location.href = `/calendar/selectWorkout?date=${dateKey}`;
  };
  cell.appendChild(workoutBtn);

  // Add Meal button
  const mealBtn = document.createElement('button');
  mealBtn.className   = 'add-meal-btn';
  mealBtn.textContent = '➕ Add Meal';
  mealBtn.onclick     = () => {
    window.location.href = `/meals?date=${dateKey}#add-meal-form`;
  };
  cell.appendChild(mealBtn);

}

  // Reaction buttons (like, dislike)
  const commentSection = document.createElement('div');

  const likeBtn = document.createElement('button');
  likeBtn.textContent = '👍 Like';
  likeBtn.onclick = () => handleReaction(dateKey, 'like');
  commentSection.appendChild(likeBtn);

  const dislikeBtn = document.createElement('button');
  dislikeBtn.textContent = '👎 Dislike';
  dislikeBtn.onclick = () => handleReaction(dateKey, 'dislike');
  commentSection.appendChild(dislikeBtn);


  commentSection.className = 'comment-section';

  const commentList = document.createElement('ul');
  commentSection.appendChild(commentList);


  // Display existing comments (if any)
  const commentOwner = window.viewedUser || window.sessionUserId;
  fetch(`/calendar/comments?date=${encodeURIComponent(dateKey)}&userId=${encodeURIComponent(commentOwner)}`)
  .then(res => res.json())
  .then(comments => {
    comments.forEach(c => {
      const li = document.createElement('li');
      li.textContent = c.author ? `${c.author}: ${c.comment}` : c.comment;
      commentList.appendChild(li);
    });
  });

  const commentInput = document.createElement('input');
  commentInput.type = 'text';
  commentInput.placeholder = 'Add a comment...';
  commentSection.appendChild(commentInput);

  const commentBtn = document.createElement('button');
  commentBtn.textContent = 'Add Comment';
  
  commentBtn.onclick = () => {
    const rawComment = commentInput.value;
    const sanitizedComment = sanitizeComment(rawComment)
    addComment(dateKey, sanitizedComment, commentList);
  }  
  
  commentSection.appendChild(commentBtn);

  cell.appendChild(commentSection);

  return cell;
}

function generateMonthView(year, month) {
  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // blank leading cells
  for (let i = 0; i < firstDay; i++) {
    calendarEl.appendChild(document.createElement('div'));
  }
  // each day
  for (let d = 1; d <= daysInMonth; d++) {
    calendarEl.appendChild(renderDayCell(year, month, d));
  }
}

function generateWeekView(year, month, baseDay) {
  const baseDate    = new Date(year, month, baseDay);
  const baseWeekDay = baseDate.getDay();
  const start       = new Date(baseDate);
  start.setDate(baseDay - baseWeekDay);

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
  calendarEl.innerHTML = '';
  const y = parseInt(yearSelect.value, 10);
  const m = parseInt(monthSelect.value, 10);
  const v = viewSelect.value;

  if (v === 'month') {
    generateMonthView(y, m);
  } else if (v === 'week') {
    generateWeekView(y, m, today.getDate());
  } else if (v === 'day') {
    generateDayView(y, m, today.getDate());
  }
}

function handleReaction(dateKey, type) {
  fetch('/calendar/reaction', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ date: dateKey, type })
  }).then(res => {
    if (res.ok) {
      alert(`You ${type === 'like' ? 'liked' : 'disliked'} ${dateKey}`);
    }
  });
}

function addComment(dateKey, comment, listEl) {
  if (!comment.trim()) return;

  fetch('/calendar/comment', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ date: dateKey, comment, userId: window.viewedUser || window.sessionUserId })
  })
  .then(res => res.json())
  .then(data => {
    const li = document.createElement('li');
    li.textContent = `${data.author}: ${data.comment}`;
    listEl.appendChild(li);
  });
}

// Event listeners
monthSelect.addEventListener('change', generateCalendar);
yearSelect.addEventListener('change', generateCalendar);
viewSelect.addEventListener('change', generateCalendar);
window.addEventListener('DOMContentLoaded', generateCalendar);
