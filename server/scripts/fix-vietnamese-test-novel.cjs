const Database = require("better-sqlite3");

const db = new Database("dev.db");

const novelId = "cmpywmfal0000rgije2jvrasq";
const now = new Date().toISOString();

const payload = {
  title: "Mộ Gió Dưới Chân Núi",
  description:
    "Một điều tra viên khảo sát đất quay về quê miền Trung để xử lý khu resort sắp khởi công cạnh miếu nhỏ và bãi mộ cũ, rồi bị kéo vào chuỗi dị sự nối Huế, Hà Nội phố cổ và Núi Bà Đen.",
  targetAudience: "Người thích tâm linh Việt Nam, hiện thực u ám, điều tra dân gian",
  bookSellingPoint:
    "Tâm linh Việt dựa trên địa điểm thật, đất có chuyện, miếu nhỏ, lời đồn và dự án hiện đại xâm lấn.",
  first30ChapterPromise:
    "Mỗi chương mở ra một lớp nợ của đất, từ miếu cũ, gia phả sai, mộ thất tán đến lời gọi giữa đêm trên nước.",
  styleTone: "u ám, ám gợi, rất Việt, ít jump scare, nhiều dư âm",
  commercialTagsJson: JSON.stringify([
    "tâm linh Việt",
    "điều tra",
    "đô thị linh dị",
    "dân gian",
  ]),
  updatedAt: now,
};

const existing = db.prepare("SELECT id FROM Novel WHERE id = ?").get(novelId);

if (!existing) {
  console.error(`Novel not found: ${novelId}`);
  process.exit(1);
}

db.prepare(`
  UPDATE Novel
  SET title = @title,
      description = @description,
      targetAudience = @targetAudience,
      bookSellingPoint = @bookSellingPoint,
      first30ChapterPromise = @first30ChapterPromise,
      styleTone = @styleTone,
      commercialTagsJson = @commercialTagsJson,
      updatedAt = @updatedAt
  WHERE id = @id
`).run({
  id: novelId,
  ...payload,
});

const result = db
  .prepare("SELECT id, title, hex(title) as titleHex, targetAudience FROM Novel WHERE id = ?")
  .get(novelId);

console.log(JSON.stringify(result, null, 2));

db.close();
