/////////////////////////
// Serialization

// User interaction
function serializeDebug() {
  censor = false
  printPropagations = true
  return serialize(sheets.slice(overrideStartIndex))
}

function serializeCensored() {
  censor = true
  printPropagations = false
  return serialize(sheets.slice(overrideStartIndex))
}

function serializeStandard() {
  censor = false
  printPropagations = false
  return serialize(sheets.slice(overrideStartIndex))
}

function serializeActiveDebug() {
  censor = false
  printPropagations = true
  var activeIdx = app.getActiveSheet().getIndex()-1 // 1-indexed
  return serialize(sheets.slice(activeIdx,activeIdx+1))
}

function serializeActiveCensored() {
  censor = true
  printPropagations = false
  var activeIdx = app.getActiveSheet().getIndex()-1 // 1-indexed
  return serialize(sheets.slice(activeIdx,activeIdx+1))
}

function serializeActiveStandard() {
  censor = false
  printPropagations = false
  var activeIdx = app.getActiveSheet().getIndex()-1 // 1-indexed
  return serialize(sheets.slice(activeIdx,activeIdx+1))
}

function getDataFolder() {
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

  return dataFolder
}

// serialize turns provided sheets into json and writes the to suitable files
// sheets - array of Sheet objects to process
function serialize(sheets) {
  var dataFolder = getDataFolder()
  var workbook = processWorkbook(sheets)

  for (var i = 0; i < workbook.length; i++) {
    // handle the file first to front load IO errors
    var fileName = defaultExportFolder+"_"+workbook[i].name + ".json"
    var fileItr = DriveApp.getFilesByName(fileName)
    if (fileItr.hasNext() == false) {
      Logger.log(`Creating new export file: ${fileName}`)
      existingFile = dataFolder.createFile(fileName, data)
    }

    var existingFile = fileItr.next()


    Logger.log(`Serializing sheet ${workbook[i].name} to ${fileName}`)
    const startTime = Date.now();
    var data = serializeSheet(workbook, i)
    const endTime = Date.now();
    Logger.log(`Serializing sheet ${workbook[i].name} took ${endTime - startTime}ms`)

    // the actual write of string is outside of the time as I cannot usefull influence it
    existingFile.setContent(data)
  }
}


// processWorkbook iterates over the sheets, generates distilled versions of them, and
// returns a 3d array for sheet:row:col containing processed cell info
// sheets - array of Sheet objects to process
function processWorkbook(sheets) {
  var workbook = Array(sheets.length)
  for (var i = 0; i < sheets.length; i++) {
    workbook[i] = processSheet(workbook, sheets[i])
  }

  return workbook
}

