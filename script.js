document.addEventListener('DOMContentLoaded', () => {
    const cookieTableBody = document.querySelector('#cookieTable tbody');
    const emptyState = document.getElementById('emptyState');
    const refreshBtn = document.getElementById('refreshBtn');
    const addDemoCookieBtn = document.getElementById('addDemoCookieBtn');
    const clearAllBtn = document.getElementById('clearAllBtn');
    const cookieCountSpan = document.getElementById('cookieCount');

    // Function to parse cookies
    function getCookies() {
        const cookieString = document.cookie;
        if (!cookieString) return [];

        return cookieString.split(';').filter(c => c.trim()).map(cookie => {
            const [name, ...valueParts] = cookie.trim().split('=');
            return {
                name: name,
                value: valueParts.join('=')
            };
        });
    }

    // Function to render the table
    function renderCookies() {
        const cookies = getCookies();
        cookieTableBody.innerHTML = '';
        cookieCountSpan.textContent = cookies.length;

        if (cookies.length === 0) {
            emptyState.classList.remove('hidden');
        } else {
            emptyState.classList.add('hidden');
            cookies.forEach(cookie => {
                const row = document.createElement('tr');

                // Simulate/Infer categorization (Real categorization not possible with document.cookie)
                // For demo purposes, we'll label short names as "Session-like" and long values as "Persistent-like"
                // or just leave it generic since we can't truly know without HttpOnly/Expires.
                let type = "Standard";
                if (cookie.name.includes('sess')) type = "Session (Inferred)";

                row.innerHTML = `
                    <td><strong>${cookie.name}</strong></td>
                    <td><div class="cookie-value" title="${cookie.value}">${cookie.value}</div></td>
                    <td><span style="background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px; font-size: 0.8rem;">${type}</span></td>
                    <td>
                        <button class="action-btn" onclick="deleteCookie('${cookie.name}')" title="Delete">×</button>
                    </td>
                `;
                cookieTableBody.appendChild(row);
            });
        }
    }

    // Function to set a cookie
    function setCookie(name, value, days) {
        let expires = "";
        if (days) {
            const date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = "; expires=" + date.toUTCString();
        }
        document.cookie = name + "=" + (value || "") + expires + "; path=/";
        renderCookies();
    }

    // Function to delete a cookie
    window.deleteCookie = function (name) {
        document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        renderCookies();
    }

    // Event Listeners
    refreshBtn.addEventListener('click', renderCookies);

    addDemoCookieBtn.addEventListener('click', () => {
        const randomId = Math.random().toString(36).substring(7);
        setCookie(`demo_cookie_${randomId}`, `value_${Date.now()}`, 1);
        setCookie(`session_test_${randomId}`, `temp_data`, 0); // Session cookie (no expiry)
    });

    clearAllBtn.addEventListener('click', () => {
        const cookies = getCookies();
        cookies.forEach(c => window.deleteCookie(c.name));
    });

    // Initial render
    renderCookies();
});
