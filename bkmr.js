/**
 * TopoGlyphNavigator - A Vim-like HTML page navigator bookmarklet
 * Implements the TopoGlyph Web Navigation Extension model
 */
javascript:(function() {
    // Create our navigator system
    const topoNav = {
      // State management
      state: {
        mode: 'normal', // 'normal', 'visual', 'command'
        position: null, // Current focused element
        selections: [], // Selected elements
        history: [],    // Navigation history
        markers: {}     // Named position markers
      },
      
      // Element indexing system
      elements: {
        all: [],        // All navigable elements
        headings: [],   // Heading elements
        links: [],      // Link elements
        forms: [],      // Form elements
        current: 0      // Current element index
      },
      
      // Initialize the navigator
      init: function() {
        // Create UI overlay
        this.createUI();
        
        // Index all navigable elements
        this.indexElements();
        
        // Set up key bindings
        this.setupKeyBindings();
        
        // Enter normal mode
        this.enterNormalMode();
      },
      
      // Create minimal UI overlay
      createUI: function() {
        const ui = document.createElement('div');
        ui.id = 'topo-nav-ui';
        ui.style.cssText = `
          position: fixed;
          bottom: 10px;
          right: 10px;
          background: rgba(0,0,0,0.7);
          color: white;
          padding: 5px 10px;
          font-family: monospace;
          z-index: 999999;
          border-radius: 3px;
        `;
        
        this.ui = {
          container: ui,
          mode: document.createElement('div'),
          position: document.createElement('div'),
          command: document.createElement('input')
        };
        
        this.ui.mode.innerHTML = 'Mode: Normal';
        this.ui.position.innerHTML = 'Position: 0/0';
        this.ui.command.style.display = 'none';
        
        ui.appendChild(this.ui.mode);
        ui.appendChild(this.ui.position);
        ui.appendChild(this.ui.command);
        
        document.body.appendChild(ui);
      },
      
      // Index all navigable elements in the page
      indexElements: function() {
        // Get all navigable elements
        const navigable = document.querySelectorAll('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"]), h1, h2, h3, h4, h5, h6, p, li, img');
        
        this.elements.all = Array.from(navigable);
        this.elements.headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
        this.elements.links = Array.from(document.querySelectorAll('a'));
        this.elements.forms = Array.from(document.querySelectorAll('input, select, textarea, button'));
        
        // Update position information
        this.updatePositionInfo();
      },
      
      // Set up vim-like key bindings
      setupKeyBindings: function() {
        document.addEventListener('keydown', (e) => {
          // Don't intercept when in input fields
          if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            if (e.key === 'Escape') {
              e.target.blur();
              this.enterNormalMode();
              e.preventDefault();
            }
            return;
          }
          
          // Handle based on current mode
          switch (this.state.mode) {
            case 'normal':
              this.handleNormalModeKey(e);
              break;
            case 'visual':
              this.handleVisualModeKey(e);
              break;
            case 'command':
              this.handleCommandModeKey(e);
              break;
          }
        });
      },
      
      // Normal mode key handling
      handleNormalModeKey: function(e) {
        switch (e.key) {
          case 'j': // Move down
            this.moveDown();
            e.preventDefault();
            break;
          case 'k': // Move up
            this.moveUp();
            e.preventDefault();
            break;
          case 'h': // Move left/previous
            this.movePrevious();
            e.preventDefault();
            break;
          case 'l': // Move right/next
            this.moveNext();
            e.preventDefault();
            break;
          case 'g': // Go to top
            if (e.shiftKey) { // G - go to bottom
              this.goToBottom();
            } else { // g - go to top
              this.goToTop();
            }
            e.preventDefault();
            break;
          case 'f': // Find and navigate to link
            this.enterFindMode();
            e.preventDefault();
            break;
          case '/': // Search
            this.enterSearchMode();
            e.preventDefault();
            break;
          case 'v': // Enter visual mode
            this.enterVisualMode();
            e.preventDefault();
            break;
          case ':': // Enter command mode
            this.enterCommandMode();
            e.preventDefault();
            break;
          case 'Enter': // Activate element
            this.activateElement();
            e.preventDefault();
            break;
          case 'Escape': // Clear any highlights
            this.clearHighlights();
            e.preventDefault();
            break;
        }
      },
      
      // Visual mode key handling
      handleVisualModeKey: function(e) {
        switch (e.key) {
          case 'Escape':
            this.enterNormalMode();
            e.preventDefault();
            break;
          case 'j': // Extend selection down
            this.extendSelectionDown();
            e.preventDefault();
            break;
          case 'k': // Extend selection up
            this.extendSelectionUp();
            e.preventDefault();
            break;
          case 'y': // Yank (copy) selection
            this.yankSelection();
            this.enterNormalMode();
            e.preventDefault();
            break;
        }
      },
      
      // Command mode key handling
      handleCommandModeKey: function(e) {
        if (e.key === 'Enter') {
          this.executeCommand(this.ui.command.value);
          this.enterNormalMode();
          e.preventDefault();
        } else if (e.key === 'Escape') {
          this.enterNormalMode();
          e.preventDefault();
        }
      },
      
      // Mode transitions
      enterNormalMode: function() {
        this.state.mode = 'normal';
        this.ui.mode.innerHTML = 'Mode: Normal';
        this.ui.command.style.display = 'none';
        this.clearHighlights();
        
        // Focus first element if nothing is focused
        if (!this.state.position) {
          this.focusElement(this.elements.all[0]);
        }
      },
      
      enterVisualMode: function() {
        this.state.mode = 'visual';
        this.ui.mode.innerHTML = 'Mode: Visual';
        this.state.selections = [this.state.position];
        this.highlightElement(this.state.position, 'visual-selection');
      },
      
      enterCommandMode: function() {
        this.state.mode = 'command';
        this.ui.mode.innerHTML = 'Mode: Command';
        this.ui.command.style.display = 'block';
        this.ui.command.value = '';
        this.ui.command.focus();
      },
      
      // Navigation operations
      moveNext: function() {
        const currentIndex = this.elements.all.indexOf(this.state.position);
        if (currentIndex < this.elements.all.length - 1) {
          this.focusElement(this.elements.all[currentIndex + 1]);
        }
      },
      
      movePrevious: function() {
        const currentIndex = this.elements.all.indexOf(this.state.position);
        if (currentIndex > 0) {
          this.focusElement(this.elements.all[currentIndex - 1]);
        }
      },
      
      moveUp: function() {
        // Find element above current visually
        const current = this.state.position;
        if (!current) return;
        
        const currentRect = current.getBoundingClientRect();
        let bestMatch = null;
        let minDistance = Infinity;
        
        for (const element of this.elements.all) {
          const rect = element.getBoundingClientRect();
          // Check if element is above
          if (rect.bottom < currentRect.top) {
            const horizontalDistance = Math.abs(rect.left - currentRect.left);
            const distance = Math.sqrt(
              Math.pow(rect.bottom - currentRect.top, 2) + 
              Math.pow(horizontalDistance, 2)
            );
            if (distance < minDistance) {
              minDistance = distance;
              bestMatch = element;
            }
          }
        }
        
        if (bestMatch) {
          this.focusElement(bestMatch);
        }
      },
      
      moveDown: function() {
        // Find element below current visually
        const current = this.state.position;
        if (!current) return;
        
        const currentRect = current.getBoundingClientRect();
        let bestMatch = null;
        let minDistance = Infinity;
        
        for (const element of this.elements.all) {
          const rect = element.getBoundingClientRect();
          // Check if element is below
          if (rect.top > currentRect.bottom) {
            const horizontalDistance = Math.abs(rect.left - currentRect.left);
            const distance = Math.sqrt(
              Math.pow(rect.top - currentRect.bottom, 2) + 
              Math.pow(horizontalDistance, 2)
            );
            if (distance < minDistance) {
              minDistance = distance;
              bestMatch = element;
            }
          }
        }
        
        if (bestMatch) {
          this.focusElement(bestMatch);
        }
      },
      
      goToTop: function() {
        if (this.elements.all.length > 0) {
          this.focusElement(this.elements.all[0]);
        }
      },
      
      goToBottom: function() {
        if (this.elements.all.length > 0) {
          this.focusElement(this.elements.all[this.elements.all.length - 1]);
        }
      },
      
      // Element operations
      focusElement: function(element) {
        // Remove previous highlight
        if (this.state.position) {
          this.state.position.classList.remove('topo-nav-focus');
        }
        
        // Set new position
        this.state.position = element;
        
        // Add highlight
        element.classList.add('topo-nav-focus');
        
        // Scroll element into view if needed
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Update position information
        this.updatePositionInfo();
        
        // Add to history
        this.state.history.push(element);
        if (this.state.history.length > 100) {
          this.state.history.shift();
        }
      },
      
      activateElement: function() {
        const element = this.state.position;
        if (!element) return;
        
        if (element.tagName === 'A') {
          element.click();
        } else if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.tagName === 'SELECT') {
          element.focus();
        } else if (element.tagName === 'BUTTON') {
          element.click();
        }
      },
      
      // Utility methods
      updatePositionInfo: function() {
        const currentIndex = this.state.position ? 
          this.elements.all.indexOf(this.state.position) + 1 : 0;
        this.ui.position.innerHTML = `Position: ${currentIndex}/${this.elements.all.length}`;
      },
      
      clearHighlights: function() {
        // Clear all highlights from elements
        document.querySelectorAll('.topo-nav-focus, .visual-selection, .search-result').forEach(el => {
          el.classList.remove('topo-nav-focus', 'visual-selection', 'search-result');
        });
        
        // Keep focus on current element if in normal mode
        if (this.state.mode === 'normal' && this.state.position) {
          this.state.position.classList.add('topo-nav-focus');
        }
        
        // Clear selections array
        this.state.selections = [];
      },
      
      highlightElement: function(element, className) {
        if (element) {
          element.classList.add(className);
        }
      },
      
      // Command execution
      executeCommand: function(command) {
        // Parse command
        const parts = command.split(' ');
        const cmd = parts[0];
        const args = parts.slice(1);
        
        switch (cmd) {
          case 'q': // Quit the navigator
            this.destroy();
            break;
          case 'h': // Show help
            this.showHelp();
            break;
          case 'm': // Set marker
            if (args.length > 0 && this.state.position) {
              this.state.markers[args[0]] = this.state.position;
              this.showMessage(`Marker '${args[0]}' set`);
            }
            break;
          case "'": // Go to marker
            if (args.length > 0 && this.state.markers[args[0]]) {
              this.focusElement(this.state.markers[args[0]]);
            }
            break;
        }
      },
      
      showMessage: function(message) {
        const msg = document.createElement('div');
        msg.className = 'topo-nav-message';
        msg.textContent = message;
        msg.style.cssText = `
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(0,0,0,0.8);
          color: white;
          padding: 10px 20px;
          border-radius: 5px;
          z-index: 10000000;
        `;
        
        document.body.appendChild(msg);
        setTimeout(() => {
          msg.remove();
        }, 2000);
      },
      
      // Cleanup
      destroy: function() {
        // Remove UI
        if (this.ui.container) {
          this.ui.container.remove();
        }
        
        // Remove all styles and highlights
        const style = document.getElementById('topo-nav-style');
        if (style) {
          style.remove();
        }
        
        this.clearHighlights();
        
        // Remove event listeners
        // Note: This is a simplified approach - in a real implementation
        // we would need to properly remove specific listeners
        
        // Show exit message
        this.showMessage('TopoGlyph Navigator exited');
      }
    };
    
    // Create and inject CSS
    const style = document.createElement('style');
    style.id = 'topo-nav-style';
    style.innerHTML = `
      .topo-nav-focus {
        outline: 3px solid rgba(255, 165, 0, 0.7) !important;
        background-color: rgba(255, 165, 0, 0.1) !important;
      }
      
      .visual-selection {
        outline: 3px solid rgba(0, 128, 255, 0.7) !important;
        background-color: rgba(0, 128, 255, 0.1) !important;
      }
      
      .search-result {
        outline: 2px dashed rgba(0, 255, 0, 0.7) !important;
        background-color: rgba(0, 255, 0, 0.1) !important;
      }
    `;
    document.head.appendChild(style);
    
    // Initialize the navigator
    topoNav.init();
    
    // Save reference to global scope (for debugging)
    window.topoNav = topoNav;
  })();