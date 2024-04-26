function replyMessage(message,text) {
    if (message.room()) {
        message.room().say(text,message.talker())
    } else {
        message.talker().say(text)
    }
}
module.exports = {replyMessage}
