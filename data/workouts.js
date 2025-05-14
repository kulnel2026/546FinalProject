import { workouts } from '../config/mongoCollections.js';
import { ObjectId } from 'mongodb';

export const createWorkout = async (username, group, time, exercises) => {
  if (!username || !group || !time || !Array.isArray(exercises)) throw 'Invalid input';

  const workoutCollection = await workouts();
  const newWorkout = {
    username,
    group,
    time,
    exercises, // Array of { name, weight, sets, reps }
    comments: [],
    reactions: []
  };


  for (let exercise of exercises){
    if (typeof exerciseName != "string"){
      throw new Error('Exercise name has to be a string');
    }


    if (
      exercise.sets < 0 ||
      exercise.reps < 0 ||
      exercise.weight < 0
    ) {
      throw new Error('Exercise fields cannot be negative');
    }
  }

  const insertInfo = await workoutCollection.insertOne(newWorkout);
  if (!insertInfo.acknowledged || !insertInfo.insertedId) throw 'Workout insert failed';

  return await workoutCollection.findOne({ _id: insertInfo.insertedId });
};

export const getAllWorkouts = async (username) => {
  const workoutCollection = await workouts();
  return await workoutCollection.find({username}).toArray();
};

export const getWorkoutById = async (id) => {
  if (!id) throw 'Workout ID required';
  const workoutCollection = await workouts();
  return await workoutCollection.findOne({ _id: new ObjectId(id) });
};

export const deleteWorkoutById = async (id) => {
  if (!id) throw 'Workout ID required';
  const workoutCollection = await workouts();
  const deletionInfo = await workoutCollection.deleteOne({ _id: new ObjectId(id) });
  if (deletionInfo.deletedCount === 0) throw 'Workout could not be deleted';
  return true;
};

export const updateWorkout = async (id, updatedFields) => {
  if (!id) throw 'Workout ID required';
  const workoutCollection = await workouts();

  const updateData = {};
  if (updatedFields.username) updateData.username = updatedFields.username.trim();
  if (updatedFields.group) updateData.group = updatedFields.group.trim();
  if (updatedFields.time) updateData.time = updatedFields.time.trim();
  if (Array.isArray(updatedFields.exercises)) updateData.exercises = updatedFields.exercises;

  const updateInfo = await workoutCollection.updateOne(
    { _id: new ObjectId(id) },
    { $set: updateData }
  );

  if (updateInfo.modifiedCount === 0) throw 'No changes made';

  return await getWorkoutById(id);


};