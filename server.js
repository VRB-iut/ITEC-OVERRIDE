import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import prismaPkg from "@prisma/client";
import bcrypt from "bcrypt";
import cors from "cors";
import "dotenv/config";
import express from "express";

const { PrismaClient } = prismaPkg;
const adapter = new PrismaBetterSqlite3({ url: "file:./dev.db" });

const app = express();
const prisma = new PrismaClient({ adapter });

app.use(cors());
app.use(express.json({ limit: "50mb" })); // Am păstrat doar varianta cu limită mare pentru desene

// --- AUTH ROUTES ---

app.post("/register", async (req, res) => {
  try {
    const { username, password, confirmPassword } = req.body;
    if (!username || !password || !confirmPassword)
      return res.json({ success: false });
    if (password !== confirmPassword) return res.json({ success: false });

    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) return res.json({ success: false });

    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: { username, password: hashedPassword },
    });
    return res.json({ success: true });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.json({ success: false });

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) return res.json({ success: false });

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) return res.json({ success: false });

    return res.json({ success: true, userId: user.id });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false });
  }
});

// --- ADMIN / UTILS ---

app.delete("/delete-user", async (req, res) => {
  try {
    const { username } = req.body;
    if (!username)
      return res.json({ success: false, message: "No username provided" });
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) return res.json({ success: false, message: "User not found" });

    await prisma.user.delete({ where: { username } });
    return res.json({ success: true });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false });
  }
});

app.delete("/delete-all-users", async (req, res) => {
  try {
    const result = await prisma.user.deleteMany({});
    return res.json({
      success: true,
      message: `Au fost șterși toți cei ${result.count} utilizatori.`,
    });
  } catch (err) {
    console.error("Eroare la ștergerea globală:", err);
    return res.status(500).json({ success: false });
  }
});

// --- TEAMS ---

app.post("/create-team", async (req, res) => {
  const { teamName, userId, password, colorHex } = req.body;
  if (!teamName || !userId || !password || !colorHex) {
    return res.json({ success: false, message: "Missing team data" });
  }
  try {
    const result = await prisma.$transaction(async (tx) => {
      const newTeam = await tx.team.create({
        data: {
          name: teamName,
          password: password,
          colorHex: colorHex || "#AF52DE",
        },
      });
      await tx.user.update({
        where: { id: parseInt(userId) },
        data: { teamId: newTeam.id },
      });
      return newTeam;
    });
    return res.json({
      success: true,
      teamId: result.id,
      teamName: result.name,
      colorHex: result.colorHex,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false });
  }
});

app.post("/join-team", async (req, res) => {
  const { teamName, password, userId } = req.body;
  if (!teamName || !password || !userId)
    return res.status(400).json({ success: false });
  try {
    const team = await prisma.team.findUnique({ where: { name: teamName } });
    if (!team) return res.json({ success: false, message: "Team not found" });
    if (team.password !== password)
      return res.json({ success: false, message: "Incorrect password" });

    await prisma.user.update({
      where: { id: parseInt(userId) },
      data: { teamId: team.id },
    });
    return res.json({
      success: true,
      teamId: team.id,
      teamName: team.name,
      colorHex: team.colorHex,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false });
  }
});

// --- BATTLE SYSTEM (Toată logica ta originală) ---

app.post("/battle-won", async (req, res) => {
  const { winnerTeamId, loserTeamId, winnerUserId, loserUserId, percentage } =
    req.body;
  if (percentage === undefined || percentage < 50.1)
    return res.status(400).json({ success: false });

  try {
    await prisma.$transaction(async (tx) => {
      if (winnerTeamId) {
        await tx.user.updateMany({
          where: { teamId: parseInt(winnerTeamId) },
          data: { battlesWon: { increment: 1 } },
        });
      } else if (winnerUserId) {
        await tx.user.update({
          where: { id: parseInt(winnerUserId) },
          data: { battlesWon: { increment: 1 } },
        });
      }

      if (loserTeamId) {
        await tx.user.updateMany({
          where: { teamId: parseInt(loserTeamId) },
          data: { battlesLost: { increment: 1 } },
        });
      } else if (loserUserId) {
        await tx.user.update({
          where: { id: parseInt(loserUserId) },
          data: { battlesLost: { increment: 1 } },
        });
      }

      if (winnerTeamId && loserTeamId) {
        await tx.battleLog.create({
          data: {
            winnerTeamId: parseInt(winnerTeamId),
            loserTeamId: parseInt(loserTeamId),
            winPercentage: parseFloat(percentage || 0),
          },
        });
      }
    });
    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false });
  }
});

