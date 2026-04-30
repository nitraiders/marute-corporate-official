/**
 * Google Apps Script Handler for Marute Site
 * 
 * Instructions:
 * 1. Open your Google Spreadsheet.
 * 2. Go to Extensions > Apps Script.
 * 3. Replace the code with this content.
 * 4. Deploy as Web App (Manage Deployments > New Deployment > Web App).
 * 5. Set 'Who has access' to 'Anyone'.
 * 6. Copy the Web App URL and update GAS_URL in server.js.
 */

function doGet(e) {
  const sheetName = e.parameter.sheet || "partners";
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({error: "Sheet not found: " + sheetName})).setMimeType(ContentService.MimeType.JSON);
  }
  
  const values = sheet.getDataRange().getValues();
  const header = values.shift();
  const data = values.map((row, index) => {
    const obj = {};
    header.forEach((h, i) => {
      obj[h] = row[i];
    });
    obj._row = index + 2; // spreadsheet row index
    return obj;
  });
  
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  let params;
  try {
    params = JSON.parse(e.postData.contents);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({error: "Invalid JSON"})).setMimeType(ContentService.MimeType.JSON);
  }
  
  const action = params.action || 'add';
  const target = params.target || "partners";
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(target);
  
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({error: "Sheet not found: " + target})).setMimeType(ContentService.MimeType.JSON);
  }

  if (action === 'delete') {
    const row = params.row;
    if (row && row > 1) {
      sheet.deleteRow(row);
      return ContentService.createTextOutput(JSON.stringify({status: "success", message: "Row " + row + " deleted"})).setMimeType(ContentService.MimeType.JSON);
    }
    return ContentService.createTextOutput(JSON.stringify({error: "Invalid row index"})).setMimeType(ContentService.MimeType.JSON);
  }

  // Default: Add
  const date = new Date();
  if (target === "partners") {
    // Expected structure: [date, name, url]
    sheet.appendRow([date, params.name, params.url]);
  } else {
    // marute_news, yuzuki_news, tempest_news use: [date, content]
    sheet.appendRow([date, params.content]);
  }
  
  return ContentService.createTextOutput(JSON.stringify({status: "success"})).setMimeType(ContentService.MimeType.JSON);
}
