/* ============================================================
   ============================================================ */

let lastAction = 0;
let isFirstChat = true;

// ---  ---
function formatMessage(text) {
    // 1.  (```...```)
    const parts = text.split(/```/g);
    let formatted = "";

    parts.forEach((part, index) => {
        if (index % 2 === 1) {
            // Ambil bahasa (misal: javascript, html) jika ada
            let lang = "code";
            let codeContent = part;
            
            const firstLineBreak = part.indexOf('\n');
            if (firstLineBreak > -1 && firstLineBreak < 20) {
                lang = part.substring(0, firstLineBreak).trim();
                codeContent = part.substring(firstLineBreak + 1);
            }

            // Escape HTML agar tidak dijalankan browser (< jadi &lt;)
            codeContent = codeContent
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;");

            // Bungkus dengan styling khusus
            formatted += `
                <div class="code-wrapper">
                    <div class="code-header">
                        <span>${lang || 'snippet'}</span>
                    </div>
                    <pre><code class="language-${lang}">${codeContent}</code></pre>
                </div>`;
        } else {
            // --- INI BAGIAN TEKS BIASA (Genap) ---
            let textContent = part;
            
            // Format Bold (**teks**)
            textContent = textContent.replace(/\*\*(.*?)\*\*/g, '<b style="color:#a855f7;">$1</b>');
            
            // Format Inline Code (`kode`)
            textContent = textContent.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
            
            // Ubah Baris Baru menjadi <br>
            textContent = textContent.replace(/\n/g, '<br>');
            
            formatted += textContent;
        }
    });

    return formatted;
}
// ------------------------------------------

function fillInput(text) {
    const inputField = document.getElementById('userInput');
    inputField.value = text;
    inputField.focus();
}

async function executeProtokol() {
    const input = document.getElementById('userInput');
    const container = document.getElementById('chat-container');
    const greeting = document.getElementById('greeting');
    const query = input.value.trim();
    const now = Date.now();

    if (!query) return;

    if (now - lastAction < SECURITY_CONFIG.rateLimit) return; 

    if (isFirstChat) {
        greeting.style.display = 'none';
        isFirstChat = false;
    }

    lastAction = now;

    // Tampilkan Pesan User
    container.innerHTML += `
        <div class="message-wrapper user-msg">
            <div class="user-icon">U</div>
            <div class="text-content">${query.replace(/</g, "&lt;")}</div> 
        </div>
    `;
    
    input.value = '';
    
    const aiId = 'xyz-' + now;
    
    container.innerHTML += `
        <div class="message-wrapper ai-msg">
            <div class="ai-icon">
                <img src="[https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg](https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg)" alt="AI">
            </div>
            <div class="text-content" id="${aiId}">
                <span class="typing-indicator">Menganalisis logika...</span>
            </div>
        </div>
    `;
    
    container.scrollTop = container.scrollHeight;

    try {
        const response = await fetch("[https://api.groq.com/openai/v1/chat/completions](https://api.groq.com/openai/v1/chat/completions)", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${getSecureKey()}`, 
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                messages: [
                    {role: "system", content: AI_IDENTITY}, 
                    {role: "user", content: query}
                ],
                model: "llama-3.3-70b-versatile",
                temperature: 0.7 
            })
        });

        const data = await response.json();
        const rawText = data.choices[0].message.content;
        
        // PANGGIL FUNGSI FORMATTING BARU
        const prettyHtml = formatMessage(rawText);
        
        document.getElementById(aiId).innerHTML = prettyHtml;
        
    } catch (e) {
        console.error(e);
        document.getElementById(aiId).innerText = "Sistem sibuk atau koneksi terputus.";
    }
    
    container.scrollTop = container.scrollHeight;
}

document.getElementById('userInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') executeProtokol();
});

if (SECURITY_CONFIG.antiInspect) {
    document.onkeydown = function(e) {
        if(e.keyCode == 123 || (e.ctrlKey && (e.keyCode == 85 || e.keyCode == 73))) {
            return false;
        }
    };
}
