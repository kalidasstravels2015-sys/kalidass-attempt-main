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

  // 3. Driver Leads Sheet
  var driverSheet = ss.getSheetByName('Driver Leads');
  if (!driverSheet) {
    driverSheet = ss.insertSheet('Driver Leads');
    var dHeaders = [
      'Lead ID',
      'Timestamp',
      'Applicant Name',
      'Phone Number',
      'Category',
      'Fleet / License Details',
      'Operating Area',
      'Google Drive Folder',
      'Status',
      'Notes'
    ];
    driverSheet.appendRow(dHeaders);
    driverSheet.getRange(1, 1, 1, dHeaders.length).setFontWeight('bold').setBackground('#673ab7').setFontColor('#ffffff');
    driverSheet.setFrozenRows(1);
  }

  // 4. Active Drivers Roster Sheet (2-way sync with /admin/#drivers)
  var activeDriversSheet = ss.getSheetByName('Drivers');
  if (!activeDriversSheet) {
    activeDriversSheet = ss.insertSheet('Drivers');
    var adHeaders = [
      'id', 'name', 'phone', 'category', 'vehicle', 'plate', 'zone', 'area',
      'languages', 'boardType', 'carrier', 'partnerType', 'notes', 'createdAt', 'updatedAt'
    ];
    activeDriversSheet.appendRow(adHeaders);
    activeDriversSheet.getRange(1, 1, 1, adHeaders.length).setFontWeight('bold').setBackground('#0b57d0').setFontColor('#ffffff');
    activeDriversSheet.setFrozenRows(1);
  }

  return { enqSheet: enqSheet, bookSheet: bookSheet, driverSheet: driverSheet, activeDriversSheet: activeDriversSheet };
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
    var driverSheet = sheets.driverSheet;

    // Dedicated Atomic Sequence Coordinator for Website Quotations (Q-DDMMYY-X)
    var action = (e && e.parameter && e.parameter.action) || '';
    if (action === 'next_quote_id' || action === 'quote_id') {
      var lock = LockService.getScriptLock();
      var gotLock = lock.tryLock(5000);
      try {
        var dateCode = (e && e.parameter && e.parameter.dateCode) || Utilities.formatDate(new Date(), 'Asia/Kolkata', 'ddMMyy');
        var props = PropertiesService.getScriptProperties();
        var propKey = 'quote_seq_' + dateCode;
        var currentSeq = parseInt(props.getProperty(propKey) || '0', 10);

        // Also cross-check Enquiries & Bookings sheets for both Q-DDMMYY-N and KT/DDMMM/NN
        var monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
        var ddStr = dateCode.slice(0, 2);
        var mmIdx = Math.max(0, Math.min(11, parseInt(dateCode.slice(2, 4), 10) - 1));
        var ktPrefix = 'KT\\/' + ddStr + (monthNames[mmIdx] || 'NOV') + '\\/';
        var qRegex = new RegExp('Q-' + dateCode + '-(\\d+)', 'gi');
        var ktRegex = new RegExp(ktPrefix + '0*(\\d+)', 'gi');

        var scanRangeForMax = function(sheet) {
          var lastR = sheet.getLastRow();
          if (lastR <= 1) return;
          var vals = sheet.getRange(2, 1, lastR - 1, sheet.getLastColumn()).getValues();
          for (var r = 0; r < vals.length; r++) {
            var rowText = String(vals[r][0] || '') + ' ' + String(vals[r][vals[r].length - 1] || '');
            var m;
            qRegex.lastIndex = 0;
            while ((m = qRegex.exec(rowText)) !== null) {
              var n1 = parseInt(m[1], 10);
              if (!isNaN(n1) && n1 > currentSeq) currentSeq = n1;
            }
            ktRegex.lastIndex = 0;
            while ((m = ktRegex.exec(rowText)) !== null) {
              var n2 = parseInt(m[1], 10);
              if (!isNaN(n2) && n2 > currentSeq) currentSeq = n2;
            }
          }
        };
        scanRangeForMax(enqSheet);
        scanRangeForMax(bookSheet);

        var shouldAdvance = Boolean(e && e.parameter && (e.parameter.claim === 'true' || e.parameter.advance === 'true' || e.parameter.reserve === 'true'));
        var nextSeq = currentSeq + 1;
        if (shouldAdvance) {
          props.setProperty(propKey, String(nextSeq));
        }

        var assignedId = 'Q-' + dateCode + '-' + (shouldAdvance ? nextSeq : nextSeq);

        return ContentService
          .createTextOutput(JSON.stringify({
            success: true,
            dateCode: dateCode,
            currentSeq: currentSeq,
            nextSeq: nextSeq,
            quoteId: assignedId,
            claimed: shouldAdvance
          }))
          .setMimeType(ContentService.MimeType.JSON);
      } finally {
        if (gotLock) lock.releaseLock();
      }
    }

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
          var rawDate = row[1];
          var timestampStr = '';
          if (rawDate instanceof Date) {
            timestampStr = Utilities.formatDate(rawDate, 'Asia/Kolkata', 'dd MMM yyyy, hh:mm a');
          } else {
            timestampStr = String(rawDate || '');
          }
          var status = String(row[10] || 'Enquiry Sent');
          if (status === 'Cancelled' || status === 'Deleted') continue;

          leads.push({
            quoteId: String(row[0] || ''),
            timestamp: timestampStr,
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
            status: status,
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
            partySize: String(bRow[6] || '4 Seats'),
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

    var driverLeads = [];
    var lastDrvRow = driverSheet.getLastRow();
    if (lastDrvRow > 1) {
      var dStartRow = Math.max(2, lastDrvRow - 99);
      var dNumRows = lastDrvRow - dStartRow + 1;
      var dValues = driverSheet.getRange(dStartRow, 1, dNumRows, 11).getValues();

      for (var d = dValues.length - 1; d >= 0; d--) {
        var dRow = dValues[d];
        if (dRow[0]) {
          driverLeads.push({
            leadId: String(dRow[0] || ''),
            timestamp: String(dRow[1] || ''),
            name: String(dRow[2] || ''),
            phone: String(dRow[3] || ''),
            category: String(dRow[4] || ''),
            details: String(dRow[5] || ''),
            city: String(dRow[6] || ''),
            dlDriveUrl: String(dRow[7] || ''),
            rcDriveUrl: String(dRow[8] || ''),
            status: String(dRow[9] || 'Pending Review'),
            notes: String(dRow[10] || '')
          });
        }
      }
    }

    var activeDrivers = [];
    var activeDriversSheet = sheets.activeDriversSheet;
    if (activeDriversSheet && activeDriversSheet.getLastRow() > 1) {
      var adRows = activeDriversSheet.getDataRange().getValues();
      var adHeaders = adRows[0];
      for (var adIdx = 1; adIdx < adRows.length; adIdx++) {
        var adRow = adRows[adIdx];
        if (!adRow[0] && !adRow[1]) continue;
        var drvObj = {};
        for (var adCol = 0; adCol < adHeaders.length; adCol++) {
          drvObj[adHeaders[adCol]] = adRow[adCol];
        }
        activeDrivers.push(drvObj);
      }
    }

    var result = {
      success: true,
      schemaVersion: 2,
      count: leads.length,
      leads: leads,
      calculatorQuotes: leads,
      bookings: bookings,
      driverLeads: driverLeads,
      drivers: activeDrivers,
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
    var activeDriversSheet = sheets.activeDriversSheet;

    // Active Drivers Roster CRUD (2-way sync with /admin/#drivers)
    if (data.action === 'SAVE_DRIVER' && data.driver && activeDriversSheet) {
      var drv = data.driver;
      var adRows = activeDriversSheet.getDataRange().getValues();
      var adHeaders = adRows[0];
      var adIdIdx = adHeaders.indexOf('id');
      if (adIdIdx < 0) adIdIdx = 0;
      var foundDrvRow = -1;
      for (var dr = 1; dr < adRows.length; dr++) {
        if (String(adRows[dr][adIdIdx]) === String(drv.id)) {
          foundDrvRow = dr + 1;
          break;
        }
      }
      var drvRowData = [];
      for (var dc = 0; dc < adHeaders.length; dc++) {
        var val = drv[adHeaders[dc]];
        if (Array.isArray(val)) val = val.join(', ');
        drvRowData.push(val !== undefined && val !== null ? val : '');
      }
      if (foundDrvRow > 0) {
        activeDriversSheet.getRange(foundDrvRow, 1, 1, drvRowData.length).setValues([drvRowData]);
      } else {
        activeDriversSheet.appendRow(drvRowData);
      }
      return ContentService.createTextOutput(JSON.stringify({ success: true, id: drv.id })).setMimeType(ContentService.MimeType.JSON);
    }

    if (data.action === 'DELETE_DRIVER' && data.id && activeDriversSheet) {
      var delRows = activeDriversSheet.getDataRange().getValues();
      var delIdIdx = delRows[0].indexOf('id');
      if (delIdIdx < 0) delIdIdx = 0;
      for (var dli = 1; dli < delRows.length; dli++) {
        if (String(delRows[dli][delIdIdx]) === String(data.id)) {
          activeDriversSheet.deleteRow(dli + 1);
          break;
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
    }
    var bookSheet = sheets.bookSheet;
    var driverSheet = sheets.driverSheet;

    // Fast-path: Centralized atomic quote ID allocation
    if (data.action === 'next_quote_id' || data.type === 'next_quote_id') {
      var lock = LockService.getScriptLock();
      var gotLock = lock.tryLock(5000);
      try {
        var dateCode = data.dateCode || Utilities.formatDate(new Date(), 'Asia/Kolkata', 'ddMMyy');
        var props = PropertiesService.getScriptProperties();
        var propKey = 'quote_seq_' + dateCode;
        var currentSeq = parseInt(props.getProperty(propKey) || '0', 10);

        if (currentSeq === 0) {
          var enqLast = enqSheet.getLastRow();
          if (enqLast > 1) {
            var enqIds = enqSheet.getRange(2, 1, enqLast - 1, 1).getValues();
            var qRegex = new RegExp('^Q-' + dateCode + '-(\\d+)$', 'i');
            for (var r = 0; r < enqIds.length; r++) {
              var qVal = String(enqIds[r][0] || '').trim();
              var qMatch = qVal.match(qRegex);
              if (qMatch) {
                var qNum = parseInt(qMatch[1], 10);
                if (!isNaN(qNum) && qNum > currentSeq) {
                  currentSeq = qNum;
                }
              }
            }
          }
        }

        var newSeq = currentSeq + 1;
        props.setProperty(propKey, String(newSeq));
        var quoteId = 'Q-' + dateCode + '-' + newSeq;

        return ContentService
          .createTextOutput(JSON.stringify({
            success: true,
            dateCode: dateCode,
            currentSeq: currentSeq,
            seq: newSeq,
            quoteId: quoteId,
            nextQuoteId: 'Q-' + dateCode + '-' + (newSeq + 1)
          }))
          .setMimeType(ContentService.MimeType.JSON);
      } finally {
        if (gotLock) lock.releaseLock();
      }
    }

    var isDriverLead = data.type === 'driver_lead' ||
                       Boolean(data.leadId && String(data.leadId).indexOf('DRV') !== -1) ||
                       (data.tripType && String(data.tripType).indexOf('Driver Lead') !== -1) ||
                       (data.category && (data.category === 'Attach Car' || data.category === 'Acting Driver'));

    if (isDriverLead) {
      var dLast = driverSheet.getLastRow();
      var incomingLeadId = String(data.leadId || data.referenceId || '').trim();
      var leadId = incomingLeadId || getNextSequenceId(driverSheet, '#KT-DRV-');
      var timestamp = data.timestamp || data.date || Utilities.formatDate(new Date(), 'Asia/Kolkata', 'dd MMM yyyy, hh:mm a');
      var name = data.name || data.guestName || 'Driver Applicant';
      var rawPhone = data.phone || data.mobile || '';
      var cleanPhone = String(rawPhone).replace(/[^0-9]/g, '').slice(-10);

      // Strict Guard: Reject submissions without a valid 10-digit mobile number to stop dummy rows
      if (!cleanPhone || cleanPhone.length !== 10 || cleanPhone === '9999999999' || cleanPhone.startsWith('00000')) {
        return ContentService.createTextOutput(
          JSON.stringify({ success: false, error: 'A valid 10-digit mobile phone number is required.' })
        ).setMimeType(ContentService.MimeType.JSON);
      }

      // Deduplication check: If driver with this phone already exists in the sheet, update their row!
      var foundLeadRow = 0;
      if (dLast > 1) {
        var phoneValues = driverSheet.getRange(2, 4, dLast - 1, 1).getValues();
        for (var p = 0; p < phoneValues.length; p++) {
          var existingPhone = String(phoneValues[p][0] || '').replace(/[^0-9]/g, '').slice(-10);
          if (existingPhone && existingPhone === cleanPhone) {
            foundLeadRow = p + 2;
            leadId = String(driverSheet.getRange(foundLeadRow, 1).getValue() || leadId);
            break;
          }
        }
      }

      var category = data.category || 'Attach Car';
      var details = data.details || (category === 'Attach Car' 
        ? ((data.carCount || '') + ' (' + (data.cars || '') + ') - Plate: ' + (data.plateType || 'Yellow Board'))
        : ((data.licenseType || '') + ' - Exp: ' + (data.experience || '') + ' - Duty: ' + (data.preferredDuty || 'All')));
      var city = data.city || data.pickup || 'Chennai';
      var notes = data.notes || data.drop || '';

      // 1. Create dedicated applicant folder in Google Drive
      var folder = getOrCreateApplicantFolder(leadId, name, cleanPhone, category);
      var folderUrl = folder.getUrl();

      // 2. Save Driving License Photo
      if (data.dlFile && data.dlFile.base64) {
        saveBase64ToFolder(folder, data.dlFile.base64, leadId + '-DL-License.jpg', data.dlFile.mimeType || 'image/jpeg');
      }

      // 3. Save RC Book Photo
      if (data.rcFile && data.rcFile.base64) {
        saveBase64ToFolder(folder, data.rcFile.base64, leadId + '-RC-Book.jpg', data.rcFile.mimeType || 'image/jpeg');
      }

      // 4. Save Car Front Photo
      if (data.carFile && data.carFile.base64) {
        saveBase64ToFolder(folder, data.carFile.base64, leadId + '-CAR-Front-Plate.jpg', data.carFile.mimeType || 'image/jpeg');
      }

      // 5. Create Applicant Summary Text File in the folder
      var summaryText = [
        '=====================================================',
        '  KALIDASS TRAVELS — DRIVER / CAB ATTACHMENT DETAILS',
        '=====================================================',
        'Reference ID       : ' + leadId,
        'Submission Date    : ' + timestamp,
        'Applicant Name     : ' + name,
        'Phone Number       : ' + (cleanPhone ? '+91 ' + cleanPhone : 'Not Provided'),
        'Category           : ' + category,
        'Vehicle / License  : ' + details,
        'Operating Area     : ' + city,
        'Review Status      : Pending Review',
        'Additional Notes   : ' + (notes || 'None'),
        'Drive Folder Link  : ' + folderUrl,
        '=====================================================',
        'Official Portal    : https://kalidasstravels.in/attach-cab/',
        'Dispatch Desk      : +91 90923 03060 / +91 89395 39211'
      ].join('\n');
      folder.createFile('Applicant_Details.txt', summaryText, 'text/plain');

      // 6. Ensure header structure in Driver Leads sheet
      var dHeaders = [
        'Lead ID',
        'Timestamp',
        'Applicant Name',
        'Phone Number',
        'Category',
        'Fleet / License Details',
        'Operating Area',
        'Google Drive Folder',
        'Status',
        'Notes'
      ];
      if (dLast <= 1) {
        driverSheet.clearContents();
        driverSheet.appendRow(dHeaders);
        driverSheet.getRange(1, 1, 1, dHeaders.length).setFontWeight('bold').setBackground('#673ab7').setFontColor('#ffffff');
        driverSheet.setFrozenRows(1);
      } else {
        driverSheet.getRange(1, 1, 1, dHeaders.length).setValues([dHeaders]);
        driverSheet.getRange(1, 1, 1, dHeaders.length).setFontWeight('bold').setBackground('#673ab7').setFontColor('#ffffff');
      }

      var folderHyperlink = '=HYPERLINK("' + folderUrl + '", "📂 Open Drive Folder")';
      var cleanPhoneCell = cleanPhone ? ("'" + cleanPhone) : '';

      var dRowData = [
        leadId,
        timestamp,
        name,
        cleanPhoneCell,
        category,
        details,
        city,
        folderHyperlink,
        'Pending Review',
        notes
      ];

      if (foundLeadRow > 0) {
        driverSheet.getRange(foundLeadRow, 1, 1, dRowData.length).setValues([dRowData]);
      } else {
        driverSheet.appendRow(dRowData);
      }

      return ContentService
        .createTextOutput(JSON.stringify({
          success: true,
          leadId: leadId,
          driveFolderUrl: folderUrl,
          action: foundLeadRow > 0 ? 'updated' : 'created'
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var isBooking = (data.type === 'admin_booking_sync' ||
                     data.type === 'booking' ||
                     Boolean(data.bookingId && String(data.bookingId).startsWith('#KT-BK-'))) &&
                     data.type !== 'calculator_activity';

    if (isBooking) {
      // Record or update Confirmed Booking (Strict continuous serial numbering starting from 101)
      var incomingBookingId = String(data.bookingId || '').trim();
      var hasSeqBooking = false;
      var bLast = bookSheet.getLastRow();
      var bMaxAllowed = (101 - 1) + Math.max(bLast + 50, 100);
      if (incomingBookingId) {
        var bNumMatch = incomingBookingId.match(/(?:QT|ENQ|WA|CALL|KT|BK|CAB|MAA|OUT|TPT|PDY|TMP|ACT)-?(\d+)/i);
        if (bNumMatch) {
          var bn = parseInt(bNumMatch[1], 10);
          if (!isNaN(bn) && bn >= 101 && bn <= bMaxAllowed) {
            hasSeqBooking = true;
          }
        }
      }
      var bookingId = hasSeqBooking ? incomingBookingId : getNextSequenceId(bookSheet, '#KT-BK-');
      var guestNamePhone = data.guestNamePhone || (data.name ? (data.name + ' (' + (data.phone || '') + ')') : (data.phone || 'Customer'));
      var schedule = data.travelDateTime || data.travelDate || data.pickupDate || 'Tomorrow';
      var route = data.pickupAddress || (data.pickup ? (data.pickup + ' ➔ ' + (data.drop || 'Outstation')) : (data.drop || 'Chennai ➔ Outstation'));
      var vehicle = data.vehicleCategory || data.vehicle || 'Sedan';
      var pax = data.partySize || data.passengers || '4 Seats';
      var fare = parseInt(String(data.terminalFare || data.fare || data.estimate || 0).replace(/[^0-9]/g, ''), 10) || 0;
      var advance = parseInt(String(data.advancePaid || data.advance || 0).replace(/[^0-9]/g, ''), 10) || 0;
      var payout = parseInt(String(data.chauffeurPayout || Math.round(fare * 0.8)).replace(/[^0-9]/g, ''), 10) || 0;
      var driver = data.assignedChauffeur || 'Unassigned';
      var status = data.manifestStatus || 'Need Driver';
      var notes = data.metadata || data.notes || '';

      // Check if booking already exists to update
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
        try {
          syncBookingToGoogleCalendar({ bookingId: bookingId, action: 'delete' });
        } catch (_) {}
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

      // Sync confirmed booking to Google Calendar with 24h and 2h reminders
      try {
        syncBookingToGoogleCalendar({
          bookingId: bookingId,
          action: foundRow > 0 ? 'update' : 'create',
          guestNamePhone: guestNamePhone,
          schedule: schedule,
          route: route,
          vehicle: vehicle,
          pax: pax,
          fare: fare,
          advance: advance,
          driver: driver,
          status: status,
          notes: notes
        });
      } catch (calErr) {
        Logger.log('Calendar sync skipped: ' + calErr.toString());
      }

      return ContentService
        .createTextOutput(JSON.stringify({ success: true, bookingId: bookingId, action: foundRow > 0 ? 'updated' : 'created' }))
        .setMimeType(ContentService.MimeType.JSON);

    } else {
      // Record Customer Enquiry / Quote / Website Calculation (Strict continuous serial numbering starting from 101)
      var incomingId = String(data.quoteId || data.bookingId || (data.meta && data.meta.quoteRefId) || '').trim();
      var isExplicitEnquiry = data.type === 'enquiry' ||
                              data.leadType === 'enquiry' ||
                              Boolean(incomingId && (incomingId.indexOf('ENQ') !== -1 || incomingId.indexOf('MAA') !== -1 || incomingId.indexOf('CAB') !== -1 || incomingId.indexOf('TMP') !== -1 || incomingId.indexOf('ACT') !== -1 || incomingId.indexOf('PDY') !== -1 || incomingId.indexOf('TPT') !== -1));

      var prefix = isExplicitEnquiry ? '#ENQ-' : '#QT-';

      // Check if incoming quoteId already has a valid continuous sequential number (>= 101)
      var hasSeqNum = false;
      var eLast = enqSheet.getLastRow();
      var eMaxAllowed = (101 - 1) + Math.max(eLast + 50, 100);

      var dateQuoteMatch = incomingId.match(/^Q-(\d{6})-(\d+)$/i);
      if (dateQuoteMatch) {
        hasSeqNum = true;
        try {
          var qdCode = dateQuoteMatch[1];
          var qdNum = parseInt(dateQuoteMatch[2], 10);
          var qprops = PropertiesService.getScriptProperties();
          var qpropKey = 'quote_seq_' + qdCode;
          var curProp = parseInt(qprops.getProperty(qpropKey) || '0', 10);
          if (qdNum > curProp) {
            qprops.setProperty(qpropKey, String(qdNum));
          }
        } catch (_) {}
      } else if (incomingId) {
        var numMatch = incomingId.match(/(?:QT|ENQ|KT|CALC|CALL|WA)[-_/A-Za-z0-9]*[-_]?(\d+)/i) || incomingId.match(/(\d+)/);
        if (numMatch) {
          var n = parseInt(numMatch[1], 10);
          if (!isNaN(n) && n >= 101 && n <= eMaxAllowed) {
            hasSeqNum = true;
          }
        }
      }

      // Check if enquiry with this quoteId already exists in Enquiries sheet
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

      // Handle Delete / Cancel enquiry
      if (data.action === 'delete' || data.action === 'cancel' || data.status === 'Cancelled' || data.status === 'Deleted') {
        if (foundEnqRow > 0) {
          enqSheet.deleteRow(foundEnqRow);
        }
        return ContentService
          .createTextOutput(JSON.stringify({ success: true, quoteId: incomingId, action: 'deleted' }))
          .setMimeType(ContentService.MimeType.JSON);
      }

      var quoteId = foundEnqRow > 0 
        ? enqSheet.getRange(foundEnqRow, 1).getValue()
        : (hasSeqNum ? incomingId : getNextSequenceId(enqSheet, prefix));

      var timestamp = data.date || data.timestamp || new Date().toLocaleString('en-IN');
      var name = data.guestName || data.name || '';
      var rawPhone = data.phone || data.mobile || '';
      var cleanPhone = String(rawPhone).replace(/[^0-9]/g, '').slice(-10);
      var tripType = data.tripType || 'Round Trip';
      var pickup = data.pickup || 'Chennai';
      var drop = data.drop || 'Outstation';
      var vehicle = data.vehicle || 'Swift Dzire';
      var distance = data.distance || data.distanceKm || 'N/A';
      var estimate = parseInt(String(data.estimate || data.estimatedFare || data.fare || 0).replace(/[^0-9]/g, ''), 10) || 0;
      var status = data.status || 'Rate Locked';
      var source = data.sourcePage || data.calculatorEngine || 'Website Calculator';
      var meta = typeof data.metadata === 'object' ? JSON.stringify(data.metadata) : (data.metadata || (data.meta ? JSON.stringify(data.meta) : ''));

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
 * Helper to compute the next continuous sequential number starting from 101.
 * Ensures Quotations (#QT-101+), Enquiries (#ENQ-101+) and Bookings (#KT-BK-101+) stay strictly continuous.
 * Ignores any past random numbers.
 */
function getNextSequenceId(sheet, prefix) {
  var lastRow = sheet.getLastRow();
  var startSeq = 101;
  prefix = prefix || '#QT-';
  if (lastRow <= 1) {
    return prefix + startSeq;
  }

  var values = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  var maxNum = startSeq - 1; // 100
  // Threshold strictly ignores legacy random 4-digit numbers (e.g. 5046, 9123, 866992)
  var threshold = (startSeq - 1) + Math.max(values.length + 30, 100);

  var cleanPrefix = prefix.replace(/[^A-Za-z0-9]/g, '').toUpperCase();

  for (var i = 0; i < values.length; i++) {
    var val = String(values[i][0] || '').trim();
    if (!val) continue;

    var valClean = val.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    // Filter for matching prefix
    if (!cleanPrefix || valClean.indexOf(cleanPrefix) !== -1 || (cleanPrefix === 'QT' && val.indexOf('CALC') !== -1) || (cleanPrefix.indexOf('DRV') !== -1 && valClean.indexOf('DRV') !== -1)) {
      var match = val.match(/(\d+)/);
      if (match) {
        var num = parseInt(match[1], 10);
        if (!isNaN(num) && num >= startSeq && num <= threshold) {
          if (num > maxNum) {
            maxNum = num;
          }
        }
      }
    }
  }

  // If no valid continuous sequence numbers exist yet, count from row count
  if (maxNum === startSeq - 1) {
    maxNum = (startSeq - 1) + (lastRow - 1);
  }

  return prefix + (maxNum + 1);
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

/**
 * ONE-CLICK REPAIR UTILITY:
 * Run this function from Apps Script Editor to clean up the 'Driver Leads' sheet:
 * 1. Purges all dummy, test, and blank visitor rows.
 * 2. Deduplicates multiple submissions by phone number (keeps latest full vehicle entry).
 * 3. Renumbers strictly from #KT-DRV-101 in chronological order:
 *    - #KT-DRV-101: Saravanan K (Acting Driver)
 *    - #KT-DRV-102: Sriram (Swift Dzire)
 *    - #KT-DRV-103: Moorthy K (Swift Dzire)
 *    - #KT-DRV-104: Sivakumar (Other Commercial Cab)
 * 4. Ensures Google Drive hyperlinks are working.
 */
function cleanAndFixDriverLeadsSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Driver Leads');
  if (!sheet) return;
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return;

  var range = sheet.getRange(2, 1, lastRow - 1, 10);
  var values = range.getValues();
  var formulas = range.getFormulas();

  var phoneMap = {};
  var order = [];

  for (var i = 0; i < values.length; i++) {
    var r = values[i];
    var formula = (formulas[i] && formulas[i][7]) ? formulas[i][7] : '';
    var rawPhone = String(r[3] || '');
    var cleanPhone = rawPhone.replace(/[^0-9]/g, '').slice(-10);
    var name = String(r[2] || '').trim();

    // Skip dummy, test, or blank entries
    if (!cleanPhone || cleanPhone.length !== 10 || cleanPhone === '9999999999' || cleanPhone.startsWith('00000')) continue;
    if (/test|verify|applicant|visitor/i.test(name) && cleanPhone.length !== 10) continue;
    if (String(r[0] || '').indexOf('TEST') !== -1) continue;

    var driveLink = formula || r[7];
    var entry = {
      timestamp: r[1],
      name: name,
      phone: "'" + cleanPhone,
      category: r[4],
      details: r[5],
      city: r[6],
      folder: driveLink,
      status: r[8] || 'Pending Review',
      notes: r[9] || ''
    };

    if (!phoneMap[cleanPhone]) {
      phoneMap[cleanPhone] = entry;
      order.push(cleanPhone);
    } else {
      // If duplicate, prefer the one with vehicle details
      var existing = phoneMap[cleanPhone];
      if (String(entry.details).indexOf('Car (') !== -1 && String(entry.details).indexOf('Car ()') === -1) {
        phoneMap[cleanPhone] = entry;
      }
    }
  }

  // Clear existing rows (keep header)
  sheet.getRange(2, 1, Math.max(lastRow - 1, 1), 10).clearContent();

  // Write clean sequenced rows starting from #KT-DRV-101
  var startSeq = 101;
  var cleanRows = [];
  for (var k = 0; k < order.length; k++) {
    var p = order[k];
    var item = phoneMap[p];
    var seqId = '#KT-DRV-' + (startSeq + k);
    cleanRows.push([
      seqId,
      item.timestamp,
      item.name,
      item.phone,
      item.category,
      item.details,
      item.city,
      item.folder,
      item.status,
      item.notes
    ]);
  }

  if (cleanRows.length > 0) {
    sheet.getRange(2, 1, cleanRows.length, 10).setValues(cleanRows);
  }
}

/**
 * Optional Maintenance Utility:
 * Run this function from Apps Script editor to re-number any existing rows in the
 * 'Bookings' sheet in order starting from 101 (#KT-BK-101, #KT-BK-102...).
 */
function renumberBookingsFrom101() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Bookings');
  if (!sheet) return;
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return;

  var idsRange = sheet.getRange(2, 1, lastRow - 1, 1);
  var values = idsRange.getValues();
  var seq = 101;

  for (var i = 0; i < values.length; i++) {
    values[i][0] = '#KT-BK-' + seq;
    seq++;
  }

  idsRange.setValues(values);
}

/**
 * Automatically syncs Confirmed Bookings to Google Calendar with 24h and 2h reminders.
 */
function syncBookingToGoogleCalendar(b) {
  if (typeof CalendarApp === 'undefined') return;

  var cal = CalendarApp.getDefaultCalendar();
  if (!cal) return;

  var bookingId = b.bookingId;
  if (!bookingId) return;

  var now = new Date();
  var searchEnd = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days ahead
  var searchStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days in past
  var existingEvents = cal.getEvents(searchStart, searchEnd, { search: bookingId });

  // Handle Cancel / Delete action
  if (b.action === 'delete' || b.action === 'cancel' || b.status === 'Cancelled') {
    for (var i = 0; i < existingEvents.length; i++) {
      existingEvents[i].deleteEvent();
    }
    return;
  }

  // Parse Travel Date
  var scheduleStr = String(b.schedule || '');
  var startTime = new Date();
  var lower = scheduleStr.toLowerCase();

  if (lower.indexOf('tomorrow') !== -1) {
    startTime.setDate(startTime.getDate() + 1);
    startTime.setHours(6, 0, 0, 0);
  } else if (lower.indexOf('today') !== -1) {
    startTime.setHours(6, 0, 0, 0);
  } else {
    var cleanSchedule = scheduleStr.replace('@', ' ').replace(/\s+/g, ' ').trim();
    var parsed = Date.parse(cleanSchedule);
    if (!isNaN(parsed)) {
      startTime = new Date(parsed);
    } else {
      startTime.setDate(startTime.getDate() + 1);
      startTime.setHours(6, 0, 0, 0);
    }
  }

  // Check for specific time like "05:00 AM"
  var timeMatch = scheduleStr.match(/(\d{1,2}):(\d{2})\s*(am|pm)?/i);
  if (timeMatch) {
    var h = parseInt(timeMatch[1], 10);
    var m = parseInt(timeMatch[2], 10);
    var meridian = (timeMatch[3] || '').toLowerCase();
    if (meridian === 'pm' && h < 12) h += 12;
    if (meridian === 'am' && h === 12) h = 0;
    startTime.setHours(h, m, 0, 0);
  }

  // Default duration: 6 hours
  var endTime = new Date(startTime.getTime() + 6 * 60 * 60 * 1000);

  var title = '[' + bookingId + '] ' + b.guestNamePhone + ' - ' + b.vehicle + ' (' + b.route + ')';
  var cleanRef = bookingId.replace(/[^A-Za-z0-9]/g, '');
  var tripSheetUrl = 'https://kalidasstravels.in/trip/?ref=' + cleanRef;

  var description = [
    '🚕 KALIDASS TRAVELS — TRIP DUTY SLIP',
    '--------------------------------------',
    'Booking ID: ' + bookingId,
    'Passenger: ' + b.guestNamePhone,
    'Route: ' + b.route,
    'Vehicle: ' + b.vehicle + ' (' + (b.pax || '4 Seats') + ')',
    'Assigned Chauffeur: ' + (b.driver || 'Unassigned'),
    'Duty Status: ' + (b.status || 'Need Driver'),
    'Total Fare: ₹' + (b.fare || 0),
    'Advance Paid: ₹' + (b.advance || 0),
    'Balance Due at Drop: ₹' + Math.max(0, (b.fare || 0) - (b.advance || 0)),
    '--------------------------------------',
    'Live Trip Sheet: ' + tripSheetUrl,
    'Office Helpline: +91 89395 39211',
    'Headquarters: Medavakkam, Chennai'
  ].join('\n');

  if (b.notes) {
    description += '\nNotes: ' + b.notes;
  }

  var location = String(b.route || '').split('➔')[0].trim() || 'Medavakkam, Chennai';

  if (existingEvents.length > 0) {
    var event = existingEvents[0];
    event.setTitle(title);
    event.setDescription(description);
    event.setLocation(location);
    event.setTime(startTime, endTime);
  } else {
    var newEvent = cal.createEvent(title, startTime, endTime, {
      description: description,
      location: location
    });
    // 24 hours (1440m) & 2 hours (120m) push/email alerts on phone
    newEvent.addPopupReminder(1440);
    newEvent.addPopupReminder(120);
  }
}

/**
 * Create or get a dedicated subfolder for an applicant inside the Master Folder:
 * Master: "Kalidass Driver & Cab Attachments"
 * Subfolder: "[#KT-DRV-101] Saravanan - 9952749408 (Attach Car)"
 */
function getOrCreateApplicantFolder(leadId, name, phone, category) {
  var masterFolderName = 'Kalidass Driver & Cab Attachments';
  var masterFolders = DriveApp.getFoldersByName(masterFolderName);
  var masterFolder = masterFolders.hasNext() ? masterFolders.next() : DriveApp.createFolder(masterFolderName);
  
  var cleanPhone = String(phone || '').replace(/[^0-9]/g, '').slice(-10);
  var folderName = '[' + leadId + '] ' + (name || 'Driver') + (cleanPhone ? ' - ' + cleanPhone : '') + ' (' + (category || 'Lead') + ')';
  
  var subFolders = masterFolder.getFoldersByName(folderName);
  var folder = subFolders.hasNext() ? subFolders.next() : masterFolder.createFolder(folderName);
  
  try {
    folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (_) {}
  
  return folder;
}

/**
 * Save Base64 file into a specific Google Drive folder
 */
function saveBase64ToFolder(folder, base64Data, fileName, mimeType) {
  try {
    if (!base64Data) return null;
    var cleanBase64 = String(base64Data).replace(/^data:[a-zA-Z0-9\/\+\-]+;base64,/, '');
    var decoded = Utilities.base64Decode(cleanBase64);
    var blob = Utilities.newBlob(decoded, mimeType || 'image/jpeg', fileName);
    var file = folder.createFile(blob);
    try {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (_) {}
    return file.getUrl();
  } catch (err) {
    return null;
  }
}


