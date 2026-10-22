
import type { PromoCode } from '@/lib/types';

export const promoCodes: PromoCode[] = [
    {
        code: "AGRIPRO24",
        redeemed: false,
    },
    {
        code: "PHYTPLUS",
        redeemed: false,
    },
    {
        code: "FARMERUP",
        redeemed: true,
        redeemedBy: 'farmer@example.com (3)',
        redeemedAt: new Date('2024-06-15T10:00:00Z').toISOString(),
    },
];
