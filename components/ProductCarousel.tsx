import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Linking,
} from 'react-native';
import { Product, trackAffiliateClick, getPrimaryBuyLink } from '../lib/products';
import ProductCard from './ProductCard';

interface Props {
  products: Product[];
  diagnosis: string;
}

export default function ProductCarousel({ products, diagnosis }: Props) {
  if (!products || products.length === 0) return null;

  const handleBuyPress = async (product: Product) => {
    trackAffiliateClick(product, diagnosis);
    const link = getPrimaryBuyLink(product);
    await Linking.openURL(link.url);
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🛒 Recommended Products</Text>
        <Text style={styles.headerSubtitle}>Based on your diagnosis</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {products.map(product => (
          <ProductCard
            key={product.id}
            product={product}
          />
        ))}
      </ScrollView>

      <Text style={styles.disclaimer}>
        As an Amazon Associate, GardenGenius earns from qualifying purchases.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#F1F8E9',
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
  disclaimer: {
    fontSize: 10,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 16,
    fontStyle: 'italic',
  },
});
