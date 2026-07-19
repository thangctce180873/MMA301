import React, { useCallback, useMemo, useState } from "react";

import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { Ionicons } from "@expo/vector-icons";

import { useFocusEffect } from "@react-navigation/native";

import { useAuth } from "../context/AuthContext";

import { getUserInitials } from "../utils/authUtils";

import { categories } from "../utils/categories";

import {
  filterItems,
  formatPrice,
  formatTimeAgo,
  getAllItems,
} from "../utils/itemUtils";

const APP_BAR_HEIGHT = 64;

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();

  const [items, setItems] = useState([]);

  const [activeCategory, setActiveCategory] = useState("all");

  const [searchQuery, setSearchQuery] = useState("");

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const loadItems = useCallback(async () => {
    try {
      const storedItems = await getAllItems();

      setItems(storedItems);
    } catch (error) {
      console.error("Lỗi khi tải sản phẩm:", error);

      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadItems();
    }, [loadItems]),
  );

  const visibleItems = useMemo(() => {
    const sellingItems = items.filter((item) => item.status !== "sold");

    return filterItems(sellingItems, searchQuery, activeCategory);
  }, [items, searchQuery, activeCategory]);

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

  const openProfile = () => {
    navigation.navigate("Profile");
  };

  const openDetail = (itemId) => {
    navigation.navigate("Detail", {
      itemId,
    });
  };

  const renderProduct = ({ item }) => {
    const sellerInitial = getUserInitials(item.sellerName);

    return (
      <TouchableOpacity
        activeOpacity={0.86}
        style={styles.productCard}
        onPress={() => openDetail(item.id)}
      >
        <View style={styles.productImageContainer}>
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
              <Ionicons name="image-outline" size={42} color="#A1A18E" />
            </View>
          )}

          <View style={styles.conditionBadge}>
            <Text style={styles.conditionText}>
              {item.condition || "Chưa rõ"}
            </Text>
          </View>
        </View>

        <View style={styles.productContent}>
          <Text style={styles.categoryName}>
            {getCategoryName(item.category)}
          </Text>

          <Text
            numberOfLines={2}
            ellipsizeMode="tail"
            style={styles.productTitle}
          >
            {item.title}
          </Text>

          <Text style={styles.priceText}>{formatPrice(item.price)}</Text>

          <View style={styles.sellerDivider} />

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
                <Text style={styles.sellerAvatarText}>{sellerInitial}</Text>
              )}
            </View>

            <View style={styles.sellerInfo}>
              <Text numberOfLines={1} style={styles.sellerName}>
                {item.sellerName || "Người bán"}
              </Text>

              <Text style={styles.productTime}>
                {formatTimeAgo(item.createdAt)}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIcon}>
          <Ionicons name="search-outline" size={43} color="#A1A18E" />
        </View>

        <Text style={styles.emptyTitle}>Không tìm thấy sản phẩm</Text>

        <Text style={styles.emptyDescription}>
          Hãy thử tìm kiếm bằng từ khóa hoặc danh mục khác.
        </Text>
      </View>
    );
  };

  const renderListHeader = () => {
    return (
      <>
        {/* Thanh tìm kiếm */}
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={21} color="#A1A18E" />

            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Tìm sách, đồ điện tử, đồ dùng..."
              placeholderTextColor="#A1A18E"
              returnKeyType="search"
              style={styles.searchInput}
            />

            {searchQuery ? (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setSearchQuery("")}
              >
                <Ionicons name="close-circle" size={19} color="#A1A18E" />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* Danh mục */}
        <View style={styles.categorySection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryContent}
          >
            {categories.map((category) => {
              const isActive = activeCategory === category.id;

              return (
                <TouchableOpacity
                  key={category.id}
                  activeOpacity={0.8}
                  style={[
                    styles.categoryButton,

                    isActive && styles.activeCategoryButton,
                  ]}
                  onPress={() => setActiveCategory(category.id)}
                >
                  <Text
                    style={[
                      styles.categoryButtonText,

                      isActive && styles.activeCategoryButtonText,
                    ]}
                  >
                    {category.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Tiêu đề danh sách */}
        <View style={styles.listTitleRow}>
          <Text style={styles.listTitle}>Tin đăng mới nhất</Text>

          <Text style={styles.resultCount}>{visibleItems.length} sản phẩm</Text>
        </View>
      </>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      {/* Khung logo và avatar */}
      <View style={styles.headerCard}>
        <View style={styles.brandContainer}>
          <View style={styles.logoBox}>
            <Ionicons name="moon" size={28} color="#FFFFFF" />
          </View>

          <View style={styles.brandText}>
            <Text style={styles.appName}>Night Sweet</Text>

            <Text style={styles.appSubtitle}>CHỢ SINH VIÊN</Text>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.userAvatar}
          onPress={openProfile}
        >
          {user?.avatarUri ? (
            <Image
              source={{
                uri: user.avatarUri,
              }}
              style={styles.userAvatarImage}
              resizeMode="cover"
            />
          ) : (
            <Text style={styles.userAvatarText}>
              {getUserInitials(user?.name)}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7A8450" />

          <Text style={styles.loadingText}>Đang tải sản phẩm...</Text>
        </View>
      ) : (
        <FlatList
          data={visibleItems}
          numColumns={2}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderProduct}
          ListHeaderComponent={renderListHeader}
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          columnWrapperStyle={
            visibleItems.length > 0 ? styles.productRow : undefined
          }
          contentContainerStyle={styles.listContent}
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

  /*
   * Chiều cao này bằng với
   * chiều cao nội dung thanh tab dưới.
   */
  headerCard: {
    height: APP_BAR_HEIGHT,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    backgroundColor: "#FFFFFF",

    paddingHorizontal: 18,

    borderBottomWidth: 1,
    borderBottomColor: "#E8E4D9",
  },

  brandContainer: {
    flexDirection: "row",
    alignItems: "center",
  },

  logoBox: {
    width: 44,
    height: 44,
    borderRadius: 13,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#7A8450",
  },

  brandText: {
    marginLeft: 10,
  },

  appName: {
    color: "#4A4A3A",
    fontSize: 17,
    fontWeight: "800",
  },

  appSubtitle: {
    color: "#8A8A75",
    fontSize: 8,
    fontWeight: "800",

    letterSpacing: 1.5,

    marginTop: 1,
  },

  userAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#D6CEB8",

    overflow: "hidden",
  },

  userAvatarImage: {
    width: "100%",
    height: "100%",
  },

  userAvatarText: {
    color: "#7A8450",
    fontSize: 11,
    fontWeight: "800",
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
    paddingBottom: 24,
  },

  searchSection: {
    backgroundColor: "#FFFFFF",

    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 10,
  },

  searchContainer: {
    height: 47,

    flexDirection: "row",
    alignItems: "center",

    backgroundColor: "#F3F1E9",

    paddingHorizontal: 15,

    borderRadius: 24,
  },

  searchInput: {
    flex: 1,
    height: 46,

    color: "#4A4A3A",
    fontSize: 13,

    paddingHorizontal: 10,
  },

  categorySection: {
    backgroundColor: "#FFFFFF",

    paddingBottom: 12,

    borderBottomWidth: 1,
    borderBottomColor: "#E8E4D9",
  },

  categoryContent: {
    paddingHorizontal: 14,
  },

  categoryButton: {
    height: 39,

    alignItems: "center",
    justifyContent: "center",

    paddingHorizontal: 17,

    marginHorizontal: 3,

    borderWidth: 1,
    borderColor: "transparent",
    borderRadius: 13,
  },

  activeCategoryButton: {
    backgroundColor: "#FFFFFF",

    borderColor: "#E8E4D9",

    shadowColor: "#000000",

    shadowOffset: {
      width: 0,
      height: 2,
    },

    shadowOpacity: 0.06,
    shadowRadius: 3,

    elevation: 2,
  },

  categoryButtonText: {
    color: "#6D6D5D",
    fontSize: 11,
    fontWeight: "700",
  },

  activeCategoryButtonText: {
    color: "#7A8450",
    fontWeight: "800",
  },

  listTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    paddingHorizontal: 18,
    paddingTop: 19,
    paddingBottom: 13,
  },

  listTitle: {
    color: "#4A4A3A",
    fontSize: 20,
    fontWeight: "800",
  },

  resultCount: {
    color: "#A1A18E",
    fontSize: 10,
  },

  productRow: {
    justifyContent: "space-between",

    paddingHorizontal: 16,
    marginBottom: 13,
  },

  productCard: {
    width: "48.5%",

    backgroundColor: "#FFFFFF",

    borderWidth: 1,
    borderColor: "#E8E4D9",
    borderRadius: 20,

    overflow: "hidden",

    shadowColor: "#000000",

    shadowOffset: {
      width: 0,
      height: 2,
    },

    shadowOpacity: 0.06,
    shadowRadius: 4,

    elevation: 2,
  },

  productImageContainer: {
    width: "100%",
    aspectRatio: 1,

    position: "relative",

    backgroundColor: "#F3F1E9",
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

  conditionBadge: {
    position: "absolute",
    top: 9,
    right: 9,

    backgroundColor: "rgba(255,255,255,0.94)",

    paddingHorizontal: 8,
    paddingVertical: 5,

    borderRadius: 9,
  },

  conditionText: {
    color: "#7A8450",
    fontSize: 8,
    fontWeight: "800",
  },

  productContent: {
    flex: 1,

    paddingHorizontal: 11,
    paddingTop: 10,
    paddingBottom: 10,
  },

  categoryName: {
    color: "#A1A18E",
    fontSize: 8,
    fontWeight: "800",

    textTransform: "uppercase",
  },

  productTitle: {
    minHeight: 36,

    color: "#4A4A3A",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "800",

    marginTop: 4,
  },

  priceText: {
    color: "#7A8450",
    fontSize: 15,
    fontWeight: "800",

    marginTop: 6,
  },

  sellerDivider: {
    height: 1,

    backgroundColor: "#F3F1E9",

    marginTop: 10,
    marginBottom: 8,
  },

  sellerRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  sellerAvatar: {
    width: 25,
    height: 25,
    borderRadius: 13,

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
    fontSize: 8,
    fontWeight: "800",
  },

  sellerInfo: {
    flex: 1,
  },

  sellerName: {
    color: "#6D6D5D",
    fontSize: 9,
    fontWeight: "700",
  },

  productTime: {
    color: "#A1A18E",
    fontSize: 8,

    marginTop: 1,
  },

  emptyContainer: {
    minHeight: 330,

    alignItems: "center",
    justifyContent: "center",

    paddingHorizontal: 35,
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

    marginTop: 16,
  },

  emptyDescription: {
    color: "#A1A18E",
    fontSize: 12,
    lineHeight: 19,

    textAlign: "center",

    marginTop: 6,
  },
});
