var rsuPrefer = 12
var esppPrefer = 16
var cashPreference = "cash"
var stockPreference = "shares"
var balancePreference = "balance"
var totalShares = 9545
var maxCashShares = 4573
var maxStockShares = 4972

var lotPreferenceCSV = "Lot Share Type,Lot Vest Date,AVGO shares,AVGO cost basis,Equity Ratio,Description\n"

function setCashPreference() {
  for (var i = 0; i < datasheetNames.length; i++) {
    var sheet = app.getSheetByName(datasheetNames[i])
    var colIdx = findIndices(sheet)
    normalizeLotPreference(cashPreference, sheet, colIdx)
  }
}

function setStockPreference() {
  for (var i = 0; i < datasheetNames.length; i++) {
    var sheet = app.getSheetByName(datasheetNames[i])
    var colIdx = findIndices(sheet)
    normalizeLotPreference(stockPreference, sheet, colIdx)
  }
}

function setBalancePreference() {
  var referenceSheet = app.getSheetByName(referenceName)
  var balanceRatioCell = referenceSheet.getRange(balanceRatioA1Notation)

  for (var i = 0; i < datasheetNames.length; i++) {
    var sheet = app.getSheetByName(datasheetNames[i])
    var colIdx = findIndices(sheet)
    balanceRatioCell.setValue(`=${derivedStockRatioCellA1Notation}`)
    normalizeLotPreference(balancePreference, sheet, colIdx)
  }
}

function optimize() {
  var referenceSheet = app.getSheetByName(referenceName)
  var balanceRatioCell = referenceSheet.getRange(balanceRatioA1Notation)

  var lotSet = []

  // before we gather we need to normalize lots to get consistent input info now that
  // the algo considers avgo basis which can change based on current preference.
  // Set all preferences to shares to get most comparable info.


  for (var i = 0; i < datasheetNames.length; i++) {
    var sheet = app.getSheetByName(datasheetNames[i])
    var colIdx = findIndices(sheet)
    normalizeLotPreference(stockPreference, sheet, colIdx)
    lotSet = lotSet.concat(gatherCostBasis(sheet, colIdx))
  }

  // sort the basis array
  lotSet.sort(compareBasis)

  // lowest basis will be in costBasisSet[0]
  var l = lotSet[0]
  var h = lotSet[lotSet.length-1]
  Logger.log(`Lowest basis is ${l.sheet}!${l.row}={vmw:${l.vmwBasis},avgo:${l.avgoBasis}} qty[vmw:${l.vmwQuantity},${l.avgoQuantity}], 
              highest is ${h.sheet}!${h.row}={vmw:${h.vmwBasis},avgo:${h.avgoBasis}} qty[vmw:${h.vmwQuantity},${h.avgoQuantity}]`) 

  var cashShares = 0
  var stockShares = 0
  var bal

  var lowIdx = 0
  var highIdx = lotSet.length-1

  var highestSeenVMW = 0

  for (; lowIdx < highIdx; lowIdx++) {
    // work from lowest, selecting for shares
    var cur = lotSet[lowIdx]
    var pref = cur.pref

    var count = cur.vmwQuantity
    if (stockShares+count > maxStockShares) {
      Logger.log(`Maxed out stock shares at ${lowIdx}, with ${stockShares}`)
      Logger.log(`Setting lot ${cur.sheet}!${cur.row} (vmw basis: ${cur.vmwBasis}) to balance`)
      pref.setValue(balancePreference)
      bal = cur
      break
    }

    // added to see if we ever have an order change from considering post-merger basis
    if (highestSeenVMW > cur.vmwBasis) {
      Logger.log(`Future basis consideration impact!`)
    } else {
      highestSeenVMW = cur.vmwBasis
    }

    pref.setValue(stockPreference)
    stockShares+= count

    lotPreferenceCSV+= `${cur.sheet},${shortDate(cur.purchaseDate)},${cur.avgoQuantity.toFixed(3)},${cur.avgoBasis.toFixed(2)},1.0000,shares\n`
    Logger.log(`Assigned ${cur.vmwQuantity} shares to stock {vmw:${cur.vmwBasis},avgo:${cur.avgoBasis}} (${cur.sheet}!${cur.row})`)
  }
    
  for (; highIdx > lowIdx; highIdx--) {
    // work from highest, selecting for cash
    var cur = lotSet[highIdx]
    var pref = cur.pref

    var count = cur.vmwQuantity
    if (cashShares+count > maxCashShares) {
      Logger.log(`Maxed out cash shares at ${lowIdx}, with ${cashShares}`)
      Logger.log(`Setting lot ${cur.sheet}!${cur.row} (vmw basis: ${cur.vmwBasis}) to balance`)
      pref.setValue(balancePreference)
      bal = cur
      break
    }

    // added to see if we ever have an order change from considering post-merger basis
    if (highestSeenVMW > cur.vmwBasis) {
      Logger.log(`Future basis consideration impact!`)
    } else {
      highestSeenVMW = cur.vmwBasis
    }

    pref.setValue(cashPreference)
    cashShares+= count

    lotPreferenceCSV+= `${cur.sheet},${shortDate(cur.purchaseDate)},${cur.avgoQuantity.toFixed(3)},${cur.avgoBasis.toFixed(2)},0.0000,cash\n`
    Logger.log(`Assigned ${cur.vmwQuantity} shares to cash {vmw:${cur.vmwBasis},avgo:${cur.avgoBasis}} (${cur.sheet}!${cur.row})`)
  }


  Logger.log(`${cashShares} cash, ${stockShares} stock, ${stockShares/(cashShares+stockShares)}`)

  // determine the ratio needed to normalize
  if (bal == null) {
    Logger.log(`exact fit, no need for a balance lot`)
  } else {
    var lackingStockShares = maxStockShares - stockShares
    var finalLotRatio = lackingStockShares / bal.vmwQuantity
    balanceRatioCell.setValue(finalLotRatio)

    var balanceToStock = finalLotRatio * bal.vmwQuantity
    var balanceToCash = bal.vmwQuantity - balanceToStock

    lotPreferenceCSV+= `${bal.sheet},${shortDate(bal.purchaseDate)},${bal.avgoQuantity.toFixed(3)},${bal.avgoBasis.toFixed(2)},${finalLotRatio},mixed\n`
    Logger.log(`balance - ratio: ${finalLotRatio}, cash: ${balanceToCash}, stock: ${balanceToStock}`)
  }

  
  stockShares+= balanceToStock
  cashShares+= balanceToCash
  Logger.log(`final - ratio: ${stockShares/totalShares}, cash: ${cashShares}, stock: ${stockShares}`)

  if (exportLotsCSV) {
    Logger.log(`\n${lotPreferenceCSV}\n`)
  }
}

