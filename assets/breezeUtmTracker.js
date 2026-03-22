function extractQueryParamFromPageURL() {
    const params = {};
    try {
        const queryString = window.location.search.substring(1);
        if (queryString === '') {
            return params;
        }
        const pairs = queryString.split('&');
        pairs.forEach(pair => {
            const [key, value] = pair.split('=');
            if (typeof key !== 'undefined' && typeof value !== 'undefined') {
                params[decodeURIComponent(key)] = decodeURIComponent(value);
            }
        });
    } catch (e) {
    }
    return params;
}

function setUTMParameters() {
    try {
        const queryParams = extractQueryParamFromPageURL();
        const utmKeys = ["utm_source", "utm_medium", "utm_campaign", "fbclid", "utm_content", "utm_term", "ref", "gclid", "shpxid"];
        let newData = {};

        Object.keys(queryParams).forEach(key => {
            if (utmKeys.includes(key)) {
                newData[key] = queryParams[key];
            }
        });

        if (Object.keys(newData).length > 0) {
            localStorage.setItem("utmTracker", JSON.stringify(newData));
        }
    } catch (e) {
    }
}

setUTMParameters();