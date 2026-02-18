document.addEventListener('DOMContentLoaded', () => {
    const totalCountElement = document.getElementById('totalCount');
    const domainListElement = document.getElementById('domainList');

    // Query all cookies
    chrome.cookies.getAll({}, (cookies) => {
        // 1. Update total count
        const totalCookies = cookies.length;
        totalCountElement.textContent = totalCookies;

        // 2. Aggregate by domain
        const domainMap = {};
        cookies.forEach(cookie => {
            // Clean domain (remove leading dot)
            let domain = cookie.domain.startsWith('.') ? cookie.domain.substring(1) : cookie.domain;
            if (!domainMap[domain]) {
                domainMap[domain] = 0;
            }
            domainMap[domain]++;
        });

        // 3. Sort by count (descending)
        const sortedDomains = Object.entries(domainMap)
            .sort(([, countA], [, countB]) => countB - countA)
            .slice(0, 10); // Top 10

        // 4. Render user list
        domainListElement.innerHTML = '';
        sortedDomains.forEach(([domain, count]) => {
            const li = document.createElement('li');
            li.className = 'domain-item';
            li.innerHTML = `
                <span class="domain-name" title="${domain}">${domain}</span>
                <span class="domain-count">${count}</span>
            `;
            domainListElement.appendChild(li);
        });
    });
});
