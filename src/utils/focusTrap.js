export function trapFocus(container, restoreTo) {
    if (!container) return () => { }
    const focusable = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    const first = container.querySelectorAll(focusable)[0]
    const nodes = container.querySelectorAll(focusable)
    const last = nodes[nodes.length - 1]
    function onKey(e) {
        if (e.key === 'Tab') {
            if (nodes.length === 0) { e.preventDefault(); return }
            if (e.shiftKey) {
                if (document.activeElement === first) { e.preventDefault(); last.focus() }
            } else {
                if (document.activeElement === last) { e.preventDefault(); first.focus() }
            }
        } else if (e.key === 'Escape') {
        }
    }
    window.addEventListener('keydown', onKey)
    return () => {
        window.removeEventListener('keydown', onKey)
        try { restoreTo && restoreTo.focus() } catch (e) { }
    }
}
