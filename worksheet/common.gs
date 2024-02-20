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
    .addToUi()
}
