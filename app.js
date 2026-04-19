// AI-Sentinel Application Controller
document.addEventListener('DOMContentLoaded', () => {
    // Check Session
    const sessionDetail = JSON.parse(localStorage.getItem('sentinel_session'));
    if (!sessionDetail) {
        window.location.href = 'index.html';
        return;
    }

    const userEmail = sessionDetail.email;
    const historyKey = `sentinel_history_${userEmail}`;
    const attemptsKey = `sentinel_attempts_${userEmail}`;
    const settingsKey = `sentinel_settings_${userEmail}`;

    // Drive Mismatch Alert
    if (window.location.href.toLowerCase().startsWith('file:///f:')) {
        console.warn("ALERT: You are loading AI-Sentinel from F: drive. My workspace is on E: drive. Your changes might not be synced!");
    }

    // Migrate/Initialize settings for existing users
    let storedSettings = JSON.parse(localStorage.getItem(settingsKey));
    if (!storedSettings) {
        storedSettings = {
            level: 'high',
            apiKey: '', 
            openAIKey: '',
            provider: 'gemini',
            geminiModel: 'gemini-1.5-flash',
            openaiModel: 'gpt-4o',
            theme: 'dark'
        };
    } else {
        if (storedSettings.provider === undefined) storedSettings.provider = 'gemini';
        if (storedSettings.openAIKey === undefined) storedSettings.openAIKey = '';
        if (storedSettings.geminiModel === undefined) storedSettings.geminiModel = 'gemini-1.5-flash';
        if (storedSettings.openaiModel === undefined) storedSettings.openaiModel = 'gpt-4o';
    }
    localStorage.setItem(settingsKey, JSON.stringify(storedSettings));

    // Initialize UI Elements
    const userNameEl = document.getElementById('userName');
    const attemptsEl = document.getElementById('attempts');
    const viewSubtitleEl = document.getElementById('viewSubtitle');
    const promptInput = document.getElementById('promptInput');
    const sendBtn = document.getElementById('sendBtn');
    const attachBtn = document.getElementById('attachBtn');
    const fileInput = document.getElementById('fileInput');

    if (userNameEl) userNameEl.textContent = sessionDetail.name;
    if (attemptsEl) attemptsEl.textContent = localStorage.getItem(attemptsKey) || '0';

    const currentSettings = JSON.parse(localStorage.getItem(settingsKey));
    if (viewSubtitleEl) {
        viewSubtitleEl.textContent = `Intercepting: ${currentSettings.level.toUpperCase()} Sensitivity Mode`;
    }

    // Event Listeners
    if (sendBtn) sendBtn.addEventListener('click', processPrompt);
    if (promptInput) {
        promptInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                processPrompt();
            }
        });
    }

    if (attachBtn) attachBtn.addEventListener('click', () => fileInput.click());
    if (fileInput) fileInput.addEventListener('change', handleFileSelect);

    window.showView = function(viewName, e) {
        const chatView = document.getElementById('chatView');
        const otherViews = document.getElementById('otherViews');
        const navItems = document.querySelectorAll('.nav-item');

        if (e && e.currentTarget) {
            navItems.forEach(i => i.classList.remove('active'));
            e.currentTarget.classList.add('active');
        }

        if (viewName === 'chat') {
            chatView.style.display = 'flex';
            otherViews.style.display = 'none';
        } else {
            chatView.style.display = 'none';
            otherViews.style.display = 'block';
            renderOtherView(viewName);
        }
    };

    function renderOtherView(viewName) {
        const title = document.getElementById('otherTitle');
        const content = document.getElementById('otherContent');
        const settings = JSON.parse(localStorage.getItem(settingsKey));

        if (viewName === 'profile') {
            title.textContent = 'User Profile';
            content.innerHTML = `
                <div style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 12px;">
                    <p><strong>Name:</strong> ${sessionDetail.name}</p>
                    <p><strong>Email:</strong> ${sessionDetail.email}</p>
                    <p><strong>Status:</strong> Security Certified</p>
                </div>
            `;
        } else if (viewName === 'settings') {
            const isGemini = settings.provider === 'gemini';
            const activeModel = isGemini ? settings.geminiModel : settings.openaiModel;

            title.textContent = 'Security Settings';
            content.innerHTML = `
                <div class="form-group" style="margin-bottom: 25px;">
                    <label>Sensitivity Level</label>
                    <select id="set_level" class="input-field" onchange="updateSettings('level', this.value)">
                        <option value="low" ${settings.level === 'low' ? 'selected' : ''}>Low (Public Info Only)</option>
                        <option value="medium" ${settings.level === 'medium' ? 'selected' : ''}>Medium (Internal Project Protection)</option>
                        <option value="high" ${settings.level === 'high' ? 'selected' : ''}>High (Comprehensive Protection - Recommended)</option>
                    </select>
                </div>

                <div class="form-group" style="margin-bottom: 25px;">
                    <label>Intelligence Provider</label>
                    <select id="set_provider" class="input-field" onchange="updateSettings('provider', this.value); renderOtherView('settings')">
                        <option value="gemini" ${settings.provider === 'gemini' ? 'selected' : ''}>Google Gemini (Default)</option>
                        <option value="openai" ${settings.provider === 'openai' ? 'selected' : ''}>ChatGPT (OpenAI)</option>
                    </select>
                </div>
                
                <!-- Dynamic API Key Field -->
                <div class="form-group">
                    <label>${isGemini ? 'Gemini' : 'ChatGPT'} API Key</label>
                    <input type="password" id="active_api_key" class="input-field" 
                           value="${isGemini ? settings.apiKey : settings.openAIKey}" 
                           placeholder="Enter your ${isGemini ? 'Gemini' : 'ChatGPT'} key" 
                           onchange="updateSettings('${isGemini ? 'apiKey' : 'openAIKey'}', this.value)">
                    <p style="font-size: 0.85rem; color: var(--text-muted); padding-top: 8px;">
                        <a href="${isGemini ? 'https://aistudio.google.com/app/apikey' : 'https://platform.openai.com/api-keys'}" 
                           target="_blank" style="color: var(--primary); font-weight: bold;">
                           Get ${isGemini ? 'Gemini' : 'ChatGPT'} API Key here
                        </a>
                    </p>
                </div>

                <div class="form-group" style="margin-top: 30px; padding: 22px; border: 1px solid var(--border-glass); border-radius: 12px; background: rgba(255,255,255,0.02);">
                    <label style="display: flex; align-items: center; gap: 10px;">
                        <i class="fas fa-stethoscope"></i> ${isGemini ? 'Gemini' : 'ChatGPT'} Health Check
                    </label>
                    <p style="font-size: 0.85rem; color: var(--text-muted); margin: 10px 0;">
                        Scan for compatible ${isGemini ? 'Gemini' : 'ChatGPT'} models.
                    </p>
                    <button id="diagnosticBtn" class="btn-primary" style="width: 100%; border-radius: 8px;" onclick="runDiagnostics()">
                        🔍 Verify AI Connection
                    </button>
                    <div id="diagnosticResults" style="margin-top: 15px; font-size: 0.85rem;"></div>
                </div>

                <div class="form-group" style="margin-top: 30px;">
                    <label>Active ${isGemini ? 'Gemini' : 'ChatGPT'} Version</label>
                    <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 10px;">
                        Currently using: <span id="activeModelDisplay" style="color: var(--primary); font-weight: bold;">${activeModel}</span>
                    </p>
                    <div id="modelListDisplay" style="display: flex; flex-wrap: wrap; gap: 8px;">
                        <span style="font-size: 0.8rem; color: var(--text-muted);">Run connection test to see available versions.</span>
                    </div>
                </div>
            `;
        } else if (viewName === 'history') {
            title.textContent = 'Chat History';
            const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
            content.innerHTML = history.length ? history.map(h => `
                <div style="border-bottom: 1px solid var(--border-glass); padding: 10px 0;">
                    <span style="color: ${h.sender === 'user' ? 'var(--primary)' : 'var(--text-muted)'}; font-weight: bold;">
                        ${h.sender.toUpperCase()}:
                    </span>
                    <span>${h.text}</span>
                </div>
            `).join('') : '<p>No history yet.</p>';
            content.innerHTML += '<button class="btn-primary" style="margin-top:20px; background:var(--danger);" onclick="clearHistory()">Clear History</button>';
        }
    }

    async function processPrompt() {
        const currentAttempts = parseInt(localStorage.getItem(attemptsKey) || '0');
        if (currentAttempts >= 250) {
            alert('Daily research limit reached (250).');
            return;
        }
        const text = promptInput.value.trim();
        if (!text) return;
        const settings = JSON.parse(localStorage.getItem(settingsKey));
        const result = checkSensitivity(text, settings.level);
        if (result.safe) executeChat(text);
        else showInterception(result);
    }

    async function handleFileSelect(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target.result;
            const settings = JSON.parse(localStorage.getItem(settingsKey));
            const result = checkSensitivity(content, settings.level);
            if (result.safe) executeChat(`[File: ${file.name}]\n\n${content}`);
            else showInterception(result);
        };
        reader.readAsText(file);
    }

    async function executeChat(text) {
        addToHistory(text, 'user');
        promptInput.value = '';
        incrementAttempts();
        try {
            const aiResponse = await callAI(text);
            addToHistory(aiResponse, 'ai');
        } catch (err) {
            addToHistory(`Request Error: ${err.message}`, 'ai');
        }
    }

    function showInterception(result) {
        const modal = document.getElementById('interceptor');
        const reason = document.getElementById('interceptReason');
        const findingsList = result.findings.map(f => f.type).join(', ');
        reason.textContent = `Sensitive data [${findingsList}] detected. Sharing restricted.`;
        modal.dataset.currentPrompt = promptInput.value;
        modal.dataset.findings = JSON.stringify(result.findings);
        modal.style.display = 'flex';
    }

    window.handleIntercept = function(action) {
        const modal = document.getElementById('interceptor');
        modal.style.display = 'none';
        if (action === 'edit') promptInput.focus();
        else if (action === 'enhance') {
            const prompt = modal.dataset.currentPrompt;
            const findings = JSON.parse(modal.dataset.findings);
            executeChat(sanitizeText(prompt, findings));
        } else if (action === 'cancel') promptInput.value = '';
    };

    window.runDiagnostics = async function() {
        const settings = JSON.parse(localStorage.getItem(settingsKey));
        const provider = settings.provider || 'gemini';
        const apiKey = provider === 'gemini' ? settings.apiKey : settings.openAIKey;
        const resultDiv = document.getElementById('diagnosticResults');
        const bnt = document.getElementById('diagnosticBtn');
        const modelList = document.getElementById('modelListDisplay');

        if (!apiKey) {
            resultDiv.innerHTML = `<span style="color: var(--danger);">Error: No key for ${provider.toUpperCase()}</span>`;
            return;
        }

        bnt.disabled = true;
        bnt.textContent = '⏱️ Connecting...';
        resultDiv.innerHTML = `Probing ${provider.toUpperCase()} interfaces...`;

        try {
            const models = await listAvailableAIModels(provider, apiKey);
            resultDiv.innerHTML = '<span style="color: var(--success);"><i class="fas fa-check-circle"></i> Connection Verified!</span>';
            const currentModel = provider === 'gemini' ? settings.geminiModel : settings.openaiModel;
            modelList.innerHTML = models.map(m => `
                <button onclick="selectModel('${m}')" class="btn-primary" style="padding: 5px 10px; font-size: 0.75rem; background: ${currentModel === m ? 'var(--primary)' : 'var(--bg-card)'}; border: 1px solid var(--border-glass);">
                    ${m}
                </button>
            `).join('');
        } catch (err) {
            resultDiv.innerHTML = `<span style="color: var(--danger);">Failed: ${err.message}</span>`;
        } finally {
            bnt.disabled = false;
            bnt.textContent = '🔍 Verify AI Connection';
        }
    };

    window.selectModel = function(model) {
        const settings = JSON.parse(localStorage.getItem(settingsKey));
        if (settings.provider === 'gemini') settings.geminiModel = model;
        else settings.openaiModel = model;
        localStorage.setItem(settingsKey, JSON.stringify(settings));
        document.getElementById('activeModelDisplay').textContent = model;
        alert(`Model updated: ${model}`);
        renderOtherView('settings');
    };

    window.updateSettings = function(key, val) {
        const settings = JSON.parse(localStorage.getItem(settingsKey));
        settings[key] = val;
        localStorage.setItem(settingsKey, JSON.stringify(settings));
        if (key === 'level' && viewSubtitleEl) {
            viewSubtitleEl.textContent = `Intercepting: ${val.toUpperCase()} Mode`;
        }
    };

    window.logout = function() {
        localStorage.removeItem('sentinel_session');
        window.location.href = 'index.html';
    };

    window.clearHistory = function() {
        localStorage.setItem(historyKey, '[]');
        renderOtherView('history');
    };

    window.simulateVoice = function() {
        promptInput.value = "Listening...";
        setTimeout(() => {
            promptInput.value = "My password is Secret123";
            alert("Voice simulated.");
        }, 1000);
    };

    loadHistory();
});
