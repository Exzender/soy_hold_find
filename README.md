# Script for finding SOY holder/buyers at a block in EVM blockchains
# (CLI version)

Full processing from 8540975 to 14186359 blocks takes about 50 min*.

## Running locally

Install the app's dependencies:

```bash
npm install
```

Set up your local environment variables by copying the example into your own `.env` file:

```bash
cp .env.local.example .env
```

Your `.env` now contains the following environment variables:

- `STARTBLOCK` (placeholder) - First block (when was the first LP mint)
- `ENDBLOCK` (placeholder) - Last block.

Start app:

```bash
npm start
```

Results in **OUT** folder:
- `soy_buyer.csv` - unsorted CSV version. **Rewrites on each run!**

## Contacts

[LinkedIn](https://www.linkedin.com/in/aleksandr-s-terekhov/)
