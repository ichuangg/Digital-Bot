// 登录
const {FileBox} = require("file-box");
const {log} = require("wechaty");
const cloudMusicApi = require("NeteaseCloudMusicApi");
const path = require("path");
const os = require("os");
const fs = require("fs");
const {replyMessage} = require('../utils/messageUtils.js')
let musicCookieMap = new Map()
const filePath = path.join(os.homedir(), '.user-cookie.json');
async function login(message) {
    let timer
    // await getLoginStatus()
    // const res = await axios.request({
    //     url: `/login/qr/key?timestamp=${Date.now()}`,
    // })

    const res = await cloudMusicApi.login_qr_key()
    const key = res.body.data.unikey
    const res2 = await cloudMusicApi.login_qr_create({key,qrimg: true})
    // const res2 = await axios.request({
    //     url: `/login/qr/create?key=${key}&qrimg=true&timestamp=${Date.now()}`,
    // })
    const qrFile = FileBox.fromDataURL(res2.body.data.qrimg,'qr.jpg')
    replyMessage(message,qrFile)
    replyMessage(message,"网易云APP扫二维码登录📱")
    timer = setInterval(async () => {
        const statusRes = await cloudMusicApi.login_qr_check({key})
        if (statusRes.body.code === 800) {
            replyMessage(message,"二维码已过期,请重新获取。")
            clearInterval(timer)
        }
        if (statusRes.body.code === 803) {
            // 这一步会返回cookie
            clearInterval(timer)
            const cookie = statusRes.body.cookie
            const status = await cloudMusicApi.login_status({cookie})
            const userInfo = status.body.data
            musicCookieMap.set(message.talker().id,{contacts : message.talker(),cookie,userInfo})
            replyMessage(message,'登录成功😊:' + userInfo.profile.nickname)
            log.info("登录成功：" + userInfo.profile.nickname)
        }
    }, 3000)
}
async function initCookieMap() {
    if (fs.existsSync(filePath)) {
        try {
            const data = fs.readFileSync(filePath, 'utf8');
            musicCookieMap = new Map(Object.entries(JSON.parse(data)))
        } catch (err) {
            console.error('加载数据失败:', err);
        }
    }
}
async function saveCookieMap() {
    const jsonMap = JSON.stringify(Object.fromEntries(musicCookieMap.entries()));
    await fs.writeFileSync(filePath, jsonMap);
    console.log('用户cookie数据已保存。');
}
const getCookie = (wxid = 'wxid_taztz8qep6ou22') => {
    return musicCookieMap.get(wxid)?.cookie
}
initCookieMap().then(_r => {

    // 云盘列表
    // cloudMusicApi.user_cloud({cookie:getCookie()}).then(r =>
    // {
    //     /**
    //      * r.body.data[0]
    //      *   simpleSong: {
    //      *     name: '老刘',
    //      *     id: 1469680209,
    //      *     pst: 0,
    //      *     t: 1,
    //      *     ar: [ [Object] ],
    //      *     alia: [],
    //      *     pop: 0,
    //      *     st: 0,
    //      *     rt: null,
    //      *     fee: 0,
    //      *     v: 3,
    //      *     crbt: null,
    //      *     cf: null,
    //      *     al: {
    //      *       id: 0,
    //      *       name: null,
    //      *       picUrl: 'http://p1.music.126.net/UeTuwE7pvjBpypWLudqukA==/3132508627578625.jpg',
    //      *       tns: [],
    //      *       pic: 0
    //      *     },
    //      *     dt: 650919,
    //      *     h: null,
    //      *     m: null,
    //      *     l: { br: 322018, fid: 0, size: 26201018, vd: 0 },
    //      *     a: null,
    //      *     cd: null,
    //      *     no: 0,
    //      *     rtUrl: null,
    //      *     ftype: 0,
    //      *     rtUrls: [],
    //      *     djId: 0,
    //      *     copyright: 0,
    //      *     s_id: 1469680209,
    //      *     mark: 0,
    //      *     originCoverType: 0,
    //      *     originSongSimpleData: null,
    //      *     single: 0,
    //      *     noCopyrightRcmd: null,
    //      *     rtype: 0,
    //      *     rurl: null,
    //      *     mst: 9,
    //      *     cp: 0,
    //      *     mv: 0,
    //      *     publishTime: 0,
    //      *     privilege: {
    //      *       id: 1469680209,
    //      *       fee: 0,
    //      *       payed: 0,
    //      *       st: 0,
    //      *       pl: 323000,
    //      *       dl: 323000,
    //      *       sp: 0,
    //      *       cp: 0,
    //      *       subp: 1,
    //      *       cs: true,
    //      *       maxbr: 323000,
    //      *       fl: 999000,
    //      *       toast: false,
    //      *       flag: 137,
    //      *       preSell: false,
    //      *       playMaxbr: 0,
    //      *       downloadMaxbr: 0,
    //      *       maxBrLevel: 'exhigh',
    //      *       playMaxBrLevel: 'none',
    //      *       downloadMaxBrLevel: 'none',
    //      *       plLevel: 'exhigh',
    //      *       dlLevel: 'exhigh',
    //      *       flLevel: 'lossless',
    //      *       rscl: null,
    //      *       freeTrialPrivilege: [Object],
    //      *       chargeInfoList: null
    //      *     }
    //      *   },
    //      *   lyricId: '0',
    //      *   bitrate: 323,
    //      *   album: '脚步声阵阵',
    //      *   artist: '美好药店',
    //      *   songId: 1469680209,
    //      *   songName: '老刘',
    //      *   addTime: 1692008148495,
    //      *   cover: 109951168843112600,
    //      *   coverId: '109951168843112603',
    //      *   version: 4,
    //      *   fileSize: 26201018,
    //      *   fileName: '美好药店 - 老刘.mp3'
    //      * }
    //      */
    //     console.log(r)
    // })

    // 4237806 Mother PF data.url: http://m8.music.126.net/20240415161249/227e902ac88cd645bab342312df5857d/ymusic/4166/d99c/b2da/22a7a3ffc850792d5616c1a872ea5ec9.flac
    // 1469680209 网盘 老刘
    // cloudMusicApi.song_url({id:'4237806',cookie:getCookie()}).then(res => {
    //     console.log(res)
    // })


    /**
     * {
     *   status: 200,
     *   body: {
     *     code: 200,
     *     data: {
     *       sheetInstrumentTypeVOList: [Array],
     *       musicSheetSimpleInfoVOS: [Array],
     *       errorCode: null,
     *       findSheet: 1,
     *       uploadSheet: 1
     *     },
     *     message: ''
     *   },
     *   cookie: [
     *     'NMTID=00OArxClRyVZIHKTkBjuPtf2UQVxN8AAAGO4My2Sw; Max-Age=315360000; Expires=Thu, 13 Apr 2034 08:08:16 GMT; Path=/;'
     *   ]
     * }
     * {
     *   sheetInstrumentTypeVOList: [
     *     {
     *       code: 4,
     *       name: '吉他',
     *       icon: 'http://p5.music.126.net/LDPkFucEhYCd9_J0cVLJgQ==/109951166560458655'
     *     }
     *   ],
     *   musicSheetSimpleInfoVOS: [
     *       totalPageSize: 24,
     *       difficulty: '',
     *       musicKey: 'C',
     *       playVersion: '演奏版',
     *       chordName: '',
     *       bpm: 0,
     *       commentNum: 0
     *     }
     *   ],
     *   errorCode: null,
     *   findSheet: 1,
     *   uploadSheet: 1
     * }
     *
     *       chordName: '',
     *       bpm: 0,
     *       commentNum: 0
     *     }
     *   ],
     *   errorCode: null,
     *   findSheet: 1,
     *   uploadSheet: 1
     * }
     */
    // cloudMusicApi.sheet_list({id:'4237806',cookie:getCookie()}).then(res => {
    //     console.log(res.body)
    // })

    // 获取乐谱 624947
    // cloudMusicApi.sheet_preview({id:'624947',cookie:getCookie()}).then(res => {
    //     console.log(res.body)
    // })

    // cloudMusicApi.msg_private({cookie:getCookie()}).then(res => {
    //     console.log(res)
    // })

    // cloudMusicApi.msg_recentcontact({cookie:getCookie()}).then(res => {
    //     res.body.data.follow.forEach(item => {
    //         console.log(item.userId)
    //     })
    // })

    // cloudMusicApi.msg_private_history({uid:'1686750785',cookie:getCookie()}).then(res_ => {
    //     console.log(res_)
    // })
})
module.exports = {musicCookieMap,saveCookieMap ,login ,getCookie}
