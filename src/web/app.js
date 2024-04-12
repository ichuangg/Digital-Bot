const {log} = require('wechaty')
const express = require('express')
const bodyParser = require('body-parser')
const {FileBox} = require('file-box')
const multer = require('multer')
const path = require('path')
// https://github.com/express-rate-limit/express-rate-limit 限流器文档
const rateLimit = require('express-rate-limit')
const fs = require('fs')
const restrictIp = require('../utils/ipfilter.js')
const {readDirectoryTree} = require('../utils/fileUtils.js')
const {bot, puppet} = require('../wechaty/wechaty.js')

// 加载配置
// const config = JSON.parse(fs.readFileSync((path.join(__dirname, "../../config/config.json")), 'utf-8'))
// express web 服务器配置
const app = express()
app.use(express.static('public'));
app.use(express.urlencoded({extended: true}))
app.set('port', 8027)
// 解析请求体
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())
// 发送消息的限流参数
const sendMsgLimiter = rateLimit({
    windowMs: 1000,    // 时间限制（ms)
    max: 2, // 频率限制
    message: "发送消息频率太快，请稍等重试！",  // 限流消息
    standardHeaders: true, //
    legacyHeaders: false, //
    skipFailedRequests: true,
    keyGenerator: (request, response) => {
        // 设置请求体参数wxId为请求标识，对每个wxId请求进行
        if (request.body && request.body.wxId) {
            return request.body.wxId
        } else {
            return request.ip
        }
    }
})
// 发送文件的限流参数
const sendFileLimiter = rateLimit({
    windowMs: 1000,    // 时间限制（ms)
    max: 1, // 频率限制
    message: "发送文件频率太快，请稍等重试！",  // 限流消息
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    skipFailedRequests: true,
    keyGenerator: (request, response) => {
        // 设置请求体参数wxId为请求标识，对每个wxId请求进行
        if (request.body && request.body.wxId) {
            return request.body.wxId
        } else {
            return request.ip
        }
    }
})
app.use('/sendTextMsg', sendMsgLimiter)
app.use('/roomList', sendMsgLimiter)
app.use('heartbeat', sendMsgLimiter)
app.use('/sendFile', sendFileLimiter)
// app.use(restrictIp({
//     whitelist: new Set(config.whitelist),// ip白名单配置
//     allowPrivate: config.allowPrivate, //是否开放局域网内访问
//     onRestrict: (req, res, next, ipToCheck) => {    // 拒绝访问
//         log.info(`拒绝访问${req.ip}`)
//         res.send(R.error("拒绝访问。",req.ip))
//     }
// }))

// 默认返回结果
class R {
    constructor(code, msg, data = null) {
        this.code = code
        this.msg = msg
        this.data = data
    }

    static succeed(msg, data = null) {
        return new R(200, msg, data)
    }

    static error(msg, data = null) {
        return new R(200, msg, data)
    }
}


/**
 * 发送文本消息
 * wxId: 微信唯一id
 * msgContent： 发送内容
 * mentionIdList ：
 * 源码中代表对群组发送消息时@的成员列表wxid
 * 经过测试发现不能实现功能。
 * 已反馈源码仓库：https://github.com/wechaty/puppet-xp/issues/163
 *
 * 如要需要@群成员需求可先手动在mentionIdList中拼接字符串
 * 或者源码中修改mentionIdList逻辑 puppet-xp.ts line 879
 */
app.post('/sendTextMsg', (req, res) => {
    let sendMsg = req.body
    // 心跳
    if (sendMsg.data && sendMsg.data.msgType === 1001) {

    }
    sendTextMsg(sendMsg).then(() => {
        res.json(R.succeed("发送消息成功。"))
    }).catch((e) => {
        log.error(`消息发送失败,检查机器人状态。 参数：${JSON.stringify(sendMsg)},错误:${e.message}`)
        res.send(R.error("请求失败。", e))
    })
})

app.get('/heartbeat', (req, res) => {
    bot.currentUser.say("💕").then(() => {
        res.json(R.succeed("心跳监测成功。"))
    }).catch((e) => {
        log.error(`心跳监测失败,检查机器人状态。`)
        res.send(R.error("心跳监测失败。", e))
    })
})

async function sendTextMsg(sendMsg) {
    if (sendMsg.wxId && sendMsg.data.msgContent) {
        await puppet.messageSendText(sendMsg.wxId, sendMsg.data.msgContent, sendMsg.mentionIdList)
        log.info(`发送消息💌 ==> wxid:${sendMsg.wxId},content:${sendMsg.data.msgContent}`)
    } else {
        log.info(`发送消息参数错误，参数:${JSON.stringify(sendMsg)}`)
    }
}

