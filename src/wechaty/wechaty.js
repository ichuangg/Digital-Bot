const {WechatyBuilder, log} = require('wechaty')
const {searchFileList} = require('../utils/searchUtils.js')
const {default: PuppetXp} = require('wechaty-puppet-xp')
const {FileBox} = require('file-box')
const xml2js = require('xml2js')
const mm = require("music-metadata");
// PuppetXp
const puppet = new PuppetXp()
// WeChatY
const bot = WechatyBuilder.build({
    name: 'wechat-bot', puppet
})

// 提前导出 解决循环依赖
module.exports = {bot, puppet}

const app = require("../web/app");
const Fuse = require("fuse.js");

// const MessageMap = new Map()

/**
 * 登陆完成，初始化成功后的回调
 */
const fuse = new Fuse(searchFileList, {
    includeScore: true,
    keys: ['searchKey'], // 定义搜索的键
});
function onLogin(contact) {
    log.info('WechatY Start successfully By', contact.toString())
    // 启动Web服务
    app.listen(app.get('port'), () => {
        log.info(`Web Serve Running on Port ${app.get('port')} ...`)
    })
}
const testList = ["wxid_taztz8qep6ou22",'17948661487@chatroom','wxid_taztz8qep6ou22']
/**
 * 接收到微信消息后触发的事件
 * @param message 收到的消息 类型信息 WechatyInterface.Message.Type
 */
async function onMessage(message) {
    log.info(`消息接收: ${message.toString()} `)
    // 文本消息解析
    if (message.type() === bot.Message.Type.Text) {
        if ((testList.includes(message.talker().id) || (message.room() && testList.includes(message.room().id) && message.text().startWith("@漫长的")))) {
            const key = message.text().replace('@漫长的白日梦 ', '');
            const searchList = fuse.search(key)
            if (searchList.length > 0) {
                console.log(searchList[0])
                // const fileBox = FileBox.fromFile(searchList[0].item.path)
                if (message.room()) {
                    await puppet.sidecar.sendPicMsg(message.room().id, searchList[0].item.path)
                    // await puppet.messageSendFile(message.room().id, fileBox)
                } else {
                    await puppet.sidecar.sendPicMsg(message.talker().id, searchList[0].item.path)
                    // await puppet.messageSendFile(message.talker().id, fileBox)
                }
                // await message.room().say(fileBox)
            }
        }
    }
    // if (message.type() === bot.Message.Type.Text && message.text().startsWith("查询")) {
        // 匹配关键词  找到对应接口  生成查询条件  请求接口  包装返回数据
        // message.say("查询信息...")
    // }
    // 文件
    if (message.type() === bot.Message.Type.Attachment) {
        const FileBox = await message.toFileBox()
        console.log(FileBox)
    }
    // 小程序解析
    if (message.type() === bot.Message.Type.MiniProgram) {
    }
    // 位置信息解析
    if (message.type() === bot.Message.Type.Location) {
    }
}


// 绑定事件
bot.on('message', onMessage)
bot.on('login', onLogin)
