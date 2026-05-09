import chalk from 'chalk';
import { Separator } from '@inquirer/prompts';
import { sprintf } from '../utils/sprintf.js';
export const PLATFORM_ORDER = ['Shopify', 'Shoptet', 'PrestaShop', 'Upgates', 'WordPress', 'Other'];
export const stripProtocol = (url) => url.replace(/^https?:\/\//, '').replace(/\/$/, '');
export const inferPlatform = (url) => {
    if (/myshopify\.com/i.test(url))
        return 'Shopify';
    if (/myshoptet\.com|\.shoptet\./i.test(url))
        return 'Shoptet';
    if (/prestashop/i.test(url))
        return 'PrestaShop';
    if (/upgates/i.test(url))
        return 'Upgates';
    if (/wordpress/i.test(url))
        return 'WordPress';
    return 'Other';
};
export const platformOrderIndex = (platform) => {
    const idx = PLATFORM_ORDER.indexOf(platform);
    return idx === -1 ? PLATFORM_ORDER.length : idx;
};
const formatEshopRow = (eshop) => ({
    name: sprintf('%s  %s', stripProtocol(eshop.url), chalk.gray(sprintf('#%s', eshop.id))),
    value: eshop.id,
});
export const buildEshopChoices = (eshops) => {
    const grouped = new Map();
    for (const eshop of eshops) {
        const platform = inferPlatform(eshop.url);
        const bucket = grouped.get(platform) ?? [];
        bucket.push(eshop);
        grouped.set(platform, bucket);
    }
    if (grouped.size <= 1) {
        return [...eshops]
            .sort((a, b) => a.url.localeCompare(b.url))
            .map(formatEshopRow);
    }
    const choices = [];
    for (const platform of PLATFORM_ORDER) {
        const items = grouped.get(platform);
        if (!items || items.length === 0)
            continue;
        choices.push(new Separator(chalk.gray(sprintf('── %s ──', platform))));
        items.sort((a, b) => a.url.localeCompare(b.url));
        for (const eshop of items) {
            choices.push(formatEshopRow(eshop));
        }
    }
    return choices;
};
