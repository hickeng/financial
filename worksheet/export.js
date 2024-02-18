var defaultExportFolder = 'github_hickeng_financial_vmw_avgo_merger_data'
var censor = true
var printPropagations = false
var sheetStartIndex = 0

// Install menu items
function onOpen() {
  var ui = SpreadsheetApp.getUi()
  ui.createMenu("Custom Functions")
    .addItem("Export", "serialize")
    .addToUi()
}

/////////////////////////
// Serialization

function serialize() {
  var ui = SpreadsheetApp.getUi()
  var useDefaultFolder = false

  var dataFolder
  try {
    var folderItr = DriveApp.getFoldersByName(defaultExportFolder)
    if (folderItr.hasNext()) {
      dataFolder = folderItr.next()
      useDefaultFolder = true
    } else {
      Logger.log('Default folder not found')
    }

  } catch (err) {
    Logger.log('Default folder not used: %s', err)
  }

  // if we've not got a default, prompt for one
  if (useDefaultFolder != true) {
    // Create Google Drive folder
    var response = ui.prompt("Export Sheet to Folder (created in root of Google Drive if doesn't exist)\ndefault is /github_hickeng_financial_vmw_avgo_merger_data", ui.ButtonSet.OK_CANCEL)
    // Process the user's response.
    if (response.getSelectedButton() == ui.Button.OK) {
      var folderName = response.getResponseText()
      if (folderName == '') {
        folderName = defaultExportFolder
      }
      Logger.log('User wants to create folder %s.', folderName);

    } else if (response.getSelectedButton() == ui.Button.CANCEL) {
      Logger.log('User aborted export');
      return

    } else {
      Logger.log('The user clicked the close button in the dialog\'s title bar.');
      return
    }

    try {
      dataFolder = DriveApp.getFolderById(folderName)
    } catch (err) {
      // assume it's does not exist for now
      dataFolder = DriveApp.createFolder(folderName)
    }
  }


  processWorkbook(dataFolder)

}

// serializeSheet turns the cells into JSON representaitons
// it iterates column first instead of row as is habitual because we tend to fill downwards in spreadsheets.
// therefore we should end up with large clumpings of similar/identical cells grouped from column patterns.
function serializeSheet(workbook, sheetIndex) {
  var serialization = ""
  var serializedCol = ""

  var sheet = workbook[sheetIndex]
  var render = {
    sheet: sheetIndex,
    id: "_",
    name: sheet.name,
    conditional_formatting: sheet.conditionalFormatting,
  }
  serialization+= JSON.stringify(render) + ',\n'

  for (var col = 0; col < workbook[sheetIndex][0].length; col++) {
    serializedCol = ""
    for (var row = 0; row < workbook[sheetIndex].length && col < workbook[sheetIndex][row].length; row++) {
      var cell = workbook[sheetIndex][row][col]

      // if the cell isn't empty and isn't a propagation of a higher cell, record it
      if (isCellEmpty(cell) == false && (cell.propagate == null || cell.propagate.source == null || printPropagations)) {
        // I prefer to serialize the A1 notation for the cell, but row/col are too useful to loose
        // TODO - see if there's a more sane way to filter fields
        var cRow = cell.row
        var cCol = cell.col
        var cCell = cell.cell
        delete cell.row
        delete cell.col
        delete cell.cell


        var cData = cell.data
        if (censor == true && cell.sensitive == true) {
          delete cell.data
        }

        serializedCol+= JSON.stringify(cell) + ',\n'

        cell.row = cRow
        cell.col = cCol
        cell.data = cData
        cell.cell = cCell
      }

    }

    serialization+= serializedCol
  }

  return serialization
}

// processWorkbook iterates over the sheets, generates distilled versions of them, and
// returns a 3d array for sheet:row:col containing processed cell info

// TODO: remove dataFolder argument
function processWorkbook(dataFolder) {
  var app = SpreadsheetApp.getActiveSpreadsheet()
  var sheets = app.getSheets()


  var workbook = Array(sheets.length)
  for (var i = sheetStartIndex; i < sheets.length; i++) {
    var sheet = sheets[i]
    var fileName = defaultExportFolder+"_"+sheet.getName() + ".json"
    Logger.log(fileName)
    // TODO: replace sheets with the fixed up [][][] form so we can easily cross reference while
    // serializing
    var processedSheet = processSheet(workbook, i, sheet)
    workbook[i] = processedSheet

    var data = serializeSheet(workbook, i)
    var fileItr = DriveApp.getFilesByName(fileName)
    if (fileItr.hasNext() == false) {
      Logger.log("Creating new export file: %s", fileName)
      dataFolder.createFile(fileName, data)
      continue
    }

    var existingFile = fileItr.next()
    existingFile.setContent(data)
    existingFile.setContent(data)
  }
}

