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
    var lastRow = sheet.getLastRow();
    var leads = [];
    if (lastRow > 1) {
      var data = sheet.getRange(2, 1, lastRow - 1, 10).getValues();
      for (var i = data.length - 1; i >= 0; i--) {
        leads.push({
          leadId: data[i][0],
          timestamp: data[i][1],
          name: data[i][2],
          phone: data[i][3],
          category: data[i][4],
          details: data[i][5],
          city: data[i][6],
          folderUrl: data[i][7],
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
    var leadId = String(data.leadId || data.referenceId || '').trim();
    if (!leadId) {
      leadId = '#KT-DRV-' + (100 + sheet.getLastRow());
    }

    var timestamp = data.timestamp || data.date || Utilities.formatDate(new Date(), 'Asia/Kolkata', 'dd MMM yyyy, hh:mm a');
    var name = String(data.name || data.guestName || 'Driver Applicant').trim();
    var rawPhone = String(data.phone || data.mobile || '');
    var cleanPhone = rawPhone.replace(/[^0-9]/g, '').slice(-10);
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
    sheet.appendRow(row);

    return ContentService.createTextOutput(
      JSON.stringify({
        success: true,
        leadId: leadId,
        driveFolderUrl: folderUrl,
        action: 'created'
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
