/**
 * ============================================================
 *  Alicja & Fulvio — Wedding RSVP Backend
 *  Google Apps Script — paste this into script.google.com
 * ============================================================
 *
 *  SETUP INSTRUCTIONS (takes ~5 minutes):
 *
 *  1. Go to https://sheets.google.com and create a new spreadsheet.
 *     Name it "Wedding RSVPs".
 *
 *  2. Add these headers in Row 1 (one per column, A through L):
 *     Timestamp | Name | Email | Phone | Day 1 (Ceremony) | Day 2 (Brunch) |
 *     Guests | Dietary | Dietary Other | Song Request | Message | IP
 *
 *  3. Go to Extensions → Apps Script.
 *     Delete any existing code and paste ALL of this file.
 *
 *  4. Click "Save" (floppy disk icon).
 *
 *  5. Click "Deploy" → "New deployment".
 *     - Type: Web App
 *     - Execute as: Me
 *     - Who has access: Anyone
 *     Click "Deploy" and copy the Web App URL.
 *
 *  6. Open js/rsvp.js in the wedding website and replace:
 *       const APPS_SCRIPT_URL = 'YOUR_APPS_SCRIPT_URL_HERE';
 *     with your copied URL.
 *
 *  7. That's it! Test by submitting a test RSVP on the website.
 *     You should see a new row appear in your Google Sheet.
 *
 *  NOTE: If you change this script, you must create a NEW deployment
 *  (not update the existing one) and update the URL in rsvp.js.
 * ============================================================
 */

// ── Configuration ────────────────────────────────────────────
const SPREADSHEET_ID = ''; // Optional: paste your Sheet ID here for safety.
                            // Leave blank to use the active spreadsheet.

const SHEET_NAME = 'RSVPs'; // The name of the tab/sheet in your spreadsheet.
                             // Rename tab 1 in Google Sheets to "RSVPs".

const NOTIFY_EMAIL = '';    // Optional: your email address to receive a
                             // notification for each new RSVP. Leave blank
                             // to disable email notifications.

// ── Main POST handler ────────────────────────────────────────
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    const sheet = getSheet();

    // Append a new row with all RSVP data
    sheet.appendRow([
      new Date(),                    // A: Timestamp
      sanitise(data.name),           // B: Full name
      sanitise(data.email),          // C: Email
      sanitise(data.phone),          // D: Phone
      data.day1 || 'No',             // E: Attending Day 1?
      data.day2 || 'No',             // F: Attending Day 2?
      sanitise(data.guests) || '1',  // G: Number of guests
      sanitise(data.dietary),        // H: Dietary requirements
      sanitise(data.dietary_other),  // I: Dietary other (free text)
      sanitise(data.song),           // J: Song request
      sanitise(data.notes),          // K: Message
      e.parameter.ip || '',          // L: IP (for deduplication if needed)
    ]);

    // Optional email notification
    if (NOTIFY_EMAIL) {
      sendNotificationEmail(data);
    }

    return jsonResponse({ success: true, message: 'RSVP received!' });

  } catch (err) {
    console.error('RSVP error:', err);
    return jsonResponse({ success: false, error: err.message }, 500);
  }
}

// ── GET handler (health check) ───────────────────────────────
function doGet(e) {
  return jsonResponse({ status: 'ok', message: 'Wedding RSVP API is running.' });
}

// ── Helpers ──────────────────────────────────────────────────

function getSheet() {
  const ss = SPREADSHEET_ID
    ? SpreadsheetApp.openById(SPREADSHEET_ID)
    : SpreadsheetApp.getActiveSpreadsheet();

  let sheet = ss.getSheetByName(SHEET_NAME);

  // Auto-create sheet with headers if it doesn't exist
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow([
      'Timestamp',
      'Full Name',
      'Email',
      'Phone',
      'Day 1 — Ceremony & Dinner (11 Sept)',
      'Day 2 — Farewell Brunch (12 Sept)',
      'Number of Guests',
      'Dietary Requirements',
      'Dietary (other details)',
      'Song Request',
      'Message',
      'IP',
    ]);

    // Style the header row
    const headerRange = sheet.getRange(1, 1, 1, 12);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#2C4A6E');
    headerRange.setFontColor('#FAF7F0');
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(1, 180);  // Timestamp
    sheet.setColumnWidth(2, 160);  // Name
    sheet.setColumnWidth(3, 200);  // Email
    sheet.setColumnWidth(11, 280); // Message
  }

  return sheet;
}

function sanitise(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim().substring(0, 1000); // cap at 1000 chars
}

function jsonResponse(data, statusCode) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function sendNotificationEmail(data) {
  const subject = `New RSVP: ${data.name || 'Unknown'}`;
  const body = `
New RSVP received for Alicja & Fulvio's wedding!

Name:      ${data.name || '—'}
Email:     ${data.email || '—'}
Phone:     ${data.phone || '—'}
Day 1:     ${data.day1 || 'No'}
Day 2:     ${data.day2 || 'No'}
Guests:    ${data.guests || '1'}
Dietary:   ${data.dietary || 'None'} ${data.dietary_other ? '(' + data.dietary_other + ')' : ''}
Song:      ${data.song || '—'}
Message:   ${data.notes || '—'}

View all RSVPs in Google Sheets.
  `.trim();

  GmailApp.sendEmail(NOTIFY_EMAIL, subject, body);
}
