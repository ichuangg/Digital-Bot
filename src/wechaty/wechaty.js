const {WechatyBuilder, log} = require('wechaty')
const {searchFileList} = require('../utils/searchUtils.js')
const {musicCookieMap,login} = require('../utils/musicLogin.js')
const {uploadMusicToCloud} = require('../utils/musicUploadToCloud.js')
const {default: PuppetXp} = require('wechaty-puppet-xp')
const {FileBox} = require('file-box')
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

const Keyword = {
    Login : '网易云登录',
    Music : '@@',
    Upload: '**'
}
// 自己 、 兔头
const contactsWhiteList = ["wxid_taztz8qep6ou22",'wxid_luuasz72ta0t22']
// 男厕所、
const roomWhiteList = ['17948661487@chatroom']
function messageFilter(message) {
    if (message.room()) {
        return roomWhiteList.includes(message.room().id)
    } else {
        return true
        // return contactsWhiteList.includes(message.talker().id)
    }
}
/**
 * 接收到微信消息后触发的事件
 * @param message 收到的消息 类型信息 WechatyInterface.Message.Type
 */
async function onMessage(message) {

    // 白名单拦截
    if (!messageFilter(message)) return;

    log.info(`消息接收: ${message.toString()} `)
    // 文本消息解析
    if (message.type() === bot.Message.Type.Text) {

        // 联系人私信操作
        if (!message.room()) {
            if (message.text() === Keyword.Login) {
                if (musicCookieMap.has(message.talker().id)) {
                    await message.talker().say("已登录过。")
                } else {
                    log.info(`开始二维码登录: ${message.talker()} `)
                    await login(message)
                }
            }
        }


        if (message.text().startsWith(Keyword.Music)) {
            const key = message.text().replace(Keyword.Music, '');
            const searchList = fuse.search(key)
            if (searchList.length > 0) {
                if (message.room()) {
                    await puppet.sidecar.sendPicMsg(message.room().id, searchList[0].item.path)
                } else {
                    await puppet.sidecar.sendPicMsg(message.talker().id, searchList[0].item.path)
                }
            } else {
                if (message.room()) {
                    await message.room().say("没有找到：" + key)
                } else {
                    await message.from().say("没有找到：" + key)
                }
            }
        }


        if (message.text().startsWith(Keyword.Upload)) {
            const key = message.text().replace(Keyword.Upload, '');
            const searchList = fuse.search(key)
            if (searchList.length > 0) {
                uploadMusicToCloud(message,searchList[0].item)
            } else {
                if (message.room()) {
                    await message.room().say("没有找到：" + key)
                    // await puppet.messageSendFile(message.room().id, fileBox)
                } else {
                    await message.from().say("没有找到：" + key)
                    // await puppet.messageSendFile(message.talker().id, fileBox)
                }
            }
        }

    }

    // 文件
    if (message.type() === bot.Message.Type.Attachment) {
        // const FileBox = await message.toFileBox()
        // console.log(FileBox)
    }
    //C:\Users\Administrator\Documents\WeChat Files\wxid_taztz8qep6ou22\FileStorage\File\2024-04\北京一夜.mp3'
    //
    // 小程序解析
    if (message.type() === bot.Message.Type.MiniProgram) {
    }
    // 位置信息解析
    if (message.type() === bot.Message.Type.Location) {
    }
}

//C:\Users\Administrator\Documents\WeChat Files\WeChat Files\wxid_taztz8qep6ou22\FileStorage\File\2024-04
// 'C:\Users\Administrator\Documents\WeChat Files\wxid_taztz8qep6ou22\FileStorage\File\2024-04\周杰伦 - 将军.flac'
// 绑定事件
bot.on('message', onMessage)
bot.on('login', onLogin)
