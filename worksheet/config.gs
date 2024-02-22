const defaultExportFolder = 'github_hickeng_financial_vmw_avgo_merger_data'

var censor = false
var printPropagations = false
var debug = 0
var exportLotsCSV = true

const overrideStartIndex = 0

const useFutureBasisForOptimization = true

// Merge processing turned out to be insanely slow.
// Almost 60s added just for the cells in Summary, with the bulk of that spent
// in the per-cell getMergedRanges calls
const enableMergeProcessing = false


const datasheetNames = ["ESPP","RSU"]
const referenceName = "Reference"

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
}

const vmwSharePurchaseDate = 2 // always in column C currently
const vmwShareQtyIdx = 3 // always in column D currently

// the rows for heading/spacing before data starts
const datasheetSpecificHeadingRow = 3 // 0-indexed
const datasheetDataStartRow = 6 // 0-indexed

const derivedStockRatioCellA1Notation = "B5"
const balanceRatioA1Notation = "E7"