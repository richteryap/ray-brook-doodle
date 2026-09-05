document.getElementById('logBtn').addEventListener('click', () => {
    const statusDiv = document.getElementById('status');
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