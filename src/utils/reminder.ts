import { Member, Subscription, getMemberPlatformInfo, getMemberContributionAmount } from '../types';

/**
 * Formats a clean, friendly payment reminder message for co-subscribers.
 */
export function generateMemberReminderText(
  subscription: Subscription,
  member: Member,
  ownerName?: string
): string {
  const currentMonth = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(new Date());
  const monthCapitalized = currentMonth.charAt(0).toUpperCase() + currentMonth.slice(1);
  const mInfo = getMemberPlatformInfo(subscription, member);
  const memberName = member.memberName || member.name || 'Co-suscriptor';
  const memberAmount = getMemberContributionAmount(subscription, member);
  const memberPlatform = member.sharingPlatform || member.platform || 'Compartición';

  return `👋 ¡Hola ${memberName}!

Te escribo por la suscripción compartida de *${subscription.platformName || subscription.name}*.

📌 *Ciclo*: ${monthCapitalized}
💰 *Importe*: ${memberAmount.toFixed(2)} ${mInfo.currency === 'EUR' ? '€' : mInfo.currency}/${mInfo.periodShort}
🔄 *Plataforma/Vía*: ${memberPlatform}${member.paymentMethod ? ` (${member.paymentMethod})` : ''}

Cuando puedas realizar o confirmar el abono de este ciclo, házmelo saber para dejarlo marcado como pagado.

¡Muchas gracias! 🙌${ownerName ? `\n— ${ownerName}` : ''}`;
}

/**
 * Creates a WhatsApp share URL with encoded text.
 */
export function getWhatsAppShareUrl(phone: string, text: string): string {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  if (cleanPhone) {
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  }
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

/**
 * Creates a Telegram share URL with encoded text.
 */
export function getTelegramShareUrl(usernameOrPhone: string, text: string): string {
  if (usernameOrPhone.startsWith('@')) {
    return `https://t.me/${usernameOrPhone.replace('@', '')}`;
  }
  return `https://t.me/share/url?url=${encodeURIComponent('https://splitzy.app')}&text=${encodeURIComponent(text)}`;
}

/**
 * Creates a mailto link.
 */
export function getMailtoUrl(email: string, subscription: Subscription, text: string): string {
  const subject = encodeURIComponent(`Recordatorio suscripción compartida: ${subscription.name}`);
  const body = encodeURIComponent(text);
  return `mailto:${email}?subject=${subject}&body=${body}`;
}
