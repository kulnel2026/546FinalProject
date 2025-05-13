import { ObjectId } from 'mongodb';
import { calendarEntries } from '../config/mongoCollections.js';

export const createEntry = async (userId, date, workouts = [], meals = []) => {
    if (!userId) throw "Error: userId is invalid";

    if (!date || typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date.trim())) {
        throw "Error: date must be in YYYY-MM-DD format";
    }
    date = date.trim();
    let userObjectId = ObjectId(userId);
    let inputDate = new Date(date);
    if (isNaN(inputDate.getTime())) {
        throw "Error: provided date is not a valid calendar date";
    }

    let formattedWorkouts = [];
    for (let w of workouts) {
        if (!w || typeof w !== 'object') {
            throw "Error: workout must be a valid object";
        }
        if(!w.name || typeof w.name !== 'string' || !/^[a-zA-Z ]+$/.test(w.name.trim())){
            throw "Error: workout name is invalid";
        }
        w.name = w.name.trim();

        if (!w.sets || typeof w.sets !== 'string' || !/^[0-9]+$/.test(w.sets.trim())) {
            throw "Error: workout sets must be a numeric string";
        }
        w.sets = w.sets.trim();

        if (!w.reps || typeof w.reps !== 'string' || !/^[0-9]+$/.test(w.reps.trim())) {
            throw "Error: workout reps must be a numeric string";
        }
        w.reps = w.reps.trim();

        if (!w.weight || typeof w.weight !== 'string' || !/^[0-9]+$/.test(w.weight.trim())) {
            throw "Error: workout weight must be a numeric string";
        }
        w.weight = w.weight.trim();


        formattedWorkouts.push({
            name: w.name,
            sets: w.sets,
            reps: w.reps,
            weight: w.weight
        });
    }

    let formattedMeals = [];
    for (let m of meals) {

        if (!m || typeof m !== 'object') {
            throw "Error: meal must be a valid object";
        }
        if(!m.name || typeof m.name !== 'string' || !/^[a-zA-Z ]+$/.test(m.name.trim())){
            throw "Error: meal name is invalid";
        }
        m.name = m.name.trim();

        if (!m.calories || typeof m.calories !== 'string' || !/^[0-9]+$/.test(m.calories.trim())) {
            throw "Error: meal calories must be a numeric string";
        }
        m.calories = m.calories.trim();

        if (!m.protein || typeof m.protein !== 'string' || !/^[0-9]+$/.test(m.protein.trim())) {
            throw "Error: meal protein be a numeric string";
        }
        m.protein = m.protein.trim();

        formattedMeals.push({
        name: m.name,
        calories: m.calories,
        protein: m.protein
        });
    }

    let calendarCollection = await calendarEntries();

    existingEntry = await calendarCollection.findOne({
        userId: userObjectId,
        date: inputDate
    });

    if (existingEntry) {
        let updateResult = await calendarCollection.updateOne(
          { _id: existingEntry._id },
          {
            $push: {
              workouts: { $each: formattedWorkouts },
              meals: { $each: formattedMeals }
            }
          }
        );
        if (updateResult.modifiedCount === 0) {
            throw "Error: Failed to update existing calendar entry";
        }
        return await calendarCollection.findOne({ _id: existingEntry._id });

    }

    let newEntry = {
        userId: userObjectId,
        date: inputDate,
        workouts: formattedWorkouts,
        meals: formattedMeals
      };

    let insertResult = await calendarCollection.insertOne(newEntry);
    if (!insertResult.acknowledged) {
        throw "Error: Failed to insert calendar entry";
      }
    
    newEntry._id = insertResult.insertedId;
    return newEntry;
};

export const getEntriesByUser = async (userId) => {
    if (!userId) throw "Error: userId is required";

    let calendarCollection = await calendarEntries();

    return await calendarCollection.find({ userId: ObjectId(userId) }).sort({ date: 1 }).toArray();

};

export const getCalendarEntryById = async (id, userId) => {
    if (!id || !userId) throw "Error: id and userId are required";
  
    const calendarCollection = await calendarEntries();
    return await calendarCollection.findOne({
      _id: ObjectId(id),
      userId: ObjectId(userId)
    });
  };

export const updateCalendarEntry = async (id, userId, date, workouts = [], meals = []) => {
    if (!id || !userId) throw "Error: id and userId are required";

    if (!date || typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date.trim())) {
        throw "Error: date must be in YYYY-MM-DD format";
    }
    let inputDate = new Date(date.trim());
    if (isNaN(inputDate.getTime())) {
    throw "Error: provided date is not a valid calendar date";
    }

    let formattedWorkouts = [];
    for (let w of workouts) {
        if (!w || typeof w !== 'object') {
            throw "Error: workout must be a valid object";
        }
        if(!w.name || typeof w.name !== 'string' || !/^[a-zA-Z ]+$/.test(w.name.trim())){
            throw "Error: workout name is invalid";
        }
        w.name = w.name.trim();

        if (!w.sets || typeof w.sets !== 'string' || !/^[0-9]+$/.test(w.sets.trim())) {
            throw "Error: workout sets must be a numeric string";
        }
        w.sets = w.sets.trim();

        if (!w.reps || typeof w.reps !== 'string' || !/^[0-9]+$/.test(w.reps.trim())) {
            throw "Error: workout reps must be a numeric string";
        }
        w.reps = w.reps.trim();

        if (!w.weight || typeof w.weight !== 'string' || !/^[0-9]+$/.test(w.weight.trim())) {
            throw "Error: workout weight must be a numeric string";
        }
        w.weight = w.weight.trim();


        formattedWorkouts.push({
            name: w.name,
            sets: w.sets,
            reps: w.reps,
            weight: w.weight
        });
    }

    let formattedMeals = [];
    for (let m of meals) {

        if (!m || typeof m !== 'object') {
            throw "Error: meal must be a valid object";
        }
        if(!m.name || typeof m.name !== 'string' || !/^[a-zA-Z ]+$/.test(m.name.trim())){
            throw "Error: meal name is invalid";
        }
        m.name = m.name.trim();

        if (!m.calories || typeof m.calories !== 'string' || !/^[0-9]+$/.test(m.calories.trim())) {
            throw "Error: meal calories must be a numeric string";
        }
        m.calories = m.calories.trim();

        if (!m.protein || typeof m.protein !== 'string' || !/^[0-9]+$/.test(m.protein.trim())) {
            throw "Error: meal protein be a numeric string";
        }
        m.protein = m.protein.trim();

        formattedMeals.push({
        name: m.name,
        calories: m.calories,
        protein: m.protein
        });
    }

    const calendarCollection = await calendarEntries();
    const result = await calendarCollection.updateOne(
      { _id: ObjectId(id), userId: ObjectId(userId) },
      {
        $set: {
          date: inputDate,
          workouts: formattedWorkouts,
          meals: formattedMeals
        }
      }
    );
  
    if (result.modifiedCount === 0) {
      throw "Error: No calendar entry was updated";
    }
  
    return true;
};

export const removeCalendarEntry = async (id, userId) => {
    if (!id || !userId) throw "Error: id and userId are required";
  
    const calendarCollection = await calendarEntries();
    const result = await calendarCollection.deleteOne({
      _id: ObjectId(id),
      userId: ObjectId(userId)
    });
  
    if (result.deletedCount === 0) {
      throw "Error: No calendar entry was deleted";
    }
  
    return true;
  };
