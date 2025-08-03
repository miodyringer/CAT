let config = null

/**
 * Loads the API configuration from the server or returns the cached config.
 *
 * @returns {Promise<Object>} The configuration object containing API URLs.
 * @throws {Error} If the configuration cannot be loaded.
 */
export async function getConfig () {
  if (config) {
    return config
  }
  try {
    const response = await fetch('/config')
    if (!response.ok) throw new Error('Config-Request failed')
    config = await response.json()
    return config
  } catch (error) {
    console.error("Couldn't load API-configuration", error)
  }
}

/**
 * Sends an HTTP request to the backend API with the given path, method, and data.
 *
 * @param {string} path - The API endpoint path (e.g., '/lobby/list').
 * @param {string} [method='GET'] - The HTTP method to use (GET, POST, etc.).
 * @param {Object|null} [data=null] - The request body data to send (for POST/PUT requests).
 * @returns {Promise<Object>} The parsed JSON response from the server.
 * @throws {Error} If the response is not ok or the server returns an error.
 */
export default async function sendRequest (path, method = 'GET', data = null) {
  const { apiBaseUrl } = await getConfig()
  const cleanBaseUrl = apiBaseUrl.endsWith('/') ? apiBaseUrl.slice(0, -1) : apiBaseUrl
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  const url = `${cleanBaseUrl}${cleanPath}`
  console.log(`Send Request to: ${url}`)

  const options = {
    method,
    headers: {}
  }

  if (data) {
    options.headers['Content-Type'] = 'application/json'
    options.body = JSON.stringify(data)
  }

  const response = await fetch(url, options)

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: `HTTP error! status: ${response.status}` }))
    throw new Error(errorData.detail || `HTTP error! status: ${response.status}`)
  }

  return response.json().catch(() => null)
}
