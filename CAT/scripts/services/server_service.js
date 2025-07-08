export default async function sendRequest(url, method = "GET", data = null) {
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

    // Wir fangen einen Fehler ab, falls die Antwort kein gültiges JSON ist
    return response.json().catch(() => null);
}