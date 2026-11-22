import { Router, Request, Response } from 'express';
import { requireAdmin } from './auth';
import {
  getParticipantsWithGifts,
  addGift,
  updateGift,
  deleteGift,
  readBackup,
} from '../db';

const router = Router();

// Public: Get all participants and their gifts
router.get('/participants', async (_req: Request, res: Response) => {
  try {
    const data = await getParticipantsWithGifts();
    return res.json({ success: true, participants: data });
  } catch (err: any) {
    console.error('Error obteniendo participantes:', err);
    return res.status(500).json({ error: 'Error interno al consultar la lista' });
  }
});

// Admin: Add a gift option to a participant
router.post('/gifts', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { participant_id, name, price, url, image_url } = req.body;

    if (!participant_id || !name) {
      return res.status(400).json({ error: 'El participante y el nombre del regalo son requeridos' });
    }

    const gift = await addGift({
      participant_id,
      name: name.trim(),
      price: price ? Number(price) : null,
      url: url ? url.trim() : null,
      image_url: image_url ? image_url.trim() : null,
    });

    return res.status(201).json({ success: true, gift });
  } catch (err: any) {
    console.error('Error agregando regalo:', err);
    return res.status(500).json({ error: err?.message || 'Error al guardar el regalo' });
  }
});

// Admin: Update a gift option
router.put('/gifts/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, price, url, image_url } = req.body;

    const updated = await updateGift(id, {
      name: name ? name.trim() : undefined,
      price: price !== undefined ? (price ? Number(price) : null) : undefined,
      url: url !== undefined ? (url ? url.trim() : null) : undefined,
      image_url: image_url !== undefined ? (image_url ? image_url.trim() : null) : undefined,
    });

    if (!updated) {
      return res.status(404).json({ error: 'Regalo no encontrado' });
    }

    return res.json({ success: true, gift: updated });
  } catch (err: any) {
    console.error('Error actualizando regalo:', err);
    return res.status(500).json({ error: err?.message || 'Error al actualizar el regalo' });
  }
});

// Admin: Delete a gift option
router.delete('/gifts/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await deleteGift(id);

    if (!deleted) {
      return res.status(404).json({ error: 'Regalo no encontrado' });
    }

    return res.json({ success: true, message: 'Regalo eliminado correctamente' });
  } catch (err: any) {
    console.error('Error eliminando regalo:', err);
    return res.status(500).json({ error: err?.message || 'Error al eliminar el regalo' });
  }
});

// Admin: Export complete JSON backup
router.get('/backup/export', requireAdmin, (_req: Request, res: Response) => {
  try {
    const backup = readBackup();
    res.setHeader('Content-Disposition', 'attachment; filename="amigo_secreto_backup.json"');
    res.setHeader('Content-Type', 'application/json');
    return res.send(JSON.stringify(backup, null, 2));
  } catch (err: any) {
    return res.status(500).json({ error: 'Error exportando backup' });
  }
});

export default router;
