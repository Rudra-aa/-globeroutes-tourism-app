/**
 * Aura V2 UI Integration Layer
 * Handles rendering chat, cards, route maps, and voice controls
 * Works with existing Aura HTML container
 */

class AuraV2UI {
  constructor() {
    this.chatWindow = document.getElementById('chatWindow') || document.getElementById('integratedAuraChatWindow') || this.createChatWindow();
    this.inputBox = document.getElementById('auraInput') || document.getElementById('integratedAuraInputBox') || this.createInputBox();
    this.voiceBtn = null;
    this.sendBtn = document.getElementById('sendBtn');
    this.isListening = false;
    this.setupEventListeners();
    setTimeout(() => {
      this.updateDestinationPill();
    }, 100);
  }

  /**
   * Create chat window if not exists
   */
  createChatWindow() {
    const div = document.createElement('div');
    div.id = 'auraChatWindow';
    div.style.cssText = `
      flex: 1;
      overflow-y: auto;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 20px;
      background: var(--bg);
    `;
    return div;
  }

  /**
   * Create input box if not exists
   */
  createInputBox() {
    const div = document.createElement('div');
    div.id = 'auraInputBox';
    div.style.cssText = `
      padding: 16px 24px;
      border-top: 1px solid var(--border);
      background: var(--bg-surface);
      display: flex;
      gap: 12px;
      align-items: center;
    `;
    div.innerHTML = `
      <input id="auraUserInput" type="text" placeholder="Ask me about your trip..."
        style="
          flex: 1;
          padding: 12px 16px;
          border-radius: 12px;
          border: 1px solid var(--border);
          background: var(--bg);
          color: var(--text-primary);
          font-size: 0.9rem;
        "/>
      <button id="auraVoiceBtn" style="
        width: 40px;
        height: 40px;
        border-radius: 50%;
        border: 1px solid var(--border);
        background: transparent;
        color: var(--text-secondary);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
      ">🎤</button>
      <button id="auraSendBtn" style="
        padding: 12px 24px;
        border-radius: 12px;
        border: none;
        background: var(--aura-grad);
        color: white;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
      ">Send</button>
    `;
    return div;
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    const userInput = document.getElementById('auraInput') || document.getElementById('integratedAuraInput') || 
                      this.inputBox.querySelector('input') || this.inputBox.querySelector('textarea');
    const sendBtn = document.getElementById('sendBtn') || document.getElementById('integratedAuraSendBtn') || 
                    this.inputBox.querySelector('button:last-child');
    const voiceBtn = document.getElementById('auraMicBtn') || document.getElementById('auraVoiceBtn');

    if (userInput) {
      userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.handleSendMessage();
        }
      });
    }

    if (sendBtn) {
      sendBtn.addEventListener('click', () => {
        this.handleSendMessage();
      });
    }

    if (voiceBtn) {
      voiceBtn.addEventListener('click', () => {
        this.toggleVoiceInput();
      });
    }
  }

  /**
   * Handle sending message
   */
  async handleSendMessage() {
    // if (!localStorage.getItem('globeroutes_user')) {
    //   if (window.checkAuthSession) window.checkAuthSession();
    //   return;
    // }
    const userInput = document.getElementById('auraInput') || document.getElementById('integratedAuraInput') || document.getElementById('auraUserInput');
    if (!userInput || !userInput.value.trim()) return;

    const message = userInput.value.trim();
    userInput.value = '';

    // Hide welcome screen on first message if visible
    const welcome = document.getElementById('welcomeScreen');
    if (welcome) welcome.style.display = 'none';

    // Display user message
    this.displayUserMessage(message);

    try {
      // Send to Aura V2
      const response = await window.AuraV2.handleUserMessage(message);

      // Display Aura response
      this.displayAuraMessage(response.response);

      // Display cards if any
      if (response.cards && response.cards.length > 0) {
        response.cards.forEach(card => {
          this.displayCard(card);
        });
      }

      // Handle map actions
      if (response.mapAction) {
        this.handleMapAction(response.mapAction);
      }

      // Display suggested actions
      if (response.suggestedActions && response.suggestedActions.length > 0) {
        this.displaySuggestedActions(response.suggestedActions);
      }

      // Dynamic update of destination status pill
      this.updateDestinationPill();

    } catch (error) {
      console.error('Error sending message:', error);
      this.displayAuraMessage('I encountered an error. Please try again.');
    }
  }

  /**
   * Handle quick action chip clicks
   */
  handleQuickAction(text) {
    const userInput = document.getElementById('auraInput') || document.getElementById('integratedAuraInput') || document.getElementById('auraUserInput');
    if (userInput) {
      userInput.value = text;
      this.handleSendMessage();
    }
  }

  /**
   * Update destination status pill dynamically
   */
  updateDestinationPill() {
    const dest = window.AuraV2 && window.AuraV2.memory && window.AuraV2.memory.context ? window.AuraV2.memory.context.destination : null;
    const destPill = document.getElementById('auraDestPill');
    const destLabel = document.getElementById('auraDestLabel');
    if (destLabel) {
      if (dest) {
        destLabel.textContent = dest;
        if (destPill) {
          destPill.style.color = '#a78bfa';
          destPill.style.borderColor = 'rgba(167, 139, 250, 0.3)';
          destPill.style.background = 'rgba(167, 139, 250, 0.08)';
        }
      } else {
        destLabel.textContent = 'No destination';
        if (destPill) {
          destPill.style.color = 'var(--text-secondary)';
          destPill.style.borderColor = 'rgba(255,255,255,0.06)';
          destPill.style.background = 'rgba(255,255,255,0.03)';
        }
      }
    }
  }

  /**
   * Display user message in chat
   */
  displayUserMessage(message) {
    const msgDiv = document.createElement('div');
    msgDiv.style.cssText = 'display:flex; gap:10px; justify-content: flex-end; animation: fadeIn 0.3s ease; margin-bottom: 8px; width: 100%;';
    msgDiv.innerHTML = `
      <div style="background:rgba(139,92,246,0.25); padding:10px 16px; border-radius:18px 18px 0 18px; color:var(--text-primary); border:1px solid rgba(139,92,246,0.4); line-height:1.5; font-size:0.92rem; max-width:80%; word-break: break-word;">
        ${this.escapeHtml(message)}
      </div>
      <div style="background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.15); border-radius:12px; padding:2px 8px; font-size:0.65rem; font-weight:700; color:#c4b5fd; text-transform:uppercase; align-self:center; flex-shrink:0; letter-spacing: 0.05em;">YOU</div>
    `;
    this.chatWindow.appendChild(msgDiv);
    this.scrollToBottom();
  }

  /**
   * Display Aura message in chat
   */
  displayAuraMessage(message) {
    if (!message) return;
    
    // Hide welcome screen if still present
    const welcome = document.getElementById('welcomeScreen');
    if (welcome) welcome.style.display = 'none';

    const msgDiv = document.createElement('div');
    msgDiv.style.cssText = 'display:flex; gap:10px; animation: fadeIn 0.3s ease; margin-bottom: 8px; width: 100%;';
    msgDiv.innerHTML = `
      <div style="background:linear-gradient(135deg, #8b5cf6, #3b82f6); border-radius:50%; width:32px; height:32px; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:0.9rem; color:white; box-shadow:0 0 10px rgba(139,92,246,0.4);">✦</div>
      <div style="background:rgba(255,255,255,0.05); padding:12px 16px; border-radius:18px; color:var(--text-primary); border:1px solid rgba(255,255,255,0.08); line-height:1.5; font-size:0.92rem; max-width:80%; word-break: break-word;">
        ${this.escapeHtml(message).replace(/\n/g, '<br>')}
      </div>
    `;
    this.chatWindow.appendChild(msgDiv);
    this.scrollToBottom();
  }

  /**
   * Display card (itinerary, budget, routes, etc.)
   */
  displayCard(card) {
    const cardDiv = document.createElement('div');
    cardDiv.style.cssText = `
      margin-top: 12px;
      padding: 16px;
      background: rgba(13,21,40,0.6);
      border: 1px solid var(--border);
      border-radius: 12px;
    `;

    switch (card.type) {
      case 'itinerary':
        cardDiv.innerHTML = this.formatItineraryCard(card.data);
        break;
      case 'budget':
        cardDiv.innerHTML = this.formatBudgetCard(card.data);
        break;
      case 'attractions':
        cardDiv.innerHTML = this.formatAttractionsCard(card.data);
        break;
      case 'hotels':
        cardDiv.innerHTML = this.formatHotelsCard(card.data);
        break;
      case 'food':
        cardDiv.innerHTML = this.formatFoodCard(card.data);
        break;
      case 'route-comparison':
        cardDiv.innerHTML = this.formatRouteComparisonCard(card.data);
        break;
      default:
        cardDiv.innerHTML = `<p>${JSON.stringify(card.data)}</p>`;
    }

    this.chatWindow.appendChild(cardDiv);
    this.scrollToBottom();
  }

  /**
   * Format itinerary card
   */
  formatItineraryCard(itinerary) {
    let html = '<h4 style="margin-bottom: 12px; color: #a78bfa;">Day-wise Itinerary</h4>';
    html += '<div style="display: flex; flex-direction: column; gap: 8px;">';

    itinerary.forEach(day => {
      html += `
        <div style="padding: 10px; background: rgba(255,255,255,0.03); border-radius: 8px;">
          <strong>${day.title}</strong>
          <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 4px;">
            ${day.activities.join(' → ')}
          </div>
        </div>
      `;
    });

    html += '</div>';
    return html;
  }

  /**
   * Format budget card
   */
  formatBudgetCard(budget) {
    if (!budget) return '';
    let html = `<h4 style="margin-bottom: 12px; color: #a78bfa;">Budget Breakdown</h4>`;
    html += `<div class="responsive-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">`;

    Object.entries(budget.distribution || {}).forEach(([key, value]) => {
      const label = key.replace(/_/g, ' ').charAt(0).toUpperCase() + key.slice(1);
      html += `
        <div style="padding: 10px; background: rgba(255,255,255,0.03); border-radius: 8px;">
          <div style="font-size: 0.8rem; color: var(--text-muted);">${label}</div>
          <div style="font-weight: bold; color: #a78bfa;">₹${value}</div>
        </div>
      `;
    });

    html += '</div>';
    return html;
  }

  /**
   * Format attractions card
   */
  formatAttractionsCard(attractions) {
    let html = '<h4 style="margin-bottom: 12px; color: #a78bfa;">Top Attractions</h4>';
    html += '<div style="display: flex; flex-direction: column; gap: 6px;">';

    attractions.forEach(attr => {
      html += `
        <div style="display: flex; gap: 8px; padding: 8px; background: rgba(255,255,255,0.02); border-radius: 6px;">
          <span style="color: var(--text-secondary);">📍</span>
          <div>
            <div style="font-weight: 600;">${attr.name}</div>
            <div style="font-size: 0.8rem; color: var(--text-muted);">${attr.description}</div>
          </div>
        </div>
      `;
    });

    html += '</div>';
    return html;
  }

  /**
   * Format hotels card
   */
  formatHotelsCard(hotels) {
    let html = '<h4 style="margin-bottom: 12px; color: #a78bfa;">Hotel Suggestions</h4>';
    html += '<div style="display: flex; flex-direction: column; gap: 10px;">';

    hotels.forEach(hotel => {
      html += `
        <div style="padding: 12px; background: rgba(139,92,246,0.08); border: 1px solid rgba(139,92,246,0.2); border-radius: 8px;">
          <div style="font-weight: 600;">${hotel.name}</div>
          <div style="font-size: 0.85rem; color: var(--text-secondary);">
            ${hotel.price} • ⭐ ${hotel.rating}
          </div>
          ${hotel.amenities ? `<div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">${hotel.amenities.join(', ')}</div>` : ''}
        </div>
      `;
    });

    html += '</div>';
    return html;
  }

  /**
   * Format food card
   */
  formatFoodCard(foods) {
    let html = '<h4 style="margin-bottom: 12px; color: #a78bfa;">Local Delicacies</h4>';
    html += '<div style="display: flex; flex-wrap: wrap; gap: 8px;">';

    foods.forEach(food => {
      html += `
        <div style="padding: 8px 12px; background: rgba(255,255,255,0.05); border-radius: 6px; font-size: 0.9rem;">
          🍽️ ${food}
        </div>
      `;
    });

    html += '</div>';
    return html;
  }

  /**
   * Format route comparison card
   */
  formatRouteComparisonCard(comparison) {
    let html = `<h4 style="margin-bottom: 12px; color: #a78bfa;">Route Options</h4>`;
    html += '<div style="display: flex; flex-direction: column; gap: 10px;">';

    comparison.routes.forEach((route, idx) => {
      const icon = route.type === 'road' ? '🚗' : route.type === 'train' ? '🚂' : '✈️';
      html += `
        <div style="padding: 12px; background: ${route.recommended ? 'rgba(139,92,246,0.12)' : 'rgba(255,255,255,0.02)'}; border: 1px solid ${route.recommended ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.1)'}; border-radius: 8px;">
          <div style="display: flex; justify-content: space-between; font-weight: 600; margin-bottom: 6px;">
            <span>${icon} ${route.type.toUpperCase()}</span>
            ${route.recommended ? '<span style="color: #22c55e;">✓ Recommended</span>' : ''}
          </div>
          <div class="responsive-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 0.85rem;">
            <div>Duration: <strong>${route.duration}</strong></div>
            <div>Cost: <strong>${route.estimatedCost}</strong></div>
            <div>Distance: <strong>${route.distance} km</strong></div>
            <div>Comfort: <strong>${route.comfort || 'N/A'}/5</strong></div>
          </div>
        </div>
      `;
    });

    html += '</div>';
    return html;
  }

  /**
   * Display suggested actions
   */
  displaySuggestedActions(actions) {
    const actionsDiv = document.createElement('div');
    actionsDiv.style.cssText = `
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 12px;
    `;

    actions.forEach(action => {
      const btn = document.createElement('button');
      btn.textContent = action.label;
      btn.style.cssText = `
        padding: 8px 14px;
        border-radius: 6px;
        border: 1px solid rgba(139,92,246,0.3);
        background: rgba(139,92,246,0.1);
        color: #c4b5fd;
        font-size: 0.82rem;
        cursor: pointer;
        transition: all 0.2s;
      `;
      btn.onmouseover = () => {
        btn.style.background = 'rgba(139,92,246,0.2)';
      };
      btn.onmouseout = () => {
        btn.style.background = 'rgba(139,92,246,0.1)';
      };
      btn.onclick = () => {
        this.handleActionClick(action.action);
      };
      actionsDiv.appendChild(btn);
    });

    this.chatWindow.appendChild(actionsDiv);
    this.scrollToBottom();
  }

  /**
   * Handle action button clicks
   */
  handleActionClick(action) {
    console.log('Action clicked:', action);
    // Implement specific actions based on type
  }

  /**
   * Handle map action
   */
  handleMapAction(action) {
    // This would integrate with Explorer map
    console.log('Map action:', action);
    // Emit event for Explorer to handle
    if (window.parent && window.parent.postMessage) {
      window.parent.postMessage({
        type: 'aura-map-action',
        data: action
      }, '*');
    }
  }

  /**
   * Toggle voice input
   */
  toggleVoiceInput() {
    if (!window.AuraV2.voiceRecognition) {
      alert('Voice input not supported in your browser');
      return;
    }

    if (this.isListening) {
      window.AuraV2.voiceRecognition.stop();
      this.isListening = false;
      return;
    }

    this.isListening = true;
    window.AuraV2.voiceRecognition.onresult = (event) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      const userInput = document.getElementById('integratedAuraInput') || document.getElementById('auraUserInput');
      if (userInput) {
        userInput.value = transcript;
        this.handleSendMessage();
      }
      this.isListening = false;
    };

    window.AuraV2.voiceRecognition.start();
  }

  /**
   * Scroll chat to bottom
   */
  scrollToBottom() {
    if (this.chatWindow) {
      this.chatWindow.scrollTop = this.chatWindow.scrollHeight;
    }
  }

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize UI when document is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.AuraV2UI = new AuraV2UI();
  });
} else {
  window.AuraV2UI = new AuraV2UI();
}
