import { goalTracker } from '../config/mongoCollections.js';
import { ObjectId } from 'mongodb';


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

function computeBmiAndMaintenance(weightKg, heightCm) {
    const heightM     = heightCm / 100;
    const bmi         = weightKg / (heightM * heightM);
    const maintenance = Math.round(weightKg * 24);
    return {
      bmi: Number(bmi.toFixed(1)),
      maintenance
    };
}

export async function getGoalsByUser(sessionUser) {
    if (!sessionUser) throw new Error('You must provide a session user');
    const userId = normalizeUserId(
      sessionUser._id || sessionUser.id || sessionUser.userId
    );
    const coll = await goalTracker();
    const doc  = await coll.findOne({ userId });
    return doc;
}

export async function upsertGoals(sessionUser, goalsData) {
    if (!sessionUser) throw new Error('You must provide a session user');
    const userId = normalizeUserId(
      sessionUser._id || sessionUser.id || sessionUser.userId
    );
    const {
      calorieGoal, proteinGoal, carbsGoal, fatGoal,
      weight, height
    } = goalsData;
  
    // parse & validate
    const cals  = parseFloat(calorieGoal);
    const prot  = parseFloat(proteinGoal);
    const carbs = parseFloat(carbsGoal);
    const fat   = parseFloat(fatGoal);
    const w     = parseFloat(weight);
    const h     = parseFloat(height);
  
    if ([cals, prot, carbs, fat, w, h].some(n => isNaN(n) || n < 0)) {
      throw new Error('All inputs must be non‑negative numbers');
    }
  
    // compute BMI & maintenance cals
    const { bmi, maintenance } = computeBmiAndMaintenance(w, h);
  
    const coll = await goalTracker();
    const result = await coll.updateOne(
      { userId },
      {
        $set: {
          userId,
          calorieGoal:  cals,
          proteinGoal:  prot,
          carbsGoal:    carbs,
          fatGoal:      fat,
          weight:       w,
          height:       h,
          bmi,
          maintenance,
          updatedAt:    new Date()
        },
        $setOnInsert: {
          createdAt: new Date()
        }
      },
      { upsert: true }
    );
  
    // return the fresh document
    return coll.findOne({ userId });
}

