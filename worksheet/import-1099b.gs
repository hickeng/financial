
function promptFor1099B() {
  var html = HtmlService.createHtmlOutputFromFile('1099bModalInputHtml')
    .setWidth(400)
    .setHeight(300);
  SpreadsheetApp.getUi().showModalDialog(html, 'Copy/Paste 1099-B');
}

function process1099b(data) {
  Logger.log(`Received ${data.length} of data for 1099b`)
  
  var transactionText = isolateTransactions(data)
  Logger.log(`Found ${transactionText.length} of transaction text`)

  var transactions = parseTransactionText(transactionText)
}


function isolateTransactions(data) {
  var sectionIndex = data.indexOf(transactionSectionHeader)
  if (sectionIndex == -1) {
    Logger.log(`failed to find transaction section start string`)
    return
  }

  data = data.slice(sectionIndex,data.length)
  var sectionEnd = data.indexOf(transactionSectionEnd)
  if (sectionEnd == -1) {
    Logger.log(`failed to find transaction section end string`)
    return
  }

  return data.slice(0, sectionEnd)
}

function testParseTransactionText() {
  var testTransactions = 
`103.000 12/01/22 11/24/23 $7,031.97 $0.00 0.00 $0.00 $7,031.97 $0.00
44.000 02/01/23 11/24/23 $3,003.95 $0.00 0.00 $0.00 $3,003.95 $0.00
257.000 03/01/23 11/24/23 $17,545.81 $0.00 0.00 $0.00 $17,545.81 $0.00`

  var result = parseTransactionText(testTransactions)
}

// parseTransactionText turns text into an array of transaction objects that
// equates to sale of lots
function parseTransactionText(data) {
  // var regexp = /(\d+\.\d{3}) +(\d{2}\/d{2}\/d{2}) +(\d{2}\/d{2}\/d{2}) \$([0-9\.,]) +\$([0-9\.,]) +([0-9\.,]) +\$([0-9\.,]) +\$([0-9\.,]) +\$([0-9\.,])$/
  // TODO: add negative to second to last group
  var regexp = /(\d+\.\d{3}) +(\d{2}\/\d{2}\/\d{2}) +(\d{2}\/\d{2}\/\d{2}) +\$([0-9\.,]+) +\$([0-9\.,]+) +([0-9\.,]+) +\$([0-9\.,]+) +\$([0-9\.,]+) +\$([0-9\.,]+)/
  var transactions = []

  while((m = regexp.exec(data)) !== null) {
    data = data.substring(m.index+m[0].length+1)

    transactions.push(
      {
        quantity: m[1],
        acquired: m[2],
        sold: m[3],
        proceeds: m[4],
        basis: m[5],
        discount: m[6],
        disallowed: m[7],
        gain: m[8],
        taxWithheld: m[9],
      }
    )
  }

  Logger.log(JSON.stringify(transactions))
}























