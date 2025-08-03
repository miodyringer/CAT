/**
 * Retrieves the value of a cookie by its name.
 *
 * @param {string} cname - The name of the cookie to retrieve.
 * @returns {string} The value of the cookie, or an empty string if not found.
 */
export default function getCookie (cname) {
  const name = cname + '='
  const decodedCookie = decodeURIComponent(document.cookie)
  const ca = decodedCookie.split(';')
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i]
    while (c.charAt(0) === ' ') {
      c = c.substring(1)
    }
    if (c.indexOf(name) === 0) {
      return c.substring(name.length, c.length)
    }
  }
  return ''
}
