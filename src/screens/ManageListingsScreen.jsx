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
import { useFocusEffect } from "@react-navigation/native";

import BackButton from "../components/BackButton";
                                                                                        
import { useAuth } from "../context/AuthContext";
import { categories } from "../utils/categories";

import { formatPrice, formatTimeAgo, getUserItems } from "../utils/itemUtils";

const filters = [
  {
    id: "all",
    label: "Tất cả",
  },
  {
    id: "draft",
    label: "Bản nháp",
  },
  {
    id: "selling",
    label: "Đang bán",
  },
  {
    id: "free",
    label: "0 đồng",
  },
  {
    id: "sold",
    label: "Đã bán",
  },
];

export default function ManageListingsScreen({ navigation }) {
  const { user } = useAuth();

  const [items, setItems] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const loadItems = useCallback(async () => {
    try {
      const userItems = await getUserItems(user);

      setItems(Array.isArray(userItems) ? userItems : []);
    } catch (error) {
      console.error("Lỗi khi tải tin đăng:", error);

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

  const filteredItems = useMemo(() => {
    if (activeFilter === "all") {
      return items;
    }
    if (activeFilter === "free") {
      return items.filter((item) => Number(item.price) === 0 && item.status === "selling");
    }
    if (activeFilter === "selling") {
      return items.filter((item) => Number(item.price) > 0 && item.status === "selling");
    }

    return items.filter((item) => item.status === activeFilter);
  }, [items, activeFilter]);

  const sellingCount = useMemo(
    () => items.filter((item) => item.status === "selling" && Number(item.price) > 0).length,
    [items],
  );

  const freeCount = useMemo(
    () => items.filter((item) => item.status === "selling" && Number(item.price) === 0).length,
    [items],
  );

  const draftCount = useMemo(
    () => items.filter((item) => item.status === "draft").length,
    [items],
  );

  const soldCount = useMemo(
    () => items.filter((item) => item.status === "sold").length,
    [items],
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

  const openAddScreen = () => {
    navigation.navigate("MainTabs", {
      screen: "Add",
    });
  };

  const renderItem = ({ item }) => {
    const sold = item.status === "sold";

    return (
      <TouchableOpacity
        activeOpacity={0.85}
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
                size={35}
                color={COLORS.textMuted}
              />
            </View>
          )}

          <View
            style={[
              styles.statusBadge,

              sold ? styles.soldBadge : (item.status === "draft" ? styles.draftBadge : styles.sellingBadge),
            ]}
          >
            <Text style={styles.statusText}>
              {sold ? "ĐÃ BÁN" : (item.status === "draft" ? "BẢN NHÁP" : "ĐANG BÁN")}
            </Text>
          </View>
        </View>

        <View style={styles.productContent}>
          <Text style={styles.categoryText}>
            {getCategoryName(item.category)}
          </Text>

          <Text numberOfLines={2} style={styles.productTitle}>
            {item.title}
          </Text>

          <Text style={styles.priceText}>{formatPrice(item.price)}</Text>

          <View style={styles.metaRow}>
            <Ionicons name="time-outline" size={13} color={COLORS.textMuted} />

            <Text style={styles.timeText}>{formatTimeAgo(item.createdAt)}</Text>
          </View>

          <View style={styles.cardFooter}>
            <Text style={styles.viewDetailText}>Xem chi tiết</Text>

            <Ionicons name="arrow-forward" size={16} color={COLORS.primary} />
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
          <Text style={styles.headerTitle}>Quản lý tin đăng</Text>

          <Text style={styles.headerSubtitle}>Sản phẩm của bạn</Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.75}
          style={styles.addButton}
          onPress={openAddScreen}
        >
          <Ionicons name="add" size={25} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.summaryCard}>
        <SummaryItem value={items.length} label="Tổng tin" />
        <View style={styles.summaryDivider} />
        <SummaryItem value={draftCount} label="Bản nháp" />
        <View style={styles.summaryDivider} />
        <SummaryItem value={sellingCount} label="Đang bán" />
        <View style={styles.summaryDivider} />
        <SummaryItem value={freeCount} label="0 đồng" />
        <View style={styles.summaryDivider} />
        <SummaryItem value={soldCount} label="Đã bán" />
      </View>

      <View style={styles.filterRow}>
        {filters.map((filter) => {
          const active = activeFilter === filter.id;

          return (
            <TouchableOpacity
              key={filter.id}
              activeOpacity={0.8}
              style={[styles.filterButton, active && styles.activeFilterButton]}
              onPress={() => setActiveFilter(filter.id)}
            >
              <Text
                style={[styles.filterText, active && styles.activeFilterText]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />

          <Text style={styles.loadingText}>Đang tải tin đăng...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.listContent,

            filteredItems.length === 0 && styles.emptyListContent,
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
            <EmptyState activeFilter={activeFilter} onAdd={openAddScreen} />
          }
        />
      )}
    </SafeAreaView>
  );
}

function SummaryItem({ value, label }) {
  return (
    <View style={styles.summaryItem}>
      <Text style={styles.summaryValue}>{value}</Text>

      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function EmptyState({ activeFilter, onAdd }) {
  const message =
    activeFilter === "selling"
      ? "Bạn chưa có sản phẩm đang bán."
      : activeFilter === "sold"
        ? "Bạn chưa có sản phẩm đã bán."
        : "Bạn chưa đăng sản phẩm nào.";

  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIcon}>
        <Ionicons name="cube-outline" size={45} color={COLORS.textMuted} />
      </View>

      <Text style={styles.emptyTitle}>Chưa có tin đăng</Text>

      <Text style={styles.emptyDescription}>{message}</Text>

      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.emptyButton}
        onPress={onAdd}
      >
        <Ionicons name="add" size={20} color={COLORS.white} />

        <Text style={styles.emptyButtonText}>ĐĂNG SẢN PHẨM</Text>
      </TouchableOpacity>
    </View>
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

  addButton: {
    width: 42,
    height: 42,
    borderRadius: 14,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: COLORS.primaryLight,
  },

  summaryCard: {
    minHeight: 82,

    flexDirection: "row",
    alignItems: "center",

    backgroundColor: COLORS.primarySoft,

    marginHorizontal: 16,
    marginTop: 15,

    borderRadius: 21,
  },

  summaryItem: {
    flex: 1,
    alignItems: "center",
  },

  summaryValue: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "800",
  },

  summaryLabel: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: "700",

    marginTop: 3,
  },

  summaryDivider: {
    width: 1,
    height: 34,

    backgroundColor: COLORS.border,
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
    paddingTop: 6,
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

  statusBadge: {
    position: "absolute",
    left: 7,
    bottom: 7,

    paddingHorizontal: 8,
    paddingVertical: 5,

    borderRadius: 9,
  },

  sellingBadge: {
    backgroundColor: COLORS.primary,
  },

  draftBadge: {
    backgroundColor: COLORS.textMuted,
  },

  soldBadge: {
    backgroundColor: COLORS.primaryDark,
  },

  statusText: {
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

    marginTop: 6,
  },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",

    marginTop: 7,
  },

  timeText: {
    color: COLORS.textMuted,
    fontSize: 9,

    marginLeft: 4,
  },

  cardFooter: {
    flexDirection: "row",
    alignItems: "center",

    marginTop: "auto",
  },

  viewDetailText: {
    color: COLORS.primary,
    fontSize: 9,
    fontWeight: "800",

    marginRight: 4,
  },

  emptyContainer: {
    flex: 1,

    alignItems: "center",
    justifyContent: "center",

    paddingHorizontal: 35,
  },

  emptyIcon: {
    width: 84,
    height: 84,
    borderRadius: 25,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: COLORS.primaryLight,
  },

  emptyTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "800",

    marginTop: 16,
  },

  emptyDescription: {
    color: COLORS.textMuted,
    fontSize: 12,
    lineHeight: 19,

    textAlign: "center",

    marginTop: 6,
  },

  emptyButton: {
    height: 47,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    backgroundColor: COLORS.primary,

    paddingHorizontal: 19,

    borderRadius: 16,

    marginTop: 19,
  },

  emptyButtonText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: "800",

    marginLeft: 6,
  },
});
