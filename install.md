# Install

To just use the sheet directly from Google, go:
* [here for G-Suite](https://docs.google.com/spreadsheets/d/1uMr691SCG3aOayA7QZTfEwx2C8Bevn6hyI6UWwLvlPM/edit?usp=sharing), `File->Make a copy` then you can start entering data. If you want to use the binary from the repo, instructions are below.
* [here for Office365](https://1drv.ms/x/s!AkHZkTkvLX2LmpA9AQYw2TWjU7hyOQ?e=dxZx0o) (does not have the logic for applying strategies, but the sheet works and the lot selections for strategies can be copied over easily)

User documentation is [here](usage.md).

Install is more "import", but there's some fixup required because of a Sheets bug I haven't got a workaround for as yet.

There's [a binary sheet](https://github.com/hickeng/financial/releases/download/v0.1.6/VMW_to_AVGO_ESPP_and_RSU-v0.1.6-b-github.xlsx) attached to the releases, suitable for import into Google Sheets, and a version [suitable for Excel](https://github.com/hickeng/financial/releases/download/v0.1.6/VMW_to_AVGO_ESPP_and_RSU-v0.1.6-b-github-excel.xlsx).

1. Download [the latest binary sheet](https://github.com/hickeng/financial/releases/download/v0.1.6/VMW_to_AVGO_ESPP_and_RSU-v0.1.6-b-github.xlsx)
2. Create a new Google Sheet - [open this in new window](https://docs.google.com/spreadsheets/u/0/create?usp=sheets_home&ths=true)
3. Go to File->Import->Upload->Browse - this will open a system file selection box. Select the downloaded sheet.
4. Choose `Replace Spreadsheet`, and select `Import data`
5. FIXUP: there's a Sheets import bug ([#30](https://github.com/hickeng/financial/issues/30)) that drops the checkbox validation from `Use for fraction` column in ESPP and RSU sheets:
   1. Menu `Data->Data validation`, then `Add rule` at the bottom of the right side pane that opens.
   2. Set `Apply to range` to `ESPP!N7:N26`, `Criteria` to `Tick box`. Click `Done`.
   3. Repeat (2) but with `Apply to range` as `RSU!J7:J84`
   4. If `ESPP!N5` is displaying `#REF!`, replace the cell formula with `=COUNTIF(N7:N26, TRUE)`
   5. Repeat (4) but for `RSU!J5`, replacing with `=COUNTIF(J7:J84, TRUE)`
   6. (the bottom sums are just for convenience and because people expect totals at the bottom - fix them up with the same formula if you care)
6. Import the AppScript (needed for running lot optimization)
   1. In the sheet, `Extensions->App Scripts` and copy the .gs files from the repo worksheet directory.
   2. Either reload the spreadsheet, or run the `common.gs:onOpen` function using the AppScript UI
   3. Menu `Custom Functions->All balance` to trigger auth prompts
   4. Accept the authorization prompts - like self-signed website certs, you need to look at the small links below the main warning and text to proceed.
7. Run the `Custom Functions->Optimize per-lot (avgo basis)` function - you'll be
   1. This sets the preference for each lot to `cash` or `shares` and you'll see the impact if choosing `manual per-lot ratio` in the Tweaks.
   2. If you want to make changes to the sheet, then export those changes for a PR, use the `Custom Functions->Export Workbook (Censored)`. This will write json to a Google Drive location and is the mechanism I use to construct the json [in the repo](worksheet/). These are intended for easy visual review of diffs. Well, easy compared to doing it as a spreadsheet.