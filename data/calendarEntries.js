import { ObjectId } from 'mongodb';
import { calendarEntries } from '../config/mongoCollections.js';

export const createEntry = async (userId, date, workouts = [], meals = []) => {
  if (!userId) throw "Error: userId is required";

  if (!date || typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date.trim())) {
    throw "Error: date must be in YYYY-MM-DD format";
  }

  const inputDate = new Date(date.trim());
  if (isNaN(inputDate.getTime())) {
    throw "Error: provided date is not a valid calendar date";
  }


  let formattedWorkouts = [];
  if (Array.isArray(workouts) && workouts.length > 0) {
    for (let w of workouts) {
      if (!w || typeof w !== 'object') throw "Workout must be a valid object";

      if (!w.name || typeof w.name !== 'string' || !/^[a-zA-Z ]+$/.test(w.name.trim())) {
        throw "Workout name is invalid";
      }
      if (!w.sets || typeof w.sets !== 'string' || !/^\d+$/.test(w.sets.trim())) {
        throw "Workout sets must be a numeric string";
      }
      if (!w.reps || typeof w.reps !== 'string' || !/^\d+$/.test(w.reps.trim())) {
        throw "Workout reps must be a numeric string";
      }
      if (!w.weight || typeof w.weight !== 'string' || !/^\d+$/.test(w.weight.trim())) {
        throw "Workout weight must be a numeric string";
      }

      formattedWorkouts.push({
        name: w.name.trim(),
        sets: w.sets.trim(),
        reps: w.reps.trim(),
        weight: w.weight.trim()
      });
    }
  }

  let formattedMeals = [];
  if (Array.isArray(meals) && meals.length > 0) {
    for (let m of meals) {
      if (!m || typeof m !== 'object') throw "Meal must be a valid object";

      if (!m.name || typeof m.name !== 'string' || !/^[a-zA-Z ]+$/.test(m.name.trim())) {
        throw "Meal name is invalid";
      }
      if (!m.calories || typeof m.calories !== 'string' || !/^\d+$/.test(m.calories.trim())) {
        throw "Meal calories must be a numeric string";
      }
      if (!m.protein || typeof m.protein !== 'string' || !/^\d+$/.test(m.protein.trim())) {
        throw "Meal protein must be a numeric string";
      }

      formattedMeals.push({
        name: m.name.trim(),
        calories: m.calories.trim(),
        protein: m.protein.trim()
      });
    }
  }

  // Ensure that at least one of workouts or meals is present
  if (formattedWorkouts.length === 0 && formattedMeals.length === 0) {
    throw "Error: Entry must include at least one workout or meal";
  }

  const newEntry = {
    userId: userId,
    date: inputDate,
    workouts: formattedWorkouts,
    meals: formattedMeals
  };

  const calendarCollection = await calendarEntries();
  const insertResult = await calendarCollection.insertOne(newEntry);
  if (!insertResult.acknowledged) {
    throw "Error: Failed to insert calendar entry";
  }

  newEntry._id = insertResult.insertedId;
  return newEntry;
};
