import { Member, Subscription, getMemberPlatformInfo, getMemberContributionAmount } from '../types';
import { dateLocale, t } from '../i18n';

/**
 * Formats a clean, friendly payment reminder message for co-subscribers.
 */
export function generateMemberReminderText(
  subscription: Subscription,
  member: Member,
  ownerName?: string
): string {
  const currentMonth = new Intl.DateTimeFormat(dateLocale(), { month: 'long', year: 'numeric' }).format(new Date());
  const monthCapitalized = currentMonth.charAt(0).toUpperCase() + currentMonth.slice(1);
  const mInfo = getMemberPlatformInfo(subscription, member);
  const memberName = member.memberName || member.name || t('rem.coSub');
  const memberAmount = getMemberContributionAmount(subscription, member);
  const memberPlatform = member.sharingPlatform || member.platform || t('rem.platformFallback');
  const via = `${memberPlatform}${member.paymentMethod ? ` (${member.paymentMethod})` : ''}`;
  const cur = mInfo.currency === 'EUR' ? '€' : mInfo.currency;

  const body = t('rem.body', {
    name: memberName,
    sub: subscription.platformName || subscription.name,
    cycle: monthCapitalized,
    amount: memberAmount.toFixed(2),
    cur,
    period: mInfo.periodShort,
    platform: via,
  });

  return body + (ownerName ? `\n— ${ownerName}` : '');
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
  const subject = encodeURIComponent(t('rem.mailSubject', { name: subscription.name }));
  const body = encodeURIComponent(text);
  return `mailto:${email}?subject=${subject}&body=${body}`;
}
