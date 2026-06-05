const Database = require("better-sqlite3");

const db = new Database("dev.db");

function nowIso() {
  return new Date().toISOString();
}

function makeId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

const worldName = "Việt Âm Địa Chí";
const worldType = "Tâm linh dân gian Việt Nam";
const now = nowIso();

const structure = {
  profile: {
    summary:
      "Một thế giới tâm linh dân gian Việt Nam dựng trên địa điểm có thật, chuyện truyền miệng có thật và những vùng đất giữ ký ức không chịu chết hẳn.",
    identity:
      "Hiện thực tâm linh rất Việt, lấy miếu nhỏ, chợ cũ, phố cổ, núi linh, biệt thự bỏ hoang và sông nước làm trục thay vì fantasy thần thoại hóa.",
    tone:
      "U ám, ám gợi, nhiều dư âm, ít hù dọa trực diện. Điều đáng sợ nhất là đất còn nhớ và người sống đang đụng vào thứ họ không hiểu.",
    themes: [
      "đất nhớ người",
      "truyền miệng vừa là cửa mở vừa là phong ấn",
      "hiện đại hóa xé rách âm mạch",
      "người sống trả nợ cho ký ức của đất",
    ],
    coreConflict:
      "Những dự án hiện đại liên tục cắt đứt âm mạch ở các địa điểm có thật, làm các dị sự cũ sống lại trong hình dạng méo lệch và kéo người sống vào mạng nợ của đất.",
  },
  rules: {
    summary:
      "Không có ma vô cớ. Mỗi hiện tượng phải bám vào địa điểm thật, chết chóc thật, lời hứa dang dở, vật bị chôn hoặc một nghi thức bị cắt ngang.",
    axioms: [
      {
        id: "rule-land-remembers",
        name: "Đất nhớ người",
        summary: "Bi kịch lặp lại đủ lâu sẽ bám vào địa điểm và trở thành oan ký, linh ứng hoặc dị sự lặp.",
      },
      {
        id: "rule-oral-seal",
        name: "Truyền miệng là phong ấn sống",
        summary: "Câu chuyện được kể đúng giúp hiện tượng ổn định; kể sai nhiều đời sẽ làm nó biến dạng.",
      },
      {
        id: "rule-local-faith",
        name: "Miếu nhỏ mạnh hơn đền lớn ở chỗ khác",
        summary: "Sức nặng không đến từ quy mô mà đến từ việc dân địa phương còn thật sự tin và còn giữ lễ.",
      },
      {
        id: "rule-living-gate",
        name: "Người sống là cửa mở",
        summary: "Một số người có căn, có nợ đất hoặc mang vết thương đúng mạch sẽ vô tình mở cửa giữa dương địa và âm mạch.",
      },
      {
        id: "rule-no-ghost-without-cause",
        name: "Không có ma vô cớ",
        summary: "Muốn xử lý một hiện tượng thì phải truy ra gốc sự thật, không thể chỉ dùng bùa phép để đè tạm.",
      },
    ],
    taboo: [
      "Không di dời mộ, phá miếu nhỏ hoặc đổi tên người chết oan khi chưa truy lại lịch sử đúng của vùng đất.",
      "Không biến linh tích thành sân khấu du lịch nếu cộng đồng địa phương chưa kịp xử lý nợ cũ của nơi đó.",
      "Không dùng lời kể bịa để thay thế ký ức thật của một địa điểm.",
    ],
    sharedConsequences: [
      "Đất bị cắt mạch sẽ trả bằng mơ tập thể, tai nạn lặp hoặc những lời đồn sai nhưng không chịu biến mất.",
      "Người có quan hệ máu mủ, nợ ân oán hoặc tình cảm sâu với vùng đất sẽ bị gọi tên trước tiên.",
      "Che giấu gốc sự thật càng lâu thì hiện tượng càng đổi sang hình dạng khó nhận ra hơn.",
    ],
  },
  factions: [
    {
      id: "faction-mieu",
      name: "Ban Trông Miếu Cũ",
      position: "Những người trông miếu, giữ bàn nước, nhớ tên đất và giữ lại các nghi thức nhỏ mà nơi khác xem là lạc hậu.",
    },
    {
      id: "faction-scribes",
      name: "Người Chép Dị Sự",
      position: "Nhóm đi thu thập lời kể, gia phả, bia mộ, thần tích và các bản chép tay còn sót lại để giữ bản kể đúng.",
    },
    {
      id: "faction-patchers",
      name: "Nhóm Vá Mạch",
      position: "Những người chuyên xử lý đất đứt mạch, phong ấn hỏng và các điểm linh bị xâm phạm bởi xây dựng hiện đại.",
    },
    {
      id: "faction-traders",
      name: "Phường Buôn Lộc",
      position: "Mạng lưới kiếm tiền từ nỗi sợ, từ bùa giả, lễ giả và du lịch hóa những nơi có chuyện.",
    },
  ],
  forces: [
    {
      id: "force-am-mach",
      name: "Âm Mạch Rã Rời",
      type: "supernatural-field",
      summary: "Mạng lực vô hình nối các địa điểm có thật với nhau qua oan khí, ký ức tập thể và vật bị chôn.",
    },
  ],
  locations: [
    {
      id: "loc-hue",
      name: "Huế",
      summary:
        "Trục lễ nghi âm, nơi thành quách, lăng tẩm, đàn tế và sông Hương giữ cho linh giới mang vẻ trật tự, đẹp mà lạnh.",
      narrativeFunction: "Hợp cho các vụ việc liên quan đến thần tích, danh phận bị xóa, lễ cũ bị làm sai và người chết có tên tuổi.",
    },
    {
      id: "loc-hanoi-old-quarter",
      name: "Hà Nội phố cổ",
      summary:
        "Không gian của ngõ hẹp, nhà cũ, đình nhỏ, giếng cổ và những câu chuyện ai cũng nghe loáng thoáng nhưng không ai nói thẳng.",
      narrativeFunction: "Hợp cho dị sự dân sinh, bí mật gia tộc, nhà cũ có chuyện và ký ức bị đô thị hóa đè lên.",
    },
    {
      id: "loc-ba-den",
      name: "Tây Ninh - Núi Bà Đen",
      summary:
        "Trục linh sơn của hành hương, thử lòng, lời cầu xin và những thứ rất dễ giả làm linh ứng giữa đám đông.",
      narrativeFunction: "Hợp cho xung đột giữa niềm tin thật và thương mại hóa tín ngưỡng.",
    },
    {
      id: "loc-dalat",
      name: "Đà Lạt",
      summary:
        "Vùng ký ức lạc mạch, biệt thự cũ, rừng thông, hồ và những mối tình hoặc mất tích bị sương giữ lại quá lâu.",
      narrativeFunction: "Hợp cho truyện ký ức méo, danh tính lệch và cảm xúc bị địa điểm giữ lại.",
    },
    {
      id: "loc-mekong",
      name: "Miền Tây sông nước",
      summary:
        "Không gian của ma trôi, ghe lạ, miếu ven sông, xác không về được đất tổ và những tiếng gọi giữa đêm trên nước.",
      narrativeFunction: "Hợp cho các vụ việc liên quan tới thi thể thất lạc, nợ gia tộc và địa danh bị nước ăn mất.",
    },
  ],
  relations: {
    forceRelations: [
      {
        id: "rel-1",
        sourceForceId: "faction-scribes",
        targetForceId: "faction-patchers",
        relation: "đồng minh bất đắc dĩ",
        detail: "Một bên giữ sự thật, một bên phải hành động. Họ cần nhau nhưng hiếm khi đồng ý về cái giá phải trả.",
      },
      {
        id: "rel-2",
        sourceForceId: "faction-mieu",
        targetForceId: "faction-traders",
        relation: "xung đột trực diện",
        detail: "Một bên giữ niềm tin đúng chỗ, một bên biến niềm tin thành món hàng.",
      },
    ],
  },
  metadata: {
    schemaVersion: 1,
    seededFrom: "seed-viet-spiritual-world.cjs",
    lastGeneratedAt: now,
  },
};

