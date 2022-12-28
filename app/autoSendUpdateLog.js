import plugin from '../../../lib/plugins/plugin.js'
import setting from "../model/setting.js";
import common from "../../../lib/common/common.js";
import cfg from "../../../lib/config/config.js";


export class autoSendUpdateLog extends plugin {
  constructor () {
    super({
      name: '自动发送更新日志',
      dsc: '更新全部插件并重启后发送更新日志',
      event: 'message',
      priority: 888,
      rule: [{
        reg: "^#?[今昨日天自动]+更新(日志|内容)$",
        fnc: "updataLog",
      },{
        reg: ".*",
        fnc: "listen"
      }],
    })
    this.appconfig = setting.getConfig("autoUpdate");
    this.task = {
      cron: '0 58 7 * * ?',
      name: '早晨推送更新消息',
      fnc: () => this.updataTask()
    }
  }

  async init () {
    if (!this.appconfig.remind) {return}

    let key = `Yz:loginMsg:${Bot.uin}`
    await redis.del(key)
  }

  async listen () {
    if (this.appconfig.log !== 2) {return}
    if (!this.e.isMaster) {return}
    let key = `Yz:auto-plugin:Update:${Bot.uin}`
    if (!await redis.get(key)) return
    await this.sendLog(cfg.masterQQ[0])
    await redis.del(key)
  }

  async updataTask () {
    if (this.appconfig.log !== 1) {return}
    await this.sendLog(cfg.masterQQ[0])
  }

  async sendLog (qq = cfg.masterQQ[0]) {
    let updataLog = setting.getData(`autoUpdata`, `log-${(new Date().toLocaleDateString()).replace(/\//g, '-')}`)
    if(!updataLog) return
    let replyMsg = []
    for (let pluginLog of updataLog){
      let pluginName = pluginLog.plugin
      let message = pluginLog.logs
      if (pluginName) {
        pluginName = pluginName + '更新日志如下：'
        message = [pluginName, ...pluginLog.logs]
      }
      replyMsg.push({
        message: message.join('\n'),
        nickname: Bot.nickname,
        user_id: Bot.uin
      })
    }
    if(!replyMsg) return
    // 以转发消息形式处理
    let forwardMsg = await Bot.makeForwardMsg(replyMsg);
    forwardMsg.data = forwardMsg.data
      .replace('<?xml version="1.0" encoding="utf-8"?>','<?xml version="1.0" encoding="utf-8" ?>')
      .replace(/\n/g, '')
      .replace(/<title color="#777777" size="26">(.+?)<\/title>/g, '___')
      .replace(/___+/, '<title color="#777777" size="26">请点击查看内容</title>');
    await common.relpyPrivate(qq, '主人~自动化插件已帮您更新了全部插件。插件更新日志请您过目……')
    await common.relpyPrivate(qq, forwardMsg)
  }

  async updataLog () {
    if (!this.e.isMaster) await this.reply('你没有权限')
    await this.sendLog(this.e.user_id)
  }

}
