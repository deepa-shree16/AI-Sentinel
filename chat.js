async function getSessionData() {
    const session = JSON.parse(localStorage.getItem('sentinel_session'));
    if (!session) return null;
    const email = session.email;
    return {
        historyKey: `sentinel_history_${email}`,
        attemptsKey: `sentinel_attempts_${email}`,
        settingsKey: `sentinel_settings_${email}`
    };
}

async function callAI(prompt) {
    const keys = await getSessionData();
    const settings = JSON.parse(localStorage.getItem(keys.settingsKey)) || {};
    const provider = settings.provider || 'gemini';

    if (provider === 'gemini') {
        if (!settings.apiKey) throw new Error('Gemini API Key missing.');
        return await callGemini(prompt, settings.apiKey);
    } else if (provider === 'openai') {
        if (!settings.openAIKey) throw new Error('ChatGPT (OpenAI) API Key missing.');
        return await callOpenAI(prompt, settings.openAIKey);
    }
}

async function callGemini(prompt, apiKey) {
    const keys = await getSessionData();
    const settings = JSON.parse(localStorage.getItem(keys.settingsKey)) || {};
    const modelId = settings.geminiModel || 'gemini-1.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;
    
    const container = document.getElementById('chatContainer');
    const thinkingDiv = document.createElement('div');
    thinkingDiv.className = 'message msg-ai glass thinking';
    thinkingDiv.id = 'thinking-indicator';
    thinkingDiv.textContent = '🛡️ AI-Sentinel is thinking...';
    container.appendChild(thinkingDiv);
    container.scrollTop = container.scrollHeight;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction: {
                    role: "system",
                    parts: [{ text: "You are AI-Sentinel. Rules: 1. Always be extremely concise. 2. Use maximum 2 bullet points. 3. No introductory or concluding text (no 'Sure', 'Here is', etc.). 4. Direct answers only. 5. If the user asks for a brief explanation, keep it to 1-2 sentences. 6. Only provide detailed explanations if explicitly asked to 'elaborate' or 'explain in detail'." }]
                },
                contents: [{ 
                    role: "user",
                    parts: [{ text: prompt }] 
                }],
                generationConfig: {
                    maxOutputTokens: 200,
                    temperature: 0.1
                }
            })
        });

        thinkingDiv.remove();

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const apiMsg = errorData.error?.message || response.statusText || 'Request Failed';
            throw new Error(`Gemini Error (${response.status}): ${apiMsg}`);
        }
        
        const data = await response.json();
        if (data.promptFeedback?.blockReason) throw new Error(`Blocked by AI Safety: ${data.promptFeedback.blockReason}`);
        if (!data.candidates || !data.candidates[0].content || !data.candidates[0].content.parts) throw new Error('Empty response from Gemini.');

        return data.candidates[0].content.parts[0].text;
    } catch (err) {
        if (thinkingDiv) thinkingDiv.remove();
        throw err;
    }
}

async function callOpenAI(prompt, apiKey) {
    const keys = await getSessionData();
    const settings = JSON.parse(localStorage.getItem(keys.settingsKey)) || {};
    const modelId = settings.openaiModel || "gpt-4o";

    const url = "https://api.openai.com/v1/chat/completions";
    const container = document.getElementById('chatContainer');
    const thinkingDiv = document.createElement('div');
    thinkingDiv.className = 'message msg-ai glass thinking';
    thinkingDiv.id = 'thinking-indicator';
    thinkingDiv.textContent = '🛡️ AI-Sentinel (ChatGPT) is thinking...';
    container.appendChild(thinkingDiv);
    container.scrollTop = container.scrollHeight;

    const systemMsg = "You are AI-Sentinel. Rules: 1. Always be extremely concise. 2. Use maximum 2 bullet points. 3. No introductory or concluding text. 4. Direct answers only. 5. If the user asks for a brief explanation, keep it to 1-2 sentences. 6. Only provide detailed explanations if explicitly asked to 'elaborate' or 'explain in detail'.";

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: modelId,
                messages: [
                    { role: "system", content: systemMsg },
                    { role: "user", content: prompt }
                ],
                max_tokens: 200,
                temperature: 0.1
            })
        });

        thinkingDiv.remove();

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const apiMsg = errorData.error?.message || response.statusText || 'Request Failed';
            throw new Error(`OpenAI Error (${response.status}): ${apiMsg}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    } catch (err) {
        if (thinkingDiv) thinkingDiv.remove();
        throw err;
    }
}

async function addToHistory(msg, sender) {
    const keys = await getSessionData();
    const history = JSON.parse(localStorage.getItem(keys.historyKey) || '[]');
    const chatMsg = { text: msg, sender, timestamp: new Date().toISOString() };
    history.push(chatMsg);
    localStorage.setItem(keys.historyKey, JSON.stringify(history));
    
    renderMessage(msg, sender);
}

function renderMessage(text, sender) {
    const container = document.getElementById('chatContainer');
    if (!container) return;

    const msgDiv = document.createElement('div');
    msgDiv.className = `message msg-${sender} glass`;
    
    if (sender === 'ai' && typeof marked !== 'undefined') {
        msgDiv.innerHTML = marked.parse(text); 
    } else {
        msgDiv.textContent = text;
    }
    
    container.appendChild(msgDiv);
    container.scrollTop = container.scrollHeight;
}

async function incrementAttempts() {
    const keys = await getSessionData();
    let currentAttempts = parseInt(localStorage.getItem(keys.attemptsKey) || '0');
    currentAttempts++;
    localStorage.setItem(keys.attemptsKey, currentAttempts);
    const attemptsEl = document.getElementById('attempts');
    if (attemptsEl) attemptsEl.textContent = currentAttempts;
}

async function loadHistory() {
    const keys = await getSessionData();
    if (!keys) return;
    const history = JSON.parse(localStorage.getItem(keys.historyKey) || '[]');
    const container = document.getElementById('chatContainer');
    if (container) {
        container.innerHTML = ''; 
        history.forEach(msg => renderMessage(msg.text, msg.sender));
    }
}

async function listAvailableAIModels(provider, apiKey) {
    if (provider === 'gemini') {
        const url = `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Gemini Diagnostic Failed: ${response.status}`);
        const data = await response.json();
        return data.models.map(m => m.name.replace('models/', ''));
    } else if (provider === 'openai') {
        const url = "https://api.openai.com/v1/models";
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        if (!response.ok) throw new Error(`OpenAI Diagnostic Failed: ${response.status}`);
        const data = await response.json();
        return data.data
            .filter(m => m.id.includes('gpt'))
            .map(m => m.id)
            .sort();
    }
    return [];
}
