document.getElementById('add-exercise-btn').addEventListener('click', () => {
    const container = document.getElementById('exercise-fields');
    const div = document.createElement('div');
    div.classList.add('exercise-entry');
    div.innerHTML = `
      <input class="input-field" type="text" name="exerciseName" placeholder="Exercise Name" required>
      <input class="input-field" type="number" name="exerciseSets" placeholder="Sets" required>
      <input class="input-field" type="number" name="exerciseReps" placeholder="Reps" required>
      <input class="input-field" type="number" name="exerciseWeight" placeholder="Weight (lbs)" required>
    `;
    container.appendChild(div);
  });