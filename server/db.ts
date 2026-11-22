import pg from 'pg';
import fs from 'fs';
import path from 'path';

const { Pool } = pg;

export interface Participant {
  id: string;
  name: string;
  order_index: number;
  avatar_color: string;
}

export interface Gift {
  id: string;
  participant_id: string;
  name: string;
  price: number | null;
  url: string | null;
  image_url: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface BackupData {
  participants: Participant[];
  gifts: Gift[];
  last_updated: string;
}

export const INITIAL_PARTICIPANTS: Participant[] = [
  { id: 'pamela', name: 'Pamela', order_index: 1, avatar_color: 'from-rose-500 to-pink-600' },
  { id: 'cote', name: 'Cote', order_index: 2, avatar_color: 'from-amber-500 to-orange-600' },
  { id: 'joaquin', name: 'Joaquín', order_index: 3, avatar_color: 'from-emerald-500 to-teal-600' },
  { id: 'nacho', name: 'Nacho', order_index: 4, avatar_color: 'from-blue-500 to-cyan-600' },
  { id: 'coni', name: 'Coni', order_index: 5, avatar_color: 'from-purple-500 to-fuchsia-600' },
  { id: 'ale', name: 'Ale', order_index: 6, avatar_color: 'from-violet-500 to-indigo-600' },
  { id: 'carla', name: 'Carla', order_index: 7, avatar_color: 'from-pink-500 to-rose-600' },
  { id: 'mindy', name: 'Mindy', order_index: 8, avatar_color: 'from-teal-500 to-emerald-600' },
  { id: 'mauri', name: 'Mauri', order_index: 9, avatar_color: 'from-cyan-500 to-blue-600' },
  { id: 'tonka', name: 'Tonka', order_index: 10, avatar_color: 'from-amber-400 to-yellow-600' },
  { id: 'monse', name: 'Monse', order_index: 11, avatar_color: 'from-red-500 to-rose-600' },
];

const BACKUP_FILE = path.resolve(process.cwd(), 'data', 'backup_gifts.json');

// Ensure data directory exists
function ensureDataDir() {
  const dir = path.dirname(BACKUP_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Read from JSON backup
export function readBackup(): BackupData {
  try {
    ensureDataDir();
    if (fs.existsSync(BACKUP_FILE)) {
      const content = fs.readFileSync(BACKUP_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Error leyendo backup JSON:', err);
  }
  return {
    participants: INITIAL_PARTICIPANTS,
    gifts: [],
    last_updated: new Date().toISOString(),
  };
}

// Write to JSON backup
export function writeBackup(data: BackupData) {
  try {
    ensureDataDir();
    fs.writeFileSync(BACKUP_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error guardando backup JSON:', err);
  }
}

let pool: pg.Pool | null = null;
let usePostgres = false;

export async function initDb() {
  const dbUrl = process.env.DATABASE_URL;

  if (dbUrl) {
    try {
      pool = new Pool({
        connectionString: dbUrl,
        ssl: dbUrl.includes('localhost') ? false : { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000,
      });

      // Test connection
      const client = await pool.connect();
      client.release();
      usePostgres = true;
      console.log('✅ Conectado exitosamente a PostgreSQL de Render');

      // Create tables
      await pool.query(`
        CREATE TABLE IF NOT EXISTS participants (
          id VARCHAR(50) PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          order_index INT NOT NULL,
          avatar_color VARCHAR(100) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS gifts (
          id VARCHAR(50) PRIMARY KEY,
          participant_id VARCHAR(50) NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          price INT,
          url TEXT,
          image_url TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);

      // Seed participants if empty
      const { rowCount } = await pool.query('SELECT 1 FROM participants LIMIT 1');
      if (rowCount === 0) {
        console.log('🌱 Inicializando lista de 11 participantes en PostgreSQL...');
        for (const p of INITIAL_PARTICIPANTS) {
          await pool.query(
            'INSERT INTO participants (id, name, order_index, avatar_color) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING',
            [p.id, p.name, p.order_index, p.avatar_color]
          );
        }

        // Restore gifts from backup if present
        const backup = readBackup();
        if (backup.gifts && backup.gifts.length > 0) {
          console.log(`📦 Restaurando ${backup.gifts.length} regalos desde el respaldo JSON hacia PostgreSQL...`);
          for (const g of backup.gifts) {
            await pool.query(
              'INSERT INTO gifts (id, participant_id, name, price, url, image_url) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO NOTHING',
              [g.id, g.participant_id, g.name, g.price, g.url, g.image_url]
            );
          }
        }
      }
    } catch (err: any) {
      console.warn('⚠️ No se pudo conectar a PostgreSQL. Operando con almacenamiento JSON local:', err?.message || err);
      usePostgres = false;
    }
  } else {
    console.log('ℹ️ DATABASE_URL no configurada. Operando con almacenamiento JSON local.');
    usePostgres = false;
  }

  // If running on JSON, make sure backup file exists with participants
  if (!usePostgres) {
    const backup = readBackup();
    if (!backup.participants || backup.participants.length === 0) {
      writeBackup({
        participants: INITIAL_PARTICIPANTS,
        gifts: [],
        last_updated: new Date().toISOString(),
      });
    }
  }
}

// Synchronize all DB data to local JSON backup
export async function syncToJsonBackup() {
  if (!usePostgres || !pool) return;
  try {
    const pRes = await pool.query('SELECT id, name, order_index, avatar_color FROM participants ORDER BY order_index ASC');
    const gRes = await pool.query('SELECT id, participant_id, name, price, url, image_url, created_at, updated_at FROM gifts ORDER BY created_at ASC');
    writeBackup({
      participants: pRes.rows,
      gifts: gRes.rows,
      last_updated: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('Error sincronizando a JSON backup:', err);
  }
}

// DB Access Methods
export async function getParticipantsWithGifts() {
  if (usePostgres && pool) {
    const pRes = await pool.query('SELECT id, name, order_index, avatar_color FROM participants ORDER BY order_index ASC');
    const gRes = await pool.query('SELECT id, participant_id, name, price, url, image_url, created_at, updated_at FROM gifts ORDER BY created_at ASC');

    const giftsByParticipant: Record<string, Gift[]> = {};
    for (const g of gRes.rows) {
      if (!giftsByParticipant[g.participant_id]) {
        giftsByParticipant[g.participant_id] = [];
      }
      giftsByParticipant[g.participant_id].push(g);
    }

    return pRes.rows.map((p) => ({
      ...p,
      gifts: giftsByParticipant[p.id] || [],
    }));
  }

  // Fallback to JSON
  const backup = readBackup();
  const giftsByParticipant: Record<string, Gift[]> = {};
  for (const g of backup.gifts) {
    if (!giftsByParticipant[g.participant_id]) {
      giftsByParticipant[g.participant_id] = [];
    }
    giftsByParticipant[g.participant_id].push(g);
  }

  return (backup.participants || INITIAL_PARTICIPANTS).map((p) => ({
    ...p,
    gifts: giftsByParticipant[p.id] || [],
  }));
}

export async function addGift(gift: {
  participant_id: string;
  name: string;
  price: number | null;
  url: string | null;
  image_url: string | null;
}) {
  const id = `gift_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const newGift: Gift = {
    id,
    participant_id: gift.participant_id,
    name: gift.name,
    price: gift.price,
    url: gift.url,
    image_url: gift.image_url,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (usePostgres && pool) {
    await pool.query(
      `INSERT INTO gifts (id, participant_id, name, price, url, image_url)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [newGift.id, newGift.participant_id, newGift.name, newGift.price, newGift.url, newGift.image_url]
    );
    await syncToJsonBackup();
    return newGift;
  }

  const backup = readBackup();
  backup.gifts.push(newGift);
  backup.last_updated = new Date().toISOString();
  writeBackup(backup);
  return newGift;
}

export async function updateGift(
  id: string,
  updates: {
    name?: string;
    price?: number | null;
    url?: string | null;
    image_url?: string | null;
  }
) {
  if (usePostgres && pool) {
    const res = await pool.query(
      `UPDATE gifts
       SET name = COALESCE($1, name),
           price = COALESCE($2, price),
           url = COALESCE($3, url),
           image_url = COALESCE($4, image_url),
           updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [updates.name, updates.price, updates.url, updates.image_url, id]
    );
    await syncToJsonBackup();
    return res.rows[0] || null;
  }

  const backup = readBackup();
  const index = backup.gifts.findIndex((g) => g.id === id);
  if (index === -1) return null;

  backup.gifts[index] = {
    ...backup.gifts[index],
    ...updates,
    updated_at: new Date().toISOString(),
  };
  backup.last_updated = new Date().toISOString();
  writeBackup(backup);
  return backup.gifts[index];
}

export async function deleteGift(id: string) {
  if (usePostgres && pool) {
    const res = await pool.query('DELETE FROM gifts WHERE id = $1 RETURNING id', [id]);
    await syncToJsonBackup();
    return (res.rowCount || 0) > 0;
  }

  const backup = readBackup();
  const initialLength = backup.gifts.length;
  backup.gifts = backup.gifts.filter((g) => g.id !== id);
  const deleted = backup.gifts.length < initialLength;
  if (deleted) {
    backup.last_updated = new Date().toISOString();
    writeBackup(backup);
  }
  return deleted;
}