// processSheet the distilled form of the sheet
function processSheet(workbook, sheetIndex, sheet) {
  var activeRange = sheet.getDataRange()
  var dataValidation = activeRange.getDataValidations()

  var data = activeRange.getValues()

  var processedSheet = Array(data.length)

  // it's javascript - just dynamically ram extra fields onto an Aray.
  processedSheet.name = sheet.getName()
  // TODO: see if there's a neat way to assocaite the conditions with the cells....it'll make editing
  // via the json easier in the future
  processedSheet.conditionalFormatting = conditionalFormattingText(sheet)
  // TODO: what makes up a sheet?
  // frozen rows
  // hidden columns


  // prepop the column arrays
  for (var row = 0; row < data.length; row++) {
    processedSheet[row] = Array(data[row].length)
  }

  // unintuitively, we iterate on the column first.
  // this is because we tend to fill down in spreadsheets and this lets us dedup.
  var anchorCell
  for (var col = 0; col < processedSheet[0].length; col++) {
    for (var row = 0; row < processedSheet.length && col < processedSheet[row].length; row++) {
      // getCell is 1 indexed... For! Some! Reason!
      var cell = activeRange.getCell(row+1, col+1)
      var processedCell = processCell(workbook, sheetIndex, cell, dataValidation[row][col])
      processedSheet[row][col] = processedCell

      // if this cell is equal to the anchor cell, record a propagation on the anchor
      // TODO: add magic for relative formula propagation test
      if (!isCellEmpty(anchorCell) && doesCellPropagate(anchorCell, processedCell, (censor && processedCell.sensitive))) {
        anchorCell.propagate = {
          end: processedCell.id,
        }
        processedCell.propagate = {
          source: anchorCell.id
        }
      } else {
        anchorCell = processedCell
      }
    }
  }

  return processedSheet
}

// processCell returns the distilled form of the cell, but also enters it into the
// appropriate index in the workbook
function processCell(workbook, sheetIndex, cell, validation) {
  var distillation = {
    cell: cell, // preserve a reference in case we need it
    sheet: sheetIndex,
    row: cell.getRow() - 1, // 1 indexed
    col: cell.getColumn() - 1, // 1 indexed
    id: cell.getA1Notation(),
    // empty: false,
    comment: cell.getComment(),
    note: cell.getNote(),
    metadata: cell.getDeveloperMetadata(),
    data: cell.getFormula(),
    type: "formula", // date, formula, string, numeric, bool, checkbox, dropdown
    // sensitive: false, // true if personal data
    format: cell.getNumberFormat(), // format string
    // validation: null,  // data validation
    // conditional_format: null // sheet level?
    colour: "", // info, in_req, in_opt, in_prepop, in_prepop2, in_ref, out_now, out_future, def
    // mergeEnd: { // only record the first cell of a merge. Omit if it's not a merge
    //   row: 0,
    //   col: 0,
    // },
    // propagate: {
    //   row: 0,
    //   col: 0,
    // }
  }

  // formula or data?
  if (distillation.data == "") {
    distillation.data = cell.getValue().toString()
    distillation.type = "string"

     // TODO: type classifier
  }

  // I think this is a special case of data validation
  var checked = cell.isChecked()
  if (cell.isChecked() != null) {
    distillation.type = "checkbox"
    distillation.data = checked.toString()
  }

  // dropdown capture
  if (validation != null) {
    distillation.validation = {
      type: validation.getCriteriaType().toJSON(),
      values: validation.getCriteriaValues()[0],
      enforced: !validation.getAllowInvalid(),
      help: validation.getHelpText(),
    }

    if (distillation.validation.type == "VALUE_IN_LIST") {
      distillation.type = "dropdown"
    }
  }


  var colour = cell.getBackground()
  switch (colour) {
    case "#f3f3f3":
      distillation.colour = "info"
      break
    case "#fff2cc":
      distillation.colour = "in"
      distillation.sensitive = true
      break
    case "#fce5cd":
      // data validation modified colour
    case "#ded5ba":
      distillation.colour = "in_opt"
      distillation.sensitive = true
      break
    case "#ead1dc":
      distillation.colour = "in_prepop"
      // TODO: if default has been overwritten, value is now sensitive
      break
    case "#efefef":
      distillation.colour = "in_ref"
      distillation.sensitive = true
      break
    case "#a2c4c9":
      // data validation modified colour
    case "#d0e0e3":
      distillation.colour = "out_now"
      break
    case "#d9ead3":
      distillation.colour = "out_future"
      break
    case "#d5a6bd":
      distillation.colour = "in_prepop2"
    case "#ffffff":
      // default
      break
    default:
      distillation.colour = colour
      Logger.log("unrecognized cell (sheet: %i, row: %i, col: %i) colour: %s", distillation.sheet, distillation.row, distillation.col, colour)
      break
  }

  if (isCellEmpty(distillation)) {
    distillation.empty = true
  }

  // delete any fields that have default values so they're not serialized
  if (distillation.comment == "") {
    delete distillation.comment
  }
  if (distillation.metadata == "") {
    delete distillation.metadata
  }
  if (distillation.data == "") {
    delete distillation.data
  }
  if (distillation.type == "") {
    delete distillation.type
  }
  if (distillation.validation == null) {
    delete distillation.validation
  }
  if (distillation.note == "") {
    delete distillation.note
  }

  return distillation
}


