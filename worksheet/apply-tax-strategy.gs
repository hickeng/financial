var rsuPrefer = 12
var esppPrefer = 16
var cashPreference = "cash"
var stockPreference = "shares"
var balancePreference = "balance"
var vmwCashValue = 0

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

  // This has been turned into a cell formula so that changes via the preference dropdowns immediately cause recalculation.
  // var balanceRatioCell = referenceSheet.getRange(balanceRatioA1Notation)

  for (var i = 0; i < datasheetNames.length; i++) {
    var sheet = app.getSheetByName(datasheetNames[i])
    var colIdx = findIndices(sheet)
    normalizeLotPreference(balancePreference, sheet, colIdx)
  }
}

function solveSyntheticOptimization() {
  useFIFOStrategy = false
  useHIFOStrategy = false
  useSyntheticBasisForOptimization = true
  useFutureBasisForOptimization = true
  solve()
}

function solveFIFO() {
  useFIFOStrategy = true
  useHIFOStrategy = false
  useSyntheticBasisForOptimization = false
  useFutureBasisForOptimization = false
  solve()
}

function solveHIFO() {
  useHIFOStrategy = true
  useFIFOStrategy = false
  useFutureBasisForOptimization = false
  useSyntheticBasisForOptimization = false
  solve()
}

