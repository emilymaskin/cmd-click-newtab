chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'open-tab') {
    chrome.tabs.create({ url: message.url });
  }
});