const bindingSupport = {
  recommendedEntryPoints: [
    "Một khu đất chuẩn bị làm resort hoặc mở đường nằm cạnh miếu nhỏ, bãi mộ cũ hay bến nước có truyền miệng lạ.",
    "Một gia đình quay về quê truy lại cái chết cũ nhưng gia phả, lời kể và dấu tích địa phương không khớp nhau.",
    "Một người có căn hoặc mang nợ đất bị gọi tên sau khi chạm vào vật đào lên từ một địa điểm có thật.",
  ],
  highPressureForces: ["faction-traders", "force-am-mach", "faction-patchers"],
  suggestedLocationClusters: [
    {
      id: "cluster-hue-hanoi",
      label: "Lễ nghi cũ và dị sự dân sinh",
      locationIds: ["loc-hue", "loc-hanoi-old-quarter"],
      reason: "Hợp cho điều tra tâm linh có gốc lịch sử, thần tích và bí mật gia tộc.",
    },
    {
      id: "cluster-dalat-mekong",
      label: "Ký ức lạc mạch và lời gọi sông nước",
      locationIds: ["loc-dalat", "loc-mekong"],
      reason: "Hợp cho không khí ám, mất tích, xác thân thất lạc và cảm giác bị địa điểm giữ lại.",
    },
  ],
  compatibleConflicts: [
    "Giải tỏa, di dời mộ, mở đường, làm khu du lịch trên đất có chuyện.",
    "Người trẻ quay về quê xử lý di sản nhưng bị kéo vào nợ cũ của đất và gia tộc.",
    "Thế lực buôn lộc chiếm quyền kể chuyện về một địa điểm linh ứng để kiếm tiền.",
  ],
  forbiddenCombinations: [
    "Không biến tâm linh dân gian Việt thành fantasy phép thuật lên cấp kiểu game.",
    "Không để hiện tượng siêu nhiên tách rời địa điểm thật, lịch sử thật hoặc động cơ thật.",
    "Không giải quyết xung đột chỉ bằng sức mạnh lớn hơn; phải trả lại sự thật đúng chỗ.",
  ],
};

