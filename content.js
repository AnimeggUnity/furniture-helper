
((app) => {
  // Inject inject.js into the page
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('inject.js');
  document.documentElement.appendChild(script);

  // Initialize message listener
  app.initializeMessageListener();

  // Initial button insertion and Enter key support
  app.insertButtons();
  app.addEnterKeySupport();

  // Observe for changes in the button container to re-insert buttons if the DOM is updated
  const buttonContainer = document.querySelector('.el-button-group') || document.body;
  new MutationObserver(() => {
    app.insertButtons();
    app.addEnterKeySupport();
  }).observe(buttonContainer, { childList: true, subtree: true });

})(window.FurnitureHelper = window.FurnitureHelper || {});
