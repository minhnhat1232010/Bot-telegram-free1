const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const app = express();

// ⚠️ Lưu ý: Không cần node-fetch nếu dùng Node.js 18 trở lên (có fetch sẵn)
const BOT_TOKEN = process.env.BOT_TOKEN || '8280612700:AAFiIRFMfRo2KjE9ukQ-qkkVnDIxTtRqPes';
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

let latestPhien = null;
let subscribers = [];

async function fetchData() {
  try {
    const response = await fetch('https://saobody-lopq.onrender.com/api/taixiu/sunwin');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('❌ Lỗi khi lấy dữ liệu API:', error.message);
    return null;
  }
}

function formatMessage(data) {
  const {
    phien,
    xuc_xac_1,
    xuc_xac_2,
    xuc_xac_3,
    tong,
    ket_qua,
    du_doan,
    ty_le_thanh_cong,
    pattern
  } = data;

  const nextPhien = phien + 1;
  const time = new Date().toLocaleTimeString('vi-VN', { hour12: false });

  return `
🎮 SUNWIN VIP - PHÂN TÍCH CHUẨN XÁC 🎮
══════════════════════════
🆔 Phiên: ${phien}
🎲 Xúc xắc: [${xuc_xac_1} - ${xuc_xac_2} - ${xuc_xac_3}]
🧮 Tổng điểm: ${tong} | Kết quả: ${ket_qua}
──────────────────────────
🔮 Dự đoán phiên ${nextPhien}: ${du_doan}
📊 Độ tin cậy: 🔥 (${ty_le_thanh_cong}%)
🎯 Khuyến nghị: Đặt cược ${du_doan}

🧩 Pattern: ${pattern || 'Không phát hiện mẫu cụ thể'}
⏱️ Thời gian: ${time}
══════════════════════════
👥 Hệ thống phân tích Sunwin AI 👥
💎 Uy tín - Chính xác - Hiệu quả 💎
`.trim();
}

async function checkNewData() {
  const data = await fetchData();
  if (!data || !data.phien) return;

  if (data.phien !== latestPhien) {
    latestPhien = data.phien;

    const message = formatMessage(data);
    for (const chatId of subscribers) {
      bot.sendMessage(chatId, message);
    }
  }
}

// 🔄 Kiểm tra mỗi 5 giây
setInterval(checkNewData, 5000);

// 👋 /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, `👋 Chào bạn đến với SUNWIN AI!\nGửi /sunwin để nhận dự đoán tự động.\nGửi /stop để hủy.`);
});

// ✅ /sunwin
bot.onText(/\/sunwin/, (msg) => {
  const chatId = msg.chat.id;
  if (!subscribers.includes(chatId)) {
    subscribers.push(chatId);
  }
  bot.sendMessage(chatId, `✅ Bạn đã đăng ký nhận dự đoán SUNWIN tự động!`);
});

// 🚫 /stop
bot.onText(/\/stop/, (msg) => {
  const chatId = msg.chat.id;
  subscribers = subscribers.filter(id => id !== chatId);
  bot.sendMessage(chatId, `🚫 Bạn đã hủy nhận dự đoán SUNWIN.`);
});

// 🌐 Endpoint giữ bot sống
app.get('/', (req, res) => {
  res.send('✅ SUNWIN BOT is running...');
});

// 🚀 Server Express để Render không tắt
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server is listening on port ${PORT}`);
});
