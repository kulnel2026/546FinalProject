import { calendarEntries } from '../config/mongoCollections.js';
import { ObjectId } from 'mongodb';

export const getWorkoutStatsForUser = async (userId) => {
  const calendarColl = await calendarEntries();
  const userEntries = await calendarColl.find({ userId }).toArray();

  const today = new Date();
  today.setUTCHours(0,0,0,0);
  today.setDate(today.getDate() - 1);

  const stats = {
    groupStats: {
      daily: {},
      monthly: {},
      yearly: {}
    },
    groupStats: {}
  };

  for (const entry of userEntries) {
    const entryDate = new Date(entry.date);
    entryDate.setUTCHours(0,0,0,0);

    const dateStr = entryDate.toISOString().split('T')[0];


    const isToday = entryDate.getUTCDay() === today.getUTCDay();
    const isSameMonth = entryDate.getUTCMonth() === today.getUTCMonth() && entryDate.getUTCFullYear() === today.getUTCFullYear();
    const isSameYear = entryDate.getUTCFullYear() === today.getUTCFullYear();



    if (isToday) stats.daily++;
    if (isSameMonth) stats.monthly++;
    if (isSameYear) stats.yearly++;
    if (Array.isArray(entry.workouts)) {
      stats.total += entry.workouts.length;
    
      for (const workout of entry.workouts) {


        const group = workout.group?.trim();

        if (!group) continue;

        if (isToday) {
          stats.groupStats.daily[group] = (stats.groupStats.daily[group] || 0) + 1;
        }
        if (isSameMonth) {
          stats.groupStats.monthly[group] = (stats.groupStats.monthly[group] || 0) + 1;
        }
        if (isSameYear) {
          stats.groupStats.yearly[group] = (stats.groupStats.yearly[group] || 0) + 1;
        }
      }
    }

    console.log(stats.groupStats);
  }

  // Convert timeline objects to arrays for Chart.js
  

  return stats;
};
