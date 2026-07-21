import { COLORS } from "../constants/colors";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { getAllItems, isItemFavorite, toggleFavorite } from "../utils/itemUtils";

export default function GiveawayScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadItems = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const allItems = await getAllItems();
      setItems(allItems);
    } catch (error) {
      console.error("Lỗi khi tải danh sách sản phẩm 0 đồng:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadItems();
    }, [loadItems])
  );

  const giveawayItems = useMemo(() => {
    return items.filter(
      (item) => item.status === "selling" && Number(item.price) === 0
    );
  }, [items]);

  const handleToggleFavorite = async (itemId) => {
    if (!user) {
      navigation.navigate("Login");
      return;
    }
    await toggleFavorite(itemId, user);
    loadItems();
  };

  const renderItem = ({ item }) => {
    const saved = isItemFavorite(item, user);

    return (
      <TouchableOpacity
        activeOpacity={0.88}
        style={styles.productCard}
        onPress={() => navigation.push("Detail", { itemId: item.id })}
      >
        <View style={styles.productImageWrap}>
          {item.imageUri ? (
            <Image
              source={{ uri: item.imageUri }}
              style={styles.productImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.productImagePlaceholder}>
              <Ionicons name="image-outline" size={36} color={COLORS.textLight} />
            </View>
          )}

          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.saveButton}
            onPress={() => handleToggleFavorite(item.id)}
          >
            <Ionicons
              name={saved ? "bookmark" : "bookmark-outline"}
              size={17}
              color={COLORS.primary}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.productInfo}>
          <Text numberOfLines={2} style={styles.productTitle}>
            {item.title}
          </Text>
          <View style={styles.priceRow}>
            <Text style={styles.freeBadgeText}>MIỄN PHÍ</Text>
            <View style={styles.giftIconWrap}>
              <Ionicons name="gift" size={14} color={COLORS.primary} />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Góc 0 Đồng</Text>
          <Text style={styles.headerSubtitle}>Lan tỏa yêu thương - Cho đi là còn mãi</Text>
        </View>
        <Ionicons name="gift-outline" size={32} color={COLORS.primary} />
      </View>

      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={giveawayItems}
          numColumns={2}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={giveawayItems.length > 0 ? styles.productRow : undefined}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadItems(true)}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="cube-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>Hiện chưa có món đồ nào</Text>
              <Text style={styles.emptySubtitle}>
                Chưa có ai đăng tặng món đồ nào ở đây cả. Hãy quay lại sau nhé!
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 20,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    color: COLORS.primaryDark,
    fontSize: 24,
    fontWeight: "900",
  },
  headerSubtitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  listContent: {
    paddingTop: 15,
    paddingBottom: 40,
  },
  productRow: {
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  productCard: {
    width: "48%",
    backgroundColor: COLORS.card,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.primaryDark,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 2,
  },
  productImageWrap: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: COLORS.imagePlaceholder,
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  productImagePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(255,255,255,0.9)",
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  productInfo: {
    padding: 12,
  },
  productTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 8,
    height: 32,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  freeBadgeText: {
    fontSize: 11,
    fontWeight: "900",
    color: COLORS.primaryDark,
  },
  giftIconWrap: {
    backgroundColor: COLORS.white,
    padding: 2,
    borderRadius: 6,
  },
  emptyContainer: {
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.text,
    marginTop: 15,
  },
  emptySubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
  },
});
