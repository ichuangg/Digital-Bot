const {WechatyBuilder, log} = require('wechaty')
const {updateFileList,fuse,rootDir,fileMd5Map} = require('../utils/searchUtils.js')
const {musicCookieMap,login} = require('../utils/musicLogin.js')
const {uploadMusicToCloud} = require('../utils/musicUploadToCloud.js')
const {downloadMusic} = require('../utils/musicDownload.js')
const {replyMessage} = require('../utils/messageUtils')
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
const xml2js = require("xml2js");
const fs = require("fs");
const path = require("path");
const {getCookie} = require("../utils/musicLogin");

// const MessageMap = new Map()

/**
 * 登陆完成，初始化成功后的回调
 */
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
    DownLoadMusic : '@@@',
    Upload: '**',
}
const contactsWhiteList = ["wxid_taztz8qep6ou22",'wxid_luuasz72ta0t22']
const roomWhiteList = ['38971489958@chatroom','48041979275@chatroom']
function messageFilter(message) {
    if (message.room()) {
        return roomWhiteList.includes(message.room().id)
    } else {
        return true
        // return contactsWhiteList.includes(message.talker().id)
    }
}

const SaveFileExtList = ['mp3','flac']

async function sendFileByMessage(message, path) {
    if (message.room()) {
        await puppet.sidecar.sendPicMsg(message.room().id, path)
    } else {
        await puppet.sidecar.sendPicMsg(message.talker().id, path)
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

        }

        if (message.text() === Keyword.Login) {
            if (musicCookieMap.has(message.talker().id)) {
                replyMessage(message,"已登录过。")
            } else {
                log.info(`开始二维码登录: ${message.talker()} `)
                await login(message)
            }
        }


        if (message.text().startsWith(Keyword.Music)) {
            const key = message.text().replace(/^@+/, '');
            const searchList = fuse.search(key)
            if (searchList.length > 0) {
                await sendFileByMessage(message, searchList[0].item.path);
            } else {
                if (message.text().startsWith(Keyword.DownLoadMusic)) {
                    replyMessage(message,  '本地没有找到：'+key+',正在通过网络下载...')
                    let cookie = getCookie(message.talker().id)
                    if (!cookie) {
                        replyMessage(message,"👤下载请先登录！回复（网易云登录）")
                        return
                    } else {
                        const res = await downloadMusic(key,message,cookie)
                        if (res) {
                            await sendFileByMessage(message, res.path);
                        } else {
                            replyMessage(message,key + '\n下载失败💔')
                        }
                    }

                } else {
                    replyMessage(message,key + '\n这个真没有...🥺')
                }
            }
        }


        if (message.text().startsWith(Keyword.Upload)) {
            const key = message.text().replace(Keyword.Upload, '');
            const searchList = fuse.search(key)
            if (searchList.length > 0) {
                let cookie = getCookie(message.talker().id)
                if (!cookie) {
                    replyMessage(message,"👤上传请先登录！回复（网易云登录）")
                    return
                } else {
                    await uploadMusicToCloud(message,searchList[0].item,cookie)
                }
            } else {
                replyMessage(message,key)
            }
        }

    }

    // 文件 接收到文件后保存到本地
    if (message.type() === bot.Message.Type.Attachment) {
        try {
            const parser = new xml2js.Parser()
            const messageJson = await parser.parseStringPromise(message.text() || '')
            if (isSaveFile(messageJson)) {
                const fileName = messageJson.msg.appmsg[0].title[0]
                const size = messageJson.msg.appmsg[0].appattach[0].totallen[0]
                const fileext = messageJson.msg.appmsg[0].appattach[0].fileext[0]
                const md5 = messageJson.msg.appmsg[0].md5[0]
                const path = rootDir + '微信保存' + '\\' + fileName
                await saveMessageFile(message, path)
                const fileObj = {
                    name: fileName,
                    type: 'file',
                    size: size, // 文件大小（字节）
                    fileType: fileext, // 文件类型（后缀名）
                    path: path, // 添加完整路径
                    searchKey: fileName,
                    md5
                }
                updateFileList(fileObj)
            }
        } catch (e) {
            console.log("保存文件出错！",e)
        }
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

/**
 * 保存消息对象的文件  因为文件可能较大，微信自动下载后才能找到路径保存。
 * @param message
 * @param path
 * @param retries 重试次数
 */
async function saveMessageFile(message, path, retries = 3) {
    try {
        // 检查文件是否已存在
        if (!fs.existsSync(path)) {
            const FileBox = await message.toFileBox();
            await FileBox.toFile(path);
            console.log(path + " 保存文件成功！");
        }
    } catch (e) {
        if (retries > 0) {
            setTimeout(() => {
                saveMessageFile(message, path, retries - 1);
            }, 5000);
        } else {
            console.log("重试次数已用完，保存文件失败。" + path);
        }
    }
}

const saveFileSize = 1024 * 1024 * 1024 * 50  //MB
function isSaveFile(messageJson) {
    const size = messageJson.msg.appmsg[0].appattach[0].totallen[0]
    const fileext = messageJson.msg.appmsg[0].appattach[0].fileext[0]
    const md5 = messageJson.msg.appmsg[0].md5[0]
    return fileext && SaveFileExtList.includes(fileext) && md5 && !fileMd5Map.has(md5) && (size <= saveFileSize)
}
//C:\Users\Administrator\Documents\WeChat Files\WeChat Files\wxid_taztz8qep6ou22\FileStorage\File\2024-04
// 'C:\Users\Administrator\Documents\WeChat Files\wxid_taztz8qep6ou22\FileStorage\File\2024-04\周杰伦 - 将军.flac'
// 绑定事件
bot.on('message', onMessage)
bot.on('login', onLogin)
