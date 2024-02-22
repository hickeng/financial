const app = SpreadsheetApp.getActiveSpreadsheet()
const sheets = app.getSheets()

// Install menu items
function onOpen() {
  var ui = SpreadsheetApp.getUi()
  ui.createMenu("Custom Functions")
    .addItem("Export Workbook (with Data)", "serializeStandard")
    .addItem("Export Workbook (Censored)", "serializeCensored")
    .addItem("Export Workbook (Debug)", "serializeDebug")
    .addSeparator()
    .addItem("Export Active Sheet (with Data)", "serializeActiveStandard")
    .addItem("Export Active Sheet(Censored)", "serializeActiveCensored")
    .addItem("Export Active Sheet (Debug)", "serializeActiveDebug")
    .addSeparator()
    .addItem("Optimize per-lot selection", "optimize")
    // these are just for testing as there's no way for them to satisfy the ratio requirements
    // .addItem("All Cash", "setCashPreference")
    // .addItem("All Stock", "setStockPreference")
    .addItem("All Balance", "setBalancePreference")
    .addToUi()
}

function shortDate(input) {
    var date = new Date(input)
    var isoString = Utilities.formatDate(date, "UTC", "yyy-MM-dd")
    return isoString.split("T")[0]  
}