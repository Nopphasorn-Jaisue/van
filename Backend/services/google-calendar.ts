import { google, calendar_v3 } from 'googleapis';

interface GoogleAuthConfig {
  client_email: string;
  private_key: string;
}

function getGoogleAuthConfig(): GoogleAuthConfig {
  let client_email = process.env.GOOGLE_CLIENT_EMAIL?.trim() || "";
  let private_key = process.env.GOOGLE_PRIVATE_KEY?.trim() || "";

  if (client_email.startsWith('"') && client_email.endsWith('"')) {
    client_email = client_email.slice(1, -1);
  }
  if (private_key.startsWith('"') && private_key.endsWith('"')) {
    private_key = private_key.slice(1, -1);
  }
  private_key = private_key.replace(/\\n/g, '\n');

  if (!client_email || !private_key) {
    console.error('Server Configuration Error: Missing Google Calendar environment variables.');
    throw new Error('Server is not configured correctly for Google Calendar API.');
  }

  return { client_email, private_key };
}

const globalForGoogle = globalThis as unknown as {
  googleAuthInstance?: InstanceType<typeof google.auth.GoogleAuth>;
  googleCalendarClients?: Record<string, calendar_v3.Calendar>;
};

if (!globalForGoogle.googleCalendarClients) {
  globalForGoogle.googleCalendarClients = {};
}

export function getGoogleCalendarClient(scopes: string[]): calendar_v3.Calendar {
  const scopeKey = scopes.slice().sort().join('|');
  if (globalForGoogle.googleCalendarClients && globalForGoogle.googleCalendarClients[scopeKey]) {
    return globalForGoogle.googleCalendarClients[scopeKey];
  }

  const credentials = getGoogleAuthConfig();
  if (!globalForGoogle.googleAuthInstance) {
    globalForGoogle.googleAuthInstance = new google.auth.GoogleAuth({
      credentials,
      scopes: [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.readonly'
      ]
    });
  }

  const calendarInstance = google.calendar({
    version: 'v3',
    auth: globalForGoogle.googleAuthInstance
  });

  if (globalForGoogle.googleCalendarClients) {
    globalForGoogle.googleCalendarClients[scopeKey] = calendarInstance;
  }

  return calendarInstance;
}
