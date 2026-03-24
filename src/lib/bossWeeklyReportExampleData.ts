import type { BossWeeklyReport } from './types'

const T = '\t'

function row(...cells: string[]): string {
  return cells.join(T)
}

/**
 * 依使用者提供之 GM TW 週報（2026.03.18）整理；表格欄位以 tab 分隔，方便貼到試算表。
 */
export function exampleBossWeeklyReportHen20260318(): BossWeeklyReport {
  const sectionFinancial = [
    row(
      'Metric',
      'Monthly Target(Mar)',
      'Estimated (MTD)',
      'Achievement %',
      'Weekly new',
      'WoW %',
      'Remark',
    ),
    row('Cover Fee Revenue', '$124,740', '$30,947', '25%', '$15,385', '16.14%', ''),
    row('Menu GMV', '588,000', '-', '-', '-', '', ''),
    row('Voucher GMV', 'Target N/A', '-', '-', '-', '', ''),
    row('RMS GMV', '140,000', '-', '-', '-', '', ''),
  ].join('\n')

  const sectionMarketingBu = [
    row(
      'Item',
      'Monthly Target(Mar)',
      'Actual (MTD)',
      'Achievement %',
      'Weekly New',
      'WoW %',
      'Remark',
    ),
    row('Confirmed Bookings', '2,100', '521', '25%', '259', '16.14%', ''),
    row('New LINE Members', '1,000', '9', '1%', '0', '-', ''),
    row('New Videos', '180', '0', '0%', '0', '', ''),
    row('New Articles', '14', '0', '0%', '0', '', ''),
    row(
      'Confirmed Bookings\nfrom Google Reservation',
      '1,500',
      '493',
      '33%',
      '244',
      '15.64%',
      '',
    ),
    row(
      'Confirmed Bookings\nfrom others',
      '600',
      '28',
      '5%',
      '15',
      '25.00%',
      '',
    ),
  ].join('\n')

  const salesRemarkNewActive = `這個月簽約Total 11家
有4家未符合POI審核條件(如照片缺失), 因此目前成績只算7家`

  const salesRemarkChurn = `1.微光森林-店家告知Annie解約(Reason to be confirmed)
2.咖啡弄 敦化店-歇業
3.優喜鍋物專門店-歇業
4.理島Ideal island-歇業
5.嘿堡哥美式火烤漢堡-暫停營業

to be confirmed:
在一起 One&Together        
寒舍茶坊
米奇諾美式餐廳
牛窟溫體牛肉        `

  const sectionSalesBu = [
    row(
      'Item',
      'Monthly Target(Mar)',
      'Actual (MTD)',
      'Achievement %',
      'Weekly New',
      'WoW %',
      'Remark',
    ),
    row(
      'New Active Restaurants',
      '36',
      '7',
      '19%',
      '2',
      '',
      salesRemarkNewActive,
    ),
    row('Churned Restaurants', '0', '9', '-', '4', '', salesRemarkChurn),
    row(
      'Restaurants w/ Offers',
      '13',
      '4',
      '0%',
      '4',
      '',
      '標準: 至少discount offer以一個月為最小期間',
    ),
    row('Restaurants w/ Menu', '8', '0', '0%', '0', '', ''),
    row('Voucher sign-up', 'Target N/A', '0', '0%', '0', '', ''),
    row(
      'RMS Signed',
      '7',
      '0',
      '0%',
      '0',
      '',
      '預計本周3/19簽訂第一家RMS',
    ),
  ].join('\n')

  const sectionPartnerships = [
    row(
      'Partner(existing/from Joe)',
      'Current Stage',
      'Weekly Progress',
      '',
      'Next Actions',
      '',
      'Remark',
    ),
    row(
      'Hey Max',
      'EOI\n(Expression of Interest)',
      '-',
      '',
      'Prepare promotion miles package for New users and onboarding tasks.',
      '',
      '',
    ),
    row(
      'Cathay / Asia Miles',
      'Launch Prep',
      '3/16 Landing Page 需再調整，根據國泰要求更新商品列表呈現方式，完整訂購流程再確認',
      '',
      '',
      '',
      '',
    ),
    row(
      'Pixnet/GoGo+',
      'Launch Prep',
      'They want their cut is purely 12% of the 22.5% deposit',
      '',
      '1.BD Online Training - 3rd Week of March\n2.Negotiate for 1) some exposures of Openrice to promote its platform, 2) direct promotion in Pixnet local and overseas channels for the menus in order to increase GMVs selling.',
      '',
      '',
    ),
    row(
      'Acpay',
      'Launch Prep',
      'Hen 3/13因為家庭因素需要延期',
      '',
      'Kick off meeting in person w/ Sales head from ACpay on 4th week of Mar',
      '',
      '',
    ),
    row(
      'MasterCard Sponsorship',
      'EOI\n(Expression of Interest)',
      '-',
      '',
      '50 merchants(with menu) by the end of April',
      '',
      '',
    ),
    row(
      'Ritek Group(Dalles大樂斯)',
      'EOI\n(Expression of Interest)',
      '-',
      '',
      'Pause for now',
      '',
      'Pause for now',
    ),
    '',
    row(
      'Partner(new to reach)',
      'Current Stage',
      'Weekly Progress',
      '',
      'Next Actions',
      '',
      'Remark',
    ),
    row(
      'Uspace',
      'EOI\n(Expression of Interest)',
      'Pending',
      '',
      'Provide proposal to Uspace',
      '',
      'Alan is the CEO & founder \nof Uspace',
    ),
    row(
      '台灣代駕TWDD',
      'No interest',
      'TWDD:\n目前我們還有幾個專案在執行，在這部分還沒有明確的規劃時程，若未來有合適的機會再與您聯繫。',
      '',
      'Pause for now',
      '',
      'Pause for now',
    ),
  ].join('\n')

  const sectionCampaigns = [
    row(
      'Campaign',
      'Description',
      'Weekly Progress',
      '',
      'Next Actions',
      '',
      'Remark',
    ),
    row(
      'Asia Miles X OpenRice 預訂銷售合作 - 金豬食堂(202603-07)',
      'Campagin Page',
      '1.夥伴頁已完成，推薦餐廳待餐廳餐點照片齊全後提供。\n2.3/16 Landing Page 需再調整，根據國泰要求更新商品列表呈現方式，完整訂購流程再確認',
      '',
      '3/16 Landing Page 需再調整，根據國泰要求更新商品列表呈現方式，完整訂購流程再確認',
      '',
      '',
    ),
    row(
      '春日野餐祭',
      '目標：\nMGM增加LINE好友數',
      '遊戲測試ok， 素材tineline確認將發出設計需求。',
      '',
      '素材tineline確認將發出設計需求。',
      '',
      '',
    ),
    row(
      '主題式O2O策展',
      '鎖定 20 間熱門餐廳提供專屬優惠，結合任務式遊戲、KOL/C推廣及抽獎',
      '與Hen討論後修正新增快閃，待與BD確認',
      '',
      '與BD確認: 快閃優惠6-9燒肉餐廳餐與',
      '',
      '',
    ),
    row(
      '學生族群推廣',
      '鎖定「價格敏感度高」的學生族群，透過街訪、社群討論佈署',
      '尚未執行上一周Planning & Project timeline',
      '',
      '本週 Planning & Project timeline',
      '',
      '',
    ),
    row(
      '港客引流',
      '利用 OR HK 社群、\n首頁 Banner 曝光TW\n策劃港台連線活動\n小紅書、社團等佈署',
      '尚未執行上一周Planning & Project timeline',
      '',
      '本週 Planning & Project timeline',
      '',
      '',
    ),
  ].join('\n')

  const sectionKeyIssues = [
    row('Issue', 'Description', '', '', 'status'),
    row(
      'RMS confirmed',
      "需要確認根據Hen寄送email標題'Regarding TW RMS'的內容",
      '',
      '',
      'Pending',
    ),
    row(
      'Merchant contract e signed',
      'BD反應:跟餐廳簽約如果涵蓋1.訂位合約 2.Menu/預付訂金合約 3.訂位補充合約 4.素材授權同意合約 會花費比較多時間\nHen反應: 現在每天都要蓋章BD合約(一個餐廳有8個章要蓋) 有點耗損精力與注意力.\n想詢問是否有更方便的方式(比如e sign)',
      '',
      '',
      'Pending',
    ),
    row(
      'Sandbox for LINE miniapp',
      'TW marketing team: 為了增加CRM pool, LINE還是比較好的工具. 有沒有甚麼方式, 能夠讓TW團隊快速開發LINE mini app(不消耗HK 技術資源), 同時又能align安全性, 隱私性',
      '',
      '',
      'Pending',
    ),
    row(
      'Disable TW Region on OR:\n彰化/南投、 雲林/嘉義',
      'As the number of restaurants in some regions is currently quite limited, we suggest temporarily disabling the following regions and reopening them in the future when more restaurant listings are available: 彰化/南投、 雲林/嘉義',
      '',
      '',
      'In progress',
    ),
    row(
      'SEO improvement:\nMoving TW Domain under openrice.com',
      'make browsing of countries sites directly into www.openrice.com/zh/taipei instead of tw.openrice.com/zh/taipei',
      '',
      '',
      'In progress',
    ),
    row(
      'KOL videos & articles copy/paste automation',
      'KOL videos & articles automatically copied & uploaded by AI',
      '',
      '',
      'In progress',
    ),
    row(
      'Linking LINE Login with following the OpenRice Official Account.',
      'A scenario where users scan a QR code at their table to bookmark or leave a review on Openrice.\n\nWhen they log in via LINE, we’d like to see if we can simultaneously prompt them to join the Openrice LINE Official Account.',
      '',
      '',
      'In progress',
    ),
  ].join('\n')

  return {
    titleLine: 'GM TW Weekly Progress Report - 2026.03.18',
    opening:
      'Hi Joe, plz check the OR-TW Weekly Progress Report\n3/2-3/8 Reported by: Hen (GM, TW)',
    sectionFinancial,
    sectionMarketingBu,
    sectionSalesBu,
    sectionPartnerships,
    sectionCampaigns,
    sectionKeyIssues,
  }
}
