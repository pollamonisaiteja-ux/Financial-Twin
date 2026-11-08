# Financial Twin

**Financial Twin** is an experimental personal-finance projection tool. It models a simplified version of a user's financial position over a 10-year horizon and compares baseline, optimistic, pessimistic, and selected what-if scenarios.

> **Educational prototype only.** This project is not financial advice, does not predict market returns, and should not be used to make investment decisions.

## Current features

- FastAPI backend with a `POST /simulate` endpoint.
- Inputs for income, expenses, savings, investments, a financial goal, growth and inflation assumptions, savings allocation, risk preference, and a what-if scenario.
- Monthly net-worth projection over 120 months.
- Baseline, best-case, worst-case, and selected-scenario results.
- Frontend chart comparing the four projections.

## Tech stack

- Python
- FastAPI and Pydantic
- HTML, CSS, and JavaScript
- Chart.js (loaded by the frontend)

## Project structure

```text
Financial-Twin/
├── main.py       # FastAPI application and projection logic
├── twin.html     # User interface
├── twin.css      # Styles
├── twin.js       # API calls and chart rendering
└── README.md
```

## Run locally

Use Python 3.10 or newer.

```bash
git clone https://github.com/pollamonisaiteja-ux/Financial-Twin.git
cd Financial-Twin

python -m venv .venv

# Windows PowerShell
.venv\Scripts\Activate.ps1

# macOS / Linux
# source .venv/bin/activate

pip install fastapi uvicorn

uvicorn main:app --reload
```

Open the local address printed by Uvicorn. The API documentation is available at `/docs`.

## Important modelling assumptions and known limitations

- The frontend currently formats monetary values as **USD**. Currency is not yet configurable.
- The frontend converts annual percentage inputs to monthly decimal rates before sending them to the API. The backend expects decimal monthly rates for growth and inflation.
- The model uses simplified deterministic assumptions. Actual investment returns, taxes, fees, changing income, and market volatility are not modelled.
- Risk-tolerance multipliers and best/worst-case assumptions are illustrative heuristics, not calibrated financial models.
- The what-if scenarios use fixed example events and costs. They should not be interpreted as universal estimates.
- Input validation, automated tests, and a documented model methodology are planned improvements.

## Roadmap

- [ ] Validate input ranges and reject invalid financial values.
- [ ] Add automated tests for projection and scenario calculations.
- [ ] Make currency and locale configurable.
- [ ] Document formulas, units, and modelling assumptions in detail.
- [ ] Improve error messages and accessibility in the interface.
- [ ] Deploy the application with environment-specific configuration.

## License

No license has been added yet. Until one is added, reuse and redistribution permissions are not explicitly granted.
