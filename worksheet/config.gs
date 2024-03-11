const defaultExportFolder = 'github_hickeng_financial_vmw_avgo_merger_data'

var censor = false
var printPropagations = false
var debug = 0
var exportLotsCSV = true

const overrideStartIndex = 0

var useFutureBasisForOptimization = true
var useSyntheticBasisForOptimization = true
var useFIFOStrategy = false
var useHIFOStrategy = false
// When set to true, all lots that would realize an actual loss if straight cash are kept as pro-rata
var forceLossLotsToBalance = false

// Merge processing turned out to be insanely slow.
// Almost 60s added just for the cells in Summary, with the bulk of that spent
// in the per-cell getMergedRanges calls
const enableMergeProcessing = false


const datasheetNames = ["ESPP","RSU"]
const referenceName = "Reference"
const summaryName = "Summary"

const sharesCashCellA1Notation = "B25"
const sharesStockCellA1Notation = "B26"
const totalVMWCellA1Notation = "B29"

// the row in which the costBasisColName can be found.
// TODO: this is a monumental hack. Could also use a search, a NamedRange,
// associated dev metadata with the cost-basis column, etc.
// but this'll be fast without researching details and I need it now.
const datasheetColNameRow = 4

// Use future basis with inverted comparison to factor in ordinary income

// Names for looking up column indexes from the stable(ish) pretty names - regexp
const colIdxNames = {
  vmwBasis: "VMW tax-basis per share",
  avgoBasis: "AVGO tax-basis per share",
  purchaseDate: "(Release Date|Purchase Date)",
  vmwQuantity: "(Shares Issued|Shares Purchased)",
  avgoQuantity: "active qty",
  treatmentPreference: "Prefer",
  shortTermGain: "Short Term Capital Gain",
  longTermGain: "Long Term Capital Gain",
  ordinaryIncome: "Pending Ordinary Income",
  fractionalLot: "Use for fraction",
}

const vmwSharePurchaseDate = 2 // always in column C currently
const vmwShareQtyIdx = 3 // always in column D currently

// the rows for heading/spacing before data starts
const datasheetSpecificHeadingRow = 3 // 0-indexed
const datasheetDataStartRow = 6 // 0-indexed

// Reference sheet
const vmwCashPriceA1Notation = "B3"
const derivedStockRatioCellA1Notation = "B5"
const balanceRatioA1Notation = "E7"
// TODO: don't just hardcode to max
// const incomeRateA1Notation = ""
const longTermRateA1Notation = "B44"