const worldRecord = {
  name: worldName,
  description:
    "Một thế giới tâm linh dân gian Việt Nam dựng trên địa điểm có thật và những câu chuyện có thật còn sót lại trong lời đồn, miếu nhỏ, gia phả, nghĩa địa và ký ức cộng đồng.",
  worldType,
  templateKey: "custom",
  axioms: JSON.stringify([
    "Đất nhớ người",
    "Truyền miệng là phong ấn sống",
    "Miếu nhỏ mạnh hơn đền lớn ở chỗ khác",
    "Người sống là cửa mở",
    "Không có ma vô cớ",
  ]),
  background:
    "Việt Nam tồn tại hai lớp thực tại chồng lên nhau: dương địa của người sống và âm mạch của ký ức, oan khí, thần tích bị quên, mồ mả thất tán và những lời kể chưa chịu chết. Mỗi lần đất bị lấp, mộ bị dời, miếu bị bỏ hoặc câu chuyện bị kể sai quá lâu, âm mạch lại nứt thêm một đường.",
  geography:
    "Các trục quan trọng gồm Huế, Hà Nội phố cổ, Tây Ninh - Núi Bà Đen, Đà Lạt và miền Tây sông nước. Mỗi vùng giữ một âm tính riêng nhưng đều nối với nhau qua các mạch nợ của đất.",
  cultures:
    "Tín ngưỡng dân gian, miếu xóm, cúng bến nước, giỗ tộc, lời dặn của người già, gia phả, thần tích và chuyện đồn đầu chợ cuối làng đều là một phần của cấu trúc thế giới này.",
  magicSystem:
    "Không có pháp thuật phô trương. Sức mạnh nằm ở niềm tin đúng chỗ, lễ đúng chỗ, vật chứng đúng chỗ và việc người sống có dám trả lại sự thật đúng cho vùng đất hay không.",
  politics:
    "Chính quyền địa phương, chủ đầu tư, dòng họ cũ, người giữ miếu và kẻ buôn niềm tin cùng tranh quyền diễn giải sự thật của một địa điểm có chuyện.",
  religions:
    "Thế giới vận hành trên nền tín ngưỡng dân gian Việt Nam, các thần địa phương, cúng cô hồn, thờ người chết oan và những thực hành sống còn của cộng đồng.",
  technology:
    "Máy ảnh, flycam, livestream và hồ sơ số hóa đều tồn tại nhưng không thay thế được ký ức địa phương; công nghệ chỉ khuếch đại hoặc làm méo điều đang có.",
  conflicts:
    "Xung đột lớn nhất là hiện đại hóa va vào đất có chuyện: mở đường, giải tỏa, dời mộ, làm resort, thương mại hóa hành hương và bán sai thần tích.",
  history:
    "Chiến tranh, cải táng, thiên tai, lấp sông, bỏ làng, đổi tên đất và các đợt đô thị hóa chồng lên nhau tạo thành những lớp nứt dài trong âm mạch.",
  economy:
    "Lộc âm trở thành thị trường ngầm: bùa giả, tour ma, lễ giả, chuyện thêu dệt và đầu cơ giá trị linh dị của một nơi.",
  factions:
    "Bốn thế lực dễ thấy nhất là Ban Trông Miếu Cũ, Người Chép Dị Sự, Nhóm Vá Mạch và Phường Buôn Lộc.",
  status: "finalized",
  version: 1,
  selectedDimensions: JSON.stringify(["foundation", "power", "society", "culture", "history", "conflict"]),
  selectedElements: JSON.stringify([
    "địa điểm có thật",
    "truyền thuyết có thật",
    "miếu nhỏ",
    "gia phả",
    "mộ thất tán",
    "dự án hiện đại xâm lấn",
  ]),
  layerStates: JSON.stringify({
    foundation: { key: "foundation", status: "confirmed", updatedAt: now },
    power: { key: "power", status: "confirmed", updatedAt: now },
    society: { key: "society", status: "confirmed", updatedAt: now },
    culture: { key: "culture", status: "confirmed", updatedAt: now },
    history: { key: "history", status: "confirmed", updatedAt: now },
    conflict: { key: "conflict", status: "confirmed", updatedAt: now },
  }),
  overviewSummary:
    "Một thế giới tâm linh dân gian Việt Nam nơi đất, miếu nhỏ, lời đồn, gia phả và địa điểm có thật giữ cho quá khứ không chịu chết hẳn. Mỗi lần hiện đại hóa cắt rách âm mạch, những thứ từng bị chôn im lại tìm đường sống dậy.",
  structureJson: JSON.stringify(structure),
  bindingSupportJson: JSON.stringify(bindingSupport),
  structureSchemaVersion: 1,
  updatedAt: now,
};

