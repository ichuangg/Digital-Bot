// 登录
const {FileBox} = require("file-box");
const {log} = require("wechaty");
const axios = require("./request");
const musicCookieMap = new Map()
async function login(message) {
    let timer
    await getLoginStatus()
    const res = await axios.request({
        url: `/login/qr/key?timestamp=${Date.now()}`,
    })
    const key = res.data.data.unikey
    const res2 = await axios.request({
        url: `/login/qr/create?key=${key}&qrimg=true&timestamp=${Date.now()}`,
    })
    const qrFile = FileBox.fromDataURL(res2.data.data.qrimg,'qr.jpg')
    await message.say(qrFile)
    timer = setInterval(async () => {
        const statusRes = await checkStatus(key)
        if (statusRes.code === 800) {
            await message.say('二维码已过期,请重新获取')
            clearInterval(timer)
        }
        if (statusRes.code === 803) {
            // 这一步会返回cookie
            clearInterval(timer)
            const userInfo = await getLoginStatus(statusRes.cookie)
            musicCookieMap.set(message.talker().id,{contacts : message.talker(),cookie:statusRes.cookie,userInfo:userInfo})
            await message.say('登录成功:' + userInfo.profile.nickname)
            log.info("登录成功：" + userInfo.profile.nickname)
        }
    }, 3000)
}
// 检测登录二维码状态
async function checkStatus(key) {
    const res = await axios.request({
        url: `/login/qr/check?key=${key}&timestamp=${Date.now()}&noCookie=true`,
    })
    return res.data
}
// 获取cookie登录信息
async function getLoginStatus(cookie = '') {
    const res = await axios.request({
        url: `/login/status?timestamp=${Date.now()}`,
        method: 'post',
        data: {
            cookie,
        },
    })
    return res.data.data;
}

module.exports = {musicCookieMap ,login }
