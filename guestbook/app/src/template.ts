export function getHtmlTemplate(redisConnected: boolean): string {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Guestbook</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: #f5f5f5;
                }
                .container {
                    background: white;
                    padding: 30px;
                    border-radius: 10px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                h1 {
                    color: #333;
                    text-align: center;
                    margin-bottom: 30px;
                }
                .status {
                    padding: 10px;
                    border-radius: 5px;
                    margin-bottom: 20px;
                    text-align: center;
                }
                .status.connected {
                    background-color: #d4edda;
                    color: #155724;
                    border: 1px solid #c3e6cb;
                }
                .status.disconnected {
                    background-color: #f8d7da;
                    color: #721c24;
                    border: 1px solid #f5c6cb;
                }
                .form-group {
                    margin-bottom: 15px;
                }
                label {
                    display: block;
                    margin-bottom: 5px;
                    font-weight: bold;
                }
                input[type="text"], textarea {
                    width: 100%;
                    padding: 10px;
                    border: 1px solid #ddd;
                    border-radius: 5px;
                    font-size: 16px;
                }
                button {
                    background-color: #007bff;
                    color: white;
                    padding: 12px 24px;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 16px;
                }
                button:hover {
                    background-color: #0056b3;
                }
                .entries {
                    margin-top: 30px;
                }
                .entry {
                    background-color: #f8f9fa;
                    padding: 15px;
                    margin-bottom: 10px;
                    border-radius: 5px;
                    border-left: 4px solid #007bff;
                }
                .entry .name {
                    font-weight: bold;
                    color: #333;
                }
                .entry .message {
                    margin-top: 5px;
                    color: #666;
                }
                .entry .timestamp {
                    font-size: 12px;
                    color: #999;
                    margin-top: 5px;
                }
                .refresh-btn {
                    background-color: #28a745;
                    margin-bottom: 20px;
                }
                .refresh-btn:hover {
                    background-color: #218838;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>📝 Guestbook</h1>
                
                <div id="status" class="status ${redisConnected ? 'connected' : 'disconnected'}">
                    Redis Status: ${redisConnected ? 'Connected' : 'Disconnected'}
                </div>
                
                <form id="guestbook-form">
                    <div class="form-group">
                        <label for="name">Your Name:</label>
                        <input type="text" id="name" name="name" required>
                    </div>
                    <div class="form-group">
                        <label for="message">Message:</label>
                        <textarea id="message" name="message" rows="4" required></textarea>
                    </div>
                    <button type="submit">Sign Guestbook</button>
                </form>
                
                <div class="entries">
                    <h2>Recent Entries</h2>
                    <button class="refresh-btn" onclick="loadEntries()">Refresh Entries</button>
                    <div id="entries-list"></div>
                </div>
            </div>
            
            <script>
                // Load entries on page load
                loadEntries();
                
                // Handle form submission
                document.getElementById('guestbook-form').addEventListener('submit', async (e) => {
                    e.preventDefault();
                    
                    const formData = new FormData(e.target);
                    const data = {
                        name: formData.get('name'),
                        message: formData.get('message')
                    };
                    
                    try {
                        const response = await fetch('/sign', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(data)
                        });
                        
                        if (response.ok) {
                            e.target.reset();
                            loadEntries();
                        } else {
                            alert('Error signing guestbook');
                        }
                    } catch (error) {
                        console.error('Error:', error);
                        alert('Error signing guestbook');
                    }
                });
                
                async function loadEntries() {
                    try {
                        const response = await fetch('/entries');
                        const entries = await response.json();
                        
                        const entriesList = document.getElementById('entries-list');
                        entriesList.innerHTML = '';
                        
                        if (entries.length === 0) {
                            entriesList.innerHTML = '<p>No entries yet. Be the first to sign!</p>';
                            return;
                        }
                        
                        entries.forEach(entry => {
                            const entryDiv = document.createElement('div');
                            entryDiv.className = 'entry';
                            entryDiv.innerHTML = \`
                                <div class="name">\${entry.name}</div>
                                <div class="message">\${entry.message}</div>
                                <div class="timestamp">\${new Date(entry.timestamp).toLocaleString()}</div>
                            \`;
                            entriesList.appendChild(entryDiv);
                        });
                    } catch (error) {
                        console.error('Error loading entries:', error);
                        document.getElementById('entries-list').innerHTML = '<p>Error loading entries</p>';
                    }
                }
                
                // Update status periodically
                setInterval(async () => {
                    try {
                        const response = await fetch('/health');
                        const health = await response.json();
                        const statusDiv = document.getElementById('status');
                        statusDiv.className = \`status \${health.redis ? 'connected' : 'disconnected'}\`;
                        statusDiv.textContent = \`Redis Status: \${health.redis ? 'Connected' : 'Disconnected'}\`;
                    } catch (error) {
                        console.error('Error checking health:', error);
                    }
                }, 5000);
            </script>
        </body>
        </html>
    `;
} 