const libraryRecord = {
  name: worldName,
  description:
    "Thế giới tâm linh dân gian Việt Nam lấy địa điểm có thật và chuyện có thật làm lõi, hợp cho truyện điều tra tâm linh, đô thị linh dị và hiện thực u ám.",
  category: "Tâm linh Việt Nam",
  worldType,
  updatedAt: now,
};

const existingSnapshotWorld = db
  .prepare("SELECT worldId FROM WorldSnapshot WHERE label = ? ORDER BY createdAt DESC LIMIT 1")
  .get("seeded-viet-am-dia-chi");

const existingWorld = existingSnapshotWorld?.worldId
  ? db.prepare("SELECT id FROM World WHERE id = ?").get(existingSnapshotWorld.worldId)
  : db.prepare("SELECT id FROM World WHERE name = ?").get(worldName);

db.exec("BEGIN");
try {
  let worldId = existingWorld?.id;

  if (worldId) {
    db.prepare(`
      UPDATE World
      SET name = @name,
          description = @description,
          worldType = @worldType,
          templateKey = @templateKey,
          axioms = @axioms,
          background = @background,
          geography = @geography,
          cultures = @cultures,
          magicSystem = @magicSystem,
          politics = @politics,
          religions = @religions,
          technology = @technology,
          conflicts = @conflicts,
          history = @history,
          economy = @economy,
          factions = @factions,
          status = @status,
          selectedDimensions = @selectedDimensions,
          selectedElements = @selectedElements,
          layerStates = @layerStates,
          overviewSummary = @overviewSummary,
          structureJson = @structureJson,
          bindingSupportJson = @bindingSupportJson,
          structureSchemaVersion = @structureSchemaVersion,
          updatedAt = @updatedAt
      WHERE id = @id
    `).run({ id: worldId, ...worldRecord });
  } else {
    worldId = makeId("world");
    db.prepare(`
      INSERT INTO World (
        id, name, description, worldType, templateKey, axioms, background, geography,
        cultures, magicSystem, politics, religions, technology, conflicts, history,
        economy, factions, status, version, selectedDimensions, selectedElements,
        layerStates, overviewSummary, structureJson, bindingSupportJson,
        structureSchemaVersion, createdAt, updatedAt
      ) VALUES (
        @id, @name, @description, @worldType, @templateKey, @axioms, @background, @geography,
        @cultures, @magicSystem, @politics, @religions, @technology, @conflicts, @history,
        @economy, @factions, @status, @version, @selectedDimensions, @selectedElements,
        @layerStates, @overviewSummary, @structureJson, @bindingSupportJson,
        @structureSchemaVersion, @createdAt, @updatedAt
      )
    `).run({ id: worldId, createdAt: now, ...worldRecord });
  }

  const existingLibrary = db
    .prepare("SELECT id FROM WorldPropertyLibrary WHERE sourceWorldId = ? OR name = ?")
    .get(worldId, worldName);

  if (existingLibrary?.id) {
    db.prepare(`
      UPDATE WorldPropertyLibrary
      SET name = @name,
          description = @description,
          category = @category,
          worldType = @worldType,
          sourceWorldId = @sourceWorldId,
          updatedAt = @updatedAt
      WHERE id = @id
    `).run({ id: existingLibrary.id, sourceWorldId: worldId, ...libraryRecord });
  } else {
    db.prepare(`
      INSERT INTO WorldPropertyLibrary (
        id, name, description, category, worldType, usageCount, sourceWorldId, createdAt, updatedAt
      ) VALUES (
        @id, @name, @description, @category, @worldType, 0, @sourceWorldId, @createdAt, @updatedAt
      )
    `).run({
      id: makeId("worldlib"),
      sourceWorldId: worldId,
      createdAt: now,
      ...libraryRecord,
    });
  }

  const existingSnapshot = db
    .prepare("SELECT id FROM WorldSnapshot WHERE worldId = ? AND label = ?")
    .get(worldId, "seeded-viet-am-dia-chi");

  if (!existingSnapshot?.id) {
    db.prepare(`
      INSERT INTO WorldSnapshot (
        id, worldId, label, data, createdAt
      ) VALUES (
        @id, @worldId, @label, @data, @createdAt
      )
    `).run({
      id: makeId("worldsnap"),
      worldId,
      label: "seeded-viet-am-dia-chi",
      data: JSON.stringify(worldRecord),
      createdAt: now,
    });
  }

  db.exec("COMMIT");
  console.log(JSON.stringify({ success: true, worldId, name: worldName }, null, 2));
} catch (error) {
  db.exec("ROLLBACK");
  console.error(error);
  process.exitCode = 1;
} finally {
  db.close();
}
