document.addEventListener('DOMContentLoaded', () => {
    
    // --- Chart.js Initializations ---
    Chart.defaults.font.family = "'Inter', sans-serif";
    Chart.defaults.color = '#6b6b6b';

    // 1. Algorithm Accuracy Chart
    const ctxAcc = document.getElementById('accuracyChart');
    if(ctxAcc) {
        new Chart(ctxAcc, {
            type: 'bar',
            data: {
                labels: ['Random Forest', 'Decision Tree', 'KNN', 'Linear Reg.'],
                datasets: [{
                    label: 'Model Accuracy (%)',
                    data: [87.4, 82.1, 76.5, 68.9],
                    backgroundColor: ['#4A0E17', '#a88e84', '#d8c8c1', '#e9e5e3'],
                    borderRadius: 4
                }]
            },
            options: {
                scales: { y: { beginAtZero: true, max: 100 } },
                plugins: { legend: { display: false } }
            }
        });
    }

    // 2. Feature Impact Chart (Horizontal Bar)
    const ctxImpact = document.getElementById('featureImpactChart');
    if(ctxImpact) {
        new Chart(ctxImpact, {
            type: 'bar',
            data: {
                labels: ['Alcohol', 'Sulphates', 'Volatile Acidity', 'Total SO2', 'Density'],
                datasets: [{
                    label: 'Importance Weight',
                    data: [0.35, 0.22, 0.18, 0.12, 0.08],
                    backgroundColor: '#a88e84',
                    borderRadius: 4
                }]
            },
            options: {
                indexAxis: 'y',
                plugins: { legend: { display: false } },
                scales: { x: { max: 0.5 } }
            }
        });
    }

    // 3. Distribution Chart (Bell Curve Mock)
    const ctxDist = document.getElementById('distributionChart');
    if(ctxDist) {
        new Chart(ctxDist, {
            type: 'line',
            data: {
                labels: ['3', '4', '5', '6', '7', '8', '9'],
                datasets: [{
                    label: 'Sample Count',
                    data: [15, 163, 1457, 2198, 880, 175, 5],
                    borderColor: '#4A0E17',
                    backgroundColor: 'rgba(74, 14, 23, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                maintainAspectRatio: false,
                plugins: { legend: { display: false } }
            }
        });
    }

    // --- Prediction Engine Logic ---
    const inputs = [
        'fixed_acidity','volatile_acidity','citric_acid','residual_sugar',
        'chlorides','free_so2','total_so2','density','ph','sulphates','alcohol'
    ];

    // Bind slider values to text
    inputs.forEach(id => {
        const el = document.getElementById(id);
        const display = document.getElementById(`val-${id}`);
        if(el && display) {
            el.addEventListener('input', (e) => {
                let val = parseFloat(e.target.value);
                // format text based on step
                if(el.step.includes('0.001')) display.textContent = val.toFixed(3);
                else if(el.step.includes('0.01')) display.textContent = val.toFixed(2);
                else if(el.step.includes('0.1')) display.textContent = val.toFixed(1);
                else display.textContent = val;
            });
        }
    });

    // Auto-fill Feature
    const autoFillBtn = document.getElementById('btn-autofill');
    if(autoFillBtn) {
        autoFillBtn.addEventListener('click', () => {
            const demoData = {
                'fixed_acidity': 7.2, 'volatile_acidity': 0.35, 'citric_acid': 0.45,
                'residual_sugar': 2.5, 'chlorides': 0.045, 'free_so2': 25, 
                'total_so2': 105, 'density': 0.9940, 'ph': 3.32, 
                'sulphates': 0.85, 'alcohol': 13.5
            };
            for(const [key, val] of Object.entries(demoData)) {
                let slider = document.getElementById(key);
                let display = document.getElementById(`val-${key}`);
                slider.value = val;
                
                if(slider.step.includes('0.001')) display.textContent = val.toFixed(3);
                else if(slider.step.includes('0.01')) display.textContent = val.toFixed(2);
                else if(slider.step.includes('0.1')) display.textContent = val.toFixed(1);
                else display.textContent = val;
            }
        });
    }

    // Prediction Execution
    const runBtn = document.getElementById('run-prediction');
    const statusDot = document.getElementById('status-dot');
    const statusText = document.getElementById('status-text');
    const scoreDisplay = document.getElementById('pred-score');
    const confVal = document.getElementById('conf-val');
    const confProgress = document.getElementById('conf-progress');
    const categoryBadge = document.getElementById('category-badge');
    const insightList = document.getElementById('insight-list');
    const historyList = document.getElementById('history-list');
    const modelSelect = document.getElementById('model-select');

    let historyLog = JSON.parse(localStorage.getItem('vintnerHistory')) || [];

    const renderHistory = () => {
        if(!historyList) return;
        if(historyLog.length === 0) {
            historyList.innerHTML = '<div class="empty-history">No predictions run yet.</div>';
            return;
        }
        historyList.innerHTML = '';
        historyLog.forEach(log => {
            let histItem = document.createElement('div');
            histItem.className = 'history-item';
            histItem.innerHTML = `
                <div>
                    <div class="hist-model">${log.model}</div>
                    <div style="font-size: 0.70rem; color: #a88e84;">${log.dateStr}</div>
                </div>
                <div class="hist-score">${parseFloat(log.score).toFixed(1)} / 10</div>
            `;
            historyList.appendChild(histItem);
        });
    };
    renderHistory();

    if(runBtn) {
        runBtn.addEventListener('click', () => {
            // Processing State
            runBtn.disabled = true;
            runBtn.textContent = 'EXECUTING MODEL...';
            statusDot.className = 'status-indicator analyzing';
            statusText.textContent = 'RUNNING ' + modelSelect.value.toUpperCase();
            scoreDisplay.textContent = '--';
            confVal.textContent = '0%';
            confProgress.style.width = '0%';
            categoryBadge.className = 'category-badge';
            categoryBadge.textContent = 'Calculating...';
            
            insightList.innerHTML = '<li>Analyzing 11 parameters...</li>';

            setTimeout(() => {
                // Grab all values
                const vals = {};
                inputs.forEach(id => { vals[id] = parseFloat(document.getElementById(id).value); });

                // Multi-Algorithm Simulation
                let score = 5.0; // Base
                let conf = 0;
                
                // General chemical rules
                score += (vals.alcohol - 10) * 0.4;
                score -= (vals.volatile_acidity - 0.5) * 1.5;
                score += (vals.sulphates - 0.5) * 0.8;
                score -= Math.abs(vals.ph - 3.3) * 2.0;
                score += (vals.citric_acid) * 0.5;

                // Adjust based on Model chosen
                let selectedModel = modelSelect.value;
                if(selectedModel === 'rf') {
                    // Random Forest: robust, high confidence
                    conf = 92 - Math.abs(score - 6)*2;
                } else if(selectedModel === 'dt') {
                    // Decision tree: rigid, blocky steps
                    score = Math.round(score); 
                    conf = 85;
                } else if(selectedModel === 'lr') {
                    // Linear: exact floats, lower confidence on extremes
                    conf = 75 - Math.abs(score - 5)*4;
                } else if(selectedModel === 'knn') {
                    // KNN: high variance
                    score += (Math.random() - 0.5);
                    conf = 80;
                }

                // Bound score
                score = Math.max(3.0, Math.min(9.5, score));
                conf = Math.max(40, Math.min(99, conf));

                // Determine Category
                let catClass = '';
                let catText = '';
                if(score < 5.0) { catClass = 'cat-poor'; catText = 'Poor Quality'; }
                else if(score < 6.5) { catClass = 'cat-avg'; catText = 'Average Quality'; }
                else if(score < 8.0) { catClass = 'cat-good'; catText = 'Good Quality'; }
                else { catClass = 'cat-exc'; catText = 'Exceptional Quality'; }

                // Generate Insights
                let insightsHtml = '';
                if(vals.volatile_acidity > 0.8) insightsHtml += '<li class="warn"><b>High Volatile Acidity:</b> Consider reducing to prevent vinegar-like taste defects.</li>';
                if(vals.alcohol < 9.0) insightsHtml += '<li class="warn"><b>Low Alcohol:</b> Wine may lack body and microbiological stability.</li>';
                if(vals.ph > 3.6) insightsHtml += '<li class="warn"><b>High pH:</b> Risk of flat taste and susceptibility to bacterial spoilage.</li>';
                if(vals.sulphates > 0.6 && vals.volatile_acidity < 0.6) insightsHtml += '<li class="info"><b>Optimal Sulphates:</b> Good antimicrobial protection without overpowering aroma.</li>';
                if(score > 7.5) insightsHtml += '<li class="info"><b>Excellent Balance:</b> The ratio of acidity to alcohol is within premium parameters.</li>';
                
                if(insightsHtml === '') insightsHtml = '<li>Standard profile detected. Parameters are balanced.</li>';
                insightList.innerHTML = insightsHtml;

                // Finish UI Updates
                statusDot.className = 'status-indicator active';
                statusText.textContent = 'DONE';
                runBtn.disabled = false;
                runBtn.textContent = 'EXECUTE PREDICTION INFERENCE';

                // Number Counter
                let count = 0;
                let finalScore = parseFloat(score.toFixed(1));
                const updateScore = setInterval(() => {
                    count += 0.3;
                    if(count >= finalScore) {
                        clearInterval(updateScore);
                        scoreDisplay.textContent = finalScore.toFixed(1);
                        categoryBadge.className = `category-badge ${catClass}`;
                        categoryBadge.textContent = catText;
                    } else {
                        scoreDisplay.textContent = count.toFixed(1);
                    }
                }, 15);

                confVal.textContent = Math.round(conf) + '%';
                confProgress.style.width = conf + '%';

                // Append History
                let dateStr = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'});
                let modelTxt = modelSelect.options[modelSelect.selectedIndex].text;
                
                historyLog.unshift({ model: modelTxt, dateStr: dateStr, score: finalScore });
                if(historyLog.length > 5) historyLog.pop();
                
                localStorage.setItem('vintnerHistory', JSON.stringify(historyLog));
                renderHistory();

            }, 800);
        });
    }
});
