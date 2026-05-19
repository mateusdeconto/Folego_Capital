import { Router } from 'express';
import { createHmac } from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

function makeSignature(userId) {
  const secret = process.env.UNSUBSCRIBE_SECRET;
  if (!secret) return null;
  return createHmac('sha256', secret).update(userId).digest('hex');
}

export function makeUnsubscribeUrl(userId) {
  const base = process.env.APP_URL || '';
  const sig = makeSignature(userId);
  if (!base || !sig) return null;
  return `${base}/api/unsubscribe?uid=${encodeURIComponent(userId)}&sig=${sig}`;
}

// GET /api/unsubscribe?uid=...&sig=... — sem autenticação (link do email)
router.get('/', async (req, res) => {
  const { uid, sig } = req.query;

  if (!uid || !sig) {
    return res.status(400).type('text/html').send(`
      <html><body style="font-family:sans-serif;max-width:480px;margin:60px auto;text-align:center">
        <h2>Link inválido</h2><p>O link de cancelamento está incompleto.</p>
      </body></html>
    `);
  }

  const expectedSig = makeSignature(uid);
  if (!expectedSig || sig !== expectedSig) {
    return res.status(403).type('text/html').send(`
      <html><body style="font-family:sans-serif;max-width:480px;margin:60px auto;text-align:center">
        <h2>Link inválido</h2><p>Assinatura incorreta. Use o link enviado no e-mail.</p>
      </body></html>
    `);
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const { error } = await supabase.auth.admin.updateUserById(uid, {
    user_metadata: { email_marketing_opt_in: false },
  });

  if (error) {
    console.error('[unsubscribe] erro:', error.message);
    return res.status(500).type('text/html').send(`
      <html><body style="font-family:sans-serif;max-width:480px;margin:60px auto;text-align:center">
        <h2>Erro ao processar</h2><p>Tente novamente em instantes ou entre em contato: folegocapital@gmail.com</p>
      </body></html>
    `);
  }

  console.log('[unsubscribe] opt-out gravado para:', uid);
  res.type('text/html').send(`
    <html><body style="font-family:sans-serif;max-width:480px;margin:60px auto;text-align:center;color:#333">
      <h2 style="color:#2d6a4f">Descadastrado com sucesso</h2>
      <p>Você não receberá mais lembretes mensais do Fôlego Capital.</p>
      <p style="font-size:13px;color:#777;margin-top:32px">
        Mudou de ideia?
        <a href="${process.env.APP_URL || '#'}" style="color:#2d6a4f">Acesse sua conta</a>
        para reativar os lembretes.
      </p>
    </body></html>
  `);
});

// POST /api/unsubscribe/preferences — atualiza preferências (usuário autenticado)
router.post('/preferences', requireAuth, async (req, res) => {
  const { email_marketing_opt_in } = req.body;
  if (typeof email_marketing_opt_in !== 'boolean') {
    return res.status(400).json({ error: 'email_marketing_opt_in deve ser boolean.' });
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const { error } = await supabase.auth.admin.updateUserById(req.user.id, {
    user_metadata: { email_marketing_opt_in },
  });

  if (error) {
    console.error('[unsubscribe/preferences] erro:', error.message);
    return res.status(500).json({ error: 'Erro ao salvar preferência.' });
  }

  res.json({ ok: true });
});

export default router;
