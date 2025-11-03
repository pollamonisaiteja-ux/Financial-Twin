import math
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

app = FastAPI(title="Digital Financial Twin")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class FinancialInput(BaseModel):
    monthly_income: float
    monthly_expenses: float
    current_savings: float
    current_investments: float
    goal_cost: float
    investment_growth_rate: float
    inflation_rate: float
    monthly_savings_rate: float
    risk_tolerance: str
    scenario: str


class ProjectionResult(BaseModel):
    history: list[float]
    goal_1_month: int | None
    risks: list[str]
    insights: list[str]
    final_net_worth: float


class SimulationOutput(BaseModel):
    base: ProjectionResult
    best: ProjectionResult
    worst: ProjectionResult
    scenario: ProjectionResult


def run_monthly_projection(
    monthly_income: float,
    monthly_expenses: float,
    current_savings: float,
    current_investments: float,
    goal_cost: float,
    investment_growth_rate: float,
    inflation_rate: float,
    monthly_savings_rate: float,
    risk_tolerance: str = "moderate",
    scenario: str = "none",
) -> ProjectionResult:
    MONTHS = 120
    history = []
    risks = []
    insights = []
    goal_1_month = None
    
    risk_multiplier = 1.0
    if risk_tolerance == "conservative":
        risk_multiplier = 0.75
    elif risk_tolerance == "aggressive":
        risk_multiplier = 1.25
    
    adjusted_growth_rate = investment_growth_rate * risk_multiplier
    
    savings = current_savings
    investments = current_investments
    base_expenses = monthly_expenses
    base_income = monthly_income
    
    for month in range(1, MONTHS + 1):
        expenses = base_expenses * math.pow(1 + inflation_rate, month)
        income = base_income
        
        if scenario == "job-hike" and month == 24:
            income += base_income * 0.20
            base_income = income
            savings -= 5000
            insights.append(f"Month {month}: Job change costs $5,000 but increases income by 20%")
        
        if scenario == "sabbatical":
            if month == 12:
                insights.append(f"Month {month}: Sabbatical begins - no income for 6 months")
            if 12 <= month <= 17:
                income = 0
        
        if scenario == "emergency" and month == 36:
            emergency_cost = 10000
            savings -= emergency_cost
            insights.append(f"Month {month}: Emergency expense of ${emergency_cost:,.0f}")
        
        monthly_surplus = income - expenses
        
        if monthly_surplus > 0:
            amount_to_invest = monthly_surplus * (monthly_savings_rate / 100)
            amount_to_savings = monthly_surplus - amount_to_invest
            savings += amount_to_savings
            investments += amount_to_invest
        else:
            savings += monthly_surplus
        
        if savings < 0:
            liquidation_needed = abs(savings)
            if investments >= liquidation_needed:
                investments -= liquidation_needed
                savings = 0
                risks.append(f"Month {month}: Liquidated ${liquidation_needed:,.2f} from investments due to negative savings")
            else:
                risks.append(f"Month {month}: Insufficient funds - negative balance of ${savings:,.2f}")
        
        if investments > 0:
            investments = investments * (1 + adjusted_growth_rate)
        
        net_worth = savings + investments
        history.append(net_worth)
        
        if goal_1_month is None and net_worth >= goal_cost:
            goal_1_month = month
            insights.append(f"Goal achieved in month {month} (${net_worth:,.2f} >= ${goal_cost:,.2f})")
    
    final_net_worth = history[-1] if history else 0
    
    if final_net_worth < goal_cost and goal_1_month is None:
        risks.append(f"Goal not achieved in 10 years. Shortfall: ${goal_cost - final_net_worth:,.2f}")
    
    if len(risks) == 0:
        insights.append("No critical risks detected during simulation period")
    
    if investments > savings * 2 and len([r for r in risks if "Liquidated" in r]) == 0:
        insights.append("Strong investment position maintained throughout projection")
    
    return ProjectionResult(
        history=history,
        goal_1_month=goal_1_month,
        risks=risks,
        insights=insights,
        final_net_worth=final_net_worth
    )


@app.post("/simulate", response_model=SimulationOutput)
async def simulate(input_data: FinancialInput):
    base_result = run_monthly_projection(
        monthly_income=input_data.monthly_income,
        monthly_expenses=input_data.monthly_expenses,
        current_savings=input_data.current_savings,
        current_investments=input_data.current_investments,
        goal_cost=input_data.goal_cost,
        investment_growth_rate=input_data.investment_growth_rate,
        inflation_rate=input_data.inflation_rate,
        monthly_savings_rate=input_data.monthly_savings_rate,
        risk_tolerance=input_data.risk_tolerance,
        scenario="none"
    )
    
    best_result = run_monthly_projection(
        monthly_income=input_data.monthly_income * 1.10,
        monthly_expenses=input_data.monthly_expenses,
        current_savings=input_data.current_savings,
        current_investments=input_data.current_investments,
        goal_cost=input_data.goal_cost,
        investment_growth_rate=input_data.investment_growth_rate * 1.5,
        inflation_rate=input_data.inflation_rate * 0.5,
        monthly_savings_rate=input_data.monthly_savings_rate,
        risk_tolerance=input_data.risk_tolerance,
        scenario="none"
    )
    
    worst_result = run_monthly_projection(
        monthly_income=input_data.monthly_income * 0.90,
        monthly_expenses=input_data.monthly_expenses,
        current_savings=input_data.current_savings,
        current_investments=input_data.current_investments,
        goal_cost=input_data.goal_cost,
        investment_growth_rate=input_data.investment_growth_rate * 0.5,
        inflation_rate=input_data.inflation_rate * 1.5,
        monthly_savings_rate=input_data.monthly_savings_rate,
        risk_tolerance=input_data.risk_tolerance,
        scenario="none"
    )
    
    scenario_result = run_monthly_projection(
        monthly_income=input_data.monthly_income,
        monthly_expenses=input_data.monthly_expenses,
        current_savings=input_data.current_savings,
        current_investments=input_data.current_investments,
        goal_cost=input_data.goal_cost,
        investment_growth_rate=input_data.investment_growth_rate,
        inflation_rate=input_data.inflation_rate,
        monthly_savings_rate=input_data.monthly_savings_rate,
        risk_tolerance=input_data.risk_tolerance,
        scenario=input_data.scenario
    )
    
    return SimulationOutput(
        base=base_result,
        best=best_result,
        worst=worst_result,
        scenario=scenario_result
    )


app.mount("/", StaticFiles(directory=".", html=True), name="static")