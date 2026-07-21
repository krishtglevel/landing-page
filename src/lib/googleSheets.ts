import { google } from 'googleapis';

const SPREADSHEET_ID = '1oucNP4p0ylIOO_zLV2933tGPjivgn3G2SSOZLTx6rR0';
const SHEET_NAME = 'Sheet1';

function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

export async function ensureHeader() {
  const auth = getAuth();
  const sheets = google.sheets({ version: 'v4', auth });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A1:C1`,
  });

  const firstRow = res.data.values?.[0];
  if (!firstRow || firstRow[0] !== 'Timestamp') {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A1:C1`,
      valueInputOption: 'RAW',
      requestBody: { values: [['Timestamp', 'Full Name', 'Phone Number']] },
    });
  }
}

export async function appendRow(timestamp: string, fullName: string, phone: string) {
  const auth = getAuth();
  const sheets = google.sheets({ version: 'v4', auth });

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A:C`,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [[timestamp, fullName, phone]] },
  });
}
