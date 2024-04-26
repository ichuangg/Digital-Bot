const {musicCookieMap} = require('../utils/musicLogin.js')
const fs = require('fs');
const path = require("path");
// const mime = require('mime');
const cloudMusicApi = require("NeteaseCloudMusicApi");
const {replyMessage} = require('../utils/messageUtils.js')

async function uploadMusicToCloud(message,data,cookie) {
    try {
        await cloudMusicApi.cloud({
            songFile: {
                name: path.basename(data.path),
                data: fs.readFileSync(data.path),
            },
            cookie: cookie,
        })
        replyMessage(message,"上传云盘成功😋")
    } catch (e) {
        replyMessage(message,"上传云盘失败😅")
    }
}
module.exports = {uploadMusicToCloud}
