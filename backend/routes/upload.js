const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/', upload.single('file'), async (req, res) => {
  try {
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const b3 = worksheet['B3']?.v || '';
    const ugeMatch = b3.match(/uge\s*\d+\s*[-–]\s*(\d{4})/i);
    const year = ugeMatch ? parseInt(ugeMatch[1], 10) : new Date().getFullYear();
    const fileName = ugeMatch ? ugeMatch[0].trim() : new Date().toISOString();

    // 🚫 Tjek om fil allerede findes
    const existing = await prisma.uploadedFile.findUnique({
      where: { name: fileName },
    });

    if (existing) {
      return res.status(400).json({ error: 'Denne fil er allerede uploadet.' });
    }

    let rows = [];
    const useMultipleRows = year >= 2024;

    if (useMultipleRows) {
      rows = xlsx.utils.sheet_to_json(worksheet, { header: 1 }).slice(5, 9);
    } else {
      const allRows = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
      rows = [allRows[5]];
    }

    const statsData = rows.map(row => ({
      name: row[1]?.toString().trim() || 'Ukendt',
      oplæring: Number(row[2]) || 0,
      skole: Number(row[3]) || 0,
      vfo: Number(row[4]) || 0,  
      delaftale: Number(row[5]) || 0,
      iAlt: Number(row[6]) || 0,
      muligePåVej: Number(row[7]) || 0,
    }));

    const uploadedFile = await prisma.uploadedFile.create({
      data: {
        name: fileName,
        year: year,
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


// GET: Returner unikke årstal
router.get('/', async (req, res) => {
  try {
    const uploads = await prisma.uploadedFile.findMany({
      select: { year: true },
      distinct: ['year'],
      orderBy: { year: 'desc' },
    });

    const years = uploads.map(u => u.year.toString());
    res.json(years);
  } catch (err) {
    console.error('Fejl ved hentning af år:', err);
    res.status(500).json({ error: 'Kunne ikke hente år' });
  }
});

// POST: Compare (baseret på valgte årstal)
router.post('/compare', async (req, res) => {
  const { years } = req.body; // forventer fx: ["2023", "2024"]

  try {
    const files = await prisma.uploadedFile.findMany({
      where: {
        year: {
          in: years.map(Number),
        },
      },
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
      })),
    }));

    res.json(result);
  } catch (err) {
    console.error('Fejl ved sammenligning:', err);
    res.status(500).json({ error: 'Kunne ikke hente data' });
  }
});


module.exports = router;




