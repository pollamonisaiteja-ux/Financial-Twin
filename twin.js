Chart.defaults.color = '#a0aec0';
Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.1)';

let projectionChart = null;

const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
});

document.getElementById('inputForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    await runFullSimulation();
});

async function runFullSimulation() {
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<ion-icon name="hourglass-outline"></ion-icon> Simulating...';

    const monthlyIncome = parseFloat(document.getElementById('monthlyIncome').value);
    const monthlyExpenses = parseFloat(document.getElementById('monthlyExpenses').value);
    const currentSavings = parseFloat(document.getElementById('currentSavings').value);
    const currentInvestments = parseFloat(document.getElementById('currentInvestments').value);
    const goalCost = parseFloat(document.getElementById('goalCost').value);
    const investmentGrowth = parseFloat(document.getElementById('investmentGrowth').value);
    const inflationRate = parseFloat(document.getElementById('inflationRate').value);
    const savingsRate = parseFloat(document.getElementById('savingsRate').value);
    const riskTolerance = document.getElementById('riskTolerance').value;
    const scenario = document.getElementById('scenario').value;

    const payload = {
        monthly_income: monthlyIncome,
        monthly_expenses: monthlyExpenses,
        current_savings: currentSavings,
        current_investments: currentInvestments,
        goal_cost: goalCost,
        investment_growth_rate: (investmentGrowth / 100) / 12,
        inflation_rate: (inflationRate / 100) / 12,
        monthly_savings_rate: savingsRate,
        risk_tolerance: riskTolerance,
        scenario: scenario
    };

    try {
        const response = await fetch('/simulate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        updateUI(data);
    } catch (error) {
        console.error('Simulation error:', error);
        alert('Simulation failed. Please check console for details.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<ion-icon name="rocket-outline"></ion-icon> Run Simulation';
    }
}

function updateUI(data) {
    document.getElementById('baseNetWorth').textContent = formatter.format(data.base.final_net_worth);
    
    if (data.base.goal_1_month !== null) {
        document.getElementById('goalTime').textContent = `${data.base.goal_1_month} months`;
    } else {
        document.getElementById('goalTime').textContent = 'Not achieved';
    }
    
    const scenarioImpact = data.scenario.final_net_worth - data.base.final_net_worth;
    const impactElement = document.getElementById('scenarioImpact');
    impactElement.textContent = formatter.format(Math.abs(scenarioImpact));
    if (scenarioImpact >= 0) {
        impactElement.style.color = '#10b981';
        impactElement.textContent = '+' + impactElement.textContent;
    } else {
        impactElement.style.color = '#ef4444';
        impactElement.textContent = '-' + impactElement.textContent;
    }

    const riskAlertsContainer = document.getElementById('riskAlerts');
    riskAlertsContainer.innerHTML = '';
    
    const allRisks = [...data.base.risks, ...data.scenario.risks];
    if (allRisks.length > 0) {
        allRisks.forEach(risk => {
            const p = document.createElement('p');
            p.textContent = risk;
            p.className = 'risk-item';
            riskAlertsContainer.appendChild(p);
        });
    } else {
        const p = document.createElement('p');
        p.textContent = 'No critical risks detected';
        p.className = 'placeholder';
        riskAlertsContainer.appendChild(p);
    }

    const insightsContainer = document.getElementById('keyInsights');
    insightsContainer.innerHTML = '';
    
    const allInsights = [...data.base.insights, ...data.scenario.insights];
    if (allInsights.length > 0) {
        allInsights.forEach(insight => {
            const p = document.createElement('p');
            p.textContent = insight;
            p.className = 'insight-item';
            insightsContainer.appendChild(p);
        });
    } else {
        const p = document.createElement('p');
        p.textContent = 'Run simulation to see insights';
        p.className = 'placeholder';
        insightsContainer.appendChild(p);
    }

    updateChart(data);
}

function updateChart(data) {
    const months = Array.from({ length: 120 }, (_, i) => i + 1);

    const chartData = {
        labels: months,
        datasets: [
            {
                label: 'Base Case',
                data: data.base.history,
                borderColor: '#007bff',
                backgroundColor: 'rgba(0, 123, 255, 0.1)',
                borderWidth: 3,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 6
            },
            {
                label: 'Best Case',
                data: data.best.history,
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                borderWidth: 3,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 6
            },
            {
                label: 'Worst Case',
                data: data.worst.history,
                borderColor: '#ef4444',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                borderWidth: 3,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 6
            },
            {
                label: 'What-If Scenario',
                data: data.scenario.history,
                borderColor: '#f59e0b',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                borderWidth: 3,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 6
            }
        ]
    };

    const config = {
        type: 'line',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: true,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(26, 31, 38, 0.95)',
                    titleColor: '#ffffff',
                    bodyColor: '#a0aec0',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: true,
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + formatter.format(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Month',
                        color: '#a0aec0',
                        font: {
                            size: 12,
                            weight: '600'
                        }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    },
                    ticks: {
                        color: '#718096'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Net Worth ($)',
                        color: '#a0aec0',
                        font: {
                            size: 12,
                            weight: '600'
                        }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    },
                    ticks: {
                        color: '#718096',
                        callback: function(value) {
                            return formatter.format(value);
                        }
                    }
                }
            }
        }
    };

    if (projectionChart) {
        projectionChart.destroy();
    }

    const ctx = document.getElementById('projectionChart').getContext('2d');
    projectionChart = new Chart(ctx, config);
}