let config = null;

export async function getConfig() {
    if (config) {
        return config;
    }
    try {
        const response = await fetch('/config');
        if (!response.ok) throw new Error('Config-Request failed');
        config = await response.json();
        return config;
    } catch (error) {
        console.error("Couldn't load API-configuration", error);
        // Fallback
        return {
            apiBaseUrl: 'http://127.0.0.1:7777',
            webSocketUrl: 'ws://127.0.0.1:7777'
        };
    }
}

export default async function sendRequest(path, method = "GET", data = null) {
    const { apiBaseUrl } = await getConfig();
    const cleanBaseUrl = apiBaseUrl.endsWith('/') ? apiBaseUrl.slice(0, -1) : apiBaseUrl;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const url = `${cleanBaseUrl}${cleanPath}`;
    console.log(`Send Request to: ${url}`);

    const options = {
        method: method,
        headers: {}
    };

    if (data) {
        options.headers["Content-Type"] = "application/json";
        options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: `HTTP error! status: ${response.status}` }));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return response.json().catch(() => null);
}