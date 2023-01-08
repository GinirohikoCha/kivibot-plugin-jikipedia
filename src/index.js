const { KiviPlugin } = require('@kivibot/core')
const axios = require('axios')

const { version } = require('../package.json')
const plugin = new KiviPlugin('Jikipedia', version)

const config = {
  // 触发小鸡词典前缀
  cmdPrefix: '#'
}

const msgs = {
  unknownPhrase: '词典未收录',
  nullPhrase: '未查询到释义'
}

const cmds = [
  '/jikipedia prefix [触发前缀]'
]

plugin.onMounted(async bot => {
  plugin.saveConfig(Object.assign(config, plugin.loadConfig()))

  plugin.onAdminCmd('/jikipedia', (e, params) => {
    const [cmd, value] = params

    if (cmd === 'prefix' && value) {
      config.cmdPrefix = value
      plugin.saveConfig(config)

      return e.reply('成功修改词典查询触发前缀', true)
    }

    return e.reply(cmds.join('\n'), true)
  })

  plugin.onMessage(async event => {
    const { message, raw_message } = event

    // 消息符合触发条件
    const isHit = raw_message.trim().startsWith(config.cmdPrefix)

    // 过滤不触发的消息
    if (!isHit) {
      return
    }

    const phrase = raw_message
      .replace(new RegExp(`^\\s*${config.cmdPrefix}`), '')
      .trim()

    plugin.debug(phrase)

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

    const response = await request.post('/go/auto_complete', { phrase })

    const { data } = response.data
    plugin.debug(JSON.stringify(data))
    // 无梗
    if (data.length === 0) {
      await event.reply(msgs.unknownPhrase, true)
      return
    }
    // process
    if (data.length >= 1) {
      let mainContent = data[0].entities?.[0]?.content
      // 无释义
      if (!mainContent) {
        mainContent = msgs.nullPhrase
        if (data.length > 1) {
          mainContent += '\n\n猜你想问：'
          mainContent = addRelatedContent(data, mainContent)
        }
        await event.reply(mainContent, true)
        return
      }

      if (data.length > 1) {
        mainContent += '\n\n相关内容：'
        mainContent = addRelatedContent(data, mainContent)
      }

      await event.reply(mainContent, true)
    }
  })
})

/**
 * 添加相关词
 * @param data
 * @param mainContent
 * @return {*}
 */
function addRelatedContent(data, mainContent) {
  mainContent += '\n\n相关内容：'
  for (let i = 1; i < data.length; i++) {
    mainContent += data[i].word + (i === data.length - 1 ? '' : '、')
  }
  return mainContent
}

module.exports = { plugin }
