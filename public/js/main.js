// Example usage: attach listener to fetch or manipulate workouts dynamically
document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('.workout-form');
    form?.addEventListener('submit', (e) => {
      try {
        const text = form.elements['exercises'].value;
        const parsed = JSON.parse(text);
        if (!Array.isArray(parsed)) throw 'Exercises must be an array';
      } catch (err) {
        e.preventDefault();
        alert('Invalid exercise format. Must be valid JSON array.');
      }
    });
  });
  