function findIndices(sheet) {
  var activeRange = sheet.getDataRange()
  var data = activeRange.getValues()

  var colIdx = {
    vmwBasis: -1,
    avgoBasis: -1,
    purchaseDate: -1,
    vmwQuantity: -1,
    avgoQuantity: -1,
    preference: -1,
  }

  switch (sheet.getName()) {
    case "RSU":
      Logger.log(`Processing RSUs`)
      break
    case "ESPP":
      Logger.log(`Processing ESPPs`)
      break
    default:
      Logger.log(`unknown sheet ${sheet.getName()}`)
  }

  var headings = datasheetSpecificHeadingRow
  for (var col = 0; col < data[headings].length; col++) {
    var str = data[headings][col]
    if (new RegExp(colIdxNames.vmwBasis).test(str)) {
        colIdx.vmwBasis = col
    } else if (new RegExp(colIdxNames.avgoBasis).test(str)) {
        colIdx.avgoBasis = col
    } else if (new RegExp(colIdxNames.purchaseDate).test(str)) {
        colIdx.purchaseDate = col
    } else if (new RegExp(colIdxNames.vmwQuantity).test(str)) {
        colIdx.vmwQuantity = col
    } else if (new RegExp(colIdxNames.avgoQuantity).test(str)) {
      colIdx.avgoQuantity = col
    } else if (new RegExp(colIdxNames.treatmentPreference).test(str)) {
      colIdx.preference = col
    }
  }

  if (colIdx.vmwBasis == -1 ||
    colIdx.avgoBasis == -1 ||
    colIdx.purchaseDate == -1 ||
    colIdx.vmwQuantity == -1 ||
    colIdx.avgoQuantity == -1 ||
    colIdx.preference == -1) {
      Logger.log("unable to locate all columns for gathering optimizer input")
      return
  }

  return colIdx
}

function normalizeLotPreference(preference, sheet, colIdx) {
  var activeRange = sheet.getDataRange()
  var data = activeRange.getValues()

  for (var row = datasheetDataStartRow; row < data.length; row++) {
    activeRange.getCell(row+1,colIdx.preference+1).setValue(preference)
  }
}

function gatherCostBasis(sheet, colIdx) {
  var activeRange = sheet.getDataRange()
  var data = activeRange.getValues()

  var lots = []
  var vmwCount = 0

  for (var row = datasheetDataStartRow; row < data.length; row++) {
    if (data[row][colIdx.purchaseDate] == "") {
      // bottom of the range
      break
    }

    if(data[row][colIdx.vmwQuantity] == 0) {
      // skip the row
      continue
    }

    var lot = {
      sheet: sheet.getName(),
      row: row,
      vmwBasis: data[row][colIdx.vmwBasis],
      avgoBasis: data[row][colIdx.avgoBasis],
      purchaseDate: data[row][colIdx.purchaseDate],
      vmwQuantity: data[row][colIdx.vmwQuantity],
      avgoQuantity: data[row][colIdx.avgoQuantity],
      pref: activeRange.getCell(row+1,colIdx.preference+1),
    }

    vmwCount+= lot.vmwQuantity

    if (debug) {
      Logger.log(`${lot.sheet}:${lot.row} - ${lot.vmwQuantity}@${lot.vmwBasis} to ${lot.avgoQuantity}@${lot.avgoBasis} - ${lot.pref}`)
    }

    // collect the basis
    lots.push(lot)
  }

  Logger.log(`Gathered ${vmwCount} VMW across ${lots.length} from ${sheet.getName()}`)
  return lots
}

// compareBasis returns in such a way that stock < cash
function compareBasis(a, b) {
  if (useFutureBasisForOptimization) {
    // if avgo basis makes no difference, eg. capped at FMV, then look at vmw.
    if (a.avgoBasis != b.avgoBasis) {
      return a.avgoBasis - b.avgoBasis
    }
  }

  return a.vmwBasis - b.vmwBasis
}





