// --- LEADERBOARDS & HISTORY ---

app.get("/leaderboard-teams", async (req, res) => {
  try {
    const teams = await prisma.team.findMany({ include: { members: true } });
    const rankedTeams = teams
      .map((team) => ({
        id: team.id,
        name: team.name,
        color: team.colorHex,
        score: team.members.reduce((sum, member) => sum + member.battlesWon, 0),
      }))
      .sort((a, b) => b.score - a.score);
    res.json(rankedTeams);
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

app.get("/team-history/:teamId", async (req, res) => {
  try {
    const history = await prisma.battleLog.findMany({
      where: {
        OR: [
          { winnerTeamId: parseInt(req.params.teamId) },
          { loserTeamId: parseInt(req.params.teamId) },
        ],
      },
      include: {
        winnerTeam: { select: { name: true, colorHex: true } },
        loserTeam: { select: { name: true, colorHex: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    const formattedHistory = history.map((log) => {
      const isWinner = log.winnerTeamId === parseInt(req.params.teamId);
      return {
        id: log.id,
        date: log.createdAt,
        result: isWinner ? "VICTORIE" : "ÎNFRÂNGERE",
        opponent: isWinner ? log.loserTeam.name : log.winnerTeam.name,
        opponentColor: isWinner
          ? log.loserTeam.colorHex
          : log.winnerTeam.colorHex,
        percentage: log.winPercentage,
      };
    });
    res.json({ success: true, history: formattedHistory });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// --- USER & TEAM FETCH ---

app.get("/users", async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, username: true },
    });
    return res.json({ success: true, users });
  } catch (err) {
    return res.status(500).json({ success: false });
  }
});

app.get("/user/:userId", async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(req.params.userId) },
      include: { team: true },
    });
    if (!user) return res.json({ success: false });
    return res.json({
      success: true,
      user: {
        username: user.username,
        battlesWon: user.battlesWon,
        battlesLost: user.battlesLost,
        teamName: user.team?.name || null,
        teamColor: user.team?.colorHex || null,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

app.get("/teams", async (req, res) => {
  try {
    const teams = await prisma.team.findMany({ include: { members: true } });
    return res.json({ success: true, teams });
  } catch (err) {
    return res.status(500).json({ success: false });
  }
});

// --- MULTIPLAYER DRAWINGS (Aici am reparat duplicarea) ---

app.get("/drawings", async (req, res) => {
  try {
    if (!prisma.posterDrawing)
      return res
        .status(500)
        .json({ success: false, error: "Database model missing" });
    const drawings = await prisma.posterDrawing.findMany();
    const formattedDrawings = {};
    drawings.forEach((d) => {
      try {
        formattedDrawings[d.posterName] =
          typeof d.strokes === "string" ? JSON.parse(d.strokes) : d.strokes;
      } catch (e) {
        formattedDrawings[d.posterName] = [];
      }
    });
    res.json({ success: true, drawings: formattedDrawings });
  } catch (err) {
    console.error("Eroare la get drawings:", err);
    res.status(500).json({ success: false });
  }
});

app.post("/drawings", async (req, res) => {
  try {
    const { posterName, strokes } = req.body;
    if (!posterName || !strokes)
      return res.status(400).json({ success: false });

    await prisma.posterDrawing.upsert({
      where: { posterName: posterName },
      update: { strokes: JSON.stringify(strokes) },
      create: { posterName: posterName, strokes: JSON.stringify(strokes) },
    });
    console.log(`[SERVER] Desen salvat: ${posterName}`);
    res.json({ success: true });
  } catch (err) {
    console.error("Eroare la save drawing:", err);
    res.status(500).json({ success: false });
  }
});

// --- SINGURUL LISTEN DIN FIȘIER ---
app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
