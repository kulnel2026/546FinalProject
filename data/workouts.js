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

  const insertInfo = await workoutCollection.insertOne(newWorkout);
  if (!insertInfo.acknowledged || !insertInfo.insertedId) throw 'Workout insert failed';

  return await workoutCollection.findOne({ _id: insertInfo.insertedId });
};

export const getAllWorkouts = async () => {
  const workoutCollection = await workouts();
  return await workoutCollection.find({}).toArray();
};

export const getWorkoutById = async (id) => {
  if (!id) throw 'Workout ID required';
  const workoutCollection = await workouts();
  return await workoutCollection.findOne({ _id: new ObjectId(id) });
};
