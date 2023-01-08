const { autoComplete, translatePlaintext } = require('./api')

const config = {
    cmdPrefix: '#'
}

const msgs = {
    unknownPhrase: '词典未收录',
    nullPhrase: '未查询到释义'
}

async function test() {
    const event = {
        reply: (msg) => {
            console.log(msg)
        }
    }
    const raw_message = '#emoji 鸡你太美'

    // 消息符合触发条件
    const isHit = raw_message.trim().startsWith(config.cmdPrefix)

    // 过滤不触发的消息
    if (!isHit) {
        return
    }

    const isEmoji = raw_message.trim().startsWith(config.cmdPrefix + 'emoji')

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
}

async function replyAutoComplete(event, phrase) {
    console.debug(phrase)

    const response = await autoComplete(phrase)

    const { data } = response.data
    plugin.debug(JSON.stringify(data))
    // 无梗
    if (data.length === 0) {
        await console.log(msgs.unknownPhrase)
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
            await console.log(mainContent)
            return
        }

        if (data.length > 1) {
            mainContent += '\n\n相关内容：'
            mainContent = addRelatedContent(data, mainContent)
        }

        await console.log(mainContent)
    }
}

async function replyEmoji(event, content) {
    console.debug(content)

    const response = await translatePlaintext(content)

    const { translation } = response.data

    await event.reply(translation, true)
}

function addRelatedContent(data, mainContent) {
    for (let i = 1; i < data.length; i++) {
        mainContent += data[i].word + (i === data.length - 1 ? '' : '、')
    }
    return mainContent
}

test()
