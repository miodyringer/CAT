class ServerService {

    static async sendRequest(url, method = "GET", data) {
        const response = await fetch(url, {
            method: method,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });
        if(!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    }

}

ServerService.sendRequest("http://0.0.0.0:7777/", "GET").then(r => console.log(r));