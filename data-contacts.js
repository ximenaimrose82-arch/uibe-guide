// ================= 院系联系方式数据 · 贸大新生指南 =================
// 来源: 各学院官网「联系我们 / 机构设置 / 行政机构」页面, 2026年8月逐一核实
// 严格规则: 电话/邮箱/地点均为官网页面实际标注; 查不到一律标「待补充」, 严禁编造
// note 字段为透明备注(页面会显示), 便于读者判断信息时效
const CONTACTS = [
  { name: "国际经济贸易学院", phone: "待补充", email: "site@uibe.edu.cn", location: "博学楼11-12层",
    site: "http://site.uibe.edu.cn/", source: "http://site.uibe.edu.cn/UNIFORM/dizhi.htm",
    note: "官网未公开办公室电话（首页仅 HTML 注释中有旧传真号，未采用）" },

  { name: "中国金融学院", phone: "010-64492635/64493950", email: "jrxybgs@uibe.edu.cn", location: "博学楼9层（党政办公室908）",
    site: "http://sbf.uibe.edu.cn/", source: "http://sbf.uibe.edu.cn/xygk/lxwm/index.htm" },

  { name: "国际商学院", phone: "010-64493501/64493412", email: "uibebs@uibe.edu.cn", location: "宁远楼829（学院办公室）",
    site: "http://bs.uibe.edu.cn/", source: "http://bs.uibe.edu.cn/ibsnew_xygk/lxfs.htm" },

  { name: "法学院", phone: "010-64495038/64496035", email: "uibelaw@uibe.edu.cn", location: "宁远楼7层（学院办公室731）",
    site: "http://law.uibe.edu.cn/", source: "http://law.uibe.edu.cn/xygk/lxwm/index.htm" },

  { name: "英语学院", phone: "010-64493759/2057", email: "sis@uibe.edu.cn", location: "诚信楼13层",
    site: "http://sis.uibe.edu.cn/", source: "http://sis.uibe.edu.cn/xsgz/lxfs/index.htm" },

  { name: "外语学院", phone: "010-64493206", email: "待补充", location: "诚信楼12层（行政办公室1229）",
    site: "http://sfs.uibe.edu.cn/", source: "http://sfs.uibe.edu.cn/xyjj/jgsz/a6f2d37e802541029d262a21cfa8a8d1.htm",
    note: "机构设置页发布于2015年，内容可能偏旧；官网未找到公开邮箱" },

  { name: "人工智能与数据科学学院", phone: "010-64495029", email: "待补充", location: "求索楼（页面未标注楼层）",
    site: "http://it.uibe.edu.cn/", source: "http://it.uibe.edu.cn/xygk/zzjg/index.htm",
    note: "原信息学院，官网现名「人工智能与数据科学学院」" },

  { name: "保险学院", phone: "010-64493604", email: "待补充", location: "博学楼8层",
    site: "http://insurance.uibe.edu.cn/", source: "http://insurance.uibe.edu.cn/yxgk/xzjg/index.htm" },

  { name: "政府管理学院", phone: "010-64497243", email: "jinlin@uibe.edu.cn", location: "求索楼907",
    site: "http://schpa.uibe.edu.cn/", source: "http://schpa.uibe.edu.cn/xygk/glfwjg/xzjg/index.htm" },

  { name: "国际关系学院", phone: "010-64493558/64497042", email: "待补充", location: "诚信楼2层",
    site: "http://sir.uibe.edu.cn/", source: "http://sir.uibe.edu.cn/xygk/jgsz/xzjg/34563.htm" },

  { name: "文学与国际传播学院", phone: "010-64493801", email: "uibezw@163.com", location: "诚信楼4层（党政办公室417）",
    site: "http://scll.uibe.edu.cn/", source: "http://scll.uibe.edu.cn/xygk/jgsz/bgs/index.htm",
    note: "原中国语言文学学院，官网现名「文学与国际传播学院」" },

  { name: "统计学院", phone: "010-64494646", email: "uibesta2022@uibe.edu.cn", location: "诚信楼7层",
    site: "http://tongji.uibe.edu.cn/", source: "http://tongji.uibe.edu.cn/xygk/zzjg/index.htm",
    note: "邮箱来自官网「书记院长邮箱地址」页面" },

  { name: "经济学院", phone: "010-64493899/64492019", email: "待补充", location: "求索楼8层",
    site: "https://soe.uibe.edu.cn/", source: "https://soe.uibe.edu.cn/xygk/lxwm/index.htm" },

  { name: "马克思主义学院", phone: "010-64492587/64492772/64493357/64492993", email: "mksuibe@163.com", location: "诚信楼311室",
    site: "http://mkszyxy.uibe.edu.cn/", source: "http://mkszyxy.uibe.edu.cn/xygk/xzbg/index.htm" },

  { name: "体育部", phone: "010-64495190/64492279", email: "待补充", location: "体育部209室（办公室）",
    site: "http://sports.uibe.edu.cn/", source: "http://sports.uibe.edu.cn/bmgk/gljg/index.htm" },

  { name: "国际学院（留学生）", phone: "010-64492327/64492329", email: "sie@uibe.edu.cn", location: "国际交流大厦B座101（招生及项目开发部）",
    site: "http://sie.uibe.edu.cn/", source: "http://sie.uibe.edu.cn/lxwm2/index.htm" },

  { name: "国际发展合作学院", phone: "010-64494256/64494792/64494727", email: "sidc@uibe.edu.cn", location: "求索楼1129（学院办公室）",
    site: "http://sidc.uibe.edu.cn/", source: "http://sidc.uibe.edu.cn/xygk/lxfs/index.htm" },

  { name: "学校信息公开办公室", phone: "待补充", email: "待补充", location: "待补充",
    site: "https://xxgk.uibe.edu.cn/", source: "https://xxgk.uibe.edu.cn/",
    note: "官网（xxgk.uibe.edu.cn）验证期间不稳定；该部门常用电话010-64492107见学校公开的紧急联系渠道，建议以官网恢复后为准" },
];
