const TelegramBot = require('node-telegram-bot-api');
const fetch = require('node-fetch');
const express = require('express');
const app = express();

const BOT_TOKEN = '8280612700:AAFiIRFMfRo2KjE9ukQ-qkkVnDIxTtRqPes'; // ← Thay bằng token bot thật của bạn
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

let latestPhien = null;
let subscribers = new Set(); // Dùng Set để quản lý subscribers hiệu quả hơn

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

  // Sử dụng Markdown để tin nhắn đẹp mắt hơn
  return `
🎮 *SUNWIN VIP - PHÂN TÍCH CHUẨN XÁC* 🎮
══════════════════════════
🆔 *Phiên:* \`${phien}\`
🎲 *Xúc xắc:* [\`${xuc_xac_1}\` - \`${xuc_xac_2}\` - \`${xuc_xac_3}\`]
🧮 *Tổng điểm:* \`${tong}\` | *Kết quả:* *${ket_qua}*
──────────────────────────
🔮 *Dự đoán phiên ${nextPhien}:* *${du_doan}*
📊 *Độ tin cậy:* 🔥 (\`${ty_le_thanh_cong}%\`)
🎯 *Khuyến nghị:* Đặt cược *${du_doan}*

🧩 *Pattern:* ${pattern ? `\`${pattern}\`` : 'Không phát hiện mẫu cụ thể'}
⏱️ *Thời gian:* \`${time}\`
══════════════════════════
👥 _Hệ thống phân tích Sunwin AI_ 👥
💎 _Uy tín - Chính xác - Hiệu quả_ 💎
`.trim();
}

async function checkNewData() {
  const data = await fetchData();
  if (!data) return;

  if (data.phien !== latestPhien) {
    latestPhien = data.phien;

    for (const chatId of subscribers) {
      // Gửi tin nhắn với Markdown và tùy chọn parse_mode
      bot.sendMessage(chatId, formatMessage(data), { parse_mode: 'Markdown' });
    }
  }
}

// Chạy kiểm tra dữ liệu mỗi 5 giây
setInterval(checkNewData, 5000);

// Lệnh /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const welcomeMessage = `
👋 Chào bạn đến với SUNWIN AI!
Nhấn nút bên dưới để nhận tự động dữ liệu Tài/Xỉu hoặc hủy đăng ký.
  `.trim();

  // Thêm Inline Keyboard
  bot.sendMessage(chatId, welcomeMessage, {
    reply_markup: {
      inline_keyboard: [
        [{ text: '✅ Nhận dự đoán Sunwin', callback_data: 'subscribe_sunwin' }],
        [{ text: '🚫 Hủy nhận dự đoán', callback_data: 'unsubscribe_sunwin' }]
      ]
    }
  });
});

// Xử lý Inline Keyboard callbacks
bot.on('callback_query', (callbackQuery) => {
  const message = callbackQuery.message;
  const chatId = message.chat.id;
  const data = callbackQuery.data;

  if (data === 'subscribe_sunwin') {
    if (!subscribers.has(chatId)) {
      subscribers.add(chatId);
      bot.sendMessage(chatId, `✅ Bạn đã đăng ký nhận dự đoán SUNWIN tự động!`);
    } else {
      bot.sendMessage(chatId, `Bạn đã đăng ký rồi!`);
    }
  } else if (data === 'unsubscribe_sunwin') {
    if (subscribers.has(chatId)) {
      subscribers.delete(chatId);
      bot.sendMessage(chatId, `🚫 Bạn đã hủy nhận dự đoán SUNWIN.`);
    } else {
      bot.sendMessage(chatId, `Bạn chưa đăng ký nhận dự đoán.`);
    }
  }
  // Luôn trả lời callback query để loại bỏ trạng thái loading trên nút
  bot.answerCallbackQuery(callbackQuery.id);
});


// Render yêu cầu cổng để giữ bot sống
app.get('/', (req, res) => res.send('✅ SUNWIN Bot đang chạy...'));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🌐 Server is running on port ${PORT}`));
