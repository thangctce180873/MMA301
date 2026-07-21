import { COLORS } from "../constants/colors";
import React, { useCallback, useState } from "react";

import {
  ActivityIndicator,
  Alert,
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
import { useFocusEffect } from "@react-navigation/native";

import BackButton from "../components/BackButton";

import { useAuth } from "../context/AuthContext";
import { categories } from "../utils/categories";

import {
  formatPrice,
  formatTimeAgo,
  getFavoriteItems,
  toggleFavorite,
} from "../utils/itemUtils";

export default function ManageFavoritesScreen({ navigation }) {
  const { user } = useAuth();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [removingId, setRemovingId] = useState(null);

  const loadItems = useCallback(async () => {
    try {
      const favoriteItems = await getFavoriteItems(user);

      setItems(Array.isArray(favoriteItems) ? favoriteItems : []);
    } catch (error) {
      console.error("Lỗi khi tải sản phẩm đã lưu:", error);

      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadItems();
    }, [loadItems]),
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadItems();
  };

  const getCategoryName = (categoryId) => {
    return (
      categories.find((category) => category.id === categoryId)?.name || "Khác"
    );
  };

  const handleRemoveSavedItem = async (item) => {
    if (removingId) {
      return;
    }

    try {
      setRemovingId(item.id);

      const result = await toggleFavorite(item.id, user);

      if (!result?.success) {
        Alert.alert(
          "Không thể cập nhật",
          result?.message || "Không thể bỏ lưu sản phẩm.",
        );

        return;
      }

      setItems((previousItems) =>
        previousItems.filter(
          (currentItem) => String(currentItem.id) !== String(item.id),
        ),
      );
    } catch (error) {
      console.error("Lỗi khi bỏ lưu sản phẩm:", error);

      Alert.alert("Có lỗi xảy ra", "Không thể bỏ lưu sản phẩm.");
    } finally {
      setRemovingId(null);
    }
  };

  const renderItem = ({ item }) => {
    const removing = String(removingId) === String(item.id);

    return (
      <TouchableOpacity
        activeOpacity={0.87}
        style={styles.productCard}
        onPress={() =>
          navigation.navigate("Detail", {
            itemId: item.id,
          })
        }
      >
        <View style={styles.imageContainer}>
          {item.imageUri ? (
            <Image
              source={{
                uri: item.imageUri,
              }}
              style={styles.productImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons
                name="image-outline"
                size={38}
                color={COLORS.textMuted}
              />
            </View>
          )}

          <TouchableOpacity
            activeOpacity={0.8}
            disabled={removing}
            style={styles.savedButton}
            onPress={() => handleRemoveSavedItem(item)}
          >
            {removing ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <Ionicons name="bookmark" size={18} color={COLORS.primary} />
            )}
          </TouchableOpacity>

          {item.status === "sold" ? (
            <View style={styles.soldBadge}>
              <Text style={styles.soldText}>ĐÃ BÁN</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.productContent}>
          <Text style={styles.categoryText}>
            {getCategoryName(item.category)}
          </Text>

          <Text numberOfLines={2} style={styles.productTitle}>
            {item.title}
          </Text>

          <Text style={styles.priceText}>{formatPrice(item.price)}</Text>

          <View style={styles.productFooter}>
            <View style={styles.timeRow}>
              <Ionicons
                name="time-outline"
                size={13}
                color={COLORS.textMuted}
              />

              <Text style={styles.timeText}>
                {formatTimeAgo(item.createdAt)}
              </Text>
            </View>

            <Ionicons name="chevron-forward" size={17} color={COLORS.primary} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />

        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Sản phẩm đã lưu</Text>

          <Text style={styles.headerSubtitle}>Danh sách sản phẩm đã lưu</Text>
        </View>

        <View style={styles.headerBookmark}>
          <Ionicons name="bookmark" size={22} color={COLORS.primary} />
        </View>
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.summaryIcon}>
          <Ionicons name="bookmark-outline" size={24} color={COLORS.primary} />
        </View>

        <View style={styles.summaryInfo}>
          <Text style={styles.summaryValue}>{items.length}</Text>

          <Text style={styles.summaryLabel}>Sản phẩm đang được lưu</Text>
        </View>

        <Text style={styles.summaryHint}>Nhấn dấu lưu để bỏ lưu</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />

          <Text style={styles.loadingText}>Đang tải sản phẩm...</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.listContent,

            items.length === 0 && styles.emptyListContent,
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name="bookmark-outline"
                  size={46}
                  color={COLORS.textMuted}
                />
              </View>

              <Text style={styles.emptyTitle}>Chưa có sản phẩm đã lưu</Text>

              <Text style={styles.emptyDescription}>
                Nhấn biểu tượng lưu trên sản phẩm để lưu lại và xem sau.
              </Text>

              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.exploreButton}
                onPress={() =>
                  navigation.navigate("MainTabs", {
                    screen: "Home",
                  })
                }
              >
                <Ionicons
                  name="search-outline"
                  size={19}
                  color={COLORS.white}
                />

                <Text style={styles.exploreButtonText}>KHÁM PHÁ SẢN PHẨM</Text>
              </TouchableOpacity>
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

  header: {
    minHeight: 68,

    flexDirection: "row",
    alignItems: "center",

    backgroundColor: COLORS.card,

    paddingHorizontal: 14,
    paddingVertical: 10,

    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  headerTextContainer: {
    flex: 1,
    alignItems: "center",
  },

  headerTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "800",
  },

  headerSubtitle: {
    color: COLORS.textMuted,
    fontSize: 10,

    marginTop: 2,
  },

  headerBookmark: {
    width: 42,
    height: 42,
    borderRadius: 14,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: COLORS.primaryLight,
  },

  summaryCard: {
    minHeight: 76,

    flexDirection: "row",
    alignItems: "center",

    backgroundColor: COLORS.primarySoft,

    paddingHorizontal: 15,

    marginHorizontal: 16,
    marginTop: 15,
    marginBottom: 4,

    borderRadius: 20,
  },

  summaryIcon: {
    width: 45,
    height: 45,
    borderRadius: 15,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: COLORS.card,

    marginRight: 12,
  },

  summaryInfo: {
    flex: 1,
  },

  summaryValue: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "800",
  },

  summaryLabel: {
    color: COLORS.textSecondary,
    fontSize: 9,
    fontWeight: "700",

    marginTop: 2,
  },

  summaryHint: {
    maxWidth: 80,

    color: COLORS.textMuted,
    fontSize: 8,
    lineHeight: 12,

    textAlign: "right",
  },

  loadingContainer: {
    flex: 1,

    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    color: COLORS.textSecondary,
    fontSize: 13,

    marginTop: 12,
  },

  listContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 30,
  },

  emptyListContent: {
    flexGrow: 1,
  },

  productCard: {
    flexDirection: "row",

    backgroundColor: COLORS.card,

    padding: 10,

    marginBottom: 12,

    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
  },

  imageContainer: {
    width: 112,
    height: 112,

    position: "relative",

    backgroundColor: COLORS.imagePlaceholder,

    borderRadius: 16,

    overflow: "hidden",
  },

  productImage: {
    width: "100%",
    height: "100%",
  },

  imagePlaceholder: {
    flex: 1,

    alignItems: "center",
    justifyContent: "center",
  },

  savedButton: {
    position: "absolute",
    top: 8,
    right: 8,

    width: 30,
    height: 30,
    borderRadius: 15,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "rgba(255,255,255,0.95)",
  },

  soldBadge: {
    position: "absolute",
    left: 7,
    bottom: 7,

    backgroundColor: COLORS.primaryDark,

    paddingHorizontal: 8,
    paddingVertical: 5,

    borderRadius: 9,
  },

  soldText: {
    color: COLORS.white,
    fontSize: 7,
    fontWeight: "800",
  },

  productContent: {
    flex: 1,

    paddingLeft: 12,
    paddingVertical: 3,
  },

  categoryText: {
    color: COLORS.primary,
    fontSize: 8,
    fontWeight: "800",
    textTransform: "uppercase",
  },

  productTitle: {
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "800",

    marginTop: 4,
  },

  priceText: {
    color: COLORS.primaryDark,
    fontSize: 15,
    fontWeight: "800",

    marginTop: 7,
  },

  productFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    marginTop: "auto",
  },

  timeRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  timeText: {
    color: COLORS.textMuted,
    fontSize: 9,

    marginLeft: 4,
  },

  emptyContainer: {
    flex: 1,

    alignItems: "center",
    justifyContent: "center",

    paddingHorizontal: 35,
  },

  emptyIcon: {
    width: 88,
    height: 88,
    borderRadius: 27,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: COLORS.primaryLight,
  },

  emptyTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "800",

    marginTop: 17,
  },

  emptyDescription: {
    color: COLORS.textMuted,
    fontSize: 12,
    lineHeight: 19,

    textAlign: "center",

    marginTop: 6,
  },

  exploreButton: {
    height: 48,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    backgroundColor: COLORS.primary,

    paddingHorizontal: 18,

    borderRadius: 16,

    marginTop: 19,
  },

  exploreButtonText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: "800",

    marginLeft: 7,
  },
});
