/**
 * =========================================================================
 * KALIDASS TRAVELS - GOOGLE APPS SCRIPT SYNC BRIDGE (2-WAY)
 * =========================================================================
 * Connects your website Booking Engines & Admin Duties Board with Google Sheets.
 *
 * HOW TO INSTALL (Takes 2 minutes):
 * 1. Open Google Sheets (https://sheets.new) and name it "Kalidass Travels Operations 2026".
 * 2. Click "Extensions" > "Apps Script".
 * 3. Delete any code in the editor and PASTE THIS ENTIRE FILE.
 * 4. Click "Deploy" > "New deployment".
 * 5. Click the Gear icon (Select type) > Choose "Web app".
 * 6. Set:
 *    - Description: "Kalidass Sync v1"
 *    - Execute as: "Me" (your email)
 *    - Who has access: "Anyone"  <-- CRITICAL for website & admin sync!
 * 7. Click "Deploy", authorize permissions when prompted.
 * 8. COPY the "Web App URL" (starts with https://script.google.com/macros/s/.../exec).
 * 9. Paste this URL into your Kalidass Admin Portal under "Google Sheet Sync" settings
 *    or add to .env as: GOOGLE_SHEET_WEBHOOK_URL=https://script.google.com/.../exec
 * =========================================================================
 */

function setupSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Enquiries Sheet
  var enqSheet = ss.getSheetByName('Enquiries');
  if (!enqSheet) {
    enqSheet = ss.insertSheet('Enquiries');
    var headers = [
      'Quote ID',
      'Timestamp',
      'Customer Name',
      'Phone Number',
      'Trip Type',
      'Pickup Location',
      'Drop Location',
      'Vehicle',
      'Distance (km)',
      'Fare (INR)',
      'Status',
      'Source Page / Engine',
      'Notes & Metadata'
    ];
    enqSheet.appendRow(headers);
    enqSheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#1a73e8').setFontColor('#ffffff');
    enqSheet.setFrozenRows(1);
  }

  // 2. Bookings Sheet
  var bookSheet = ss.getSheetByName('Bookings');
  if (!bookSheet) {
    bookSheet = ss.insertSheet('Bookings');
    var bHeaders = [
      'Booking ID',
      'Timestamp',
      'Customer Name & Phone',
      'Travel Schedule',
      'Pickup ➔ Drop',
      'Vehicle',
      'Passengers',
      'Total Fare',
      'Advance Paid',
      'Chauffeur Share',
      'Driver Name',
      'Manifest Status',
      'Notes'
    ];
    bookSheet.appendRow(bHeaders);
    bookSheet.getRange(1, 1, 1, bHeaders.length).setFontWeight('bold').setBackground('#0f9d58').setFontColor('#ffffff');
    bookSheet.setFrozenRows(1);
  }

  return { enqSheet: enqSheet, bookSheet: bookSheet };
}

/**
 * Handle GET requests from Admin Dashboard to fetch real-time enquiries & bookings
 */
function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheets = setupSheets();
    var enqSheet = sheets.enqSheet;
    var bookSheet = sheets.bookSheet;

    var leads = [];
    var lastEnqRow = enqSheet.getLastRow();
    if (lastEnqRow > 1) {
      // Read up to last 100 rows (newest first)
      var startRow = Math.max(2, lastEnqRow - 99);
      var numRows = lastEnqRow - startRow + 1;
      var values = enqSheet.getRange(startRow, 1, numRows, 13).getValues();

      for (var i = values.length - 1; i >= 0; i--) {
        var row = values[i];
        if (row[0]) {
          var cleanPhone = String(row[3] || '').replace(/[^0-9]/g, '').slice(-10);
          leads.push({
            quoteId: String(row[0] || ''),
            timestamp: String(row[1] || ''),
            guestName: String(row[2] || (cleanPhone ? 'Customer (' + cleanPhone + ')' : 'Website Visitor')),
            phone: cleanPhone,
            sourcePage: cleanPhone ? (row[11] ? row[11] + ' (+91 ' + cleanPhone + ')' : '+91 ' + cleanPhone) : String(row[11] || 'Website Enquiry'),
            calculatorEngine: String(row[11] || 'Booking Engine'),
            tripType: String(row[4] || 'Round Trip'),
            pickup: String(row[5] || 'Chennai'),
            drop: String(row[6] || 'Outstation'),
            vehicle: String(row[7] || 'Swift Dzire'),
            distanceKm: String(row[8] || 'N/A'),
            estimatedFare: parseInt(String(row[9] || '0').replace(/[^0-9]/g, ''), 10) || 0,
            status: String(row[10] || 'Enquiry Sent'),
            metadata: String(row[12] || '')
          });
        }
      }
    }

    var bookings = [];
    var lastBookRow = bookSheet.getLastRow();
    if (lastBookRow > 1) {
      var bStartRow = Math.max(2, lastBookRow - 99);
      var bNumRows = lastBookRow - bStartRow + 1;
      var bValues = bookSheet.getRange(bStartRow, 1, bNumRows, 13).getValues();

      for (var j = bValues.length - 1; j >= 0; j--) {
        var bRow = bValues[j];
        if (bRow[0]) {
          var fare = parseInt(String(bRow[7] || '0').replace(/[^0-9]/g, ''), 10) || 0;
          var advance = parseInt(String(bRow[8] || '0').replace(/[^0-9]/g, ''), 10) || 0;
          var payout = parseInt(String(bRow[9] || '0').replace(/[^0-9]/g, ''), 10) || Math.round(fare * 0.8);
          bookings.push({
            bookingId: String(bRow[0] || ''),
            travelDateTime: String(bRow[3] || ''),
            guestNamePhone: String(bRow[2] || ''),
            pickupAddress: String(bRow[4] || ''),
            vehicleCategory: String(bRow[5] || 'Sedan'),
            partySize: String(bRow[6] || '4 Pax'),
            terminalFare: fare,
            advancePaid: advance,
            balanceDue: Math.max(0, fare - advance),
            chauffeurPayout: payout,
            companyMargin: fare - payout,
            assignedChauffeur: String(bRow[10] || 'Unassigned'),
            manifestStatus: String(bRow[11] || 'Need Driver'),
            metadata: String(bRow[12] || '')
          });
        }
      }
    }

    var result = {
      success: true,
      count: leads.length,
      leads: leads,
      calculatorQuotes: leads,
      bookings: bookings,
      syncedAt: new Date().toISOString()
    };

    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handle POST requests from website Booking Engines & Admin Operations
 */
