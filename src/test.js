const axios = require('axios')

const msgs = {
    unknownPhrase: '词典未收录',
    nullPhrase: '未查询到释义'
}

async function test() {
    const request = axios.create({
        baseURL: 'https://api.jikipedia.com/',
        timeout: 5000,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36 Edg/108.0.1462.54',
            'Origin': 'https://jikipedia.com',
            'Client': 'web',
            'Host': 'api.jikipedia.com'
        }
    });

    const response = await request.post(
        '/go/auto_complete',
        {
            phrase: '牛校出牛子'
        }
    )

    const { data } = response.data

    console.log(JSON.stringify(data))

    // 无梗
    if (data.length === 0) {
        console.log(msgs.unknownPhrase)
        return
    }
    // process
    if (data.length >= 1) {
        let mainContent = data[0].entities?.[0]?.content
        // 无释义
        if (!mainContent) {
            console.log(msgs.nullPhrase)
            return
        }

        if (data.length > 1) {
            mainContent += '\n\n相关内容：'
            // 相关词
            for (let i = 1; i < data.length; i++) {
                mainContent += data[i].word + (i === data.length - 1 ? '' : '、')
            }
        }

        console.log(mainContent)
    }
}

test()
