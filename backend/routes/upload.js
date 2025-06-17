const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

const storage = multer.memoryStorage();
const upload = multer({ storage });

// POST: Upload fil
router.post('/', upload.single('file'), async (req, res) => {
  try {
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const b3 = worksheet['B3']?.v || '';
    const ugeMatch = b3.match(/uge\s*\d+\s*[-–]\s*\d{4}/i);
    const fileName = ugeMatch ? ugeMatch[0].trim() : new Date().toISOString();

    const rows = xlsx.utils.sheet_to_json(worksheet, { header: 1 }).slice(5, 9);
    const statsData = rows.map(row => ({
      name: row[1]?.toString().trim() || 'Ukendt',
      oplæring: Number(row[2]) || 0,
      skole: Number(row[3]) || 0,
      vfo: Number(row[4]) || 0,
      delaftale: Number(row[5]) || 0,
      iAlt: Number(row[6]) || 0,
      muligePåVej: Number(row[7]) || 0,
      oversigt2023: Number(row[8]) || 0,
    }));

    const uploadedFile = await prisma.uploadedFile.create({
      data: {
        name: fileName,
        stats: { create: statsData },
      },
      include: { stats: true },
    });

    res.json({ filename: uploadedFile.name });
  } catch (error) {
    console.error('UPLOAD FEJL:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// GET: Hent filnavne
router.get('/', async (req, res) => {
  try {
    const uploads = await prisma.uploadedFile.findMany({
      orderBy: { id: 'desc' },
    });
    res.json(uploads);
  } catch (err) {
    console.error('Fejl ved hentning af uploads:', err);
    res.status(500).json({ error: 'Kunne ikke hente uploads' });
  }
});

// POST: Compare
router.post('/compare', async (req, res) => {
  const { filenames } = req.body;
  try {
    const files = await prisma.uploadedFile.findMany({
      where: { name: { in: filenames } },
      include: { stats: true },
    });

    const result = files.map(file => ({
      file: file.name,
      stats: file.stats.map(stat => ({
        name: stat.name,
        oplæring: stat.oplæring,
        skole: stat.skole,
        vfo: stat.vfo,
        delaftale: stat.delaftale,
        iAlt: stat.iAlt,
        muligePåVej: stat.muligePåVej,
        oversigt2023: stat.oversigt2023,
      })),
    }));

    res.json(result);
  } catch (err) {
    console.error('Fejl ved sammenligning:', err);
    res.status(500).json({ error: 'Kunne ikke hente data' });
  }
});

module.exports = router;




