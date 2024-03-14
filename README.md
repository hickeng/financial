Welcome, fellow members of the Turtle Pond.

This repo is going to hold all my spreadsheets (santized), research, and conclusions for the financials around the VMW->AVGO acquisition. Click on the burger menu on the top right of the readme pane for a table of contents.

By insistent recommendation of colleagues/friends that _they_ want to be able to pay something, I haved enabled Sponsor for the repo ([:heart:](https://github.com/sponsors/hickeng)).
Don't feel obligated - my goal is to provide support to colleagues and friends in getting through an unexpectedly complex tax season... and to get peer reviewed in turn to improve _my_ filing correctness! So, mostly standard Open Source motive.

Donations will initially go towards getting CPA validation of the calculations I'm using and answering [questions needing professional expertise](https://github.com/hickeng/financial/issues?q=is%3Aopen+is%3Aissue+label%3Acpa) assuming I can find one willing to engage in that style. I'll try to keep those issues curated such that the description is sufficiently clear and coherent to be passed directly to a CPA, but it'll be best effort. If there's questions you want answered that aren't addressed in the README and in that labelled set, please open an issue with the `cpa` label.

Use by past and present VMware and Broadcom employees for tax purposes, including giving it to a CPA for use with your personal holding, is acceptable under the non-commercial license. Use by other individuals for personal tax purposes without CPA involvement is also acceptable. For broader use than that, contact me for commercial licensing.

# Getting Started

This section is a quick reference for gathering critical data and what a CPA needs to be able to calculate basis information and gain/loss/tax.

There is a Getting Started section in the [discussions forum](https://github.com/hickeng/financial/discussions).

## 1. Collect necessary inputs

All of this information _should_ be in eTrade (see Known Problems if any is unavailable). Log into your eTrade account and follow the steps [here](usage.md). The instruction links below jump to specific steps. If you're logged into eTrade, the links provided deeplink into the appropriate eTrade pages where possible.

By the end of it you should have:

* ESPP Purchase Confirmations (PDFs) - [instructions](usage.md#etrade-stock-plan-confirmations)
* RSU Release Confirmations (PDFs) - [instructions](usage.md#etrade-stock-plan-confirmations) (same as above)
* Transaction log from 2023-11-21 to some time later, but at least after 2023-11-28 (screenshot or csv) - [instructions](usage.md#etrade-transaction-log)
* Stock Plan Benefit History spreadsheet (xlsx) - [instructions](usage.md#etrade-benefit-history-spreadsheet)
* eTrade 1099-B (PDF) - [instructions](usage.md#etrade-1099-b--supplement)
* eTrade Supplement (PDF) - [instructions](usage.md#etrade-1099-b--supplement) (same as above)


## 2. Create a bundle for a CPA

Your CPA needs all of the information collected in the prior section, along with all the following if the conditions apply:

* If you held VMware shares over the Broadcom merger
  * [Form 8937](documents/Broadcom%20-%20Form%208937%20Acquistion%20of%20VMware%20Inc..pdf) for the merger
* If you held VMware shares since before 2021-10-29 (the most recent Dell dividend)
  * [Form 8937](documents/Form%208937%20-%20October%2029,%202021.pdf) for the  2nd Dell distribution (the version with the value eTrade used)
* If you held VMware shares acquired via owning Dell shares during the 2021 Dell dividend
  * [Form 8937](documents/IRS%20Form%208937%20-%20VMWARE,%20INC.%20November%201,%202021%20Recapitalization.pdf) for the Dell recapitalization
* If you held VMware shares since before 2018-12-27 (the first Dell dividend)
  * [Form 8937](documents/IRS%20Form%208937%20-%20VMWARE,%20INC.%20December%2028,%202018%20Distribution.pdf) for the 1st Dell distribution

If you needed to give your CPA any of the Dell distribution/recapitalization forms, let them know that the eTrade Supplement does not include the necessary basis adjustment. Also let them know that you're uncertain whether "imputed ordinary income from the ESPP bargain element" will be correctly reported via W2.

The above information is everything necessary to completely recreate what the sheet does but, for utility, if you're a past/present VMware/Broadcom employee the non-commercial license allows for giving it to a CPA for use with your personal filing.

If you don't want to give your CPA the entire sheet, you could give them the values from the three Form8949 sections (section in Summary for fraction, and sections for ESPPs and RSUs).

## 3. Enter your collected data into the spreadsheet

There is a shared version of the spreadsheet on Google Sheets. Go [here](https://docs.google.com/spreadsheets/d/1L943lQjcC-cHeGObOAPqmowEskdFsoUCkRiIxZOxJVs/edit?usp=sharing), select `File->Make a copy`, then you can start entering data. If you want to use the binary from the repo, see [Install](install.md).

This entails:
1. entering number of VMW shares and:
   1. RSUs - many vest dates are already populated, but you may need to add `Market Value Per Share` if yours is absent
   1. ESPP - almost everyone has the same offering periods, so only `Current Contributions` from the confirmations and your initial `Previous Carry Forward` value are needed
1. details from eTrade transaction log - [instructions](usage.md#etrade-transaction-log)
   1. Shares (exchange for cash)
   1. Shares (tender payment)

and that's it.

For completeness you should [figure out](usage.md#factional-share) which lot your fractional AVGO share came from and check the appropriate tickbox, but omitting this will have only a minor effect on things if you've any significant number of shares. You _should_ do this if using the sheet for filing, but if using it for estimation, exploration, double-checking CPA figures, etc then it's non-critical.

Optionally you can [add validation inputs](usage.md#etrade-transaction-log) used to sanity check against transcription errors, and W2/1040 information to inform a ballpark tax estimate.

Optionally you can [add other sources of income](usage.md#other-income) to improve the tax estimation.

If you sold AVGO shares post-merger but in 2023, you can use the [post merger sale of AVGO](usage.md#post-merger-sale-of-avgo) tweak to set the price at which you sold and generate the necessary basis and imputed income (ESPP) for filing.

Very, very optionally there is [a tweaks section](usage.md#tweaks-and-custom-functions) that you can play with to change the way the sheet works. This goes from minor things like chosing which Broadcom Fair Market Value to use (both Mean and Close seem to be confidently permitted) to major items like changing the per-lot ratios for cash/shares (note [#13](https://github.com/hickeng/financial/issues/13) if playing with this).

The sheet is still being actively refined and, while it's slowed, people are still finding issues to be fixed. The [timeline](https://github.com/users/hickeng/projects/2/views/2) has a stable version that's as vetted as viable towards the end of March. I'll be tagging a v1.0.0 that I will use for filing my extension in April.

## 4. Look at the outputs from the sheet

The primary outputs from the sheet are:

Critical:
1. Per-lot tax basis and gain data needed for Form 8949 to be filed with your tax return. Used to either populate a Form 8949 directly, or to correct 1099-B imports. Information relevant to _now_, such as this data, is tinted in pale blue.
1. Per-lot tax basis, needed when selling AVGO shares post-acquisition. Information related to post-acquisition sale of shares is tinted in pale green.

Informational:
1. Long and short term capital gains for 2023 and potential future values
1. Ballpark tax liability estimate for Federal and California for making estimated payments

## 5. Make Estimated payments if you've not reached Safe Harbor thresholds

Taxes are due for the 4th quarter [on January 15th of the next year](https://www.irs.gov/faqs/estimated-tax/individuals/individuals-2)... so 2024-01-15 was the deadline for paying any estimated taxes resulting from the merger.

If you've _not_ met safe harbor thresholds then look at reducing penalty and interest amounts by filing using Annualized Income Installment method.


## 6. Adjust 1099-B in TurboTax (or similar)

There's prelim step-by-step [here](https://github.com/hickeng/financial/issues/53#issuecomment-1975475991) but screenshots are on a different computer so that's it for tonight.


-----
-----
-----


# Known Tax Problems After Merger

The problems we as VMW holders know of are collected [here](problems.md), along with groups impacted, and impact assment. All are works in progress:
* $0 cost basis and incorrect adjustment in eTrade Supplement
   * the cascade consequences of this single issue account for the bulk of this repo
* incorrect code ‘N’ in Form 8949 generated by TurboTax
* treatment of proceeds as dividends
   * substantially impacting non-US residents
* fractional share sold at incorrect price
* missing stock confirmations in eTrade
* missing lot information on eTrade 1099-B
* estimated value was used from draft f8937 for 2021 return of capital
* some ESPP lots are showing up on 1099 as Noncovered Securities
* ... if you know of others, please open an issue or pull request




# Release Status

Using github project for planning - see [Timeline](https://github.com/users/hickeng/projects/2/views/2)

## [v0.1.5](https://github.com/hickeng/financial/releases/tag/v0.1.5) - 2024-03-11

Substantial revision and update to documentation and allows selection of eTrade tax strategy for per-lot use, including:

* Getting Started section
* Examples for entering RSU & ESPP
* Step-by-step for adding new rows to RSU & ESPP
* Step-by-step for correcting Turbotax Proceeds and Basis for imported 1099-Bs
* In-sheet checklist for tracking progress through completion
* Various updates to in-sheet notes

Updates:
* Updated Dell 2021 Return of Capital number to match eTrade's use in 2021 and added draft Form8937 noting that estimated value
* Added effective rate calculation to estimate
* Added general mechanism for applying eTrade tax strategy from Account Settings if using per-lot approach
* Definitive answer that the merger is not a disposition so doesn't incur imputed income from ESPP bargin element

Includes bug fixes:
* Fractional share now correctly included in potential capital gain
* Other LTG was not being included in tax estimate
* Corrected ESPP basis calculation to use only grant date as per [this comment](https://github.com/hickeng/financial/issues/15#issuecomment-1975816154)


## [v0.1.4](https://github.com/hickeng/financial/releases/tag/v0.1.4) - 2024-02-28

Gets the basics of Form8949 / cost-basis entry for TurboTax in place, adding Form 8949 sections in Summary and RSU/ESPP datasheets.

Additionally:

* fixed up Turbotax 1099-B import using the sheet Form8949 as test.
* various column renames for consistency, precision, and clarity.
* added Close value for AVGO FMV and noted where it's stated it's acceptable (costbasis.com)
* added ratio option for "pure" ratio from eTrade transaction log to see where that value has been used by eTrade.
* add section for import of 1099-B values - currently an unused placeholder for pending import


## [v0.1.3](https://github.com/hickeng/financial/releases/tag/v0.1.3) - 2024-02-28

Fixes use of hardcoded test values in the per-lot optimizer logic which would have meant almost no-one trying it would have got a valid final ratio of stocks/cash.


## [v0.1.2](https://github.com/hickeng/financial/releases/tag/v0.1.2) - 2024-02-22

Refines the per-lot treatment option and adds an input for a "date of sale" for post-merger AVGO to assess changes from Short Term Gains to Long (RSU), and from disqualified to qualified (ESPP) as the lots age.

If you put in a date prior to 2024 then it'll roll the gains from AVGO sale into the tax estimate... but remember that's a very naive estimate and check the logic in the sheet both works for your case and is sufficient for purpose.

The Tweak is found as a dropdown below the Fractional Share Values and contains dates of interest:

* last year - this let's you see a tax estimation
* today - calculate with todays date for LTG/STG and qualified/disqualified
* a series of dates on which RSUs transition from STG to LTG

On the same row there is a share price, set to AVGO live by default that you can overwrite with any postive value.


## [v0.1.1](https://github.com/hickeng/financial/releases/tag/v0.1.1) - 2024-02-20

Adds per-lot treatment mechanism in the RSU and ESPP datasheets:

* select preference per-lot for `cash` or `shares`
* run the optimizer to automatically adjust lot preference for maximum deferred tax (see steps below)



## [v0.1.0](https://github.com/hickeng/financial/releases/tag/v0.1.0) - 2024-02-18

Initial tagged release because the foundation is there:

* human readable diffs are sufficient for reviewing changes before commit
* basic inputs are complete - minimal input data needed and easily sourced from downloadable confirmation docs
* basic outputs are complete - per-lot cash amounts, gain, old adjusted vmw basis, and new avgo basis are calculated considering short/long term gain and ESPP qualified/disqualified status
* all planned changes are enhancements



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
alternate_gain_calc = cash_received + avgo_fmv - vmw_basis

# the approximate threshold for per-share vmw basis (adjusted for dividends) where we switch clauses is
# 0.2520 * 0.521 * 979.50 = 128.601
if cash_received < alternate_gain_calc {

  # composite vmw basis was lower than avgo fmv, ie. we've got a capital gain (avgo_fmv-vmw_basis) from the share consideration that is deferred.
  # gain mandated by f8937 does not include deferred gain.
  f8937_gain = cash_received

  # the deferred gain from vmw->avgo conversion must still be realized in the future. Adjustment
  # to avgo_basis is the way this is accomplished. This is rolled into the mandated f8937 basis adjustment.

  # we need the 2023 f8949 to reconcile correctly in the future against the deferred gain resulting from the inflexible
  # avgo_basis. future avgo_basis is dictated as vmw_basis - cash_received + f8937_gain which simplifies to vmw_basis
  # for this case.
  #
  # we're deferring avgo_fmv - vmw_basis gain to the future, and we must realize the cash_received as gain now.
  # we've got a mandated basis of vmw_basis for future sales, so our current basis is avgo_fmv to achieve the necessary delta.
  f8949_basis = avgo_fmv

} else {

  # composite vmw basis was higher than avgo fmv - no deferral
  # gain mandated by f8937
  f8937_gain = alternate_gain_calc

  # that's our true gain, so we should be ok with an avgo_basis of avgo_fmv... but f8937 says the adjust avgo basis must be:
  # avgo_basis = vmw_basis - cash_received + f8937_gain
  #
  # This is still okay, as that simplifies
  # avgo_basis = vmw_basis - cash_received + cash_received + avgo_fmv - vmw_basis
  # avgo_basis = avgo_fmv
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

The ESPP discount is considered ordinary income and _should_ be reported on your W2 when you sell the shares. In the past it has shown up on VMW W2's in `Box 14 Other`, labelled as ESPP. However, the proportion of the discount treated as ordinary income vs long term capital gain depends on whether the ESPP shares are qualified or disqualified and that's termed the Bargain Element.

The recognition of ordinary income is not a consideration for lots exchanged for shares or mixed shares/cash. IRS tax code [Section 424(c)(1)(b)](https://www.law.cornell.edu/uscode/text/26/424#:~:text=an%20exchange%20to%20which%20section) explicitly excludes Section 356 exchanges from being considered as a disposition and 356 is what's noted in [Form 8937](documents/Broadcom%20-%20Form%208937%20Acquistion%20of%20VMware%20Inc..pdf) as governing the exchange. A big thank you to [@alkom](https://github.com/alkom) for [tracking down the specific section references](https://github.com/hickeng/financial/issues/15#issuecomment-1982794737).

There's discussion in [#15](https://github.com/hickeng/financial/issues/15) regarding specifics - below is a distilation of current understanding of terms/impact relating to ESPP:

* disqualified - sold within either 1 year from purchase date (when you got the shares aka exercise) or 2 years from grant date (when the ESPP period started aka offering).
* qualified - held for 2 years past grant _and_ 1 year past purchase
* tax basis - the actual amount you paid
* grant date price - the Fair Market Value at ESPP grant date
* purchase date price - the Fair Market Value when you actually acquired the share
* Disposition - the share exits your control, eg. through a sale, gift, etc.
  * Surrender of VMW for cash+AVGO consideration under section 356 does _not_ count as a Disposition
* Bargain element - I refer to this as imputed income. You pay tax on this via your W2 as if it were actual income on Disposition of the share (eg. sale). The broker should inform Broadcom of any future sale, and Broadcom should add it to your W2. If it does not show up on your W2 for some reason it's your responsibility to ensure it's reported.
  * [Qualified bargain element](https://fairmark.com/compensation-stock-options/employee-stock-purchase-plans/qualifying-disposition-reporting/) - `grant date price - purchase price`, which equates to 15% of grant date price for the VMware ESPP plan. If you made less than the bargain element in gain from Disposition, then it's the gain amount instead.
  * [Disqualified bargain element](https://fairmark.com/compensation-stock-options/employee-stock-purchase-plans/disqualifying-disposition-reporting/) - `purchase date price - actual amount paid`


## Form 8937
These forms detail tax handling for an event. This includes qualified/unqualified amounts from dividends, how to adjust cost-basis, how to calculate gain that must be realized, etc. These are pulled from the [Broadcom Invester Relations](https://investors.broadcom.com/financial-information/tax-information) site.

The acquisition form mostly uses non-imperative language, which leaves a lot of optionality for other treatments. My personal plan is to use the "generally ..." guidence absent a strong endorsement from a CPA for a different treatment being valid.

Links to the relevant Form 8937's:

* [Broadcom Acquisition](https://investors.broadcom.com/static-files/7720c4c1-c940-4d9d-800c-66819bfdc7a0) ([from repo](documents/Broadcom%20-%20Form%208937%20Acquistion%20of%20VMware%20Inc..pdf))
* [Dell recapitalization 2021](https://investors.broadcom.com/static-files/7ba40d05-a5b8-454d-8140-7f9782069523) - ([from repo](documents/IRS%20Form%208937%20-%20VMWARE,%20INC.%20November%201,%202021%20Recapitalization.pdf))applies if you received VMWs by virtue of owning Dell shares during the spin out.
* [Dell distribution 2021](https://investors.broadcom.com/static-files/c03396b2-538b-42c3-910c-dce218d5d9f1) ([from repo](documents/IRS%20Form%208937%20-%20VMWARE,%20INC.%20November%201,%202021%20Distribution.pdf))
* [Dell distribution 2018](https://investors.broadcom.com/static-files/674c4fc3-6cc3-48cf-83b1-f6f6f3f75623) ([from repo](documents/IRS%20Form%208937%20-%20VMWARE,%20INC.%20December%2028,%202018%20Distribution.pdf))

Of note, there was a draft version of the 2021 Form 8937 with an estimated return of capital value. By inspection of statements and 1099-B by multiple people, it's this estimate that was used for our taxes that year and therefore should be the basis adjustment. See [#83](https://github.com/hickeng/financial/issues/83).
* [Dell distribution 2021 - draft version](documents/Form%208937%20-%20October%2029,%202021.pdf)


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
