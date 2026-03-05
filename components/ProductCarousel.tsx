import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { AffiliateProduct, trackAffiliateClick } from '../lib/products';

interface Props {
  products: AffiliateProduct[];
  diagnosis: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  fertilizer: '#4CAF50',
  herbicide: '#F59E0B',
  fungicide: '#8B5CF6',
  pesticide: '#EF4444',
  soil: '#92400E',
  seed: '#10B981',
  tool: '#3B82F6',
};

const renderStars = (rating: string): string => {
  const n = parseFloat(rating);
  const full = Math.floor(n);
  const half = n - full >= 0.5 ? 1 : 0;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(5 - full - half);
};

export default function ProductCarousel({ products, diagnosis }: Props) {
  if (!products || products.length === 0) return null;

  const handleBuyPress = async (product: AffiliateProduct) => {
    // Fire-and-forget click tracking
    trackAffiliateClick(product, diagnosis);
    // Open Amazon
    await Linking.openURL(product.amazonUrl);
  };

  return (
    <View style={styles.wrapper}>
      {/* Section header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🛒 Recommended Products</Text>
        <Text style={styles.headerSubtitle}>Based on your diagnosis</Text>
      </View>

      {/* Horizontal carousel */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {products.map(product => (
          <View key={product.id} style={styles.card}>
            {/* Product image placeholder */}
            <View
              style={[
                styles.imagePlaceholder,
                { backgroundColor: CATEGORY_COLORS[product.category] ?? '#4CAF50' },
              ]}
            >
              <Text style={styles.productEmoji}>{product.emoji}</Text>
            </View>

            {/* Category badge */}
            <View style={[styles.categoryBadge, { backgroundColor: CATEGORY_COLORS[product.category] ?? '#4CAF50' }]}>
              <Text style={styles.categoryText}>{product.category}</Text>
            </View>

            {/* Brand */}
            <Text style={styles.brandText} numberOfLines={1}>
              {product.brand}
            </Text>

            {/* Product name */}
            <Text style={styles.productName} numberOfLines={2}>
              {product.name}
            </Text>

            {/* Stars + review count */}
            <View style={styles.ratingRow}>
              <Text style={styles.stars}>{renderStars(product.rating)}</Text>
              <Text style={styles.reviewCount}>({product.reviewCount})</Text>
            </View>

            {/* Price */}
            <Text style={styles.price}>{product.price}</Text>

            {/* Buy button */}
            <TouchableOpacity
              style={styles.buyButton}
              onPress={() => handleBuyPress(product)}
              activeOpacity={0.8}
            >
              <Text style={styles.buyButtonText}>Buy on Amazon →</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {/* Affiliate disclaimer */}
      <Text style={styles.disclaimer}>
        As an Amazon Associate, GardenGenius earns from qualifying purchases.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#F0FFF4',
    paddingVertical: 16,
    marginTop: 8,
  },
  header: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1B4332',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  card: {
    width: 160,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginRight: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  imagePlaceholder: {
    width: '100%',
    height: 90,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  productEmoji: {
    fontSize: 36,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
    marginBottom: 6,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  brandText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '600',
    marginBottom: 2,
  },
  productName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1B4332',
    lineHeight: 18,
    marginBottom: 6,
    minHeight: 36,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  stars: {
    fontSize: 11,
    color: '#FFD60A',
    marginRight: 4,
  },
  reviewCount: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  price: {
    fontSize: 16,
    fontWeight: '800',
    color: '#4CAF50',
    marginBottom: 10,
  },
  buyButton: {
    backgroundColor: '#0D9488',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  buyButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  disclaimer: {
    fontSize: 10,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 16,
    fontStyle: 'italic',
  },
});