//////////////////////
// Deserialization


//////////////////////
// Common code

function isCellEmpty(distillation) {
    // determine if the cell is Empty
  return distillation == null || (
      (distillation.data == "" || distillation.data == null) &&
      distillation.validation == null &&
      (distillation.colour == "" || distillation.colour == null) &&
      (distillation.comment == "" || distillation.comment == null) &&
      (distillation.note == "" || distillation.note == null) &&
      (distillation.metadata == null || distillation.metadata.length == 0)
    )
}

// delete the fields that are inherently different
function doesCellPropagate(a, b, ignoreData) {
  if (a != null && b == null || a == null && b != null) {
    return false
  }

  var aCell = a.cell
  var aRow = a.row
  var aCol = a.col
  var aID = a.id
  var aProp = a.propagate
  var aData = a.data

  // convert to a format with relative references to allow direct comparison
  if (a.type == "formula") {
    a.data = a.cell.getFormulaR1C1()
  }

  var bCell = b.cell
  var bRow = b.row
  var bCol = b.col
  var bID = b.id
  var bProp = b.propagate
  var bData = b.data

  if (b.type == "formula") {
    b.data = b.cell.getFormulaR1C1()
  }

  delete a.cell
  delete a.row
  delete a.col
  delete a.propagate
  // zero instead of delete as we want JSON serialization to keep this field at the start
  // of the object
  a.id = ""
  if (ignoreData || a.data == null) { // normalize
    a.data = ""
  }

  delete b.cell
  delete b.row
  delete b.col
  delete b.propagate
  b.id = ""
  if (ignoreData || b.data == null) { // normalize
    b.data = ""
  }

  var equal = deepEqual(a, b)

  a.row = aRow
  a.col = aCol
  a.id = aID
  a.propagate = aProp
  a.data = aData
  a.cell = aCell

  b.row = bRow
  b.col = bCol
  b.id = bID
  b.propagate = bProp
  b.data = bData
  b.cell = bCell

  if (equal) {
    return true
  }

  return false
}


// borrowed from https://stackoverflow.com/a/32922084
function deepEqual(x, y) {
  const ok = Object.keys, tx = typeof x, ty = typeof y;
  return x && y && tx === 'object' && tx === ty ? (
    ok(x).length === ok(y).length &&
      ok(x).every(key => deepEqual(x[key], y[key]))
  ) : (x === y);
}




function conditionalFormattingText(sheet) {
  var format = {
    type: "",
    criteria: "",
    args: [],
    ranges: [],
    effect: [],
  }

  var formats = sheet.getConditionalFormatRules()
  for (var i = 0; i < formats.length; i++) {
    var ranges = formats[i].getRanges()
    for (var r = 0; r < ranges.length; r++) {
      format.ranges.push(ranges[r].getA1Notation())
    }

    var condition = formats[i].getBooleanCondition()
    if (condition) {
      format.type = "bool"
      format.criteria = condition.getCriteriaType().toString()
      var args = condition.getCriteriaValues()
      for (var a = 0; a < args.length; a++) {
        format.args.push(args[a])
      }
      if (condition.getBackground && condition.getBackground()) {
        format.effect.push("background: "+condition.getBackground().toString())
      }
      if (condition.getFontColour && condition.getFontColour()) {
        format.effect.push("fontColour: "+condition.getFontColour().toString())
      }

      continue
    }

    var condition = formats[i].getGradientCondition();
    if (condition) {
      format.type = "gradient"
      format.criteria = condition.getCriteriaType().toString()
      var args = condition.getCriteriaValues()
      for (var a = 0; a < args.length; a++) {
        format.args.push(args[a])
      }
    }
  }

  return format
}

