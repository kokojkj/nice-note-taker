chrome.runtime.onInstalled.addListener(function() {
  chrome.storage.local.get(['notes'], function(result) {
    if (!result.notes) {
      chrome.storage.local.set({ notes: [] });
    }
  });
});