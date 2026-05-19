import cron from 'node-cron';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';
import { createTransporter } from '../routes/email.js';

function buildReminderHtml() {
  const month = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f0;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;">

        <tr>
          <td align="center" style="padding-bottom:24px;">
            <span style="font-size:22px;font-weight:800;color:#1a1a1a;letter-spacing:-0.5px;">Fôlego</span>
            <span style="font-size:20px;font-weight:600;color:#c9a227;letter-spacing:-0.5px;"> Capital</span>
          </td>
        </tr>

        <tr>
          <td style="background:#ffffff;border-radius:16px;border:1px solid #e5e5e0;overflow:hidden;">

            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#1a3a2a;padding:28px 36px 24px;">
                  <p style="margin:0 0 8px;font-size:12px;color:#a8c4b0;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Lembrete mensal</p>
                  <h1 style="margin:0;font-size:24px;font-weight:800;color:#ffffff;line-height:1.2;">
                    Novo mês, nova análise!
                  </h1>
                </td>
              </tr>
            </table>

            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:28px 36px;">
                  <p style="margin:0 0 16px;font-size:15px;color:#4a4a4a;line-height:1.6;">
                    <strong style="color:#1a1a1a;">${month}</strong> chegou — hora de registrar os números do seu negócio e ver como ele evoluiu.
                  </p>

                  <p style="margin:0 0 24px;font-size:14px;color:#7a7a7a;line-height:1.6;">
                    Empresários que acompanham mensalmente identificam problemas antes que virem crises.
                    Leva menos de 5 minutos.
                  </p>

                  <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                    <tr>
                      <td style="background:#2d6a4f;border-radius:10px;">
                        <a href="https://fincheck-production-94bb.up.railway.app"
                           style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;">
                          Fazer análise de ${month} →
                        </a>
                      </td>
                    </tr>
                  </table>

                  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f0;border-radius:10px;padding:0;">
                    <tr>
                      <td style="padding:16px 20px;">
                        <p style="margin:0 0 10px;font-size:12px;font-weight:700;color:#9a9a9a;text-transform:uppercase;letter-spacing:1px;">O que você vai descobrir</p>
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr><td style="padding:5px 0;font-size:13px;color:#4a4a4a;">✓ &nbsp;Lucro líquido e margem do mês</td></tr>
                          <tr><td style="padding:5px 0;font-size:13px;color:#4a4a4a;">✓ &nbsp;Evolução comparada ao mês anterior</td></tr>
                          <tr><td style="padding:5px 0;font-size:13px;color:#4a4a4a;">✓ &nbsp;Alertas financeiros personalizados</td></tr>
                          <tr><td style="padding:5px 0;font-size:13px;color:#4a4a4a;">✓ &nbsp;Recomendações práticas para o negócio</td></tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

          </td>
        </tr>

        <tr>
          <td align="center" style="padding:20px 0 8px;">
            <p style="margin:0;font-size:12px;color:#aaaaaa;line-height:1.6;">
              Você recebe este lembrete porque tem uma conta no Fôlego Capital.<br/>
              <a href="https://fincheck-production-94bb.up.railway.app" style="color:#2d6a4f;">Acessar minha conta</a>
            </p>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding-bottom:16px;">
            <p style="margin:0;font-size:11px;color:#cccccc;">© 2025 Fôlego Capital · Diagnóstico financeiro para pequenos negócios</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

async function sendMonthlyReminders() {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  console.log('[cron] Iniciando envio de lembretes mensais...');

  const { data: { users }, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });

  if (error) {
    console.error('[cron] Erro ao buscar usuários:', error.message);
    return;
  }

  const activeUsers = users.filter(u => u.email_confirmed_at && u.email);
  console.log(`[cron] ${activeUsers.length} usuários ativos encontrados`);

  const transporter = createTransporter();
  const month = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const html = buildReminderHtml();
  let sent = 0;
  let failed = 0;

  for (const user of activeUsers) {
    try {
      await transporter.sendMail({
        from: `"Fôlego Capital" <${process.env.GMAIL_USER}>`,
        to: user.email,
        subject: `Hora de registrar ${month} — Fôlego Capital`,
        html,
      });
      sent++;
      // Pausa 300ms entre envios para não cair em spam
      await new Promise(r => setTimeout(r, 300));
    } catch (err) {
      console.error(`[cron] Falha ao enviar para ${user.email}:`, err.message);
      failed++;
    }
  }

  console.log(`[cron] Lembretes mensais concluídos: ${sent} enviados, ${failed} falhas`);
}

export function startMonthlyCron() {
  // Todo dia 1 do mês às 09:00 (horário do servidor / UTC)
  cron.schedule('0 9 1 * *', () => {
    sendMonthlyReminders().catch(err =>
      console.error('[cron] Erro não tratado no cron mensal:', err.message)
    );
  }, { timezone: 'America/Sao_Paulo' });

  console.log('[cron] Lembrete mensal agendado: todo dia 1 às 09:00 (Brasília)');
}
