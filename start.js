const {bot} = require('./src/wechaty/wechaty')
const {saveCookieMap} = require('./src/utils/musicLogin')
const {saveFileList} = require('./src/utils/searchUtils')
const path = require('path')
const fs = require('fs')
const getMac = require('getmac')["default"]
const crypto = require('crypto');
const {log} = require("wechaty");


// const NeteaseCloudMusicApi = require("NeteaseCloudMusicApi");
// const hash = crypto.createHash('md5'); //规定使用哈希算法中的MD5算法
// const config = JSON.parse(fs.readFileSync((path.join(__dirname, "config/config.json")), 'utf-8'))
// console.log(config)
// const saltValue = "e38962adf0be6cc9ff2653c39470abea";
// const encryptMac = hash.update(getMac() + saltValue).digest("hex");
// const enableEncrypt = false
// NeteaseCloudMusicApi.cloudsearch({
//     keywords: "The Wall"
// }).then(res => {
//     console.log(res.body.result.songs[0])
// })

// if (!enableEncrypt || encryptMac === config.mac) {
//     log.info(`MAC地址加密值：${encryptMac}`)
// 启动服务，启动wechaty
bot.start().then(() => {
    log.info('WeChatY Starting ......')
}).catch(e => log.error('WeChatY Start failed!' + e))

process.on('SIGINT', async function () {
    console.log('收到 SIGINT 信号，开始优雅退出...');
    await saveCookieMap()
    await saveFileList()
    // 清理工作...
    process.exit();
});


// 开始退
process.on('exit', async function () {
    console.log('退出，完成清理工作...');
    // 清理工作...
});

process.on('uncaughtException', function (e) {
    /*处理异常*/
    console.log(e.message)
});
// } else {
//     console.log("启动失败，加密配置错误。")
//     process.exit(-1);
// }
