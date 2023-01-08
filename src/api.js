const axios = require('axios')

const request = axios.create({
  baseURL: 'https://api.jikipedia.com/',
  timeout: 5000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36 Edg/108.0.1462.54',
    'Origin': 'https://jikipedia.com',
    'Client': 'web',
    'Host': 'api.jikipedia.com'
  }
})

function autoComplete(phrase) {
  return request.post('/go/auto_complete', { phrase })
}

function translatePlaintext(content) {
  return request.post('/go/translate_plaintext', { content })
}

module.exports = { autoComplete, translatePlaintext }