// processSheet the distilled form of the sheet
// workbook - target array
// sheet - Sheet object to process
function processSheet(workbook, sheet) {
  Logger.log("Processing sheet %s", sheet.getName())
  const startTime = Date.now();

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
      if (row == "10" && col == "3") {
        var _ = "debugger breakpoint line"
      }

      // getCell is 1 indexed... For! Some! Reason! as is sheet.getIndex()
      var cell = activeRange.getCell(row+1, col+1)
      var processedCell = processCell(workbook, sheet.getIndex()-1, cell, dataValidation[row][col])
      processedSheet[row][col] = processedCell


      if (processedCell.id == "A48") {
        var _ = "debugger breakpoint line"
      }

      // if this cell is equal to the anchor cell, record a propagation on the anchor
      // TODO: add magic for relative formula propagation test
      var ignoreData = (censor && processedCell.dataclass != null && processedCell.dataclass.sensitive)
      if (!isCellEmpty(anchorCell) && doesCellPropagate(anchorCell, processedCell, ignoreData)) {
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

  const endTime = Date.now();
  Logger.log(`Processing sheet ${processedSheet.name} took ${endTime - startTime}ms`)

  return processedSheet
}


function testProcessCell() {
  var app = SpreadsheetApp.getActiveSpreadsheet()
  var sheets = app.getSheets()
  var workbook = Array(sheets.length)
  var sidx = 1
  var activeRange = sheets[sidx].getDataRange()
  var data = activeRange.getValues()
  var dataValidation = activeRange.getDataValidations()

  var sheet = Array(data.length)

  // prepop the column arrays
  for (var row = 0; row < data.length; row++) {
    sheet[row] = Array(data[row].length)
  }

  var row = 0
  var col = 0

  var cell = activeRange.getCell(row+1, col+1)
  var cell = processCell(workbook, sidx, cell, dataValidation[row][col])

  // add tests
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
    // TODO: enum, please!
    // dataclass: {
    //   type: "", // info, in_req, in_opt, in_prepop, in_prepop2, in_ref, out_now, out_future, def
    //   colour: "", // if it's an unknown class we still want to capture it
    //   sensitive: false, // true if personal data
    // }
    // seems comments are not accessible via API
    // https://issuetracker.google.com/issues/36756650?pli=1
    // distillation.comment = cell.getComment(),
    // validation: null,  // data validation
    // conditional_format: null // sheet level?
    // mergeEnd: { // only record the first cell of a merge. Omit if it's not a merge
    //   row: 0,
    //   col: 0,
    // },
    // propagate: {
    //   row: 0,
    //   col: 0,
    // }
  }

  // a cell that's part of a merge doesn't directly hold the data
  // instead it's held in the merge range
  // THIS IS SLOW
  // This took ~60s for just the Summary sheet for all of the merge logic
  // It took ~55s just for the getMergedRanges call
  if (enableMergeProcessing) {
    var mergedRanges = cell.getMergedRanges();
    if (mergedRanges.length == 1) {
      var mergeAnchorA1 = mergedRanges[0].getCell(1, 1).getA1Notation() // 1 indexed

      if (distillation.id != mergeAnchorA1) {
        // if this isn't the top-leftmost cell in the merge, return an empty cell
        distillation.empty = true
        distillation.merge = {
          source: mergeAnchorA1,
        }
        return distillation
      }

      cell = mergedRanges[0]
      var data = cell.getValues()
      // reference the merge data in place of the cell
      distillation.merge = {
        depth: data.length,
        width: data[0].length,
      }
      if (debug > 1) {
        Logger.log(`${sheetIndex}!${mergeAnchorA1} is a merge anchor`)
      }
    } else if (mergedRanges.length > 1) {
      Logger.log("%i!%s: unsupported multi-range merge", sheetIndex, cell.getA1Notation())
    }
  }

  distillation.note = cell.getNote()
  distillation.metadata = cell.getDeveloperMetadata()
  distillation.data = cell.getFormula()
  distillation.type = "formula"
  distillation.colour = ""


  // formula or data?
  if (distillation.data == "") {
    distillation.data = cell.getValue().toString()
    distillation.type = ""

    // TODO: type classifier
    distillation.format = cellFormatMapping(cell.getNumberFormat())
  }

  var valueType = cellFormatMapping(cell.getNumberFormat())
  if (valueType.type == null || valueType.type == "unknown") {
    distillation.format = valueType.formatString
    Logger.log(`${distillation.sheet}!${distillation.id}: unrecognized format string ${valueType.formatString}`)
  } else {
    distillation.format = valueType.type
  }

  if (valueType.type == "iso-date" && distillation.type != "formula") {
    var date = new Date(distillation.data)
    var isoString = Utilities.formatDate(date, "UTC", "yyy-MM-dd")
    distillation.data = isoString.split("T")[0]
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

  distillation.dataclass = cellColourMapping(cell.getBackground())
  if (distillation.dataclass.colour != null) {
      Logger.log(`${distillation.sheet}!${distillation.id}: unrecognized datatype colour ${distillation.dataclass.colour}`)
  }

  if (isCellEmpty(distillation)) {
    distillation.empty = true
  }

  // delete any fields that have default values so they're not serialized
  if (distillation.metadata == "") {
    delete distillation.metadata
  }
  if (distillation.data == "") {
    delete distillation.data
  }
  if (distillation.type == "") {
    delete distillation.type
  }
  if (distillation.validation == null || distillation.validation == "") {
    delete distillation.validation
  }
  if (distillation.note == "") {
    delete distillation.note
  }
  if (distillation.format == "") {
    delete distillation.format
  }
  if (distillation.colour == "") {
    delete distillation.colour
  }
  if (distillation.format == "text") {
    delete distillation.format
  }
  if (distillation.dataclass.type == "") {
    delete distillation.dataclass
  }

  return distillation
}

// cellColourMapping determines the classification of data in the cell and
// whether data should be censored when requested.
// - code - #xxxxxx style colour
// returns { class, sensitive }
function cellColourMapping(code) {
  switch (code) {
    case "#f3f3f3":
      return {
        type: "info",
        sensitive: false,
      }

    case "#fff2cc":
      return {
        type: "in",
        sensitive: true,
      }

    case "#fce5cd":
      // data validation modified colour
    case "#ded5ba":
      return {
        type: "in_opt",
        sensitive: true,
      }

    case "#ead1dc":
      return {
        type: "in_prepop",
      // TODO: if default has been overwritten, value is now sensitive
        sensitive: false,
      }

    case "#efefef":
      return {
        type: "in_ref",
        sensitive: true,
      }

    case "#a2c4c9":
      // data validation modified colour
    case "#d0e0e3":
      return {
        type: "out_now",
        sensitive: false,
      }

    case "#d9ead3":
      return {
        type: "out_future",
        sensitive: false,
      }

    case "#d5a6bd":
      return {
        type: "in_prepop2",
        sensitive: false,
      }

    case "#ffffff":
      return {
        type: "",
        sensitive: false,
      }

    default:
      return {
        type: "unknown",
        sensitive: false,
        colour: code,
      }
  }
}

// cellFormatMapping determines the style of value from the formatting in use
// This returns both the concept type and the format string so the string is there for
// easy reference if needed
// For now I collapse most with/out thousands into one form
// - formatString - eg. "#,##0.00;(#,##0.00)" (financial)
// returns - { valueType, formatString }
function cellFormatMapping(formatString) {
  switch(formatString) {
    case "":
      return {
        type: "text",
        formatString: "",
      }

    case "#,##0.00;(#,##0.00)":
      return {
        type: "financial",
        formatString: formatString,
      }

    case "0.00%":
      return {
        type: "%_2dp",
        formatString: formatString,
      }

    case "0%":
      return {
        type: "%",
        formatString: formatString,
      }

    case "0":
    case "###0":
    case "#,##0":
      return {
        type: "int",
        formatString: formatString,
      }

    case "0.000000":
    case "###0.000000":
    case "#,##0.000000":
      return {
        type: "int_6dp",
        formatString: formatString,
      }

    case "0.00000":
    case "###0.00000":
    case "#,##0.00000":
      return {
        type: "int_5dp",
        formatString: formatString,
      }

    case "0.0000":
    case "###0.0000":
    case "#,##0.0000":
      return {
        type: "int_4dp",
        formatString: formatString,
      }

    case "0.000":
    case "###0.000":
    case "#,##0.000":
      return {
        type: "int_3dp",
        formatString: formatString,
      }

    case "0.00":
    case "###0.00":
    case "#,##0.00":
      return {
        type: "int_2dp",
        formatString: formatString,
      }

    case "0.###############":
    // TODO: unsure about this one - is this the format indicator for auto, or the format
    // auto chose for the cell?
      return {
        type: "auto",
        formatString: formatString,
      }

    case "yyyy\"-\"mm\"-\"dd":
    case "yyyy-mm-dd":
      return {
        type: "iso-date",
        formatString: formatString,
      }

    default:
      return {
        type: "unknown",
        formatString: formatString,
      }
  }
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
        var cDataclass = cell.dataclass
        var cNote = cell.note
        var cFormat = cell.format
        delete cell.row
        delete cell.col
        delete cell.cell
        delete cell.dataclass
        if (cDataclass != null) {
          cell.dataclass = cDataclass.type
        }
        if (cFormat == "auto") {
          // I dont' want to lose this from the struct, but also don't want it serialized as it's extra noise
          delete cell.format
        }

        // do this purely to move the note to the end of the object
        delete cell.note
        cell.note = cNote

        var cData = cell.data
        if (censor == true && cDataclass != null && cDataclass.sensitive == true) {
          delete cell.data
        }

        serializedCol+= JSON.stringify(cell) + ',\n'

        cell.row = cRow
        cell.col = cCol
        cell.data = cData
        cell.cell = cCell
        if (cDataclass != null) {
          delete cell.dataclass
          cell.dataclass = cDataclass
        }
        if (cFormat != null) {
          cell.format = cFormat
        }
      }
    }

    serialization+= serializedCol
  }

  return serialization
}

//////////////////////
// Deserialization


//////////////////////
// Common code

function isCellEmpty(distillation) {
    // determine if the cell is Empty
  return distillation == null || (
      ( distillation.data == null || distillation.data == "") &&
      distillation.validation == null &&
      (distillation.colour == null || distillation.colour == "") &&
      // auto is sufficiently default that I'm considering it's presence insufficient to be non-empty in isolation
      (distillation.format == null || distillation.format == "" || distillation.format == "auto") &&
      (distillation.dataclass == null || distillation.dataclass.type == "") &&
      (distillation.note == null || distillation.note == "") &&
      (distillation.metadata == null || distillation.metadata.length == 0) &&
      // cells that aren't anchors for propagation or merge ranges and don't have other
      // distinct info are considered empty as the anchor encompasses range to which it applies
      (distillation.merge == null || distillation.merge.source != null) &&
      (distillation.propagate == null || distillation.propagate.source != null)
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

