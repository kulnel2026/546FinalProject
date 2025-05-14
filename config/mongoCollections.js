// config/mongoCollections.js
import { dbConnection } from './mongoConnections.js';

/* This will allow you to have one reference to each collection per app */
const getCollectionFn = (collection) => {
  let _col = undefined;

  return async () => {
    if (!_col) {
      const db = await dbConnection();
      _col = await db.collection(collection);
    }

    return _col;
  };
};

/* Core collections needed for workout tracker */
export const users = getCollectionFn('users');
export const meals = getCollectionFn('meals');
export const workouts = getCollectionFn('workouts');
export const calendarEntries = getCollectionFn('calendarEntries');
export const savedMeals = getCollectionFn('savedMeals');
export const goalTracker = getCollectionFn('goalTracker');