function solve() {
  var referenceSheet = app.getSheetByName(referenceName)
  var summarySheet = app.getSheetByName(summaryName)
  var balanceRatioCell = referenceSheet.getRange(balanceRatioA1Notation)
  var avgoTargetCell = summarySheet.getRange(sharesStockCellA1Notation)
  var cashTargetCell = summarySheet.getRange(sharesCashCellA1Notation)
  var totalVMWCell = summarySheet.getRange(totalVMWCellA1Notation)
  var vmwCashCell = referenceSheet.getRange(vmwCashPriceA1Notation)

  var totalShares = totalVMWCell.getValue()
  var maxCashShares = cashTargetCell.getValue()
  var maxStockShares = avgoTargetCell.getValue()
  var vmwCashValue = vmwCashCell.getValue()


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

  handleLossLots(lotSet, vmwCashValue)

  // sort the basis array for non-lossy lots
  lotSet.sort(compareBasis)

  // lowest basis will be in costBasisSet[0]
  var l = lotSet[0]
  var h = lotSet[lotSet.length-1]
  Logger.log(`Lowest basis is ${l.sheet}!${l.row}={vmw:${l.vmwBasis},avgo:${l.avgoBasis}} qty[vmw:${l.vmwQuantity},${l.avgoQuantity}],
              highest is ${h.sheet}!${h.row}={vmw:${h.vmwBasis},avgo:${h.avgoBasis}} qty[vmw:${h.vmwQuantity},${h.avgoQuantity}]`)

  var cashShares = 0
  var stockShares = 0
  var bal = []
  var cash = []

  var lowIdx = 0
  var highIdx = lotSet.length-1

  for (; lowIdx < highIdx; lowIdx++) {
    // work from lowest, selecting for shares
    var cur = lotSet[lowIdx]
    var pref = cur.pref


    if (cur.forcePreference != null && cur.forcePreference != "") {
      Logger.log(`Lot ${cur.sheet}!${cur.row} forced to ${cur.forcePreference}`)
    }

    switch (cur.forcePreference) {
      case balancePreference:
        bal = bal.concat(cur)
        continue

      case cashPreference:
        cash = cash.concat(cur)
        continue

      case stockPreference:
        break

      default:
    }

    var count = cur.vmwQuantity
    if (stockShares+count > maxStockShares) {
      if (cur.forcePreference == stockPreference) {
        // TODO: add some handling not just a warning
        Logger.log(`WARNING: unable to force lot to stock due to max stock limit`)
      }
      Logger.log(`Maxed out stock shares at ${lowIdx}, with ${stockShares}`)
      Logger.log(`Setting lot ${cur.sheet}!${cur.row} (vmw basis: ${cur.vmwBasis}) to balance`)
      bal = bal.concat(cur)

      break
    }

    pref.setValue(stockPreference)
    stockShares+= count

    lotPreferenceCSV+= `${cur.sheet},${shortDate(cur.purchaseDate)},${cur.avgoQuantity.toFixed(3)},${cur.avgoBasis.toFixed(2)},1.0000,shares\n`
    Logger.log(`Assigned ${cur.vmwQuantity} shares to stock {vmw:${cur.vmwBasis},avgo:${cur.avgoBasis}} (${cur.sheet}!${cur.row})`)
  }

  // process those forced to cash
  for (var i = 0; i < cash.length; i++) {
    var cur = cash[i]
    var pref = cur.pref
    var count = cur.vmwQuantity

    if (cashShares+count > maxCashShares) {
      Logger.log(`Maxed out cash shares at ${lowIdx}, with ${cashShares}`)
      Logger.log(`Setting lot ${cur.sheet}!${cur.row} (vmw basis: ${cur.vmwBasis}) to balance`)
      bal = bal.concat(cur)

      break
    }

    pref.setValue(cashPreference)
    cashShares+= count

    lotPreferenceCSV+= `${cur.sheet},${shortDate(cur.purchaseDate)},${cur.avgoQuantity.toFixed(3)},${cur.avgoBasis.toFixed(2)},0.0000,cash\n`
    Logger.log(`Assigned ${cur.vmwQuantity} shares to cash {vmw:${cur.vmwBasis},avgo:${cur.avgoBasis}} (${cur.sheet}!${cur.row})`)
  }

  for (; highIdx > lowIdx; highIdx--) {
    // work from highest, selecting for cash
    var cur = lotSet[highIdx]
    var pref = cur.pref

    if (cur.forcePreference != null && cur.forcePreference != "") {
      Logger.log(`Lot ${cur.sheet}!${cur.row} forced to ${cur.forcePreference}`)
    }

    switch (cur.forcePreference) {
      case stockPreference:
        Logger.log(`WARNING: cannot force lot ${cur.sheet}!${cur.row} to ${cur.forcePreference} due to phase. Assigning to balance`)
        // fallthrough
      case balancePreference:
        bal = bal.concat(cur)
        continue

      case cashPreference:
        break

      default:
        break
    }

    var count = cur.vmwQuantity
    if (cashShares+count > maxCashShares) {
      Logger.log(`Maxed out cash shares at ${lowIdx}, with ${cashShares}`)
      Logger.log(`Setting lot ${cur.sheet}!${cur.row} (vmw basis: ${cur.vmwBasis}) to balance`)
      bal = bal.concat(cur)

      break
    }

    pref.setValue(cashPreference)
    cashShares+= count

    lotPreferenceCSV+= `${cur.sheet},${shortDate(cur.purchaseDate)},${cur.avgoQuantity.toFixed(3)},${cur.avgoBasis.toFixed(2)},0.0000,cash\n`
    Logger.log(`Assigned ${cur.vmwQuantity} shares to cash {vmw:${cur.vmwBasis},avgo:${cur.avgoBasis}} (${cur.sheet}!${cur.row})`)
  }


  Logger.log(`${cashShares} cash, ${stockShares} stock, ${stockShares/(cashShares+stockShares)}`)

  // determine the ratio needed to normalize
  if (bal.length == 0) {
    Logger.log(`exact fit, no need for a balance lot`)
  } else {
    var lackingStockShares = maxStockShares - stockShares
    var balVMWQty = 0
    for (var i = 0; i < bal.length; i++) {
      balVMWQty+= bal[i].vmwQuantity
    }

    var finalLotRatio = lackingStockShares / balVMWQty
    // This has been turned into a cell formula so that changes via the preference dropdowns immediately cause recalculation.
    // balanceRatioCell.setValue(finalLotRatio)

    for (var i = 0; i < bal.length; i++) {
      bal[i].pref.setValue(balancePreference)
      lotPreferenceCSV+= `${bal[i].sheet},${shortDate(bal[i].purchaseDate)},${bal[i].avgoQuantity.toFixed(3)},${bal[i].avgoBasis.toFixed(2)},${finalLotRatio},mixed\n`
    }

    var balanceToStock = finalLotRatio * balVMWQty
    var balanceToCash = balVMWQty - balanceToStock
    Logger.log(`balance - ratio: ${finalLotRatio}, cash: ${balanceToCash}, stock: ${balanceToStock}`)
  }


  stockShares+= balanceToStock
  cashShares+= balanceToCash
  Logger.log(`final - ratio: ${stockShares/totalShares}, cash: ${cashShares}, stock: ${stockShares}`)

  if (exportLotsCSV) {
    Logger.log(`\n${lotPreferenceCSV}\n`)
  }
}

