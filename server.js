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

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});