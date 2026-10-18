/* ==========================================================================
   MODULE: CORE - UTILIDADES GLOBALES (PORTAPAPELES, TOASTS, ESCAPE HTML)
   ========================================================================== */
window.BO_MODULES = window.BO_MODULES || {};

(function() {
    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function fallbackCopy(text, successMsg) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.left = '-999999px';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            showToast(successMsg);
        } catch (err) {
            alert('No se pudo copiar automáticamente: ' + err);
        }
        document.body.removeChild(textarea);
    }

    function copyToClipboard(text, successMsg) {
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text).then(() => showToast(successMsg)).catch(() => fallbackCopy(text, successMsg));
        } else {
            fallbackCopy(text, successMsg);
        }
    }

    function showToast(message, type = 'success', action = null) {
        const toastContainer = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type === 'warning' ? 'toast-warning' : (type === 'danger' ? 'toast-danger' : (type === 'info' ? 'toast-info' : ''))}`;
        const icon = type === 'warning' ? '⚠️' : (type === 'danger' ? '❌' : (type === 'info' ? 'ℹ️' : '✅'));

        toast.style.display = 'flex';
        toast.style.alignItems = 'center';
        toast.style.justifyContent = 'space-between';
        toast.style.gap = '0.75rem';

        const contentSpan = document.createElement('div');
        contentSpan.style.display = 'flex';
        contentSpan.style.alignItems = 'center';
        contentSpan.style.gap = '0.4rem';
        contentSpan.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
        toast.appendChild(contentSpan);

        if (action && action.text && action.callback) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.textContent = action.text;
            btn.style.cssText = 'background: rgba(255,255,255,0.22); border: 1px solid rgba(255,255,255,0.35); color: #ffffff; border-radius: 5px; padding: 3px 8px; font-size: 0.75rem; font-weight: 700; cursor: pointer; transition: all 0.2s; white-space: nowrap;';
            btn.onmouseover = () => { btn.style.background = 'rgba(255,255,255,0.38)'; btn.style.transform = 'scale(1.03)'; };
            btn.onmouseout = () => { btn.style.background = 'rgba(255,255,255,0.22)'; btn.style.transform = 'scale(1)'; };
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                action.callback();
                toast.remove();
            });
            toast.appendChild(btn);
        }

        if (toastContainer) {
            toastContainer.appendChild(toast);
            const duration = action ? 6000 : 2500;
            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transform = 'translateY(10px)';
                toast.style.transition = 'all 0.3s ease';
                setTimeout(() => toast.remove(), 300);
            }, duration);
        }
    }

    // Exponer al ámbito global
    window.escapeHtml = escapeHtml;
    window.copyToClipboard = copyToClipboard;
    window.fallbackCopy = fallbackCopy;
    window.showToast = showToast;
})();
