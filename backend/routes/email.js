import express from 'express';
import nodemailer from 'nodemailer';
import rateLimit from 'express-rate-limit';
import { requireAuth } from '../middleware/auth.js';
import { escapeHtml, applyBold } from '../lib/htmlUtils.js';

const router = express.Router();

const emailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  keyGenerator: (req) => req.user?.id ?? req.ip,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitos envios em sequência. Aguarde alguns minutos.' },
});

function fmt(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);
}

export function createTransporter() {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
  });
}

function buildEmailHtml({ businessData, financialData, diagnosis, metrics }) {
  const date = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  const month = businessData.referenceMonth
    ? new Date(businessData.referenceMonth + '-02').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    : date;

  const safeName    = escapeHtml(businessData.businessName);
  const safeSegment = escapeHtml(businessData.segment);

  const diagHtml = (diagnosis || '')
    .split('\n')
    .map(line => {
      const t = line.trim();
      if (t.startsWith('## ')) return `<h3 style="color:#111827;font-size:15px;margin:20px 0 6px;">${escapeHtml(t.slice(3))}</h3>`;
      if (t.startsWith('• ') || t.startsWith('- ')) return `<li style="color:#374151;font-size:14px;margin-bottom:4px;">${applyBold(escapeHtml(t.slice(2)))}</li>`;
      if (!t) return '';
      return `<p style="color:#374151;font-size:14px;margin:6px 0;">${applyBold(escapeHtml(t))}</p>`;
    })
    .join('\n');

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">

        <tr><td style="background:#1a3a2a;padding:28px 32px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <span style="color:#ffffff;font-weight:800;font-size:18px;letter-spacing:-0.5px;">Fôlego</span>
                <span style="color:#c9a227;font-weight:600;font-size:17px;letter-spacing:-0.5px;"> Capital</span>
              </td>
              <td align="right">
                <span style="color:#a8c4b0;font-size:12px;">${date}</span>
              </td>
            </tr>
          </table>
          <h1 style="color:#ffffff;font-size:22px;font-weight:700;margin:16px 0 4px;letter-spacing:-0.5px;">
            Diagnóstico financeiro
          </h1>
          <p style="color:#a8c4b0;font-size:14px;margin:0;">${safeName} · ${safeSegment} · ${month}</p>
        </td></tr>

        <tr><td style="padding:28px 32px 0;">
          <p style="font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.8px;margin:0 0 16px;">Resumo do mês</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;">
            <tr>
              <td style="padding:16px;border-right:1px solid #e5e7eb;text-align:center;">
                <p style="font-size:11px;color:#6b7280;margin:0 0 4px;text-transform:uppercase;">Receita</p>
                <p style="font-size:18px;font-weight:700;color:#111827;margin:0;font-variant-numeric:tabular-nums;">${fmt(financialData.revenue)}</p>
              </td>
              <td style="padding:16px;border-right:1px solid #e5e7eb;text-align:center;">
                <p style="font-size:11px;color:#6b7280;margin:0 0 4px;text-transform:uppercase;">Lucro líquido</p>
                <p style="font-size:18px;font-weight:700;color:${metrics.netProfit >= 0 ? '#2d6a4f' : '#ef4444'};margin:0;font-variant-numeric:tabular-nums;">${fmt(metrics.netProfit)}</p>
              </td>
              <td style="padding:16px;text-align:center;">
                <p style="font-size:11px;color:#6b7280;margin:0 0 4px;text-transform:uppercase;">Margem líquida</p>
                <p style="font-size:18px;font-weight:700;color:#111827;margin:0;">${metrics.netMargin.toFixed(1)}%</p>
              </td>
            </tr>
          </table>

          <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;">
            <tr>
              <td style="padding:10px 14px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;text-align:center;" width="50%">
                <p style="font-size:11px;color:#6b7280;margin:0 0 2px;text-transform:uppercase;">Caixa atual</p>
                <p style="font-size:16px;font-weight:700;color:#111827;margin:0;font-variant-numeric:tabular-nums;">${fmt(financialData.cashBalance)}</p>
              </td>
              <td width="8px"></td>
              <td style="padding:10px 14px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;text-align:center;" width="50%">
                <p style="font-size:11px;color:#6b7280;margin:0 0 2px;text-transform:uppercase;">Ponto de equilíbrio</p>
                <p style="font-size:16px;font-weight:700;color:#111827;margin:0;font-variant-numeric:tabular-nums;">${fmt(metrics.breakEven)}</p>
              </td>
            </tr>
          </table>
        </td></tr>

        <tr><td style="padding:28px 32px 0;">
          <p style="font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.8px;margin:0 0 16px;">Diagnóstico completo</p>
          <div style="font-size:14px;color:#374151;line-height:1.6;">${diagHtml}</div>
        </td></tr>

        <tr><td style="padding:28px 32px;border-top:1px solid #f3f4f6;margin-top:24px;">
          <p style="font-size:12px;color:#9ca3af;margin:0 0 4px;">Este relatório foi gerado automaticamente pelo Fôlego Capital.</p>
          <p style="font-size:12px;color:#9ca3af;margin:0;">Acesse: <a href="https://fincheck-production-94bb.up.railway.app" style="color:#2d6a4f;">fincheck-production-94bb.up.railway.app</a></p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

router.post('/', requireAuth, emailLimiter, async (req, res) => {
  const { businessData, financialData, diagnosis, metrics } = req.body;
  const toEmail = req.user.email;

  if (!toEmail || !businessData || !financialData || !diagnosis) {
    return res.status(400).json({ error: 'Dados incompletos.' });
  }

  if (!metrics || typeof metrics.netProfit !== 'number' || typeof metrics.netMargin !== 'number' || typeof metrics.breakEven !== 'number') {
    return res.status(400).json({ error: 'Métricas financeiras ausentes ou inválidas.' });
  }

  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.error('[email] GMAIL_USER ou GMAIL_APP_PASSWORD não configurados');
    return res.status(503).json({ error: 'Serviço de e-mail não configurado.' });
  }

  try {
    const transporter = createTransporter();

    const month = businessData.referenceMonth
      ? new Date(businessData.referenceMonth + '-02').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
      : new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

    console.log('[email] enviando para:', toEmail);

    await transporter.sendMail({
      from: `"Fôlego Capital" <${process.env.GMAIL_USER}>`,
      to: toEmail,
      subject: `Diagnóstico financeiro — ${businessData.businessName.replace(/[\r\n]/g, ' ')} · ${month}`,
      html: buildEmailHtml({ businessData, financialData, diagnosis, metrics }),
    });

    console.log('[email] enviado com sucesso para:', toEmail);
    res.json({ ok: true });
  } catch (err) {
    console.error('[email] erro ao enviar:', err.message);
    res.status(500).json({ error: 'Falha ao enviar e-mail. Tente novamente.' });
  }
});

export default router;
