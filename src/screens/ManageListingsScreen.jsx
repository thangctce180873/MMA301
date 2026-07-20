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
    name: "Tất cả",
  },
  {
    id: "selling",
    name: "Đang bán",
  },
  {
    id: "sold",
    name: "Đã bán",
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

      setItems(userItems);
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

    return items.filter((item) => item.status === activeFilter);
  }, [items, activeFilter]);

  const sellingCount = useMemo(() => {
    return items.filter((item) => item.status === "selling").length;
  }, [items]);

  const soldCount = useMemo(() => {
    return items.filter((item) => item.status === "sold").length;
  }, [items]);

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
              <Ionicons name="image-outline" size={38} color="#A1A18E" />
            </View>
          )}

          <View
            style={[
              styles.statusBadge,
              isSold ? styles.soldStatusBadge : styles.sellingStatusBadge,
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                isSold ? styles.soldStatusText : styles.sellingStatusText,
              ]}
            >
              {isSold ? "ĐÃ BÁN" : "ĐANG BÁN"}
            </Text>
          </View>
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

          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={14} color="#A1A18E" />

            <Text numberOfLines={1} style={styles.infoText}>
              {item.location || "Chưa cập nhật địa điểm"}
            </Text>
          </View>

          <View style={styles.bottomRow}>
            <View style={styles.timeRow}>
              <Ionicons name="time-outline" size={14} color="#A1A18E" />

              <Text style={styles.timeText}>
                {formatTimeAgo(item.createdAt)}
              </Text>
            </View>

            <View style={styles.detailButton}>
              <Text style={styles.detailButtonText}>Xem chi tiết</Text>

              <Ionicons name="chevron-forward" size={16} color="#7A8450" />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => {
    let title = "Bạn chưa có tin đăng nào";

    let description = "Hãy đăng sản phẩm đầu tiên của bạn.";

    if (activeFilter === "selling") {
      title = "Không có sản phẩm đang bán";

      description = "Các sản phẩm đang bán sẽ xuất hiện tại đây.";
    }

    if (activeFilter === "sold") {
      title = "Không có sản phẩm đã bán";

      description = "Các sản phẩm được đánh dấu đã bán sẽ xuất hiện tại đây.";
    }

    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIcon}>
          <Ionicons name="cube-outline" size={45} color="#A1A18E" />
        </View>

        <Text style={styles.emptyTitle}>{title}</Text>

        <Text style={styles.emptyDescription}>{description}</Text>

        {items.length === 0 ? (
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.addButton}
            onPress={() =>
              navigation.navigate("MainTabs", {
                screen: "Add",
              })
            }
          >
            <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />

            <Text style={styles.addButtonText}>ĐĂNG SẢN PHẨM</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />

        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Quản lý tin đăng</Text>

          <Text style={styles.headerSubtitle}>Sản phẩm bạn đã đăng bán</Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.75}
          style={styles.headerActionButton}
          onPress={handleRefresh}
        >
          <Ionicons name="refresh-outline" size={23} color="#7A8450" />
        </TouchableOpacity>
      </View>

      <View style={styles.summaryContainer}>
        <SummaryItem
          iconName="cube-outline"
          value={items.length}
          label="Tổng tin đăng"
        />

        <View style={styles.summaryDivider} />

        <SummaryItem
          iconName="pricetag-outline"
          value={sellingCount}
          label="Đang bán"
        />

        <View style={styles.summaryDivider} />

        <SummaryItem
          iconName="checkmark-circle-outline"
          value={soldCount}
          label="Đã bán"
          iconColor="#8B5E3C"
        />
      </View>

      <View style={styles.filterSection}>
        {filters.map((filter) => {
          const isActive = activeFilter === filter.id;

          const count =
            filter.id === "all"
              ? items.length
              : filter.id === "selling"
                ? sellingCount
                : soldCount;

          return (
            <TouchableOpacity
              key={filter.id}
              activeOpacity={0.8}
              style={[
                styles.filterButton,
                isActive && styles.activeFilterButton,
              ]}
              onPress={() => setActiveFilter(filter.id)}
            >
              <Text
                style={[styles.filterText, isActive && styles.activeFilterText]}
              >
                {filter.name}
              </Text>

              <View
                style={[
                  styles.filterCount,
                  isActive && styles.activeFilterCount,
                ]}
              >
                <Text
                  style={[
                    styles.filterCountText,
                    isActive && styles.activeFilterCountText,
                  ]}
                >
                  {count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7A8450" />

          <Text style={styles.loadingText}>Đang tải tin đăng...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredItems}
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

function SummaryItem({ iconName, value, label, iconColor = "#7A8450" }) {
  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryIconContainer}>
        <Ionicons name={iconName} size={21} color={iconColor} />
      </View>

      <View>
        <Text style={styles.summaryValue}>{value}</Text>

        <Text style={styles.summaryLabel}>{label}</Text>
      </View>
    </View>
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

  summaryContainer: {
    minHeight: 90,

    flexDirection: "row",
    alignItems: "center",

    backgroundColor: "#FFFFFF",

    marginHorizontal: 16,
    marginTop: 16,

    borderWidth: 1,
    borderColor: "#E8E4D9",
    borderRadius: 20,

    elevation: 2,
  },

  summaryCard: {
    flex: 1,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  summaryIconContainer: {
    width: 37,
    height: 37,
    borderRadius: 12,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#F3F1E9",

    marginRight: 8,
  },

  summaryValue: {
    color: "#4A4A3A",
    fontSize: 18,
    fontWeight: "800",
  },

  summaryLabel: {
    color: "#A1A18E",
    fontSize: 8,
    fontWeight: "700",
    marginTop: 1,
  },

  summaryDivider: {
    width: 1,
    height: 44,

    backgroundColor: "#E8E4D9",
  },

  filterSection: {
    flexDirection: "row",

    paddingHorizontal: 16,
    paddingVertical: 15,
  },

  filterButton: {
    flex: 1,
    height: 42,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#F3F1E9",

    borderWidth: 1,
    borderColor: "transparent",
    borderRadius: 14,

    marginHorizontal: 4,
  },

  activeFilterButton: {
    backgroundColor: "#FFFFFF",
    borderColor: "#7A8450",

    elevation: 2,
  },

  filterText: {
    color: "#8A8A75",
    fontSize: 11,
    fontWeight: "700",
  },

  activeFilterText: {
    color: "#7A8450",
    fontWeight: "800",
  },

  filterCount: {
    minWidth: 21,
    height: 21,
    borderRadius: 11,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#E8E4D9",

    marginLeft: 6,
    paddingHorizontal: 5,
  },

  activeFilterCount: {
    backgroundColor: "#7A8450",
  },

  filterCountText: {
    color: "#8A8A75",
    fontSize: 9,
    fontWeight: "800",
  },

  activeFilterCountText: {
    color: "#FFFFFF",
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
    flexDirection: "row",

    backgroundColor: "#FFFFFF",

    padding: 11,
    marginBottom: 13,

    borderWidth: 1,
    borderColor: "#E8E4D9",
    borderRadius: 20,

    elevation: 2,
  },

  imageContainer: {
    width: 112,
    height: 112,

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

  statusBadge: {
    position: "absolute",
    left: 7,
    bottom: 7,

    paddingHorizontal: 7,
    paddingVertical: 4,

    borderRadius: 8,
  },

  sellingStatusBadge: {
    backgroundColor: "rgba(255,255,255,0.94)",
  },

  soldStatusBadge: {
    backgroundColor: "rgba(139,94,60,0.94)",
  },

  statusBadgeText: {
    fontSize: 8,
    fontWeight: "800",
  },

  sellingStatusText: {
    color: "#7A8450",
  },

  soldStatusText: {
    color: "#FFFFFF",
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

  infoRow: {
    flexDirection: "row",
    alignItems: "center",

    marginTop: 7,
  },

  infoText: {
    flex: 1,

    color: "#8A8A75",
    fontSize: 9,

    marginLeft: 4,
  },

  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    marginTop: "auto",
    paddingTop: 8,

    borderTopWidth: 1,
    borderTopColor: "#F3F1E9",
  },

  timeRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  timeText: {
    color: "#A1A18E",
    fontSize: 9,

    marginLeft: 4,
  },

  detailButton: {
    flexDirection: "row",
    alignItems: "center",
  },

  detailButtonText: {
    color: "#7A8450",
    fontSize: 9,
    fontWeight: "800",
  },

  emptyContainer: {
    minHeight: 380,

    alignItems: "center",
    justifyContent: "center",

    paddingHorizontal: 30,
  },

  emptyIcon: {
    width: 82,
    height: 82,
    borderRadius: 27,

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

  addButton: {
    height: 48,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#7A8450",

    paddingHorizontal: 20,

    borderRadius: 15,
    marginTop: 18,
  },

  addButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",

    marginLeft: 7,
  },
});
