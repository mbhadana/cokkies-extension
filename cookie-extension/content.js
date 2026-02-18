(function () {
    // Cookie Bubble: Content script running.

    function init() {
        if (document.getElementById('cookie-bubble-host')) return;

        // 1. Create Host
        const host = document.createElement('div');
        host.id = 'cookie-bubble-host';
        host.style.position = 'fixed';
        host.style.top = '0';
        host.style.left = '0';
        host.style.width = '0';
        host.style.height = '0';
        host.style.zIndex = '2147483647';
        document.body.appendChild(host);

        // 2. Shadow DOM
        const shadow = host.attachShadow({ mode: 'open' });

        // 3. Apple Style CSS - Glass Single Line + Hover Drawer
        const style = document.createElement('style');
        style.textContent = `
            :host {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            }
            #container {
                position: fixed;
                top: 70px;
                right: 20px;
                width: auto;
                min-width: 0;
                /* Glass Effect */
                background: rgba(30, 30, 30, 0.45); 
                backdrop-filter: saturate(180%) blur(25px);
                -webkit-backdrop-filter: saturate(180%) blur(25px);
                
                /* PILL SHAPE DEFAULT */
                border-radius: 38px;
                
                border: 0.5px solid rgba(255, 255, 255, 0.25);
                box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
                color: white;
                padding: 6px 10px;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 0;
                
                /* Bouncy Transition */
                transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                
                cursor: default;
                z-index: 99999;
                user-select: none;
                overflow: hidden;
            }
           
            /* Expand on Hover */
            #container:hover {
                background: rgba(40, 40, 40, 0.75);
                border-color: rgba(255, 255, 255, 0.4);
                box-shadow: 0 12px 32px rgba(0, 0, 0, 0.35);
                
                /* MORPH TO RECTANGLE */
                border-radius: 16px; 
                
                padding-bottom: 6px; /* Room for bottom drawer */
                cursor: grab;
                transform: scale(1.02); /* Slight grow */
            }
            #container:active {
                cursor: grabbing;
                transform: scale(0.98);
            }
            
            /* Main Row */
            .main-row {
                display: flex;
                align-items: center;
                gap: 9px;
                height: 24px;
                width: 100%; /* Ensure full width */
                justify-content: center;
            }

            .site-icon {
                width: 18px;
                height: 18px;
                border-radius: 6px;
                object-fit: contain;
                display: block;
            }
            
            .count-text {
                font-size: 12px;
                font-weight: 600;
                color: #fff;
                font-feature-settings: "tnum";
                line-height: 1;
                min-width: 15px;
                text-align: center;
            }

            .separator {
                width: 1px;
                height: 12px;
                background: rgba(255,255,255,0.25);
                margin: 0 4px;
            }

            .trash-btn {
                background: none;
                border: none;
                padding: 0;
                cursor: pointer;
                color: rgba(255,255,255,0.6);
                transition: color 0.2s;
                display: flex;
                align-items: center;
                justify-content: center;
                width: 18px;
                height: 18px;
                border-radius: 50%;
            }
            .trash-btn:hover {
                color: #ff453a;
                background: rgba(255, 255, 255, 0.1);
            }
            .trash-btn svg {
                width: 11px;
                height: 11px;
                fill: currentColor;
            }

            /* Total Drawer - Hidden by default */
            .total-drawer {
                height: 0;
                opacity: 0;
                overflow: hidden;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 8px;
                color: rgba(255,255,255,0.7);
                width: 100%;
                margin-top: 0;
            }
            
            /* When container is hovered, expand the drawer */
            #container:hover .total-drawer {
                height: 18px;
                opacity: 1;
                margin-top: 3px;
                border-top: 1px solid rgba(255,255,255,0.15);
            }
        `;
        shadow.appendChild(style);

        // 4. HTML Structure
        const container = document.createElement('div');
        container.id = 'container';
        container.innerHTML = `
            <div class="main-row">
                <img id="siteIcon" class="site-icon" src="" alt="">
                <span class="count-text" id="currentSiteCount">--</span>
                
                <div class="separator"></div>
                
                <button id="clearBtn" class="trash-btn" title="Delete Cookies">
                    <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                </button>
            </div>
            
            <div class="total-drawer">
                Total Cookies:&nbsp;<span id="totalCount" style="color:#fff; font-weight:600;">--</span>
            </div>
        `;
        shadow.appendChild(container);

        // 5. Drag Logic w/ Constraints
        let isDragging = false;
        let startX, startY;
        let initialX, initialY;
        let xOffset = 0, yOffset = 0;

        container.addEventListener("mousedown", dragStart);
        document.addEventListener("mouseup", dragEnd);
        document.addEventListener("mousemove", drag);

        function dragStart(e) {
            if (e.target.closest('#clearBtn')) return;
            initialX = e.clientX - xOffset;
            initialY = e.clientY - yOffset;
            startX = e.clientX;
            startY = e.clientY;

            if (e.target.closest('#container')) {
                isDragging = true;
            }
        }

        function dragEnd(e) {
            isDragging = false;
        }

        function drag(e) {
            if (isDragging) {
                e.preventDefault();
                let newX = e.clientX - initialX;
                let newY = e.clientY - initialY;

                const rect = container.getBoundingClientRect();
                const width = rect.width;
                const height = rect.height;
                const winW = window.innerWidth;
                const winH = window.innerHeight;

                newY = Math.max(-70, Math.min(newY, winH - height - 70));
                // Constrain X (starts at right:20)
                const startAbsX = winW - 20 - width;
                newX = Math.max(-startAbsX, Math.min(newX, 20));

                xOffset = newX;
                yOffset = newY;
                setTranslate(newX, newY, container);
            }
        }

        function setTranslate(xPos, yPos, el) {
            el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
        }

        // 6. Data & Auto-Refresh
        function updateStats() {
            try {
                chrome.runtime.sendMessage({ action: "getCookies" }, (response) => {
                    if (chrome.runtime.lastError || !response || !response.cookies) return;

                    const cookies = response.cookies;
                    const totalCount = cookies.length;
                    const currentHostname = window.location.hostname;

                    const currentSiteCookies = cookies.filter(c => {
                        const cDomain = c.domain.startsWith('.') ? c.domain.substring(1) : c.domain;
                        const cleanHost = currentHostname.replace(/^www\./, '');
                        const cleanDomain = cDomain.replace(/^\./, '');
                        return cleanHost.endsWith(cleanDomain) || cleanDomain.endsWith(cleanHost);
                    });

                    // Favicon
                    const iconUrl = `https://icons.duckduckgo.com/ip3/${currentHostname}.ico`;
                    const iconImg = shadow.getElementById('siteIcon');
                    if (iconImg.src !== iconUrl) iconImg.src = iconUrl;

                    shadow.getElementById('currentSiteCount').innerText = currentSiteCookies.length;
                    shadow.getElementById('totalCount').innerText = totalCount;
                });
            } catch (err) { clearInterval(refreshInterval); }
        }

        // Button Logic
        const btn = shadow.getElementById('clearBtn');
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const currentHostname = window.location.hostname;
            if (confirm(`Delete cookies for ${currentHostname}?`)) {
                chrome.runtime.sendMessage({
                    action: "deleteDomainCookies",
                    domain: currentHostname
                }, (response) => { updateStats(); });
            }
        });

        updateStats();
        const refreshInterval = setInterval(updateStats, 1000);
    }

    if (document.body) init();
    else window.addEventListener('load', init);

})();
