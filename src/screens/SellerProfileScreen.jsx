import { COLORS } from "../constants/colors";
import React, { useCallback, useState } from "react";

import {
  ActivityIndicator,
  FlatList,
  Image,
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
import { getUserInitials } from "../utils/authUtils";
import { getAllItems, formatPrice, isItemFavorite, toggleFavorite } from "../utils/itemUtils";
import { getSellerRatingStats, getReviewsForSeller } from "../utils/reviewUtils";

export default function SellerProfileScreen({ route, navigation }) {
  const { user } = useAuth();
  
  // Destructure seller info from route params
  const { sellerId, sellerEmail, sellerName, sellerAvatar } = route.params || {};

  const [items, setItems] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [ratingStats, setRatingStats] = useState({ average: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("selling");

  const loadSellerData = useCallback(async () => {
    try {
      setLoading(true);
      
      const allItems = await getAllItems();
      const sellerItems = allItems.filter(
        (item) =>
          ((sellerId && String(item.sellerId) === String(sellerId)) ||
          (sellerEmail && item.sellerEmail === sellerEmail)) &&
          item.status === "selling"
      );
      
      const sellerReviews = await getReviewsForSeller(sellerId, sellerEmail);
      const stats = await getSellerRatingStats(sellerId, sellerEmail);
      
      setItems(sellerItems);
      setReviews(sellerReviews);
      setRatingStats(stats);
    } catch (error) {
      console.error("Lỗi tải thông tin người bán:", error);
    } finally {
      setLoading(false);
    }
  }, [sellerId, sellerEmail]);

  useFocusEffect(
    useCallback(() => {
      loadSellerData();
    }, [loadSellerData])
  );

  const handleToggleFavorite = async (itemId) => {
    await toggleFavorite(itemId, user);
    loadSellerData();
  };

  const renderProduct = ({ item }) => {
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
          <Text style={styles.productPrice}>{formatPrice(item.price)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderReview = ({ item }) => (
    <View style={styles.reviewItem}>
      <View style={styles.reviewerAvatar}>
        {item.reviewerAvatar ? (
          <Image source={{ uri: item.reviewerAvatar }} style={styles.avatarImage} />
        ) : (
          <Text style={styles.avatarText}>{getUserInitials(item.reviewerName)}</Text>
        )}
      </View>
      <View style={styles.reviewContent}>
        <Text style={styles.reviewerName}>{item.reviewerName}</Text>
        <View style={styles.ratingStars}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Ionicons
              key={star}
              name={star <= item.rating ? "star" : "star-outline"}
              size={12}
              color={COLORS.primary}
            />
          ))}
        </View>
        {item.comment ? (
          <Text style={styles.reviewText}>{item.comment}</Text>
        ) : null}
      </View>
    </View>
  );

  const isOwnProfile = user && (String(user.id) === String(sellerId) || user.email === sellerEmail);

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  const sellingItems = items.filter((item) => Number(item.price) > 0);
  const freeItems = items.filter((item) => Number(item.price) === 0);
  const displayItems = activeTab === "selling" ? sellingItems : freeItems;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Hồ sơ người bán</Text>
        </View>
        <View style={{ width: 42 }} />
      </View>

      <FlatList
        data={displayItems}
        numColumns={2}
        keyExtractor={(item) => item.id}
        renderItem={renderProduct}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={items.length > 0 ? styles.productRow : undefined}
        ListHeaderComponent={
          <>
            <View style={styles.profileSection}>
              <View style={styles.avatarLarge}>
                {sellerAvatar ? (
                  <Image source={{ uri: sellerAvatar }} style={styles.avatarImage} />
                ) : (
                  <Text style={styles.avatarTextLarge}>{getUserInitials(sellerName)}</Text>
                )}
              </View>
              <Text style={styles.sellerNameLarge}>{sellerName || "Người bán"}</Text>
              
              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{ratingStats.average}</Text>
                  <View style={styles.ratingStars}>
                    <Ionicons name="star" size={12} color={COLORS.primary} />
                    <Text style={styles.statLabel}>Đánh giá ({ratingStats.total})</Text>
                  </View>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{sellingItems.length}</Text>
                  <Text style={styles.statLabel}>Đang bán</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{freeItems.length}</Text>
                  <Text style={styles.statLabel}>0 đồng</Text>
                </View>
              </View>

              {!isOwnProfile && (
                <TouchableOpacity
                  style={styles.reviewButton}
                  onPress={() =>
                    navigation.navigate("RatingReview", {
                      sellerId,
                      sellerEmail,
                      sellerName,
                      sellerAvatar,
                    })
                  }
                >
                  <Ionicons name="star-outline" size={18} color={COLORS.white} />
                  <Text style={styles.reviewButtonText}>Viết đánh giá</Text>
                </TouchableOpacity>
              )}
            </View>

            {reviews.length > 0 && (
              <View style={styles.reviewsSection}>
                <Text style={styles.sectionTitle}>Đánh giá gần đây</Text>
                {reviews.slice(0, 3).map((review) => (
                  <View key={review.id}>
                    {renderReview({ item: review })}
                  </View>
                ))}
              </View>
            )}

            <View style={styles.filterRow}>
              <TouchableOpacity
                style={[styles.filterButton, activeTab === "selling" && styles.activeFilterButton]}
                onPress={() => setActiveTab("selling")}
              >
                <Text style={[styles.filterText, activeTab === "selling" && styles.activeFilterText]}>
                  Đang bán
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterButton, activeTab === "free" && styles.activeFilterButton]}
                onPress={() => setActiveTab("free")}
              >
                <Text style={[styles.filterText, activeTab === "free" && styles.activeFilterText]}>
                  0 đồng
                </Text>
              </TouchableOpacity>
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {activeTab === "selling" ? "Người bán chưa có sản phẩm nào đang bán." : "Người bán chưa có sản phẩm 0 đồng nào."}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTextContainer: { flex: 1, alignItems: "center" },
  headerTitle: { color: COLORS.text, fontSize: 17, fontWeight: "800" },
  listContent: { paddingBottom: 30 },
  profileSection: {
    alignItems: "center",
    backgroundColor: COLORS.card,
    padding: 20,
    marginBottom: 10,
  },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 15,
    paddingBottom: 8,
  },
  filterButton: {
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.card,
    paddingHorizontal: 17,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    marginRight: 8,
  },
  activeFilterButton: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: "700",
  },
  activeFilterText: {
    color: COLORS.white,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  avatarImage: { width: "100%", height: "100%", borderRadius: 40 },
  avatarTextLarge: { color: COLORS.primaryDark, fontSize: 28, fontWeight: "800" },
  sellerNameLarge: { fontSize: 20, fontWeight: "800", color: COLORS.text, marginBottom: 15 },
  statsRow: {
    flexDirection: "row",
    backgroundColor: COLORS.background,
    borderRadius: 15,
    padding: 15,
    width: "100%",
    justifyContent: "space-around",
  },
  statBox: { alignItems: "center" },
  statValue: { fontSize: 18, fontWeight: "bold", color: COLORS.primaryDark },
  statLabel: { fontSize: 12, color: COLORS.textMuted, marginTop: 4 },
  statDivider: { width: 1, backgroundColor: COLORS.border },
  ratingStars: { flexDirection: "row", alignItems: "center", gap: 2 },
  reviewButton: {
    flexDirection: "row",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 15,
    alignItems: "center",
  },
  reviewButtonText: { color: COLORS.white, fontWeight: "bold", marginLeft: 8 },
  reviewsSection: { backgroundColor: COLORS.card, padding: 20, marginBottom: 10 },
  reviewItem: { flexDirection: "row", marginBottom: 15, borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingBottom: 15 },
  reviewerAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primaryLight, alignItems: "center", justifyContent: "center", marginRight: 10 },
  avatarText: { color: COLORS.primaryDark, fontWeight: "bold" },
  reviewContent: { flex: 1 },
  reviewerName: { fontWeight: "bold", color: COLORS.text, marginBottom: 4 },
  reviewText: { color: COLORS.textSecondary, fontSize: 13, marginTop: 6 },
  sectionHeader: { padding: 20, paddingBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: "bold", color: COLORS.text },
  productRow: { justifyContent: "space-between", paddingHorizontal: 16, marginBottom: 16 },
  productCard: {
    width: "48%",
    backgroundColor: COLORS.card,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  productImageWrap: { width: "100%", aspectRatio: 1, backgroundColor: COLORS.imagePlaceholder },
  productImage: { width: "100%", height: "100%" },
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
  productInfo: { padding: 10 },
  productTitle: { fontSize: 12, fontWeight: "bold", color: COLORS.text, marginBottom: 4 },
  productPrice: { fontSize: 13, fontWeight: "bold", color: COLORS.primaryDark },
  emptyContainer: { padding: 40, alignItems: "center" },
  emptyText: { color: COLORS.textMuted, textAlign: "center" },
});
