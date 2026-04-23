// Modal Dialog Component

class Modal {
  constructor(title, content) {
    this.title = title;
    this.content = content;
  }
  
  show() {
    const html = `
      <div class="modal-overlay" id="modal-overlay">
        <div class="modal">
          <div class="modal-header">
            <h3>${this.title}</h3>
            <button class="modal-close" onclick="closeModal()">&times;</button>
          </div>
          <div class="modal-body">
            ${this.content}
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', html);
  }
  
  close() {
    const overlay = document.getElementById('modal-overlay');
    if (overlay) {
      overlay.remove();
    }
  }
}

// Global function to close modal
function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  if (overlay) {
    overlay.remove();
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Modal;
}
