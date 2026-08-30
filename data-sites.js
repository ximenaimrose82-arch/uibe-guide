// ================= 常用网址数据 · 贸大新生指南 =================
// 来源: 校学生会权益部《在贸大学习, 你需要的网址都在这里!》(2026年8月)整理
// 规则: url 为文章/官网确证的域名; 未给独立地址的(统一身份认证/校园邮箱/成绩单打印)url 留空, 卡片显示说明
const SITES = [
  // ===== 核心门户 =====
  { cat: "核心门户", items: [
    { name: "学校官网", url: "www.uibe.edu.cn", desc: "校园邮箱、VPN、i惠园等应用入口，查新闻/招生/国际交流。" },
    { name: "i惠园", url: "i.uibe.edu.cn", desc: "统一校园信息平台（学号登录，初始密码 Dwjm+身份证后六位+!）。集成通知管理、应用中心、办事大厅（场馆预约/监控调看）、数据中心、惠园AI，一站式办事中枢。" },
    { name: "统一身份认证", url: "", desc: "邮箱、智能学工、VPN、图书馆等系统均通过它跳转登录，无需单独打开。" },
    { name: "校园邮箱", url: "", desc: "学号@uibe.edu.cn，初始密码 Maoda+身份证后六位。入口在 i惠园。" },
  ]},

  // ===== 教学教务 =====
  { cat: "教学教务", items: [
    { name: "教务处", url: "jwc.uibe.edu.cn", desc: "课表、校历、培养方案、实习基地、教务系统入口。" },
    { name: "教务系统", url: "bkjw.uibe.edu.cn", desc: "学号登录（初始密码=学号），查成绩/辅修/课表。" },
    { name: "暑期国际学校", url: "iss.uibe.edu.cn", desc: "暑期课程内容与报名，关系毕业学分。" },
    { name: "成长惠园", url: "ea.uibe.edu.cn", desc: "第二课堂（二三课堂）学分、社会实践、就业课堂。" },
    { name: "智慧树", url: "portals.zhihuishu.com", desc: "部分课程辅助平台（学号+初始密码123456）。" },
    { name: "成绩单自助打印", url: "", desc: "诚信楼6楼，密码同教务系统。" },
  ]},

  // ===== 财务生活 =====
  { cat: "财务生活", items: [
    { name: "统一支付平台", url: "pay.uibe.edu.cn", desc: "缴学费/考试费（初始密码 DWJM@身份证后六位，港澳台 DWJM@学号），也可走财务处公众号。" },
    { name: "智能学工", url: "xssw.uibe.edu.cn", desc: "档案、奖助贷、评奖评优、心理预约、辅导员评价。" },
    { name: "志愿北京", url: "test1.bv2008.cn", desc: "志愿时长与活动，也可用「京通」小程序。" },
  ]},

  // ===== 资源通道 =====
  { cat: "资源通道", items: [
    { name: "图书馆", url: "lib.uibe.edu.cn", desc: "借阅、CNKI/万方等数据库（部分免费）。" },
    { name: "WebVPN", url: "webvpn.uibe.edu.cn", desc: "校外访问内网系统及中外文数据库。" },
    { name: "国际交流中心", url: "geec.uibe.edu.cn", desc: "出国政策与项目信息。" },
  ]},
];
