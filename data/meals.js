import { meals, savedMeals } from '../config/mongoCollections.js';
import { ObjectId } from 'mongodb';

/*—— Helpers ——*/
function normalizeUserId(id) {
  if (id instanceof ObjectId) return id;
  if (typeof id === 'string' && ObjectId.isValid(id)) {
    return new ObjectId(id);
  }
  if (typeof id === 'string') {
    return id;
  }
  throw new Error(`Invalid user identifier: ${id}`);
}

function toObjectId(id) {
  if (id instanceof ObjectId) return id;
  if (typeof id === 'string' && ObjectId.isValid(id)) {
    return new ObjectId(id);
  }
  throw new Error(`Invalid ObjectId: ${id}`);
}


/*—— Logged Meals (meals collection) ——*/

export const getMealsByUser = async (userId, isoDate) => {
    if (!userId) throw new Error('You must provide a user id');
    const uid = normalizeUserId(userId);
    const coll = await meals();
  
    const filter = { userId: uid, isSaved: false };
    if (isoDate) {
      const dayStart = new Date(isoDate);
      const dayEnd   = new Date(dayStart.getTime() + 24*60*60*1000);
      filter.date = { $gte: dayStart, $lt: dayEnd };
    }
  
    return coll.find(filter).sort({ date: -1 }).toArray();
};

export const getMealById = async (mealId, userId) => {
  if (!mealId) throw new Error('You must provide a meal id');
  if (!userId) throw new Error('You must provide a user id');
  const mid = toObjectId(mealId);
  const uid = normalizeUserId(userId);
  const coll = await meals();
  const meal = await coll.findOne({ _id: mid, userId: uid });
  if (!meal) throw new Error('Meal not found');
  return meal;
};

export const addMeal = async (userId, mealData) => {
  if (!userId) throw new Error('You must provide a user id');
  const uid = normalizeUserId(userId);
  const { name, date, calories, protein=0, carbs=0, fat=0 } = mealData;
  if (!name) throw new Error('You must provide a valid name');
  if (!date) throw new Error('You must provide a date');
  const cals = Number(calories), prot = Number(protein), carb = Number(carbs), f = Number(fat);
  if ([cals,prot,carb,f].some(n => isNaN(n) || n<0)) throw new Error('Nutrients must be non-negative numbers');

  const newMeal = { userId: uid, name, date, calories: cals, protein: prot, carbs: carb, fat: f,
                    isSaved: false, createdAt: new Date(), updatedAt: new Date() };
  const coll = await meals();
  const info = await coll.insertOne(newMeal);
  if (!info.acknowledged) throw new Error('Could not add meal');
  return getMealById(info.insertedId, userId);
};

export const updateMeal = async (mealId, userId, updateData) => {
  if (!mealId) throw new Error('You must provide a meal id');
  if (!userId) throw new Error('You must provide a user id');
  const mid = toObjectId(mealId);
  const uid = normalizeUserId(userId);

  const allowed = ['name','date','calories','protein','carbs','fat'];
  const setObj = {};
  for (const key of allowed) {
    if (updateData[key] != null) {
      setObj[key] = (key==='name'||key==='date') ? updateData[key] : Number(updateData[key]);
      if (['calories','protein','carbs','fat'].includes(key) && (isNaN(setObj[key]) || setObj[key]<0)) {
        throw new Error(`${key} must be non-negative number`);
      }
    }
  }
  if (Object.keys(setObj).length===0) throw new Error('No valid fields to update');
  setObj.updatedAt = new Date();

  const coll = await meals();
  const result = await coll.updateOne({ _id: mid, userId: uid }, { $set: setObj });
  if (result.modifiedCount===0) throw new Error('Could not update meal');
  return getMealById(mealId, userId);
};

export const removeMeal = async (mealId, userId) => {
  if (!mealId) throw new Error('You must provide a meal id');
  if (!userId) throw new Error('You must provide a user id');
  const mid = toObjectId(mealId);
  const uid = normalizeUserId(userId);
  const coll = await meals();
  const result = await coll.deleteOne({ _id: mid, userId: uid });
  if (result.deletedCount===0) throw new Error('Could not delete meal');
  return true;
};


/*—— Saved Templates (savedMeals collection) ——*/

export const getSavedMeals = async (userId) => {
  if (!userId) throw new Error('You must provide a user id');
  const uid = normalizeUserId(userId);
  const coll = await savedMeals();
  return coll.find({ userId: uid }).sort({ name: 1 }).toArray();
};

export const getSavedMealById = async (mealId, userId) => {
  if (!mealId) throw new Error('You must provide a meal id');
  if (!userId) throw new Error('You must provide a user id');
  const mid = toObjectId(mealId);
  const uid = normalizeUserId(userId);
  const coll = await savedMeals();
  const meal = await coll.findOne({ _id: mid, userId: uid });
  if (!meal) throw new Error('Saved meal not found');
  return meal;
};

export const addSavedMeal = async (userId, mealData) => {
  if (!userId) throw new Error('You must provide a user id');
  const uid = normalizeUserId(userId);
  const { name, calories, protein=0, carbs=0, fat=0 } = mealData;
  if (!name) throw new Error('You must provide a valid name');
  const cals = Number(calories), prot = Number(protein), carb = Number(carbs), f = Number(fat);
  if ([cals,prot,carb,f].some(n => isNaN(n) || n<0)) throw new Error('Nutrients must be non-negative numbers');

  const newTpl = { userId: uid, name, calories:cals, protein:prot, carbs:carb, fat:f,
                   createdAt: new Date(), updatedAt: new Date() };
  const coll = await savedMeals();
  const info = await coll.insertOne(newTpl);
  if (!info.acknowledged) throw new Error('Could not save meal template');
  return getSavedMealById(info.insertedId, userId);
};

export const updateSavedMeal = async (mealId, userId, updateData) => {
  // reuse update logic but against the savedMeals collection
  if (!mealId) throw new Error('You must provide a meal id');
  if (!userId) throw new Error('You must provide a user id');
  const mid = toObjectId(mealId);
  const uid = normalizeUserId(userId);

  const allowed = ['name','calories','protein','carbs','fat'];
  const setObj = {};
  for (const key of allowed) {
    if (updateData[key] != null) {
      setObj[key] = (key==='name') ? updateData[key] : Number(updateData[key]);
      if (['calories','protein','carbs','fat'].includes(key) && (isNaN(setObj[key])||setObj[key]<0)) {
        throw new Error(`${key} must be non-negative number`);
      }
    }
  }
  if (Object.keys(setObj).length===0) throw new Error('No valid fields to update');
  setObj.updatedAt = new Date();

  const coll = await savedMeals();
  const result = await coll.updateOne({ _id: mid, userId: uid }, { $set: setObj });
  if (result.modifiedCount===0) throw new Error('Could not update saved meal');
  return getSavedMealById(mealId, userId);
};

export const removeSavedMeal = async (mealId, userId) => {
  if (!mealId) throw new Error('You must provide a meal id');
  if (!userId) throw new Error('You must provide a user id');
  const mid = toObjectId(mealId);
  const uid = normalizeUserId(userId);
  const coll = await savedMeals();
  const result = await coll.deleteOne({ _id: mid, userId: uid });
  if (result.deletedCount===0) throw new Error('Could not delete saved meal');
  return true;
};
