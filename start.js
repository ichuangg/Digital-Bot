const {bot} = require('./src/wechaty/wechaty')
const path = require('path')
const fs = require('fs')
const getMac = require('getmac')["default"]
const crypto = require('crypto');
const {log} = require("wechaty");
const hash = crypto.createHash('md5'); //规定使用哈希算法中的MD5算法
// const config = JSON.parse(fs.readFileSync((path.join(__dirname, "config/config.json")), 'utf-8'))
// console.log(config)
const saltValue = "e38962adf0be6cc9ff2653c39470abea";
const encryptMac = hash.update(getMac() + saltValue).digest("hex");
const enableEncrypt = false
// if (!enableEncrypt || encryptMac === config.mac) {
//     log.info(`MAC地址加密值：${encryptMac}`)
// 启动服务，启动wechaty
bot.start().then(() => {
    log.info('WeChatY Starting ......')
}).catch(e => log.error('WeChatY Start failed!' + e))
// } else {
//     console.log("启动失败，加密配置错误。")
//     process.exit(-1);
// }
