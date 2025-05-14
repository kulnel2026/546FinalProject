import { calendarEntries } from '../config/mongoCollections.js';
import { ObjectId } from 'mongodb';

export const getWorkoutStatsForUser = async (userId) => {
  const calendarColl = await calendarEntries();
  const userEntries = await calendarColl.find({ userId }).toArray();

  const today = new Date();
  today.setUTCHours(0,0,0,0);

  const stats = {
    daily: 0,
    monthly: 0,
    yearly: 0,
    total: 0,
    groupCount: {},
    groupTimeline: {} // group -> [{date, totalWeight}]
  };

  for (const entry of userEntries) {
    const entryDate = new Date(entry.date);
    entryDate.setUTCHours(0,0,0,0);

    const dateStr = entryDate.toISOString().split('T')[0];


    const isToday = entryDate.getUTCDay() === today.getUTCDay();
    const isSameMonth = entryDate.getUTCMonth() === today.getUTCMonth() && entryDate.getUTCFullYear() === today.getUTCFullYear();
    const isSameYear = entryDate.getUTCFullYear() === today.getUTCFullYear();


    console.log(entry.group);
    console.log(entryDate.getUTCDay());
    console.log(today.getUTCDay());

    if (isToday) stats.daily++;
    if (isSameMonth) stats.monthly++;
    if (isSameYear) stats.yearly++;

    if (Array.isArray(entry.workouts)) {
      stats.total += entry.workouts.length;

      for (const workout of entry.workouts) {
        const group = workout.group?.trim();
        const weight = Number(workout.weight) || 0;

        if (!group) continue;

        stats.groupCount[group] = (stats.groupCount[group] || 0) + 1;

        // Group timeline (for progress over time)
        if (!stats.groupTimeline[group]) stats.groupTimeline[group] = {};
        if (!stats.groupTimeline[group][dateStr]) stats.groupTimeline[group][dateStr] = 0;

        stats.groupTimeline[group][dateStr] += weight;
      }
    }
  }

  // Convert timeline objects to arrays for Chart.js
  for (const group in stats.groupTimeline) {
    stats.groupTimeline[group] = Object.entries(stats.groupTimeline[group])
      .sort(([dateA], [dateB]) => new Date(dateA) - new Date(dateB))
      .map(([date, totalWeight]) => ({ date, totalWeight }));
  }

  return stats;
};
