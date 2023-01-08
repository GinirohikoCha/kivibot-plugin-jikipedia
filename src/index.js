const { KiviPlugin } = require('@kivibot/core')
const { autoComplete, translatePlaintext } = require('./api')

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

    const isEmoji = raw_message.trim().startsWith(config.cmdPrefix + 'emoji')

    // TODO 响应失败处理
    if (isEmoji) {
      const content = raw_message
        .replace(new RegExp(`^\\s*${config.cmdPrefix + 'emoji'}`), '')
        .trim()

      await replyEmoji(event, content)
    } else {
      const phrase = raw_message
        .replace(new RegExp(`^\\s*${config.cmdPrefix}`), '')
        .trim()

      await replyAutoComplete(event, phrase)
    }
  })
})

async function replyAutoComplete(event, phrase) {
  plugin.debug(phrase)

  const response = await autoComplete(phrase)

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
}

async function replyEmoji(event, content) {
  plugin.debug(content)

  const response = await translatePlaintext(content)

  const { translation } = response.data

  await event.reply(translation, true)
}

/**
 * 添加相关词
 * @param data
 * @param mainContent
 * @return {*}
 */
function addRelatedContent(data, mainContent) {
  for (let i = 1; i < data.length; i++) {
    mainContent += data[i].word + (i === data.length - 1 ? '' : '、')
  }
  return mainContent
}

module.exports = { plugin }
