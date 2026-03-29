import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import prismaPkg from "@prisma/client";
import bcrypt from "bcrypt";
import cors from "cors";
import crypto from "crypto";
import "dotenv/config";
import express from "express";

const { PrismaClient } = prismaPkg;
const adapter = new PrismaBetterSqlite3({ url: "file:./dev.db" });

const app = express();
const prisma = new PrismaClient({ adapter });

app.use(cors());
app.use(express.json());

const createInviteCode = () =>
  `OVR-${crypto.randomBytes(5).toString("hex").toUpperCase()}`;

const generateUniqueInviteCode = async (dbClient) => {
  while (true) {
    const inviteCode = createInviteCode();
    const existing = await dbClient.team.findUnique({
      where: { inviteCode },
      select: { id: true },
    });

    if (!existing) {
      return inviteCode;
    }
  }
};

app.post("/register", async (req, res) => {
  try {
    const { username, password, confirmPassword } = req.body;

    if (!username || !password || !confirmPassword) {
      return res.json({ success: false });
    }

    if (password !== confirmPassword) {
      return res.json({ success: false });
    }

    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return res.json({ success: false });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
      },
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

    if (!username || !password) {
      return res.json({ success: false });
    }

    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return res.json({ success: false });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.json({ success: false });
    }

    return res.json({
      success: true,
      userId: user.id,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false });
  }
});

app.delete("/delete-user", async (req, res) => {
  try {
    const { username } = req.body;

    if (!username) {
      return res.json({ success: false, message: "No username provided" });
    }

    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    await prisma.user.delete({
      where: { username },
    });

    return res.json({ success: true });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false });
  }
});

app.delete("/delete-all-users", async (req, res) => {
  try {
    // deleteMany() fără niciun filtru (unde {}) șterge TOT din tabel
    const result = await prisma.user.deleteMany({});

    return res.json({
      success: true,
      message: `Au fost șterși toți cei ${result.count} utilizatori din baza de date.`,
    });
  } catch (err) {
    console.error("Eroare la ștergerea globală:", err);
    return res.status(500).json({
      success: false,
      message: "Nu s-au putut șterge utilizatorii.",
    });
  }
});

app.post("/create-team", async (req, res) => {
  const { teamName, userId, password, colorHex } = req.body;
  const normalizedTeamName =
    typeof teamName === "string" ? teamName.trim() : "";
  const normalizedPassword =
    typeof password === "string" ? password.trim() : "";
  const parsedUserId = parseInt(userId, 10);

  if (
    !normalizedTeamName ||
    !normalizedPassword ||
    !colorHex ||
    Number.isNaN(parsedUserId)
  ) {
    return res.json({
      success: false,
      message: "Missing teamName, userId, password, or colorHex",
    });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const existingUser = await tx.user.findUnique({
        where: { id: parsedUserId },
      });

      if (!existingUser) {
        throw new Error("USER_NOT_FOUND");
      }

      // Creăm echipa
      const inviteCode = await generateUniqueInviteCode(tx);
      const newTeam = await tx.team.create({
        data: {
          name: normalizedTeamName,
          password: normalizedPassword,
          inviteCode,
          colorHex: colorHex || "#AF52DE",
        },
      });

      // Actualizăm user-ul
      await tx.user.update({
        where: { id: parsedUserId },
        data: { teamId: newTeam.id },
      });

      return newTeam;
    });

    // MODIFICAREA AICI: Folosim res.json() pentru a trimite datele inapoi la telefon
    return res.json({
      success: true,
      teamId: result.id,
      teamName: result.name,
      inviteCode: result.inviteCode,
      colorHex: result.colorHex,
    });
  } catch (err) {
    console.log(err);
    if (err.message === "USER_NOT_FOUND") {
      return res
        .status(404)
        .json({ success: false, message: "Utilizatorul nu a fost găsit." });
    }

    if (err.code === "P2002") {
      return res
        .status(409)
        .json({ success: false, message: "Numele echipei este deja folosit." });
    }

    // Dacă numele echipei există deja, Prisma va arunca o eroare aici
    return res.status(500).json({
      success: false,
      message: "Echipa există deja sau eroare server.",
    });
  }
});

app.post("/join-team", async (req, res) => {
  const { teamName, password, userId } = req.body;

  if (!teamName || !password || !userId) {
    return res.status(400).json({
      success: false,
      message: "Missing teamName, password or userId",
    });
  }

  try {
    const team = await prisma.team.findUnique({
      where: { name: teamName },
    });

    if (!team) {
      return res.json({ success: false, message: "Team not found" });
    }

    if (team.password !== password) {
      return res.json({ success: false, message: "Incorrect password" });
    }

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
    return res
      .status(500)
      .json({ success: false, message: "Error joining team" });
  }
});

