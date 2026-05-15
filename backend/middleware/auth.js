import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
);

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Autenticação necessária.' });
  }

  const token = header.slice(7);

  let result;
  try {
    result = await supabase.auth.getUser(token);
  } catch (err) {
    console.error('[auth] falha ao contatar Supabase:', err.message);
    return res.status(503).json({ error: 'Serviço de autenticação indisponível. Tente novamente.' });
  }

  const { data, error } = result;
  if (error || !data?.user) {
    return res.status(401).json({ error: 'Sessão inválida ou expirada. Faça login novamente.' });
  }

  req.user = data.user;
  next();
}
