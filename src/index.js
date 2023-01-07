const { KiviPlugin } = require('@kivibot/core')
const axios = require('axios');

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

    try {
      const response = await axios.post(
          'https://api.jikipedia.com/go/auto_complete',
          {
            phrase
          }
      )

      const { data } = response
      // 无梗
      if (data.length === 0) {
        await event.reply(msgs.unknownPhrase, true)
        return
      }
      // process
      if (data.length >= 1) {
        let mainContent = data[0].entities?.[0].content
        // 无释义
        if (!mainContent) {
          await event.reply(msgs.nullPhrase, true)
          return
        }
        mainContent += '\n\n相关内容：'
        // 相关词
        for (let i = 1; i < data.length; i++) {
          mainContent += data[i].word + (i = data.length - 1 ? '' : '、')
        }
        await event.reply(mainContent, true)
      }
    } catch (err) {
      plugin.throwPluginError(err?.message ?? err)

      return event.reply(err, true)
    }
  })
})

module.exports = { plugin }