/**
 * 微信上传文件
 *
 * 默认保存文件，保存根路径
 * 修改需修改源码 puppet-xp.ts line 892
 */
const upload = multer()
app.post('/sendFile', upload.single("file"), (req, res) => {
    const sendfile = {}
    sendfile.file = req.file
    sendfile.wxId = req.body.wxId
    sendFile(sendfile).then(() => {
        res.json(R.succeed("发送文件成功。"))
    }).catch((e) => {
        log.error(`文件发送失败,检查机器人状态。 wxid:${sendfile.wxId },file:${sendfile.file.originalname},size:${sendfile.file.size / 1024.0}Kb ,错误:${e.message}`)
        res.json(R.error("发送文件失败。", e.message))
    })
})

async function sendFile(sendfile) {
    let file = sendfile.file
    let wxId = sendfile.wxId
    if (wxId && file) {
        const fileBox = FileBox.fromBuffer(file.buffer, file.originalname)
        await puppet.messageSendFile(wxId, fileBox)
        log.info(`发送文件 📁 ==> wxid:${wxId},file:${file.originalname},size:${file.size / 1024.0}Kb`)
    } else {
        log.error(`发送文件失败参数错误。wxid:${wxId},file:${file.originalname},size:${file.size / 1024.0}Kb`)
    }
}

async function sendFileByPath(wxId,file) {
    if (wxId && file) {
        const fileBox = FileBox.fromFile(file.path, file.name)
        await puppet.messageSendFile(wxId, fileBox)
        log.info(`发送文件 📁 ==> wxid:${wxId},file:${file.name},size:${file.size / 1024.0}Kb`)
    } else {
        log.error(`发送文件失败参数错误。wxid:${wxId},file:${file.name},size:${file.size / 1024.0}Kb`)
    }
}

app.post('/sendFileByPath', async (req, res) => {

    await puppet.sidecar.sendPicMsg(req.body.wxId, req.body.path)
    res.json(R.succeed("发送文件成功。"))

    // const file = req.body
    // const wxId = req.body.wxId
    // sendFileByPath(wxId,file).then(() => {
    //     res.json(R.succeed("发送文件成功。"))
    // }).catch((e) => {
    //     // log.error(`文件发送失败,检查机器人状态。 wxid:${sendfile.wxId },file:${sendfile.file.originalname},size:${sendfile.file.size / 1024.0}Kb ,错误:${e.message}`)
    //     res.json(R.error("发送文件失败。", e.message))
    // })
})
app.get('/getFileList', (req, res) => {
        res.json(R.succeed("请求成功。",readDirectoryTree()))
})

/**
 *  获取群列表
 *  启动时加载 puppet-xp.ts :: loadRoomList 重新加载群列表
 *  roomList方法在roomStore缓存中获取
 *  如果要加载新的列表：
 *  1. 重启程序
 *  2. 有人加群
 *  2. 修改源码 puppet-xp.ts line 538 提升方法权限将roomList替换loadRoomList
 */
app.get('/roomList', (req, res) => {
    puppet.roomList().then(list => {
        log.info(`获取群组列表成功，${list.length}。`)
        res.json(R.succeed("获取群组列表成功。", puppet.roomStore))
    }).catch(e => {
        log.error(`获取群组列表失败，错误：${e.message}`)
        res.json(R.error("获取群组列表失败。", e.message))
    })
});

/**
 *  获取好友列表
 *  逻辑同上
 *  源码中没有新加好友刷新列表的逻辑
 *  需要修改方法权限手动调用loadContactList
 */
app.get('/friendsList', (req, res) => {
    puppet.contactList().then(list => {
        log.info(`获取好友列表成功，${list.length}。`)
        res.json(R.succeed("获取好友列表成功。", puppet.contactStore))
    }).catch(e => {
        log.error(`获取好友列表失败，错误：${e.message}`)
        res.json(R.error("获取好友列表失败。", e))
    })
});

app.get('/myself', (req, res) => {
    try {
        log.info(`获取个人信息成功!`)
        res.json(R.succeed("获取个人信息成功。", puppet.selfInfo))
    } catch (e) {
        res.json(R.error("获取个人信息失败。", e))
    }
});


app.get('/reload', (req, res) => {
    // 重新加载好友群组列表
    reload().then(() => {
        res.json(R.succeed("重新加载好友群组列表成功。"))
    }).catch((e) => {
        res.json(R.succeed("重新加载好友群组列表失败。", e.message))
    })
});

async function reload() {
    await puppet.loadContactList()
    await puppet.loadRoomList()
    log.info(`重新加载好友群组列表成功!`)
}

module.exports = app
