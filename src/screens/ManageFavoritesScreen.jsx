import React, { useCallback, useState } from "react";

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

import { useFocusEffect } from "@react-navigation/native";

import BackButton from "../components/BackButton";

import { useAuth } from "../context/AuthContext";

import { categories } from "../utils/categories";

import {
  formatPrice,
  formatTimeAgo,
  getFavoriteItems,
} from "../utils/itemUtils";

export default function ManageFavoritesScreen({ navigation }) {
  const { user } = useAuth();

  const [items, setItems] = useState([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const loadItems = useCallback(async () => {
    try {
      const favoriteItems = await getFavoriteItems(user);

      setItems(favoriteItems);
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
    const category = categories.find(
      (currentCategory) => currentCategory.id === categoryId,
    );

    return category?.name || "Khác";
  };

  const renderItem = ({ item }) => {
    const isSold = item.status === "sold";

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        style={[styles.productCard, isSold && styles.soldProductCard]}
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
              <Ionicons name="image-outline" size={38} color="#A1A18E" />
            </View>
          )}

          <View style={styles.favoriteBadge}>
            <Ionicons name="heart" size={17} color="#D97706" />
          </View>

          {isSold ? (
            <View style={styles.soldBadge}>
              <Text style={styles.soldBadgeText}>ĐÃ BÁN</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.productContent}>
          <View style={styles.categoryRow}>
            <Text style={styles.categoryText}>
              {getCategoryName(item.category)}
            </Text>

            <Text style={styles.conditionText}>
              {item.condition || "Chưa rõ"}
            </Text>
          </View>

          <Text
            numberOfLines={2}
            ellipsizeMode="tail"
            style={styles.productTitle}
          >
            {item.title}
          </Text>

          <Text style={styles.priceText}>{formatPrice(item.price)}</Text>

          <View style={styles.sellerRow}>
            <View style={styles.sellerAvatar}>
              {item.sellerAvatar ? (
                <Image
                  source={{
                    uri: item.sellerAvatar,
                  }}
                  style={styles.sellerAvatarImage}
                  resizeMode="cover"
                />
              ) : (
                <Text style={styles.sellerAvatarText}>
                  {String(item.sellerName || "?")
                    .charAt(0)
                    .toUpperCase()}
                </Text>
              )}
            </View>

            <View style={styles.sellerInfo}>
              <Text numberOfLines={1} style={styles.sellerName}>
                {item.sellerName || "Người bán"}
              </Text>

              <Text style={styles.timeText}>
                {formatTimeAgo(item.createdAt)}
              </Text>
            </View>
          </View>

          <View style={styles.bottomRow}>
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color="#A1A18E" />

              <Text numberOfLines={1} style={styles.locationText}>
                {item.location || "Chưa cập nhật địa điểm"}
              </Text>
            </View>

            <Ionicons name="chevron-forward" size={18} color="#7A8450" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIcon}>
          <Ionicons name="heart-outline" size={47} color="#A1A18E" />
        </View>

        <Text style={styles.emptyTitle}>Chưa có sản phẩm đã lưu</Text>

        <Text style={styles.emptyDescription}>
          Những sản phẩm bạn bấm biểu tượng trái tim sẽ xuất hiện tại đây.
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
          <Ionicons name="search-outline" size={20} color="#FFFFFF" />

          <Text style={styles.exploreButtonText}>KHÁM PHÁ SẢN PHẨM</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />

        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Sản phẩm đã lưu</Text>

          <Text style={styles.headerSubtitle}>Những sản phẩm bạn quan tâm</Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.75}
          style={styles.headerActionButton}
          onPress={handleRefresh}
        >
          <Ionicons name="refresh-outline" size={23} color="#7A8450" />
        </TouchableOpacity>
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.summaryIcon}>
          <Ionicons name="heart" size={23} color="#D97706" />
        </View>

        <View style={styles.summaryInfo}>
          <Text style={styles.summaryValue}>{items.length}</Text>

          <Text style={styles.summaryLabel}>Sản phẩm đã lưu</Text>
        </View>

        <Text style={styles.summaryDescription}>Tài khoản của bạn</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7A8450" />

          <Text style={styles.loadingText}>Đang tải sản phẩm đã lưu...</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#7A8450"
              colors={["#7A8450"]}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FDFCF8",
  },

  header: {
    minHeight: 68,

    flexDirection: "row",
    alignItems: "center",

    backgroundColor: "#FFFFFF",

    paddingHorizontal: 14,
    paddingVertical: 10,

    borderBottomWidth: 1,
    borderBottomColor: "#E8E4D9",
  },

  headerActionButton: {
    width: 42,
    height: 42,
    borderRadius: 14,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#F3F1E9",
  },

  headerText: {
    flex: 1,
    alignItems: "center",
  },

  headerTitle: {
    color: "#4A4A3A",
    fontSize: 17,
    fontWeight: "800",
  },

  headerSubtitle: {
    color: "#A1A18E",
    fontSize: 10,
    marginTop: 2,
  },

  summaryCard: {
    minHeight: 78,

    flexDirection: "row",
    alignItems: "center",

    backgroundColor: "#FFFFFF",

    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 15,

    paddingHorizontal: 16,

    borderWidth: 1,
    borderColor: "#E8E4D9",
    borderRadius: 20,

    elevation: 2,
  },

  summaryIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#FFF7E8",

    marginRight: 12,
  },

  summaryInfo: {
    flex: 1,
  },

  summaryValue: {
    color: "#4A4A3A",
    fontSize: 20,
    fontWeight: "800",
  },

  summaryLabel: {
    color: "#8A8A75",
    fontSize: 10,
    fontWeight: "700",

    marginTop: 1,
  },

  summaryDescription: {
    color: "#A1A18E",
    fontSize: 9,
  },

  loadingContainer: {
    flex: 1,

    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    color: "#8A8A75",
    fontSize: 13,

    marginTop: 12,
  },

  listContent: {
    flexGrow: 1,

    paddingHorizontal: 16,
    paddingBottom: 30,
  },

  productCard: {
    minHeight: 145,

    flexDirection: "row",

    backgroundColor: "#FFFFFF",

    padding: 11,
    marginBottom: 13,

    borderWidth: 1,
    borderColor: "#E8E4D9",
    borderRadius: 20,

    elevation: 2,
  },

  soldProductCard: {
    opacity: 0.72,
  },

  imageContainer: {
    width: 120,
    height: 120,

    position: "relative",

    backgroundColor: "#F3F1E9",

    borderRadius: 16,
    overflow: "hidden",

    marginRight: 13,
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

  favoriteBadge: {
    position: "absolute",
    top: 7,
    right: 7,

    width: 31,
    height: 31,
    borderRadius: 16,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "rgba(255,255,255,0.94)",
  },

  soldBadge: {
    position: "absolute",
    left: 7,
    bottom: 7,

    backgroundColor: "rgba(139,94,60,0.94)",

    paddingHorizontal: 8,
    paddingVertical: 5,

    borderRadius: 8,
  },

  soldBadgeText: {
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "800",
  },

  productContent: {
    flex: 1,
  },

  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  categoryText: {
    color: "#A1A18E",
    fontSize: 9,
    fontWeight: "800",

    textTransform: "uppercase",
  },

  conditionText: {
    color: "#7A8450",
    fontSize: 9,
    fontWeight: "700",
  },

  productTitle: {
    color: "#4A4A3A",
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "800",

    marginTop: 5,
  },

  priceText: {
    color: "#7A8450",
    fontSize: 15,
    fontWeight: "800",

    marginTop: 5,
  },

  sellerRow: {
    flexDirection: "row",
    alignItems: "center",

    marginTop: 8,
  },

  sellerAvatar: {
    width: 27,
    height: 27,
    borderRadius: 14,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#E8E4D9",

    overflow: "hidden",
    marginRight: 7,
  },

  sellerAvatarImage: {
    width: "100%",
    height: "100%",
  },

  sellerAvatarText: {
    color: "#8A8A75",
    fontSize: 9,
    fontWeight: "800",
  },

  sellerInfo: {
    flex: 1,
  },

  sellerName: {
    color: "#6D6D5D",
    fontSize: 10,
    fontWeight: "700",
  },

  timeText: {
    color: "#A1A18E",
    fontSize: 8,

    marginTop: 1,
  },

  bottomRow: {
    flexDirection: "row",
    alignItems: "center",

    marginTop: "auto",
    paddingTop: 7,

    borderTopWidth: 1,
    borderTopColor: "#F3F1E9",
  },

  locationRow: {
    flex: 1,

    flexDirection: "row",
    alignItems: "center",
  },

  locationText: {
    flex: 1,

    color: "#A1A18E",
    fontSize: 9,

    marginLeft: 4,
  },

  emptyContainer: {
    minHeight: 390,

    alignItems: "center",
    justifyContent: "center",

    paddingHorizontal: 35,
  },

  emptyIcon: {
    width: 86,
    height: 86,
    borderRadius: 28,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#F3F1E9",
  },

  emptyTitle: {
    color: "#4A4A3A",
    fontSize: 17,
    fontWeight: "800",

    marginTop: 17,
  },

  emptyDescription: {
    color: "#A1A18E",
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

    backgroundColor: "#7A8450",

    paddingHorizontal: 20,

    borderRadius: 15,
    marginTop: 18,
  },

  exploreButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",

    marginLeft: 7,
  },
});