function handleLossLots(lots, vmwThreshold) {
  if (!forceLossLotsToBalance) {
    return
  }

  for (var i = 0; i < lots.length; i++) {
    if (lots[i].vmwBasis > vmwThreshold) {
      lots[i].forcePreference = balancePreference
    }
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
    stg: -1,
    ltg: -1,
    ordinaryIncome: -1,
    fractional: -1,
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
    } else if (new RegExp(colIdxNames.shortTermGain).test(str)) {
      colIdx.stg = col
    } else if (new RegExp(colIdxNames.longTermGain).test(str)) {
      colIdx.ltg = col
    } else if (new RegExp(colIdxNames.ordinaryIncome).test(str)) {
      colIdx.ordinaryIncome = col
    } else if (new RegExp(colIdxNames.fractionalLot).test(str)) {
      colIdx.fractional = col
    }
  }

  if (colIdx.vmwBasis == -1 ||
    colIdx.avgoBasis == -1 ||
    colIdx.purchaseDate == -1 ||
    colIdx.vmwQuantity == -1 ||
    colIdx.avgoQuantity == -1 ||
    colIdx.preference == -1 ||
    colIdx.stg == -1 ||
    colIdx.ltg == -1 ||
    colIdx.fractional == -1 ||
    (colIdx.ordinaryIncome == -1 && sheet.getName() == "ESPP")
    ) {
      Logger.log("unable to locate all columns for gathering solver input")
      return
  }

  return colIdx
}

function normalizeLotPreference(preference, sheet, colIdx) {
  var activeRange = sheet.getDataRange()
  var data = activeRange.getValues()

  for (var row = datasheetDataStartRow; row < data.length; row++) {
    var value = data[row][colIdx.preference]
    if (value == "" || value == null) {
      break
    }

    activeRange.getCell(row+1,colIdx.preference+1).setValue(preference)
  }
}

function gatherCostBasis(sheet, colIdx) {
  var referenceSheet = app.getSheetByName(referenceName)
  var ltgRate = referenceSheet.getRange(longTermRateA1Notation).getValue()

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
      shortGain: data[row][colIdx.stg],
      longGain: data[row][colIdx.ltg],
      fractional: data[row][colIdx.fractional],
    }

    // construct a synthetic basis
    lot.syntheticBasis = lot.avgoBasis

    if (colIdx.ordinaryIncome != -1) {
      lot.ordinaryIncome = data[row][colIdx.ordinaryIncome]

      // adjusting up by the ordinary income to be recognized
      lot.syntheticBasis+= lot.ordinaryIncome/lot.vmwQuantity
    }

    // adjusting it down by the amount of tax to be realized.
    // TODO: remove the hardcoding of rates
    lot.syntheticBasis-= ((lot.longGain * 0.2) + (lot.longGain *0.10) + (lot.shortGain * 0.45)) / lot.avgoQuantity

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
  // OVERRIDE fractional lot to shares as etrade have committed us to that by virtue of a concrete sale
  if (a.fractional && b.fractional) {
    return 0
  } else if (a.fractional) {
    return -1
  } else if (b.fractional) {
    return +1
  }

  // simpler strategies approaches are at the top of the function
  if (useFIFOStrategy) {
    // older lots should be earlier in the sort
    return b.purchaseDate - a.purchaseDate
  }

  if (useHIFOStrategy) {
    return a.vmwBasis - b.vmwBasis
  }

  // below are nascent attempts at a proximate MT/optimizer strategy
  // if basis makes no difference, eg. capped at FMV, then look at other calcs.
  if (useSyntheticBasisForOptimization && a.syntheticBasis != b.syntheticBasis) {
    return a.syntheticBasis - b.syntheticBasis
  }

  if (useFutureBasisForOptimization && a.avgoBasis != b.avgoBasis) {
        return a.avgoBasis - b.avgoBasis
  }

  // fallback to HIFO
  return a.vmwBasis - b.vmwBasis
}
