import { google } from 'googleapis';

interface GoogleAuthConfig {
    client_email: string;
    private_key: string;
}

function getGoogleAuthConfig(): GoogleAuthConfig {
    const client_email = process.env.GOOGLE_CLIENT_EMAIL;
    const private_key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!client_email || !private_key) {
        console.error('Server Configuration Error: Missing Google Calendar environment variables.');
        throw new Error('Server is not configured correctly for Google Calendar API.');
    }

    return { client_email, private_key };
}

export function getGoogleCalendarClient(scopes: string[]) {
    const credentials = getGoogleAuthConfig();
    const auth = new google.auth.GoogleAuth({ credentials, scopes });
    return google.calendar({ version: 'v3', auth });
}