export const SHOP_CONFIG = {
    shopSlug: 'tempest',
    shopName: 'Tempest',
    memberPrefix: 'TEM',
    pointRules: {
        visit: 1,
        companion: 2,
        bottle: 3
    }
};

export function normalizeMemberNo(value) {
    const digits = String(value || '')
        .toUpperCase()
        .replace(new RegExp(`^${SHOP_CONFIG.memberPrefix}`), '')
        .replace(/\D/g, '');
    if (!digits) return '';
    return `${SHOP_CONFIG.memberPrefix}-${digits.padStart(4, '0')}`;
}
