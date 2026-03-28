import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import prismaPkg from '@prisma/client';
import bcrypt from 'bcrypt';
import cors from 'cors';
import 'dotenv/config';
import express from 'express';

const { PrismaClient } = prismaPkg;
const adapter = new PrismaBetterSqlite3({ url: 'file:./dev.db' });

const app = express();
const prisma = new PrismaClient({ adapter });

app.use(cors());
app.use(express.json());

app.post('/register', async (req, res) => {
  try {
    const { username, password, confirmPassword } = req.body;

    if (!username || !password || !confirmPassword) {
      return res.json({ success: false });
    }

    if (password !== confirmPassword ) {
      return res.json({ success: false });
    }

    const existingUser = await prisma.user.findUnique({
      where: { username }
    });

    if (existingUser) {
      return res.json({ success: false });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {   
        username,
        password: hashedPassword
      }
    });

    return res.json({ success: true });

  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.json({ success: false });
    }

    const user = await prisma.user.findUnique({
      where: { username }
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
      userId: user.id
    });

  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false });
  }
});

app.delete('/delete-user', async (req, res) => {
  try {
    const { username } = req.body;

    if (!username) {
      return res.json({ success: false, message: "No username provided" });
    }

    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    await prisma.user.delete({
      where: { username }
    });

    return res.json({ success: true });

  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false });
  }
});


app.delete('/delete-all-users', async (req, res) => {
  try {
    // deleteMany() fără niciun filtru (unde {}) șterge TOT din tabel
    const result = await prisma.user.deleteMany({});

    return res.json({ 
      success: true, 
      message: `Au fost șterși toți cei ${result.count} utilizatori din baza de date.` 
    });

  } catch (err) {
    console.error("Eroare la ștergerea globală:", err);
    return res.status(500).json({ 
      success: false, 
      message: "Nu s-au putut șterge utilizatorii." 
    });
  }
});


app.post('/create-team', async (req, res) => {
  const { teamName, userId, password, colorHex } = req.body;

  if (!teamName || !userId || !password || !colorHex) {
    return res.json({ success: false, message: "Missing teamName, userId, password, or colorHex" });
  }

  try {

    const result = await prisma.$transaction(async (tx) => {
      
    const newTeam = await tx.team.create({
      data: {
        name: teamName,
        password: password,
        colorHex: colorHex || "#AF52DE",
      }
    });
    await tx.user.update({
      where: { id: parseInt(userId) },
      data: { teamId: newTeam.id }
    });
    return newTeam;
  });

  return { success: true, teamId: result.id, teamName: result.name, colorHex: result.colorHex };

  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false, message: "Error creating team" });
  }
});

app.post('/join-team', async (req, res) => {
  const { teamName, password, userId } = req.body;

  if (!teamName || !password || !userId) {
    return res.status(400).json({ success: false, message: "Missing teamName, password or userId" });
  }

  try {
    const team = await prisma.team.findUnique({
      where: { name: teamName }
    });

    if (!team) {
      return res.json({ success: false, message: "Team not found" });
    }

    
    if (team.password !== password) {
      return res.json({ success: false, message: "Incorrect password" });
    }

    
    await prisma.user.update({
      where: { id: parseInt(userId) },
      data: { teamId: team.id }
    });

    return res.json({ 
      success: true, 
      teamId: team.id, 
      teamName: team.name,
      colorHex: team.colorHex 
    });

  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false, message: "Error joining team" });
  }
});


app.post('/battle-won', async (req, res) => {
  const { winnerTeamId, loserTeamId, winnerUserId, loserUserId, percentage } = req.body;

  if(percentage === undefined || percentage === null || percentage < 50.1) {
    return res.status(400).json({ success: false, message: "Invalid percentage value" });
  }

  try {
    await prisma.$transaction(async (tx) => {
      
      if (winnerTeamId) {
        await tx.user.updateMany({
          where: { teamId: parseInt(winnerTeamId) },
          data: { battlesWon: { increment: 1 } }
        });
      } else if (winnerUserId) {
        await tx.user.update({
          where: { id: parseInt(winnerUserId) },
          data: { battlesWon: { increment: 1 } }
        });
      }

      if (loserTeamId) {
        await tx.user.updateMany({
          where: { teamId: parseInt(loserTeamId) },
          data: { battlesLost: { increment: 1 } }
        });
      } else if (loserUserId) {
        await tx.user.update({
          where: { id: parseInt(loserUserId) },
          data: { battlesLost: { increment: 1 } }
        });
      }

      if (winnerTeamId && loserTeamId) {
        await tx.battleLog.create({
          data: {
            winnerTeamId: parseInt(winnerTeamId),
            loserTeamId: parseInt(loserTeamId),
            winPercentage: parseFloat(percentage || 0)
          }
        });
      }
    });

    return res.json({ 
      success: true, 
      message: "Bătălia a fost înregistrată cu succes în profilul utilizatorilor!" 
    });

  } catch (err) {
    console.error("Eroare la procesarea bătăliei:", err);
    return res.status(500).json({ 
      success: false, 
      message: "Eroare internă la actualizarea scorurilor." 
    });
  }
});

app.get('/leaderboard-teams', async (req, res) => {
  try {
    const teams = await prisma.team.findMany({
      include: {
        members: true
      }
    });

    const rankedTeams = teams.map(team => {
      const totalWins = team.members.reduce((sum, member) => sum + member.battlesWon, 0);
      return {
        id: team.id,
        name: team.name,
        color: team.colorHex,
        score: totalWins
      };
    }).sort((a, b) => b.score - a.score);
    res.json(rankedTeams);
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

app.get('/team-history/:teamId', async (req, res) => {
  const { teamId } = req.params;

  try {
    const history = await prisma.battleLog.findMany({
      where: {
        OR: [
          { winnerTeamId: parseInt(teamId) },
          { loserTeamId: parseInt(teamId) }
        ]
      },
      include: {
        winnerTeam: { select: { name: true, colorHex: true } },
        loserTeam: { select: { name: true, colorHex: true } }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const formattedHistory = history.map(log => {
      const isWinner = log.winnerTeamId === parseInt(teamId);
      return {
        id: log.id,
        date: log.createdAt,
        result: isWinner ? 'VICTORIE' : 'ÎNFRÂNGERE',
        opponent: isWinner ? log.loserTeam.name : log.winnerTeam.name,
        opponentColor: isWinner ? log.loserTeam.colorHex : log.winnerTeam.colorHex,
        percentage: log.winPercentage
      };
    });

    res.json({ success: true, history: formattedHistory });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Eroare la încărcarea istoricului" });
  }
});

app.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
      }
    });
    return res.json({ success: true, users });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false });
  }
});

app.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      include: { team: true }
    });

    if (!user) return res.json({ success: false, message: "User not found" });


    return res.json({
      success: true,
      user: {
        username: user.username,
        battlesWon: user.battlesWon,
        battlesLost: user.battlesLost,
        teamName: user.team?.name || null,
        teamColor: user.team?.colorHex || null
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

app.get('/teams', async (req, res) => {
  try {
    const teams = await prisma.team.findMany({
      include: {
        members: {
          select: {
            id: true,
            username: true,
            battlesWon: true,
            battlesLost: true,
          }
        }
      }
    });

    return res.json({ 
      success: true, 
      teams: teams
    });
  } catch (err) {
    console.error("Eroare la preluarea echipelor:", err);
    return res.status(500).json({ success: false });
  }
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});