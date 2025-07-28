const TelegramBot = require('node-telegram-bot-api');
const fetch = require('node-fetch');
const express = require('express');
const app = express();

// --- Cấu hình Bot và Webhook ---
const BOT_TOKEN = '8280612700:AAFiIRFMfRo2KjE9ukQ-qkkVnDIxTtRqPes'; // <-- THAY THẾ BẰNG TOKEN BOT CỦA BẠN
const PORT = process.env.PORT || 3000;

// URL của ứng dụng Render của bạn.
// SAU KHI TRIỂN KHAI LÊN RENDER, BẠN SẼ CÓ URL NÀY (VD: https://ten-ung-dung-cua-ban.onrender.com)
// HÃY CẬP NHẬT LẠI BIẾN NÀY VỚI URL THỰC TẾ CỦA BẠN!
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'https://sunwin-bot-taixiu11.onrender.com'; // <-- THAY THẾ BẰNG URL THỰC CỦA RENDER APP CỦA BẠN

const bot = new TelegramBot(BOT_TOKEN); // Không dùng polling ở đây

let latestPhien = null;
let subscribers = new Set(); // Dùng Set để quản lý subscribers hiệu quả hơn

// Middleware để Express có thể đọc JSON body từ Telegram
app.use(express.json());

// --- Thiết lập Webhook ---
// Đặt webhook khi bot khởi động
bot.setWebHook(`${WEBHOOK_URL}/bot${BOT_TOKEN}`)
  .then(() => console.log('✅ Webhook đã được thiết lập thành công!'))
  .catch(e => console.error('❌ Lỗi khi thiết lập Webhook:', e));

// Xử lý các update từ Telegram
app.post(`/bot${BOT_TOKEN}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200); // Luôn trả về 200 OK cho Telegram
});

// --- Hàm lấy dữ liệu API ---
async function fetchData() {
  try {
    const res = await fetch('https://saobody-lopq.onrender.com/api/taixiu/sunwin');
    if (!res.ok) { // Kiểm tra trạng thái HTTP response
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const data = await res.json();
    return data;
  } catch (e) {
    console.error('❌ API Error:', e);
    return null;
  }
}

// --- Hàm định dạng tin nhắn ---
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

// --- Hàm kiểm tra dữ liệu mới và gửi cho người đăng ký ---
async function checkNewData() {
  const data = await fetchData();
  if (!data) {
    console.log('Không có dữ liệu mới hoặc lỗi API.');
    return;
  }

  // Nếu có phiên mới
  if (data.phien !== latestPhien) {
    console.log(`Phát hiện phiên mới: ${data.phien}`);
    latestPhien = data.phien; // Cập nhật phiên mới nhất

    if (subscribers.size > 0) { // Chỉ gửi nếu có người đăng ký
      for (const chatId of subscribers) {
        try {
          await bot.sendMessage(chatId, formatMessage(data), { parse_mode: 'Markdown' });
          console.log(`Đã gửi tin nhắn cho chat ID: ${chatId}`);
        } catch (error) {
          console.error(`❌ Lỗi gửi tin nhắn đến ${chatId}:`, error.message);
          // Có thể thêm logic để hủy đăng ký nếu người dùng chặn bot
          if (error.response && error.response.error_code === 403) {
            console.log(`Người dùng ${chatId} đã chặn bot. Hủy đăng ký.`);
            subscribers.delete(chatId);
          }
        }
      }
    } else {
      console.log('Chưa có người đăng ký nhận thông báo.');
    }
  } else {
    console.log(`Phiên ${data.phien} không đổi.`);
  }
}

// Chạy kiểm tra dữ liệu ban đầu ngay lập tức
checkNewData();
// Sau đó chạy kiểm tra dữ liệu định kỳ mỗi 5 giây
setInterval(checkNewData, 5000);

// --- Xử lý lệnh /start ---
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const welcomeMessage = `
👋 Chào bạn đến với SUNWIN AI!
Để nhận tự động dữ liệu Tài/Xỉu và quản lý đăng ký, hãy sử dụng các nút bên dưới.
  `.trim();

  // Thêm Inline Keyboard
  bot.sendMessage(chatId, welcomeMessage, {
    reply_markup: {
      inline_keyboard: [
        [{ text: '✅ Nhận dự đoán Sunwin', callback_data: 'subscribe_sunwin' }],
        [{ text: '🚫 Hủy nhận dự đoán', callback_data: 'unsubscribe_sunwin' }],
        [{ text: '📊 Xem dự đoán hiện tại', callback_data: 'get_current_prediction' }] // Thêm nút xem dự đoán tức thời
      ]
    }
  });
});

// --- Xử lý Inline Keyboard callbacks ---
bot.on('callback_query', async (callbackQuery) => {
  const message = callbackQuery.message;
  const chatId = message.chat.id;
  const data = callbackQuery.data;

  switch (data) {
    case 'subscribe_sunwin':
      if (!subscribers.has(chatId)) {
        subscribers.add(chatId);
        await bot.sendMessage(chatId, `✅ Bạn đã đăng ký nhận dự đoán SUNWIN tự động!`);
      } else {
        await bot.sendMessage(chatId, `Bạn đã đăng ký rồi!`);
      }
      break;
    case 'unsubscribe_sunwin':
      if (subscribers.has(chatId)) {
        subscribers.delete(chatId);
        await bot.sendMessage(chatId, `🚫 Bạn đã hủy nhận dự đoán SUNWIN.`);
      } else {
        await bot.sendMessage(chatId, `Bạn chưa đăng ký nhận dự đoán.`);
      }
      break;
    case 'get_current_prediction':
      await bot.sendMessage(chatId, 'Đang lấy dữ liệu mới nhất...', { parse_mode: 'Markdown' });
      const currentData = await fetchData();
      if (currentData) {
        await bot.sendMessage(chatId, formatMessage(currentData), { parse_mode: 'Markdown' });
      } else {
        await bot.sendMessage(chatId, 'Hiện tại không thể lấy dữ liệu. Vui lòng thử lại sau.');
      }
      break;
    default:
      await bot.sendMessage(chatId, 'Hành động không xác định.');
      break;
  }
  // Luôn trả lời callback query để loại bỏ trạng thái loading trên nút
  await bot.answerCallbackQuery(callbackQuery.id);
});

// --- Route đơn giản để Render biết ứng dụng đang chạy ---
app.get('/', (req, res) => res.send('✅ SUNWIN Bot đang chạy và sẵn sàng nhận webhook...'));

// --- Khởi động Server ---
app.listen(PORT, () => console.log(`🌐 Server is running on port ${PORT}`));

