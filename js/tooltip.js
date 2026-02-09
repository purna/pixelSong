// js/tooltip.js
class Tooltip {
    constructor() {
        this.tooltip = null;
        this.currentTarget = null;
        this.hideTimer = null;
        this.enabled = true;
        this.createTooltip();
    }

    createTooltip() {
        this.tooltip = document.createElement('div');
        this.tooltip.className = 'custom-tooltip';
        this.updateStyles();
        document.body.appendChild(this.tooltip);

        this.tooltip.addEventListener('mouseenter', () => {
            clearTimeout(this.hideTimer);
            this.tooltip.style.pointerEvents = 'auto';
        });
        this.tooltip.addEventListener('mouseleave', () => {
            this.hide();
        });
    }

    updateStyles() {
        const isDark = document.body.getAttribute('data-theme') === 'dark';
        
        Object.assign(this.tooltip.style, {
            position: 'absolute',
            background: isDark ? 'rgba(30, 30, 50, 0.98)' : 'rgba(255, 255, 255, 0.98)',
            color: isDark ? '#e0e7ff' : '#1e293b',
            padding: '12px 16px',
            borderRadius: '10px',
            fontSize: '13.5px',
            fontFamily: "'Inter', sans-serif",
            lineHeight: '1.6',
            pointerEvents: 'none',
            zIndex: '99999',
            opacity: '0',
            transition: 'opacity 0.22s ease, transform 0.22s ease',
            transform: 'translateY(8px)',
            maxWidth: '320px',
            boxShadow: isDark 
                ? '0 10px 40px rgba(0, 0, 0, 0.5)' 
                : '0 10px 40px rgba(0, 0, 0, 0.15)',
            border: isDark 
                ? '1px solid rgba(244, 114, 182, 0.5)' 
                : '1px solid rgba(244, 114, 182, 0.3)',
            backdropFilter: 'blur(12px)',
            whiteSpace: 'pre-line',
            wordWrap: 'break-word'
        });
    }

    show(text, element) {
        if (!this.enabled) return;
        
        clearTimeout(this.hideTimer);
        this.currentTarget = element;
        this.updateStyles();
        
        this.tooltip.innerHTML = text
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, `<strong style="color:${this.getAccentColor()}">$1</strong>`)
            .replace(/--(.*?)--/g, `<em style="color:${this.getSecondaryColor()}">$1</em>`);

        this.tooltip.style.opacity = '1';
        this.tooltip.style.transform = 'translateY(0)';
        this.tooltip.style.pointerEvents = 'auto';
        this.positionTooltip(element);
    }

    getAccentColor() {
        return getComputedStyle(document.body).getPropertyValue('--accent-color').trim() || '#f472b6';
    }

    getSecondaryColor() {
        const isDark = document.body.getAttribute('data-theme') === 'dark';
        return isDark ? '#a78bfa' : '#7c3aed';
    }

    positionTooltip(element) {
        const rect = element.getBoundingClientRect();
        const tooltipRect = this.tooltip.getBoundingClientRect();
        let top = rect.bottom + 10 + window.scrollY;
        let left = rect.left + rect.width / 2 + window.scrollX - tooltipRect.width / 2;
        
        if (top + tooltipRect.height > window.innerHeight + window.scrollY - 10) {
            top = rect.top + window.scrollY - tooltipRect.height - 10;
        }
        if (left < 10) left = 10;
        if (left + tooltipRect.width > window.innerWidth - 10) {
            left = window.innerWidth - tooltipRect.width - 10;
        }
        
        this.tooltip.style.top = top + 'px';
        this.tooltip.style.left = left + 'px';
    }

    hide() {
        this.hideTimer = setTimeout(() => {
            this.tooltip.style.opacity = '0';
            this.tooltip.style.transform = 'translateY(8px)';
            this.tooltip.style.pointerEvents = 'none';
            this.currentTarget = null;
        }, 100);
    }

    toggle(enabled) {
        this.enabled = enabled;
        if (!enabled) {
            this.hide();
        }
    }
}

const tooltip = new Tooltip();

document.addEventListener('DOMContentLoaded', () => {
    // Listen for theme changes to update tooltip styles
    const observer = new MutationObserver(() => {
        tooltip.updateStyles();
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['data-theme'] });
    
    document.querySelectorAll('[data-tooltip]').forEach(el => {
        el.style.cursor = 'help';
        el.addEventListener('mouseenter', () => {
            const text = el.getAttribute('data-tooltip');
            if (text) tooltip.show(text, el);
        });
        el.addEventListener('mouseleave', () => {
            if (!tooltip.tooltip.matches(':hover')) {
                tooltip.hide();
            }
        });
    });
});
