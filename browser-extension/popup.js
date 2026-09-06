const keyInputContainer = document.getElementById('keyInputContainer');
const keySavedContainer = document.getElementById('keySavedContainer');
const apiKeyInput = document.getElementById('apiKeyInput');
const statusDiv = document.getElementById('status');

function showInputState() {
    keyInputContainer.classList.remove('hidden');
    keySavedContainer.classList.add('hidden');
}

function showSavedState() {
    keyInputContainer.classList.add('hidden');
    keySavedContainer.classList.remove('hidden');
}

chrome.storage.local.get(['userApiKey'], (result) => {
    if (result.userApiKey) {
        apiKeyInput.value = result.userApiKey;
        showSavedState();
    } else {
        showInputState();
    }
});

document.getElementById('saveKeyBtn').addEventListener('click', () => {
    const key = apiKeyInput.value.trim();
    
    if (!key) {
        statusDiv.innerText = "Please enter a key.";
        statusDiv.style.color = "#f44336";
        return;
    }

    chrome.storage.local.set({ userApiKey: key }, () => {
        statusDiv.innerText = "API Key Saved!";
        statusDiv.style.color = "#4caf50";
        showSavedState();
    });
});

document.getElementById('changeKeyBtn').addEventListener('click', () => {
    showInputState();
    statusDiv.innerText = "Waiting...";
    statusDiv.style.color = "#a0a0a0";
});

document.getElementById('logBtn').addEventListener('click', () => {
    statusDiv.innerText = "Beaming to server...";
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, {action: "log_episode"}, (response) => {
            
            if (chrome.runtime.lastError) {
                statusDiv.innerText = "Error: Refresh the page.";
                showNotification("Connection Error", "Please refresh the anime page and try again.");
                return;
            }
            if (response && response.status === "success") {
                statusDiv.innerText = "Success!";
                statusDiv.style.color = "#4caf50";
                showNotification("Successfully Logged!", response.title);
            } else {
                statusDiv.innerText = "Failed.";
                statusDiv.style.color = "#f44336";
                showNotification("Logging Failed", response ? response.message : "Unknown error.");
            }
        });
    });
});

function showNotification(title, message) {
    chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon.png',
        title: title,
        message: message
    });
}