app.post("/join-team-invite", async (req, res) => {
  const { inviteCode, userId } = req.body;

  if (!inviteCode || !userId) {
    return res.status(400).json({
      success: false,
      message: "Missing inviteCode or userId",
    });
  }

  try {
    const team = await prisma.team.findUnique({
      where: { inviteCode },
    });

    if (!team) {
      return res.json({ success: false, message: "Invalid invite code" });
    }

    await prisma.user.update({
      where: { id: parseInt(userId, 10) },
      data: { teamId: team.id },
    });

    return res.json({
      success: true,
      teamId: team.id,
      teamName: team.name,
      inviteCode: team.inviteCode,
      colorHex: team.colorHex,
    });
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ success: false, message: "Error joining team by invite" });
  }
});

app.post("/battle-won", async (req, res) => {
  const { winnerTeamId, loserTeamId, winnerUserId, loserUserId, percentage } =
    req.body;

  if (percentage === undefined || percentage === null || percentage < 50.1) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid percentage value" });
  }

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

    return res.json({
      success: true,
      message:
        "Bătălia a fost înregistrată cu succes în profilul utilizatorilor!",
    });
  } catch (err) {
    console.error("Eroare la procesarea bătăliei:", err);
    return res.status(500).json({
      success: false,
      message: "Eroare internă la actualizarea scorurilor.",
    });
  }
});

app.get("/leaderboard-teams", async (req, res) => {
  try {
    const teams = await prisma.team.findMany({
      include: {
        members: true,
      },
    });

    const rankedTeams = teams
      .map((team) => {
        const totalWins = team.members.reduce(
          (sum, member) => sum + member.battlesWon,
          0,
        );
        return {
          id: team.id,
          name: team.name,
          color: team.colorHex,
          score: totalWins,
        };
      })
      .sort((a, b) => b.score - a.score);
    res.json(rankedTeams);
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

app.get("/team-history/:teamId", async (req, res) => {
  const { teamId } = req.params;

  try {
    const history = await prisma.battleLog.findMany({
      where: {
        OR: [
          { winnerTeamId: parseInt(teamId) },
          { loserTeamId: parseInt(teamId) },
        ],
      },
      include: {
        winnerTeam: { select: { name: true, colorHex: true } },
        loserTeam: { select: { name: true, colorHex: true } },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const formattedHistory = history.map((log) => {
      const isWinner = log.winnerTeamId === parseInt(teamId);
      return {
        id: log.id,
        date: log.createdAt,
        result: isWinner ? "VICTORY" : "DEFEAT",
        opponent: isWinner ? log.loserTeam.name : log.winnerTeam.name,
        opponentColor: isWinner
          ? log.loserTeam.colorHex
          : log.winnerTeam.colorHex,
        percentage: log.winPercentage,
      };
    });

    res.json({ success: true, history: formattedHistory });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ success: false, message: "Eroare la încărcarea istoricului" });
  }
});

app.get("/users", async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
      },
    });
    return res.json({ success: true, users });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false });
  }
});

app.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      include: { team: true },
    });

    if (!user) return res.json({ success: false, message: "User not found" });

    let teamInviteCode = user.team?.inviteCode || null;

    // Backfill pentru echipe create înainte de inviteCode.
    if (user.team && !teamInviteCode) {
      teamInviteCode = await generateUniqueInviteCode(prisma);
      await prisma.team.update({
        where: { id: user.team.id },
        data: { inviteCode: teamInviteCode },
      });
    }

    return res.json({
      success: true,
      user: {
        username: user.username,
        battlesWon: user.battlesWon,
        battlesLost: user.battlesLost,
        teamName: user.team?.name || null,
        teamPassword: user.team?.password || null,
        teamInviteCode,
        teamColor: user.team?.colorHex || null,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

app.get("/teams", async (req, res) => {
  try {
    const teams = await prisma.team.findMany({
      include: {
        members: {
          select: {
            id: true,
            username: true,
            battlesWon: true,
            battlesLost: true,
          },
        },
      },
    });

    return res.json({
      success: true,
      teams: teams,
    });
  } catch (err) {
    console.error("Eroare la preluarea echipelor:", err);
    return res.status(500).json({ success: false });
  }
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
