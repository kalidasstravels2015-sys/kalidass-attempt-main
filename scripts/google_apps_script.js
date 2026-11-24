/**
 * =========================================================================
 * KALIDASS TRAVELS - DRIVER & CAB ATTACHMENT SYNC ENGINE
 * =========================================================================
 * Automatically creates dedicated Google Drive folders for every applicant
 * and logs details into the "Driver Leads" sheet.
 * =========================================================================
 */

function setupSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Driver Leads');
  if (!sheet) {
    sheet = ss.insertSheet('Driver Leads');
  }
  var headers = [
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
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length)
    .setFontWeight('bold')
    .setBackground('#673ab7')
    .setFontColor('#ffffff');
  sheet.setFrozenRows(1);
  return sheet;
}

function doGet(e) {
  try {
    var sheet = setupSheets();

    // 1-Click Clean / Repair Action: can be triggered via ?action=clean
    if (e && e.parameter && (e.parameter.action === 'clean' || e.parameter.action === 'repair')) {
      cleanAndFixDriverLeadsSheet();
    }

    var lastRow = sheet.getLastRow();
    var leads = [];
    if (lastRow > 1) {
      var range = sheet.getRange(2, 1, lastRow - 1, 10);
      var data = range.getValues();
      var formulas = range.getFormulas();
      for (var i = data.length - 1; i >= 0; i--) {
        var rawFolder = data[i][7];
        var formula = (formulas[i] && formulas[i][7]) ? formulas[i][7] : '';
        var match = formula.match(/HYPERLINK\("([^"]+)"/i);
        var realFolderUrl = match ? match[1] : (String(rawFolder).startsWith('http') ? rawFolder : '');

        leads.push({
          leadId: data[i][0],
          timestamp: data[i][1],
          name: data[i][2],
          phone: data[i][3],
          category: data[i][4],
          details: data[i][5],
          city: data[i][6],
          folderUrl: realFolderUrl || rawFolder,
          status: data[i][8],
          notes: data[i][9]
        });
      }
    }
    return ContentService.createTextOutput(
      JSON.stringify({ success: true, count: leads.length, leads: leads })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, error: err.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    var raw = (e && e.postData) ? e.postData.contents : '{}';
    var data = {};
    try {
      data = JSON.parse(raw);
    } catch (_) {
      data = {};
    }

    var sheet = setupSheets();

    // 1-Click Clean Action via POST
    if (data.action === 'clean' || data.action === 'clean_leads') {
      cleanAndFixDriverLeadsSheet();
      return ContentService.createTextOutput(
        JSON.stringify({ success: true, message: 'Cleaned and resequenced Driver Leads sheet.' })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    var rawPhone = String(data.phone || data.mobile || '');
    var cleanPhone = rawPhone.replace(/[^0-9]/g, '').slice(-10);

    // Strict Guard: NEVER accept or log driver applications without a valid 10-digit mobile number!
    // This stops bots, click tracking beacons, and blank test drafts from creating dummy rows or empty Drive folders.
    if (!cleanPhone || cleanPhone.length !== 10 || cleanPhone === '9999999999' || cleanPhone.startsWith('00000')) {
      return ContentService.createTextOutput(
        JSON.stringify({ success: false, error: 'A valid 10-digit mobile phone number is required.' })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    var lastRow = sheet.getLastRow();

    // Deduplication Check: If driver with this phone already exists, update their row instead of appending duplicate!
    var foundRow = 0;
    var existingId = '';
    if (lastRow > 1) {
      var phoneValues = sheet.getRange(2, 4, lastRow - 1, 1).getValues();
      for (var p = 0; p < phoneValues.length; p++) {
        var existingPhone = String(phoneValues[p][0] || '').replace(/[^0-9]/g, '').slice(-10);
        if (existingPhone && existingPhone === cleanPhone) {
          foundRow = p + 2;
          existingId = String(sheet.getRange(foundRow, 1).getValue() || '');
          break;
        }
      }
    }

    // Compute strictly continuous sequential lead ID (#KT-DRV-101, #KT-DRV-102...)
    var maxId = 100;
    if (lastRow > 1) {
      var idValues = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
      for (var r = 0; r < idValues.length; r++) {
        var existingVal = String(idValues[r][0] || '');
        var numMatch = existingVal.match(/KT-DRV-(\d+)/i);
        if (numMatch) {
          var n = parseInt(numMatch[1], 10);
          if (!isNaN(n) && n >= 101 && n < 9999 && n > maxId) {
            maxId = n;
          }
        }
      }
    }

    var incomingLeadId = String(data.leadId || data.referenceId || '').trim();
    var incomingNumMatch = incomingLeadId.match(/KT-DRV-(\d+)/i);
    var leadId = existingId;
    if (!leadId) {
      if (incomingNumMatch && parseInt(incomingNumMatch[1], 10) > maxId) {
        leadId = '#KT-DRV-' + parseInt(incomingNumMatch[1], 10);
      } else {
        leadId = '#KT-DRV-' + (maxId + 1);
      }
    }

    var timestamp = data.timestamp || data.date || Utilities.formatDate(new Date(), 'Asia/Kolkata', 'dd MMM yyyy, hh:mm a');
    var name = String(data.name || data.guestName || 'Partner Driver').trim();
    var category = String(data.category || 'Attach Car').trim();
    var city = String(data.city || data.pickup || 'Chennai').trim();
    var notes = String(data.notes || '').trim();

    var details = data.details || (category === 'Attach Car'
      ? ((data.carCount || '1 Car') + ' (' + (data.cars || '') + ') - Plate: ' + (data.plateType || 'Yellow Board'))
      : ((data.licenseType || 'LMV') + ' - Exp: ' + (data.experience || '1-3 Yrs') + ' - Duty: ' + (data.preferredDuty || 'All')));

    // 1. Create dedicated Google Drive folder for this applicant
    var masterFolderName = 'Kalidass Driver & Cab Attachments';
    var masterFolders = DriveApp.getFoldersByName(masterFolderName);
    var masterFolder = masterFolders.hasNext() ? masterFolders.next() : DriveApp.createFolder(masterFolderName);

    var subFolderName = '[' + leadId + '] ' + name + (cleanPhone ? ' - ' + cleanPhone : '') + ' (' + category + ')';
    var appFolder = masterFolder.createFolder(subFolderName);
    try {
      appFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (_) {}

    var folderUrl = appFolder.getUrl();

    // 2. Save Driving License Photo
    if (data.dlFile && data.dlFile.base64) {
      saveFile(appFolder, data.dlFile.base64, leadId + '-DL-License.jpg', data.dlFile.mimeType);
    }

    // 3. Save RC Book Photo
    if (data.rcFile && data.rcFile.base64) {
      saveFile(appFolder, data.rcFile.base64, leadId + '-RC-Book.jpg', data.rcFile.mimeType);
    }

    // 4. Save Front Car Photo
    if (data.carFile && data.carFile.base64) {
      saveFile(appFolder, data.carFile.base64, leadId + '-CAR-Front-Plate.jpg', data.carFile.mimeType);
    }

    // 5. Create Applicant Summary Text File inside the folder
    var summary = [
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
    appFolder.createFile('Applicant_Details.txt', summary, 'text/plain');

    // 6. Append Row in Driver Leads Sheet
    var folderLinkFormula = '=HYPERLINK("' + folderUrl + '", "📂 Open Drive Folder")';
    var cleanPhoneCell = cleanPhone ? ("'" + cleanPhone) : '';

    var row = [
      leadId,
      timestamp,
      name,
      cleanPhoneCell,
      category,
      details,
      city,
      folderLinkFormula,
      'Pending Review',
      notes
    ];

    if (foundRow > 0) {
      sheet.getRange(foundRow, 1, 1, row.length).setValues([row]);
    } else {
      sheet.appendRow(row);
    }

    return ContentService.createTextOutput(
      JSON.stringify({
        success: true,
        leadId: leadId,
        driveFolderUrl: folderUrl,
        action: foundRow > 0 ? 'updated' : 'created'
      })
    ).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, error: error.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function saveFile(folder, base64Data, fileName, mimeType) {
  try {
    if (!base64Data) return null;
    var clean = String(base64Data).replace(/^data:[a-zA-Z0-9\/\+\-]+;base64,/, '');
    var decoded = Utilities.base64Decode(clean);
    var blob = Utilities.newBlob(decoded, mimeType || 'image/jpeg', fileName);
    var file = folder.createFile(blob);
    try {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (_) {}
    return file.getUrl();
  } catch (e) {
    return null;
  }
}

/**
 * ONE-CLICK REPAIR UTILITY:
 * Run this function from Apps Script Editor (or via ?action=clean):
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