function doPost(e) {
  try {
    var raw = e && e.postData ? e.postData.contents : '{}';
    var data = {};
    try {
      data = JSON.parse(raw);
    } catch (_) {
      data = {};
    }

    var sheets = setupSheets();
    var enqSheet = sheets.enqSheet;
    var bookSheet = sheets.bookSheet;

    var isBooking = (data.type === 'admin_booking_sync' ||
                     data.type === 'booking' ||
                     Boolean(data.bookingId && String(data.bookingId).startsWith('#KT-BK-'))) &&
                     data.type !== 'calculator_activity';

    if (isBooking) {
      // Record or update Confirmed Booking
      var bookingId = data.bookingId || ('#KT-BK-' + Math.floor(1000 + Math.random() * 9000));
      var guestNamePhone = data.guestNamePhone || (data.name ? (data.name + ' (' + (data.phone || '') + ')') : (data.phone || 'Customer'));
      var schedule = data.travelDateTime || data.travelDate || data.pickupDate || 'Tomorrow';
      var route = data.pickupAddress || (data.pickup + ' ➔ ' + (data.drop || 'Outstation'));
      var vehicle = data.vehicleCategory || data.vehicle || 'Sedan';
      var pax = data.partySize || data.passengers || '4 Pax';
      var fare = parseInt(String(data.terminalFare || data.fare || data.estimate || 0).replace(/[^0-9]/g, ''), 10) || 0;
      var advance = parseInt(String(data.advancePaid || data.advance || 0).replace(/[^0-9]/g, ''), 10) || 0;
      var payout = parseInt(String(data.chauffeurPayout || Math.round(fare * 0.8)).replace(/[^0-9]/g, ''), 10) || 0;
      var driver = data.assignedChauffeur || 'Unassigned';
      var status = data.manifestStatus || 'Need Driver';
      var notes = data.metadata || data.notes || '';

      // Check if booking already exists to update
      var bLast = bookSheet.getLastRow();
      var foundRow = -1;
      if (bLast > 1) {
        var bIds = bookSheet.getRange(2, 1, bLast - 1, 1).getValues();
        for (var k = 0; k < bIds.length; k++) {
          if (String(bIds[k][0]).trim().toLowerCase() === bookingId.trim().toLowerCase()) {
            foundRow = k + 2;
            break;
          }
        }
      }

      // Handle Delete / Cancel booking
      if (data.action === 'delete' || data.action === 'cancel') {
        if (foundRow > 0) {
          bookSheet.deleteRow(foundRow);
        }
        return ContentService
          .createTextOutput(JSON.stringify({ success: true, bookingId: bookingId, action: 'deleted' }))
          .setMimeType(ContentService.MimeType.JSON);
      }

      var bRowData = [
        bookingId,
        new Date().toLocaleString('en-IN'),
        guestNamePhone,
        schedule,
        route,
        vehicle,
        pax,
        fare,
        advance,
        payout,
        driver,
        status,
        notes
      ];

      if (foundRow > 0) {
        bookSheet.getRange(foundRow, 1, 1, bRowData.length).setValues([bRowData]);
      } else {
        bookSheet.appendRow(bRowData);
      }

      return ContentService
        .createTextOutput(JSON.stringify({ success: true, bookingId: bookingId, action: foundRow > 0 ? 'updated' : 'created' }))
        .setMimeType(ContentService.MimeType.JSON);

    } else {
      // Record Customer Enquiry / Quote (Numbers in order, starting from 101)
      var isExplicitEnquiry = data.type === 'enquiry' ||
                              data.leadType === 'enquiry' ||
                              (data.quoteId && String(data.quoteId).startsWith('#ENQ'));

      var prefix = isExplicitEnquiry ? '#ENQ-' : '#QT-';

      // Check if incoming quoteId already has an in-order sequential number (>= 101)
      var incomingId = String(data.quoteId || (data.meta && data.meta.quoteRefId) || '').trim();
      var hasSeqNum = false;
      if (incomingId) {
        var numMatch = incomingId.match(/(?:QT|ENQ|KT)-?(\d+)/i);
        if (numMatch) {
          var n = parseInt(numMatch[1], 10);
          if (!isNaN(n) && n >= 101 && n < 5000) {
            hasSeqNum = true;
          }
        }
      }

      // Check if enquiry with this quoteId already exists in Enquiries sheet
      var eLast = enqSheet.getLastRow();
      var foundEnqRow = -1;
      if (eLast > 1 && incomingId) {
        var eIds = enqSheet.getRange(2, 1, eLast - 1, 1).getValues();
        for (var m = 0; m < eIds.length; m++) {
          if (String(eIds[m][0]).trim().toLowerCase() === incomingId.toLowerCase()) {
            foundEnqRow = m + 2;
            break;
          }
        }
      }

      var quoteId = foundEnqRow > 0 
        ? enqSheet.getRange(foundEnqRow, 1).getValue()
        : (hasSeqNum ? incomingId : getNextSequenceId(enqSheet, prefix));

      var eRowData = [
        quoteId,
        timestamp,
        name || (cleanPhone ? 'Customer (' + cleanPhone + ')' : 'Website Visitor'),
        cleanPhone ? '+91 ' + cleanPhone : 'Not Provided',
        tripType,
        pickup,
        drop,
        vehicle,
        distance,
        estimate,
        status,
        source,
        meta
      ];

      if (foundEnqRow > 0) {
        // Update existing row
        var existingRow = enqSheet.getRange(foundEnqRow, 1, 1, 13).getValues()[0];
        if (!name && existingRow[2] && existingRow[2] !== 'Website Visitor') eRowData[2] = existingRow[2];
        if (!cleanPhone && existingRow[3] && existingRow[3] !== 'Not Provided') eRowData[3] = existingRow[3];
        eRowData[1] = existingRow[1]; // Keep original creation timestamp
        enqSheet.getRange(foundEnqRow, 1, 1, eRowData.length).setValues([eRowData]);
      } else {
        enqSheet.appendRow(eRowData);
      }

      return ContentService
        .createTextOutput(JSON.stringify({ success: true, quoteId: quoteId, action: foundEnqRow > 0 ? 'updated' : 'created' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Helper to compute the next sequential number starting from 101.
 * Ensures Quotations (#QT-101+) and Enquiries (#ENQ-101+) stay strictly in order.
 */
function getNextSequenceId(sheet, prefix) {
  var lastRow = sheet.getLastRow();
  var startSeq = 101;
  if (lastRow <= 1) {
    return (prefix || '#QT-') + startSeq;
  }

  var values = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  var maxNum = startSeq - 1; // 100
  var threshold = Math.max(500, lastRow + 200);

  for (var i = 0; i < values.length; i++) {
    var val = String(values[i][0] || '').trim();
    var match = val.match(/(?:QT|ENQ|KT|CALL|WA)-?(\d+)/i);
    if (match) {
      var num = parseInt(match[1], 10);
      if (!isNaN(num) && num >= startSeq && num <= threshold) {
        if (num > maxNum) {
          maxNum = num;
        }
      }
    }
  }

  // If no sequential numbers exist yet among rows, calculate from row count
  if (maxNum === startSeq - 1) {
    maxNum = (startSeq - 1) + (lastRow - 1);
  }

  return (prefix || '#QT-') + (maxNum + 1);
}

/**
 * Optional Maintenance Utility:
 * Run this function from Apps Script editor to re-number any existing rows in the
 * 'Enquiries' sheet in order starting from 101 (#ENQ-101, #ENQ-102 or #QT-101...).
 */
function renumberEnquiriesAndQuotesFrom101() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Enquiries');
  if (!sheet) return;
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return;

  var idsRange = sheet.getRange(2, 1, lastRow - 1, 1);
  var values = idsRange.getValues();
  var seq = 101;

  for (var i = 0; i < values.length; i++) {
    var currentId = String(values[i][0] || '').trim();
    var prefix = currentId.indexOf('ENQ') !== -1 ? '#ENQ-' : '#QT-';
    values[i][0] = prefix + seq;
    seq++;
  }

  idsRange.setValues(values);
}
