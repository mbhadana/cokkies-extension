chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // 1. Get All Cookies
    if (request.action === "getCookies") {
        chrome.cookies.getAll({}, (cookies) => {
            sendResponse({ cookies: cookies });
        });
        return true;
    }

    // 2. Delete Domain Cookies
    if (request.action === "deleteDomainCookies") {
        const domain = request.domain;
        if (!domain) {
            sendResponse({ success: false });
            return;
        }

        chrome.cookies.getAll({}, (cookies) => {
            // Filter cookies that belong to this domain (or subdomains)
            const cookiesToDelete = cookies.filter(c => {
                const cDomain = c.domain.startsWith('.') ? c.domain.substring(1) : c.domain;
                return domain.includes(cDomain) || cDomain.includes(domain);
            });

            // Delete them one by one
            let deletedCount = 0;
            cookiesToDelete.forEach(c => {
                const protocol = c.secure ? "https:" : "http:";
                const url = `${protocol}//${c.domain}${c.path}`;
                chrome.cookies.remove({
                    url: url,
                    name: c.name
                });
                deletedCount++;
            });

            console.log(`Deleted ${deletedCount} cookies for ${domain}`);
            sendResponse({ success: true, count: deletedCount });
        });
        return true;
    }
});
