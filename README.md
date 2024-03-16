# Script for finding SOY holder/buyers at a block in EVM blockchains
# (CLI version)

Searching for BUY operations of SOY token (on Soy Finance exchange).
Also counting transfers from and to "holder" address.
Check if bought tokens moved and holded on another address (only one level deep), so if one bought from one address, 
than moved tokens to another, and after that to the 3rd - that 3rd address will not be counted.
Option `ONLY_FIRST_LEVEL` allows to count only address who made buying operations.

Temporal blockchain scanning results stored to files in TEMP folder - so script may continue from the place where it
was stopped, or even skip fully blockchain scanning phase.

Full processing from 8540975 to 14186359 blocks takes about 60 minutes*.

## Running locally

Install the app's dependencies:

```bash
npm install
```

Set up your local environment variables in `.env` file:
Your `.env` now contains the following environment variables:

- `STARTBLOCK` (placeholder) - First block (when was the first LP mint)
- `ENDBLOCK` (placeholder) - Last block.
- `TEMP_CLEAR` (placeholder) - Clear temp files on start `0` or `1`
- `ONLY_FIRST_LEVEL` (placeholder) - set to `0` to count external holding address, `1` - count only buyer addresses

Start app:

```bash
npm start
```

Results in **OUT** folder:
- `soy_buyer.csv` - unsorted CSV version. **Rewrites on each run!**

## Contacts

[LinkedIn](https://www.linkedin.com/in/aleksandr-s-terekhov/)
