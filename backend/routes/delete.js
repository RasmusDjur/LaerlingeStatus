const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

// DELETE: Slet alt
router.delete('/all', async (req, res) => {
  try {
    await prisma.StudentStat.deleteMany();
    await prisma.UploadedFile.deleteMany();
    await prisma.$executeRawUnsafe(`DELETE FROM sqlite_sequence WHERE name='UploadedFile'`);
    await prisma.$executeRawUnsafe(`DELETE FROM sqlite_sequence WHERE name='StudentStat'`);
    res.json({ message: 'Alle uploads og deres data er slettet.' });
  } catch (error) {
    console.error('Fejl ved sletning:', error);
    res.status(500).json({ error: 'Noget gik galt ved sletning.' });
  }
});

module.exports = router;
