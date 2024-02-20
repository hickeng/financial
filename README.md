Welcome, fellow members of the Turtle Pond.

This repo is going to hold all my spreadsheets (santized) for the financials around the VMW->AVGO acquisition. Click on the burger menu on the top right of the readme pane for a table of contents.

By insistent recommendation of colleagues/friends that _they_ want to be able to pay something, I haved enabled Sponsor for the repo ([:heart:](https://github.com/sponsors/hickeng)).

Don't feel obligated in any way to do so - my goal is to provide as much support as feasible for everyone with the same set of concerns... and to get peer reviewed in turn to improve _my_ filing correctness! Basically standard Open Source motive.
For people that have insisted, I'm suggesting $3.80, $38, ... as an ironic echo of the _voluntary reorganization_ fee by eTrade, for which we had the expectation of correct data. Whatever it's worth to you, but _please not more than noise to you!_.

Donations will go towards getting CPA validation of the calculations I'm using and answering [questions needing professional expertise](https://github.com/hickeng/financial/issues?q=is%3Aopen+is%3Aissue+label%3Acpa). I'll try to keep those issues curated such that the description is sufficiently clear and coherent to be passed directly to a CPA, but it'll be best effort. If there's questions you want answered that aren't addressed in the README and in that labelled set, please open an issue with the `cpa` label.

# Release Status

Using github project for planning - see [Timeline](https://github.com/users/hickeng/projects/2/views/2)

## [v0.1.0](https://github.com/hickeng/financial/releases/tag/v0.1.0) - 2024-02-18

Initial tagged release because the foundation is there:

* human readable diffs are sufficient for reviewing changes before commit
* basic inputs are complete - minimal input data needed and easily sourced from downloadable confirmation docs
* basic outputs are complete - per-lot cash amounts, gain, old adjusted vmw basis, and new avgo basis are calculated considering short/long term gain and ESPP qualified/disqualified status
* all planned changes are enhancements

There's [a binary sheet](https://github.com/hickeng/financial/releases/download/v0.1.0/VMW_to_AVGO_ESPP_and_RSU-v0.1.0-github.xlsx) attached to the release, suitable for import into Google Sheets.
I've been able to:

1. Download [the sheet](https://github.com/hickeng/financial/releases/download/v0.1.0/VMW_to_AVGO_ESPP_and_RSU-v0.1.0-github.xlsx)
2. Create a new Google Sheet - [open this in new window](https://docs.google.com/spreadsheets/u/0/create?usp=sheets_home&ths=true)
3. Go to File->Import->Upload->Browse - this will open a system file selection box. Select the downloaded sheet.
4. Choose `Replace Spreadsheet`, and select `Import data`


# Contents

The spreadsheet is exported from Google Sheets. I've tried opening it in Excel but it's not happy. If there are easy tweaks to make it comptiable that'll be my first change. Until then, import into Google Docs.

* [spreadsheet for ESPP & RSU basis and realized gain cacluations](https://github.com/hickeng/financial/raw/main/VMW_to_AVGO_ESPP_and_RSU.xlsx)
  * I **STRONGLY** recommend that if you need to add rows to RSUs you append at the bottom of the data grid instead of preserving date ordering. This is so that it's easy to copy/paste into the reference sheet when it's updated, then re-append your custom rows at the end.
* [IRS Form 8949](https://www.irs.gov/pub/irs-pdf/f8949.pdf) - this is what we need to file with taxes. See #1 for generation of values.

## On "Upgrades"

I've inserted missing RSU rows in date order once, but I'm not doing it again unless I come up with some magic way of loading/copy/pasting RSU inputs that factors in the additional rows. It's just too much of a pain to do the transcription of inputs from old version to new version.

For now I've coloured the `Release Date` for the added rows in a slightly darker pre-populated colour to indicate which are new. It helps.

See #9 for tracking a more general solution.


# On use of Issues

I'm opening issues to track questions and feature requests. Feel free to do the same.

If it's also applicable to me, I'll get to them (no latency guarantees).  If not it'll be best effort.


# Form 8949 (to be filed with taxes)

This is the form used to report "Sales and Other Dispositions of Captial Assets". It's split into Short Term and Long Term gain sections, with a radio button (well, checkbox but radio button is the required behaviour) to record how it intersects with the 1099-B. If you need to use multiple radio buttons, then you must submit additional instances of the form (attaching the one with code `Z` in column (f) first). I'm working through the details of this in #1.

[Form 8949](documents/f8949.pdf) - ([instructions](documents/f8949%20-%20instructions.pdf))

![example image from the top of form 8949](assets/f8949-snippet.png)

I used costbasis.com to get a comparison, and it gave me one that I agree with, but it didn't explain _how_ that value was reached or provide reference links. I've not been able to find absolute references but I've worked through it from first principles and have the same values. The following reasoning is promoted from [my working](https://github.com/hickeng/financial/issues/1#issuecomment-1950283122) in #1.

This isn't added into the spreadsheet yet - I want to have human readable diffs for commits before that - but here for visible reference.
I strongly suspect that the value of basis from eTrade 1099-B, which goes in column (e), will be incorrect. That means the values I calculate will need to go into column(f) along with appropriate code into column(e) which I've not yet extracted from the separate instructions.

I've derived the following from first principles with the following axioms:

* realized gain and adjusted avgo basis are inflexible values dictated by f8937
* f8949 proceeds is inflexible as an actual dollar value credited & fmv of shares received
* must pay tax on realized gain
* must pay tax on deferred gain
* difference between proceeds and basis reported on f8949 must equal realized gain

The only flexible value we can adjust to reconcile the above is the reported f8949 basis.

This logic is written agnostic of per-lot or per-vmw. I prefer normalized per-vmw, but we just need to use matching values for vmw_basis, avgo_fmv, and cash_recieved:

```python
# known without calculation
f8949_proceeds = cash_received + avgo_fmv

# the alternate gain calculation from f8937
# translating it, this is also the real economic value received: total consideration - true basis
alternate_gain_calc = cash_received + fmv_avgo - vmw_basis

# the approximate threshold for per-share vmw basis (adjusted for dividends) where we switch clauses is
# 0.2520 * 0.521 * 979.50 = 128.601
if cash_received < alternate_gain_calc {

  # composite vmw basis was lower than avgo fmv, ie. we've got a capital gain (avgo_fmv-vmw_basis) from the share consideration that is deferred.
  # gain mandated by f8937 does not include deferred gain.
  f8937_gain = cash_received

  # the deferred gain from vmw->avgo conversion must still be realized in the future. Adjustment
  # to avgo_basis is the way this is accomplished. This is rolled into the mandated f8937 basis adjustment.

  # we need the 2023 f8949 to reconcile correctly in the future against the deferred gain resulting from the
  # inflexible avgo_basis.
  # we must realize the cash_received as gain therefore, with f8949_proceeds fixed as cash_received:
  #    f8949_basis = 0
  # but we're deferring avgo_fmv - vmw_basis gain to the future, so we must not pay tax on it now, therefore
  #   f8949_basis += avgo_fmv - vmw_basis
  f8949_basis = avgo_fmv - vmw_basis

} else {

  # composite vmw basis was higher than avgo fmv - no deferral
  # gain mandated by f8937
  f8937_gain = alternate_gain_calc

  # that's our true gain, so we should be ok with an avgo_basis of avgo_fmv... but f8937 says the adjust avgo basis must be:
  # avgo_basis = vmw_basis - cash_received + f8937_gain
  #
  # This is still okay, as that simplifies
  # avgo_basis = vmw_basis - cash_received + cash_received + fmv_avgo - vmw_basis
  # avgo_basis = fmv_avgo
  f8949_basis = vmw_basis
}

# adjusted avgo basis for future sale - this is mandated by f8937
avgo_basis = vmw_basis - cash_received + f8937_gain
```

Links into the IRS webiste:

* [IRS instructions for Form 8949](https://www.irs.gov/instructions/i8949)
* [IRS Form 8949](https://www.irs.gov/pub/irs-pdf/f8949.pdf)



# References

## ESPP

The ESPP discount is considered ordinary income and _should_ be reported on your W2 when you sell the shares. In the past it has shown up on VMW W2's in `Box 14 Other`, labelled as ESPP. However, the proportion of the discount treated as ordinary income vs long term capital gain depends on whether the ESPP shares are qualified or disqualified.

Terms:

* disqualified - sold within either 1 year from purchase date (when you got the shares aka exercise) or 2 years from grant date (when the ESPP period started aka offering).
* qualified - held for 2 years past grant _and_ 1 year past purchase
* market price - the Fair Market Value of the stock on the date of purchase
* offer price (my term) - the lesser of the market price and the grant date price
* purchase price - the amount you actually paid for it
* bargain element - the ESPP discount, `market price - purchase price`

Qualified vs disqualified proportion of discount considered ordinary income and reported on W2:

* disqualified - `market price - purchase price` - the entire discount, 15% plus any increase in share price over the offering period, is treated as income.
* qualified - `offer price - purchase price` - just the 15% reduction on offer price is treated as income. Any `market price - offer price` delta due to share price change over the offering period is treated as captial gain (long term because you've inherently held for a year).

[Reference](https://turbotax.intuit.com/tax-tips/investments-and-taxes/employee-stock-purchase-plans/L8NgMFpFX)

## Form 8937
These forms detail tax handling for an event. This includes qualified/unqualified amounts from dividends, how to adjust cost-basis, how to calculate gain that must be realized, etc. These are pulled from the [Broadcom Invester Relations](https://investors.broadcom.com/financial-information/tax-information) site.

The acquisition form mostly uses non-imperative language, which leaves a lot of optionality for other treatments. My personal plan is to use the "generally ..." guidence absent a strong endorsement from a CPA for a different treatment being valid.

Links to the relevant Form 8937's:

* [Broadcom Acquisition](https://investors.broadcom.com/static-files/7720c4c1-c940-4d9d-800c-66819bfdc7a0) ([from repo](documents/Broadcom%20-%20Form%208937%20Acquistion%20of%20VMware%20Inc..pdf))
* [Dell recapitalization 2021](https://investors.broadcom.com/static-files/7ba40d05-a5b8-454d-8140-7f9782069523) - ([from repo](documents/IRS%20Form%208937%20-%20VMWARE,%20INC.%20November%201,%202021%20Recapitalization.pdf))applies if you received VMWs by virtue of owning Dell shares during the spin out.
* [Dell distribution 2021](https://investors.broadcom.com/static-files/c03396b2-538b-42c3-910c-dce218d5d9f1) ([from repo](documents/IRS%20Form%208937%20-%20VMWARE,%20INC.%20November%201,%202021%20Distribution.pdf))
* [Dell distribution 2018](https://investors.broadcom.com/static-files/674c4fc3-6cc3-48cf-83b1-f6f6f3f75623) ([from repo](documents/IRS%20Form%208937%20-%20VMWARE,%20INC.%20December%2028,%202018%20Distribution.pdf))



### Pro-rata vs other allocation of cash/share split

> a shareholder ... is treated as having surrendered each share _for a pro rata portion of the stock and cash received_, based on the [fair market value](https://github.com/hickeng/financial/edit/main/README.md#on-fair-market-value) of such surrendered share, _unless the terms of the exchange provide otherwise and are economically reasonable_.

> If a holder of VMware Common Stock acquired different blocks of shares ... at different times or different prices, any gain or loss _may_ be determined separately for each block of shares ... . Any such holder should consult their tax advisor regarding the manner in which the Cash Consideration and Stock Consideration should be allocated among different blocks of shares of VMware Common Stock surrendered.

Per my reading, this explicitly states that we have the option to chose _not_ to use a pro-rata approach to calculating the cash/stock split. I've an [issue](https://github.com/hickeng/financial/issues/13) to collect data on _when_ we're allowed to make this choice.

The first quote is referencing the FMV of a VMW share at the time of acquisition. This should be fixed at $192.48 (?) based on knowledge at time of execution. I've an [issue](https://github.com/hickeng/financial/issues/14) to follow up on this.

### Realized gain calculation

> ... a holder ... who received a combination of ... Stock and cash ... will recognize gain (but not loss) for U.S. federal income tax purposes in an amount equal to the lesser of
> (1) the sum of the amount of the cash ... and the fair market value of the Broadcom Common Stock received in exchange ..., minus the holder’s adjusted tax basis in ... VMware Common Stock surrendered..., and
> (2) the amount of cash received for such share of VMware Common Stock.

We recognize gain, per lot, on the lesser of:

* `cash portion`
* `cash portion + FMV AVGO - VMW basis`

You'll recognize the cash unless your VMW basis was higher than the FMV of the AVGO received.



### Basis calculation - post-acquisition sale of AVGO

The concise version of future tax basis of RSUs, calculated per lot, is:

* basis prior to merger - cash received + gain recognized

Gain recognized is the lesser of (per Form 8937):

* cash received
* cash received + FMV AVGO received - basis prior to merger

That simplifies to the lesser of:

* basis prior to merger
* FMV AVGO received



### On Fair Market Value

[Yahoo Finance market data for the period in question](https://ca.finance.yahoo.com/quote/AVGO/history?period1=1700438400&period2=1700870400&interval=1d&filter=history&frequency=1d&includeAdjustedClose=true)

> Fair market value generally is the price at which property would change hands between a willing buyer and a willing seller, neither being under any compulsion to buy or sell and both having reasonable knowledge of the facts.

> ... tax law does not specifically prescribe ... the fair market value ... for purposes of calculating any gain recognized ....
> One reasonable approach is ... the mean ... trading price on November 22, 2023, which is $979.50 .... Other approaches ... may be appropriate. _You should consult your tax advisor to determine what measure of fair market value is appropriate._

I have an [issue](https://github.com/hickeng/financial/issues/11) open to determine the knwoledge available to our hypothetical buyer/seller pair and add other FMV options to the dropdown in the spreadsheet.


### Fractional share sale

> A holder of VMware Common Stock who received cash in lieu of a fractional share ... will generally be treated as having received such fractional share and then as having received such cash in redemption of the fractional share.
> Gain or loss generally will be recognized based on the difference between the amount of cash in lieu of the fractional share and the tax basis allocated to such fractional share.

This details sequential steps of:

1. receive fractional share
2. sell fractional share

I'm interpreting that as needing to calculate the gain for the fractional share sale (step 2) using the new cost basis, post conversion. You'll have also seperately recognised gain on the conversion of the fraction (step 1).
If the fraction was attributed against an ESPP share this implies recognizing the ordinary income associated with the fraction given it's a sale.

> The amount paid for a fractional share of Broadcom Common Stock _was based on_ the closing price of Broadcom Common Stock as reported on the NASDAQ on November 21, 2023, which was $981.20.

eTrade did not use the value explicitly specified in f8937 for the fraction. I do not know what consequence "based on" has in this sentence. I've an [issue](https://github.com/hickeng/financial/issues/12) to determine handling for this.
