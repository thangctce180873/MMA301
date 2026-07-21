import { COLORS } from "../constants/colors";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";

import BackButton from "../components/BackButton";
import { useAuth } from "../context/AuthContext";
import { getAllItems, formatPrice } from "../utils/itemUtils";
import { getSellerRatingStats } from "../utils/reviewUtils";

export default function SellerDashboardScreen({ navigation }) {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    revenue: 0,
    soldCount: 0,
    sellingCount: 0,
    totalFavorites: 0,
    rating: { average: 0, total: 0 },
  });

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      if (!user) return;

      const allItems = await getAllItems();
      const myItems = allItems.filter(
        (item) => String(item.sellerId) === String(user.id) || item.sellerEmail === user.email
      );

      let revenue = 0;
      let soldCount = 0;
      let sellingCount = 0;
      let totalFavorites = 0;

      myItems.forEach((item) => {
        if (item.status === "sold") {
          soldCount++;
          revenue += Number(item.price) || 0;
        } else if (item.status === "selling") {
          sellingCount++;
        }
        
        if (item.favoriteUserIds && Array.isArray(item.favoriteUserIds)) {
          totalFavorites += item.favoriteUserIds.length;
        }
      });

      const ratingStats = await getSellerRatingStats(user.id, user.email);

      setStats({
        revenue,
        soldCount,
        sellingCount,
        totalFavorites,
        rating: ratingStats,
      });
    } catch (error) {
      console.error("Lỗi khi tải thống kê:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, [loadDashboardData])
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Thống kê gian hàng</Text>
        </View>
        <View style={{ width: 42 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.revenueCard}>
          <Text style={styles.revenueLabel}>Tổng doanh thu</Text>
          <Text style={styles.revenueValue}>{formatPrice(stats.revenue)}</Text>
          <View style={styles.revenueBadge}>
            <Ionicons name="trending-up" size={14} color={COLORS.success} />
            <Text style={styles.revenueBadgeText}>Tính từ các đơn Đã bán</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Hiệu suất bán hàng</Text>

        <View style={styles.gridContainer}>
          <View style={styles.statCard}>
            <View style={[styles.iconContainer, { backgroundColor: COLORS.primaryLight }]}>
              <Ionicons name="cart-outline" size={24} color={COLORS.primary} />
            </View>
            <Text style={styles.statNumber}>{stats.soldCount}</Text>
            <Text style={styles.statLabel}>Đã bán</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.iconContainer, { backgroundColor: "#E3F2FD" }]}>
              <Ionicons name="pricetag-outline" size={24} color="#1976D2" />
            </View>
            <Text style={styles.statNumber}>{stats.sellingCount}</Text>
            <Text style={styles.statLabel}>Đang bán</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.iconContainer, { backgroundColor: "#FCE4EC" }]}>
              <Ionicons name="bookmark-outline" size={24} color="#C2185B" />
            </View>
            <Text style={styles.statNumber}>{stats.totalFavorites}</Text>
            <Text style={styles.statLabel}>Lượt lưu (Quan tâm)</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.iconContainer, { backgroundColor: "#FFF8E1" }]}>
              <Ionicons name="star-outline" size={24} color="#F57C00" />
            </View>
            <Text style={styles.statNumber}>{stats.rating.average}</Text>
            <Text style={styles.statLabel}>{stats.rating.total} Đánh giá</Text>
          </View>
        </View>

        <View style={styles.tipCard}>
          <View style={styles.tipIcon}>
            <Ionicons name="bulb-outline" size={24} color={COLORS.primaryDark} />
          </View>
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>Mẹo bán hàng</Text>
            <Text style={styles.tipText}>
              Phản hồi tin nhắn nhanh và giữ thái độ thân thiện sẽ giúp bạn nhận được nhiều đánh giá 5 sao.
            </Text>
          </View>
        </View>
      </ScrollView>
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
  scrollContent: { padding: 20 },
  revenueCard: {
    backgroundColor: COLORS.primarySoft,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    marginBottom: 25,
  },
  revenueLabel: { fontSize: 14, color: COLORS.text, fontWeight: "bold", marginBottom: 8 },
  revenueValue: { fontSize: 32, fontWeight: "900", color: COLORS.primaryDark, marginBottom: 12 },
  revenueBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  revenueBadgeText: { fontSize: 10, fontWeight: "bold", color: COLORS.success, marginLeft: 4 },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: COLORS.text, marginBottom: 15 },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statCard: {
    width: "48%",
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  statNumber: { fontSize: 22, fontWeight: "900", color: COLORS.text, marginBottom: 4 },
  statLabel: { fontSize: 12, color: COLORS.textMuted },
  tipCard: {
    flexDirection: "row",
    backgroundColor: COLORS.primaryLight,
    borderRadius: 16,
    padding: 16,
    marginTop: 10,
    alignItems: "center",
  },
  tipIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.5)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
  },
  tipContent: { flex: 1 },
  tipTitle: { fontSize: 14, fontWeight: "bold", color: COLORS.primaryDark, marginBottom: 4 },
  tipText: { fontSize: 12, color: COLORS.text, lineHeight: 18 },
});
