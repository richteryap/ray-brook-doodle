const TARGET_CLASS = '.linetitle3'; 

const SUPABASE_URL = 'https://jokibcrltlzxhqireiiu.supabase.co/rest/v1/rpc/log_media_stream';
const ANON_KEY = 'sb_publishable_ZLflwJPzbGJrv_XqE24JhQ_2iYB09mh';

console.log("LogStream Serverless Ext. loaded! Waiting for manual trigger.");

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "log_episode") {
        
        (async () => {
            const storageData = await chrome.storage.local.get(['userApiKey']);
            const API_KEY = storageData.userApiKey;

            if (!API_KEY) {
                console.error("API Key not found in storage.");
                sendResponse({ status: "error", message: "Please set your API Key in the extension popup." });
                return;
            }

            let htmlElement = document.querySelector(TARGET_CLASS);
            
            if (!htmlElement) {
                console.log("Target class not found on this page.");
                sendResponse({ status: "error", message: "Could not find anime title on this page." });
                return;
            }

            let rawTitle = htmlElement.innerText
                .replace(/"/g, '')
                .replace(/[\u2018\u2019`´']/g, "'")
                .replace(/\n/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
            let showName = rawTitle;
            let episode = 0;

            let match = rawTitle.match(/(.*)\s+Episode\s+(\d+)/i);
            if(match) {
                showName = match[1].trim();
                episode = parseInt(match[2], 10);
            }

            console.log("Title found:", showName, "| Ep:", episode);

            let totalEpisodes = null;
            try {
                const fetchAniListEpisodes = async (q) => {
                    let aniResponse = await fetch('https://graphql.anilist.co', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                        body: JSON.stringify({
                            query: 'query($search: String){ Page(page: 1, perPage: 6){ media(search: $search, type: ANIME, sort: SEARCH_MATCH){ episodes } } }',
                            variables: { search: q }
                        })
                    });
                    let aniData = await aniResponse.json();
                    return aniData?.data?.Page?.media?.[0]?.episodes || null;
                };

                totalEpisodes = await fetchAniListEpisodes(showName);
                if (!totalEpisodes && /['\u2018\u2019`´]/.test(showName)) {
                    totalEpisodes = await fetchAniListEpisodes(showName.replace(/'/g, '’'));
                }

                if(totalEpisodes) {
                    console.log("AniList found total episodes:", totalEpisodes);
                }
            } catch(e) {
                console.log("AniList API failed, proceeding without total episodes.");
            }

            try {
                let supabaseResponse = await fetch(SUPABASE_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': ANON_KEY,
                        'Authorization': `Bearer ${ANON_KEY}`
                    },
                    body: JSON.stringify({
                        p_api_key: API_KEY,
                        p_raw_title: rawTitle,
                        p_show_name: showName,
                        p_episode: episode,
                        p_total_episodes: totalEpisodes
                    })
                });

                if (supabaseResponse.ok) {
                    console.log("Successfully beamed to Supabase!");
                    sendResponse({ status: "success", title: showName });
                } else {
                    let err = await supabaseResponse.text();
                    console.error("Supabase Error:", err);
                    sendResponse({ status: "error", message: "Database rejected the request." });
                }
            } catch (error) {
                console.error("Network Error:", error);
                sendResponse({ status: "error", message: "Network Error. Check Supabase connection." });
            }
        })();

        return true; 
    }
});