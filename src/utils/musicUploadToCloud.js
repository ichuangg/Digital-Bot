const {musicCookieMap} = require('../utils/musicLogin.js')
const fs = require('fs');
const path = require("path");
// const mime = require('mime');
const cloudMusicApi = require("NeteaseCloudMusicApi");

async function uploadMusicToCloud(message,data) {
    const userInfo = musicCookieMap.get(message.talker().id)
    if (!userInfo) {
        message.talker().say("👤上传请先登录！回复（网易云登录）")
        return;
    }
    try {
        await cloudMusicApi.cloud({
            songFile: {
                name: path.basename(data.path),
                data: fs.readFileSync(data.path),
            },
            cookie: userInfo.cookie,
        })
        message.talker().say("上传云盘成功😋")
    } catch (e) {
        message.talker().say("上传云盘失败😅")
    }
}
module.exports = {uploadMusicToCloud}
