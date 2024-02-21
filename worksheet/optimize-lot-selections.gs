var rsuPrefer = 12
var esppPrefer = 16
var cashPreference = "cash"
var stockPreference = "shares"
var balancePreference = "balance"
var totalShares = 9545
var maxCashShares = 4573
var maxStockShares = 4972

var costBasisSet = []

function optimize() {
  for (var i = 0; i < datasheetNames.length; i++) {
    gatherCostBasis(app.getSheetByName(datasheetNames[i]))
  }

  var referenceSheet = app.getSheetByName(referenceName)
  var balanceRatioCell = referenceSheet.getRange(balanceRatioA1Notation)

  // sort the basis array
  costBasisSet.sort(compareBasis)

  // lowest basis will be in costBasisSet[0]
  var l = costBasisSet[0]
  var h = costBasisSet[costBasisSet.length-1]
  Logger.log(`Lowest basis is ${l.sheet}!${l.row}=${l.basis} [${l.count}], highest is ${h.sheet}!${h.row}=${h.basis} [${h.count}]`)

  var cashShares = 0
  var stockShares = 0
  var balanceLot

  var lowIdx = 0
  var highIdx = costBasisSet.length-1

  for (; lowIdx < highIdx; lowIdx++) {
    // work from lowest, selecting for shares
    var cur = costBasisSet[lowIdx]
    var pref = cur.pref

    var count = cur.count
    if (stockShares+count > maxStockShares) {
      Logger.log(`Maxed out stock shares at ${lowIdx}, with ${stockShares}`)
      Logger.log(`Setting lot ${cur.sheet}!${cur.row}=${cur.basis} to balance`)
      pref.setValue(balancePreference)
      balanceLot = cur
      break
    }

    pref.setValue(stockPreference)
    stockShares+= count
    Logger.log(`Assigned ${cur.count} shares to stock (${cur.sheet}!${cur.row}=${cur.basis})`)
  }
    
  for (; highIdx > lowIdx; highIdx--) {
    // work from highest, selecting for cash
    var cur = costBasisSet[highIdx]
    var pref = cur.pref

    var count = cur.count
    if (cashShares+count > maxCashShares) {
      Logger.log(`Maxed out cash shares at ${lowIdx}, with ${cashShares}`)
      Logger.log(`Setting lot ${cur.sheet}!${cur.row}=${cur.basis} to balance`)
      pref.setValue(balancePreference)
      balanceLot = cur
      break
    }

    pref.setValue(cashPreference)
    cashShares+= count

    Logger.log(`Assigned ${cur.count} shares to cash (${cur.sheet}!${cur.row}=${cur.basis})`)
  }

  Logger.log(`${cashShares} cash, ${stockShares} stock, ${stockShares/(cashShares+stockShares)}`)

  // determine the ratio needed to normalize
  if (balanceLot == null) {
    Logger.log(`exact fit, no need for a balance lot`)
  } else {
    var lackingStockShares = maxStockShares - stockShares
    var finalLotRatio = lackingStockShares / balanceLot.count
    balanceRatioCell.setValue(finalLotRatio)

    var balanceToStock = finalLotRatio * balanceLot.count
    var balanceToCash = balanceLot.count - balanceToStock

    Logger.log(`balance - ratio: ${finalLotRatio}, cash: ${balanceToCash}, stock: ${balanceToStock}`)
  }

  
  stockShares+= balanceToStock
  cashShares+= balanceToCash
  Logger.log(`final - ratio: ${stockShares/totalShares}, cash: ${cashShares}, stock: ${stockShares}`)
}

function gatherCostBasis(sheet) {
  var activeRange = sheet.getDataRange()
  var data = activeRange.getValues()

  var costBasisColIdx = -1
  var preferenceCol
  switch (sheet.getName()) {
    case "RSU":
      preferenceCol = rsuPrefer
      break
    case "ESPP":
      preferenceCol = esppPrefer
      break
    default:
      Logger.log(`unknown sheet ${sheet.getName()}`)
  }

  var costBasisColName = curCostBasisColName
  if (useFutureBasisForOptimization) {
    costBasisColName = futureCostBasisColName
  }

  for (var row = datasheetSpecificHeadingRow; row < data.length; row++) {
    if (costBasisColIdx < 0) {
      for (var col = 0; col < data[row].length; col++) {
        if (data[row][col] == costBasisColName) {
          costBasisColIdx = col
          row = datasheetDataStartRow
          break
        }
      }
    }

    if (costBasisColIdx == -1) {
      Logger.log(`Unable to locate column for basis with name ${costBasisColName}`)
    }

    var basis = data[row][costBasisColIdx]
    if (basis == "" || basis == null) {
      // bottom of the range
      break
    }
    if(basis == "n/a") {
      continue
    }

    var basis = {
      sheet: sheet.getName(),
      row: row,
      col: costBasisColIdx,
      basis: data[row][costBasisColIdx],
      count: data[row][vmwShareQtyIdx],
      pref: activeRange.getCell(row+1, preferenceCol+1),
      // TODO: for logging the lot selection
      releaseDate: "",
      avgoCount: 0,
    }

    // collect the basis
    costBasisSet.push(basis)
  }
}


// compareBasis returns in such a way that stock < cash
function compareBasis(a, b) {
  if (useFutureBasisForOptimization) {
    return a.basis - b.basis
  } else {
    return a.basis - b.basis
  }
}
