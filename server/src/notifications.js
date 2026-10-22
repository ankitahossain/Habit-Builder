/**
 * Notification integration notes:
 * For production Web Push, generate VAPID keys, store subscriptions per user,
 * add a service worker in the frontend, and send notifications from this job.
 * A server process that sleeps may not reliably run cron jobs; use a persistent
 * worker or managed scheduler for production.
 */
import cron from 'node-cron';

export function startReminderScheduler() {
  cron.schedule('* * * * *', async () => {
    // TODO production: query enabled reminders due in the current user timezone,
    // deduplicate sends, and dispatch using web-push with VAPID credentials.
    // Do not mark this as delivered until the push service confirms acceptance.
  });
}
