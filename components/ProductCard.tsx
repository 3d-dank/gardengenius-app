/**
 * GardenGenius — ProductCard
 * Multi-store buy buttons: Amazon (primary) + Home Depot (secondary)
 */
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native';
import { Product, BuyLink, getPrimaryBuyLink } from '../lib/products';
import { COLORS, RADIUS } from '../lib/theme';

interface Props {
  product: Product;
  compact?: boolean;
}

const STORE_LABEL: Record<string, string> = {
  amazon: '🛒 Amazon',
  homedepot: '🏠 Home Depot',
  chewy: '🐾 Chewy',
  leslies: "🏊 Leslie's",
  walmart: '🏪 Walmart',
};

function renderStars(rating: number): string {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5 ? 1 : 0;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(5 - full - half);
}

async function openUrl(url: string): Promise<void> {
  try {
    await Linking.openURL(url);
  } catch {
    // ignore
  }
}

export default function ProductCard({ product, compact = false }: Props) {
  const primary = getPrimaryBuyLink(product);
  const secondaryLinks: BuyLink[] = product.buyLinks.filter(
    l => l.store !== product.primaryStore,
  );

  if (compact) {
    return (
      <View style={styles.compact}>
        <Text style={styles.compactName} numberOfLines={1}>
          {product.name}
        </Text>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => openUrl(primary.url)}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryBtnText}>
            {STORE_LABEL[primary.store]}{primary.price ? `  ${primary.price}` : ''}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
        <Text style={styles.brand}>{product.brand}</Text>
      </View>

      {/* Rating */}
      {product.rating !== undefined && (
        <View style={styles.ratingRow}>
          <Text style={styles.stars}>{renderStars(product.rating)}</Text>
          <Text style={styles.ratingNum}>{product.rating.toFixed(1)}</Text>
          {product.reviewCount !== undefined && (
            <Text style={styles.reviewCount}>({product.reviewCount.toLocaleString()})</Text>
          )}
        </View>
      )}

      {/* Description */}
      <Text style={styles.description} numberOfLines={2}>
        {product.description}
      </Text>

      {/* Primary buy button */}
      <TouchableOpacity
        style={styles.primaryBtn}
        onPress={() => openUrl(primary.url)}
        activeOpacity={0.8}
      >
        <Text style={styles.primaryBtnText}>
          {STORE_LABEL[primary.store]}{primary.price ? `  ${primary.price}` : ''}
        </Text>
      </TouchableOpacity>

      {/* Secondary store buttons */}
      {secondaryLinks.length > 0 && (
        <View style={styles.secondaryRow}>
          {secondaryLinks.map(link => (
            <TouchableOpacity
              key={link.store}
              style={styles.secondaryBtn}
              onPress={() => openUrl(link.url)}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryBtnText}>
                {STORE_LABEL[link.store]}
                {link.price ? `\n${link.price}` : ''}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 210,
    backgroundColor: COLORS.surface2,
    borderRadius: RADIUS.lg,
    padding: 14,
    marginRight: 12,
    borderWidth: 1,
    borderColor: COLORS.dewBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  compact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  header: {
    marginBottom: 6,
  },
  name: {
    color: COLORS.textPrimary,
    fontWeight: '700',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 2,
  },
  compactName: {
    color: COLORS.textPrimary,
    fontWeight: '600',
    fontSize: 13,
    flex: 1,
  },
  brand: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  stars: {
    color: '#FFD60A',
    fontSize: 11,
  },
  ratingNum: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  reviewCount: {
    color: COLORS.textMuted,
    fontSize: 10,
  },
  description: {
    color: COLORS.textMuted,
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 10,
  },
  primaryBtn: {
    backgroundColor: COLORS.freshGrowth,
    borderRadius: RADIUS.sm,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginBottom: 6,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  secondaryBtn: {
    flex: 1,
    borderRadius: RADIUS.sm,
    paddingVertical: 7,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.dewBorderBright,
    backgroundColor: COLORS.dewGlass,
  },
  secondaryBtnText: {
    color: COLORS.textMuted,
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 14,
  },
});
