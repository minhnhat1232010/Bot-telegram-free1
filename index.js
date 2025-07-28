const TelegramBot = require('node-telegram-bot-api');
const fetch = require('node-fetch');
const express = require('express');
const app = express();

const BOT_TOKEN = '8280612700:AAFiIRFMfRo2KjE9ukQ-qkkVnDIxTtRqPes'; // ← Thay bằng token bot thật
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

let latestPhien = null;
let subscribers = [];

async function fetchData() {
  try {
    const res = await fetch('https://saobody-lopq.onrender.com/api/taixiu/sunwin');
    const data = await res.json();
    return data;
  } catch (e) {
    console.error('❌ API Error:', e);
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
  if (!data) return;

  if (data.phien !== latestPhien) {
    latestPhien = data.phien;

    for (const chatId of subscribers) {
      bot.sendMessage(chatId, formatMessage(data));
    }
  }
}

setInterval(checkNewData, 5000);

// Lệnh /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, `👋 Chào bạn đến với SUNWIN AI!\nGửi /sunwin để nhận tự động dữ liệu Tài/Xỉu.\nGửi /stop để hủy.`);
});

// Lệnh /sunwin: đăng ký nhận dữ liệu
bot.onText(/\/sunwin/, (msg) => {
  const chatId = msg.chat.id;
  if (!subscribers.includes(chatId)) {
    subscribers.push(chatId);
  }
  bot.sendMessage(chatId, `✅ Bạn đã đăng ký nhận dự đoán SUNWIN tự động!`);
});

// Lệnh /stop: hủy đăng ký
bot.onText(/\/stop/, (msg) => {
  const chatId = msg.chat.id;
  subscribers = subscribers.filter(id => id !== chatId);
  bot.sendMessage(chatId, `🚫 Bạn đã hủy nhận dự đoán SUNWIN.`);
});

// Render yêu cầu cổng để giữ bot sống
app.get('/', (req, res) => res.send('✅ SUNWIN Bot đang chạy...'));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🌐 Server is running on port ${PORT}`));
