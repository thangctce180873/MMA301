import { COLORS } from "../constants/colors";
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  ImageBackground,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
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
  isItemFavorite,
  toggleFavorite,
} from "../utils/itemUtils";

import { getUnreadNotificationCount } from "../utils/notificationUtils";

const BANNER_AUTO_PLAY_TIME = 3500;

const HERO_BACKGROUND = require("../assets/banner.png");

const homeBanners = [
  {
    id: "banner-1",
    title: "ƯU ĐÃI ĐỒ SINH VIÊN",
    subtitle: "Giảm giá đến 80% cho nhiều sản phẩm",
    backgroundImage:
      "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=1200&q=80",
    buttonText: "Khám phá",
    action: "explore",
  },
  {
    id: "banner-2",
    title: "SẢN PHẨM GIÁ TỐT",
    subtitle: "Khám phá đồ dùng phù hợp với túi tiền sinh viên",
    backgroundImage:
      "https://images.unsplash.com/photo-1555529771-835f59fc5efe?auto=format&fit=crop&w=1200&q=80",
    buttonText: "Xem ngay",
    action: "explore",
  },
  {
    id: "banner-3",
    title: "ĐĂNG TIN NHANH CHÓNG",
    subtitle: "Thanh lý đồ cũ dễ dàng chỉ trong vài bước",
    backgroundImage:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80",
    buttonText: "Đăng bán",
    action: "add",
  },
];

const shortcutItems = [
  {
    id: "books",
    label: "Giáo trình",
    icon: "book-outline",
    categoryId: "books",
  },
  {
    id: "electronics",
    label: "Đồ điện tử",
    icon: "phone-portrait-outline",
    categoryId: "electronics",
  },
  {
    id: "furniture",
    label: "Nội thất",
    icon: "bed-outline",
    categoryId: "furniture",
  },
  {
    id: "vehicles",
    label: "Xe cộ",
    icon: "car-sport-outline",
    categoryId: "vehicles",
  },
  {
    id: "other",
    label: "Khác",
    icon: "grid-outline",
    categoryId: "other",
  },
];

const BannerCarousel = memo(function BannerCarousel({ navigation, onExplore }) {
  const { width: screenWidth } = useWindowDimensions();

  const flatListRef = useRef(null);
  const activeIndexRef = useRef(0);

  const [activeBannerIndex, setActiveBannerIndex] = useState(0);

  const bannerPageWidth = screenWidth;
  const bannerCardWidth = screenWidth - 32;

  useEffect(() => {
    activeIndexRef.current = activeBannerIndex;
  }, [activeBannerIndex]);

  useEffect(() => {
    if (homeBanners.length <= 1) {
      return undefined;
    }

    const interval = setInterval(() => {
      const currentIndex = activeIndexRef.current;

      const nextIndex =
        currentIndex + 1 >= homeBanners.length ? 0 : currentIndex + 1;

      activeIndexRef.current = nextIndex;
      setActiveBannerIndex(nextIndex);

      flatListRef.current?.scrollToOffset({
        offset: nextIndex * bannerPageWidth,
        animated: true,
      });
    }, BANNER_AUTO_PLAY_TIME);

    return () => {
      clearInterval(interval);
    };
  }, [bannerPageWidth]);

  useEffect(() => {
    flatListRef.current?.scrollToOffset({
      offset: activeIndexRef.current * bannerPageWidth,
      animated: false,
    });
  }, [bannerPageWidth]);

  const handleMomentumScrollEnd = useCallback(
    (event) => {
      const offsetX = event.nativeEvent.contentOffset.x;

      const calculatedIndex = Math.round(offsetX / bannerPageWidth);

      const safeIndex = Math.max(
        0,
        Math.min(calculatedIndex, homeBanners.length - 1),
      );

      activeIndexRef.current = safeIndex;
      setActiveBannerIndex(safeIndex);
    },
    [bannerPageWidth],
  );

  const handleBannerPress = useCallback(
    (banner) => {
      if (banner.action === "add") {
        navigation.navigate("Add");
        return;
      }

      if (banner.action === "explore") {
        onExplore?.();
      }
    },
    [navigation, onExplore],
  );

  const handleDotPress = useCallback(
    (index) => {
      activeIndexRef.current = index;
      setActiveBannerIndex(index);

      flatListRef.current?.scrollToOffset({
        offset: index * bannerPageWidth,
        animated: true,
      });
    },
    [bannerPageWidth],
  );

  const renderBanner = useCallback(
    ({ item }) => {
      return (
        <View
          style={[
            styles.bannerPage,
            {
              width: bannerPageWidth,
            },
          ]}
        >
          <TouchableOpacity
            activeOpacity={0.9}
            style={[
              styles.bannerCard,
              {
                width: bannerCardWidth,
              },
            ]}
            onPress={() => handleBannerPress(item)}
          >
            <ImageBackground
              source={{
                uri: item.backgroundImage,
              }}
              style={styles.bannerImageBackground}
              imageStyle={styles.bannerImageStyle}
            >
              <View style={styles.bannerOverlay}>
                <View style={styles.bannerTextContent}>
                  <Text style={styles.bannerTitle}>{item.title}</Text>

                  <Text numberOfLines={2} style={styles.bannerSubtitle}>
                    {item.subtitle}
                  </Text>

                  <View style={styles.bannerActionButton}>
                    <Text style={styles.bannerActionText}>
                      {item.buttonText}
                    </Text>
                  </View>
                </View>
              </View>
            </ImageBackground>
          </TouchableOpacity>
        </View>
      );
    },
    [bannerCardWidth, bannerPageWidth, handleBannerPress],
  );

  const getItemLayout = useCallback(
    (_, index) => ({
      length: bannerPageWidth,
      offset: bannerPageWidth * index,
      index,
    }),
    [bannerPageWidth],
  );

  return (
    <View style={styles.bannerSection}>
      <View style={styles.bannerWrapper}>
        <FlatList
          ref={flatListRef}
          data={homeBanners}
          horizontal
          bounces={false}
          nestedScrollEnabled
          keyExtractor={(item) => item.id}
          renderItem={renderBanner}
          getItemLayout={getItemLayout}
          showsHorizontalScrollIndicator={false}
          snapToInterval={bannerPageWidth}
          snapToAlignment="start"
          decelerationRate="fast"
          disableIntervalMomentum
          onMomentumScrollEnd={handleMomentumScrollEnd}
        />

        <View pointerEvents="box-none" style={styles.bannerDotsContainer}>
          {homeBanners.map((banner, index) => {
            const isActive = index === activeBannerIndex;

            return (
              <TouchableOpacity
                key={banner.id}
                activeOpacity={0.8}
                onPress={() => handleDotPress(index)}
                style={[styles.bannerDot, isActive && styles.bannerDotActive]}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
});

const ShortcutGrid = memo(function ShortcutGrid({
  activeCategory,
  onSelectCategory,
}) {
  return (
    <View style={styles.shortcutGrid}>
      {shortcutItems.map((item) => {
        const isActive = activeCategory === item.categoryId;

        return (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.8}
            style={styles.shortcutItem}
            onPress={() => onSelectCategory(item.categoryId)}
          >
            <View
              style={[
                styles.shortcutIconWrapper,
                isActive && styles.activeShortcutIconWrapper,
              ]}
            >
              <Ionicons
                name={item.icon}
                size={22}
                color={isActive ? COLORS.white : COLORS.primary}
              />
            </View>

            <Text
              numberOfLines={2}
              style={[
                styles.shortcutLabel,
                isActive && styles.activeShortcutLabel,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
});

const HomeHeader = memo(function HomeHeader({
  navigation,
  user,
  searchQuery,
  onChangeSearch,
  onClearSearch,
  activeCategory,
  notificationCount,
  onOpenNotifications,
  onOpenProfile,
  onSelectCategory,
}) {
  const displayName = String(user?.name || "bạn")
    .trim()
    .split(/\s+/)
    .slice(-1)[0];

  const handleExploreBanner = useCallback(() => {
    onClearSearch();
    onSelectCategory("all");
  }, [onClearSearch, onSelectCategory]);

  return (
    <>
      <ImageBackground
        source={HERO_BACKGROUND}
        style={styles.heroSection}
        imageStyle={styles.heroImageStyle}
      >
        <View style={styles.heroOverlay}>
          <View style={styles.heroTopBar}>
            <TouchableOpacity
              activeOpacity={0.82}
              style={styles.heroProfileButton}
              onPress={onOpenProfile}
            >
              <View style={styles.heroAvatar}>
                {user?.avatarUri ? (
                  <Image
                    source={{
                      uri: user.avatarUri,
                    }}
                    style={styles.heroAvatarImage}
                    resizeMode="cover"
                  />
                ) : (
                  <Text style={styles.heroAvatarText}>
                    {getUserInitials(user?.name)}
                  </Text>
                )}
              </View>

              <View style={styles.heroTopTextContainer}>
                <Text numberOfLines={1} style={styles.heroHelloText}>
                  Xin chào, {displayName}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.heroBellButton}
              onPress={onOpenNotifications}
            >
              <Ionicons
                name={
                  notificationCount > 0
                    ? "notifications"
                    : "notifications-outline"
                }
                size={23}
                color={COLORS.text}
              />

              {notificationCount > 0 ? (
                <View style={styles.heroBellBadge}>
                  <Text style={styles.heroBellBadgeText}>
                    {notificationCount > 9 ? "9+" : notificationCount}
                  </Text>
                </View>
              ) : null}
            </TouchableOpacity>
          </View>

          <View style={styles.heroBottomContent}>
            <Text style={styles.heroDescriptionText}>
              Khám phá những sản phẩm phù hợp với bạn
            </Text>

            <View style={styles.heroSearchContainer}>
              <Ionicons
                name="search-outline"
                size={21}
                color={COLORS.textMuted}
              />

              <TextInput
                value={searchQuery}
                onChangeText={onChangeSearch}
                placeholder="Tìm sản phẩm, danh mục..."
                placeholderTextColor={COLORS.textMuted}
                returnKeyType="search"
                autoCorrect={false}
                autoCapitalize="none"
                style={styles.searchInput}
              />

              {searchQuery.length > 0 ? (
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.searchActionButton}
                  onPress={onClearSearch}
                >
                  <Ionicons
                    name="close-circle"
                    size={19}
                    color={COLORS.textMuted}
                  />
                </TouchableOpacity>
              ) : (
                <View style={styles.searchActionButton}>
                  <Ionicons
                    name="options-outline"
                    size={20}
                    color={COLORS.primary}
                  />
                </View>
              )}
            </View>
          </View>
        </View>
      </ImageBackground>

      <BannerCarousel navigation={navigation} onExplore={handleExploreBanner} />

      <ShortcutGrid
        activeCategory={activeCategory}
        onSelectCategory={onSelectCategory}
      />
    </>
  );
});

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = useMemo(() => (screenWidth - 32) * 0.483, [screenWidth]);

  const [items, setItems] = useState([]);
  const [notificationCount, setNotificationCount] = useState(0);

  const [activeCategory, setActiveCategory] = useState("all");

  const [searchQuery, setSearchQuery] = useState("");

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const loadHomeData = useCallback(async () => {
    try {
      const [storedItems, unreadNotifications] = await Promise.all([
        getAllItems(),

        user ? getUnreadNotificationCount(user) : Promise.resolve(0),
      ]);

      setItems(Array.isArray(storedItems) ? storedItems : []);

      setNotificationCount(Number(unreadNotifications) || 0);
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu trang chủ:", error);

      setItems([]);
      setNotificationCount(0);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadHomeData();
    }, [loadHomeData]),
  );

  const freeItems = useMemo(() => {
    return items.filter((item) => item.status === "selling" && Number(item.price) === 0);
  }, [items]);

  const visibleItems = useMemo(() => {
    const sellingItems = items.filter((item) => item.status === "selling");

    if (activeCategory === "free") {
      const filteredFree = sellingItems.filter((item) => Number(item.price) === 0);
      return filterItems(filteredFree, searchQuery, "all");
    }

    const nonFreeSellingItems = sellingItems.filter((item) => Number(item.price) > 0);
    return filterItems(nonFreeSellingItems, searchQuery, activeCategory);
  }, [items, searchQuery, activeCategory]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadHomeData();
  }, [loadHomeData]);

  const handleChangeSearch = useCallback((value) => {
    setSearchQuery(value);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
  }, []);

  const handleSelectCategory = useCallback(
    (categoryId) => {
      if (categoryId === activeCategory) {
        setActiveCategory("all");
        return;
      }

      setActiveCategory(categoryId);
    },
    [activeCategory],
  );

  const handleSeeAll = useCallback(() => {
    setSearchQuery("");
    setActiveCategory("all");
  }, []);

  const openProfile = useCallback(() => {
    navigation.navigate("Profile");
  }, [navigation]);

  const openNotifications = useCallback(() => {
    navigation.navigate("Notifications");
  }, [navigation]);

  const openDetail = useCallback(
    (itemId) => {
      navigation.navigate("Detail", {
        itemId,
      });
    },
    [navigation],
  );

  const getCategoryName = useCallback((categoryId) => {
    const foundCategory = categories.find(
      (category) => category.id === categoryId,
    );

    return foundCategory?.name || "Khác";
  }, []);

  const handleToggleFavorite = useCallback(
    async (itemId) => {
      try {
        const result = await toggleFavorite(itemId, user);

        if (!result?.success) {
          Alert.alert(
            "Không thể cập nhật",
            result?.message || "Không thể cập nhật sản phẩm đã lưu.",
          );

          return;
        }

        await loadHomeData();
      } catch (error) {
        console.error("Lỗi khi lưu sản phẩm:", error);

        Alert.alert("Có lỗi xảy ra", "Không thể cập nhật sản phẩm đã lưu.");
      }
    },
    [user, loadHomeData],
  );

  const renderProduct = useCallback(
    ({ item }) => {
      const sellerInitial = getUserInitials(item.sellerName);

      const saved = isItemFavorite(item, user);

      return (
        <TouchableOpacity
          activeOpacity={0.88}
          style={styles.productCard}
          onPress={() => openDetail(item.id)}
        >
          <View style={styles.productImageWrap}>
            {item.imageUri ? (
              <Image
                source={{
                  uri: item.imageUri,
                }}
                style={styles.productImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.productImagePlaceholder}>
                <Ionicons
                  name="image-outline"
                  size={36}
                  color={COLORS.textLight}
                />
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
            <Text style={styles.productCategory}>
              {getCategoryName(item.category)}
            </Text>

            <Text numberOfLines={2} style={styles.productTitle}>
              {item.title}
            </Text>

            <Text style={styles.productPrice}>{formatPrice(item.price)}</Text>

            <View style={styles.productMetaRow}>
              <View style={styles.sellerMiniAvatar}>
                {item.sellerAvatar ? (
                  <Image
                    source={{
                      uri: item.sellerAvatar,
                    }}
                    style={styles.sellerMiniAvatarImage}
                    resizeMode="cover"
                  />
                ) : (
                  <Text style={styles.sellerMiniAvatarText}>
                    {sellerInitial}
                  </Text>
                )}
              </View>

              <View style={styles.sellerMetaTextWrap}>
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
    },
    [user, getCategoryName, openDetail, handleToggleFavorite],
  );

  const renderFreeProduct = useCallback(
    ({ item }) => {
      const sellerInitial = getUserInitials(item.sellerName);
      const saved = isItemFavorite(item, user);

      return (
        <TouchableOpacity
          activeOpacity={0.88}
          style={[styles.productCard, { width: cardWidth, marginRight: 12 }]}
          onPress={() => openDetail(item.id)}
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
                <Ionicons
                  name="image-outline"
                  size={36}
                  color={COLORS.textLight}
                />
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
            <Text style={styles.productCategory}>
              {getCategoryName(item.category)}
            </Text>

            <Text numberOfLines={2} style={styles.productTitle}>
              {item.title}
            </Text>

            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
              <Text style={[styles.productPrice, { fontSize: 13, color: COLORS.primaryDark, marginTop: 0 }]}>MIỄN PHÍ</Text>
              <Ionicons name="gift" size={14} color={COLORS.primary} style={{ marginLeft: 4 }} />
            </View>

            <View style={styles.productMetaRow}>
              <View style={styles.sellerMiniAvatar}>
                {item.sellerAvatar ? (
                  <Image
                    source={{ uri: item.sellerAvatar }}
                    style={styles.sellerMiniAvatarImage}
                    resizeMode="cover"
                  />
                ) : (
                  <Text style={styles.sellerMiniAvatarText}>
                    {sellerInitial}
                  </Text>
                )}
              </View>

              <View style={styles.sellerMetaTextWrap}>
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
    },
    [user, getCategoryName, openDetail, handleToggleFavorite, cardWidth],
  );

  const listHeader = useMemo(
    () => (
      <>
        <HomeHeader
          navigation={navigation}
          user={user}
          searchQuery={searchQuery}
          onChangeSearch={handleChangeSearch}
          onClearSearch={handleClearSearch}
          activeCategory={activeCategory}
          notificationCount={notificationCount}
          onOpenNotifications={openNotifications}
          onOpenProfile={openProfile}
          onSelectCategory={handleSelectCategory}
        />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Đang bán</Text>

          <TouchableOpacity activeOpacity={0.8} onPress={handleSeeAll}>
            <Text style={styles.seeAllText}>Xem tất cả</Text>
          </TouchableOpacity>
        </View>
      </>
    ),
    [
      navigation,
      user,
      searchQuery,
      handleChangeSearch,
      handleClearSearch,
      activeCategory,
      notificationCount,
      openNotifications,
      openProfile,
      handleSelectCategory,
      handleSeeAll,
    ],
  );

  const listEmpty = useMemo(
    () => (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconWrap}>
          <Ionicons name="search-outline" size={42} color={COLORS.textMuted} />
        </View>

        <Text style={styles.emptyTitle}>Không tìm thấy sản phẩm</Text>

        <Text style={styles.emptyText}>
          Hãy thử tìm bằng từ khóa hoặc chọn một danh mục khác.
        </Text>
      </View>
    ),
    [],
  );

  const listFooter = useMemo(() => null, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />

          <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <FlatList
        data={visibleItems}
        numColumns={2}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderProduct}
        ListHeaderComponent={listHeader}
        ListFooterComponent={listFooter}
        ListEmptyComponent={listEmpty}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={
          visibleItems.length > 0 ? styles.productRow : undefined
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  listContent: {
    flexGrow: 1,

    paddingBottom: 24,

    backgroundColor: COLORS.background,
  },

  heroSection: {
    height: 260,
  },

  heroImageStyle: {
    resizeMode: "cover",
  },

  heroOverlay: {
    flex: 1,

    justifyContent: "space-between",

    backgroundColor: "rgba(239,238,255,0.08)",

    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 14,
  },

  heroTopBar: {
    minHeight: 52,

    flexDirection: "row",
    alignItems: "center",
  },

  heroProfileButton: {
    flex: 1,

    flexDirection: "row",
    alignItems: "center",
  },

  heroAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: COLORS.primaryLight,

    overflow: "hidden",

    marginRight: 10,

    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.92)",
  },

  heroAvatarImage: {
    width: "100%",
    height: "100%",
  },

  heroAvatarText: {
    color: COLORS.primaryDark,
    fontSize: 11,
    fontWeight: "800",
  },

  heroTopTextContainer: {
    flex: 1,
    justifyContent: "center",
  },

  heroHelloText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "800",
  },

  heroBellButton: {
    width: 42,
    height: 42,

    position: "relative",

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "transparent",
  },

  heroBellBadge: {
    position: "absolute",
    top: 2,
    right: 2,

    minWidth: 17,
    height: 17,
    borderRadius: 9,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: COLORS.primary,

    paddingHorizontal: 4,

    borderWidth: 2,
    borderColor: COLORS.white,
  },

  heroBellBadgeText: {
    color: COLORS.white,
    fontSize: 7,
    fontWeight: "800",
  },

  heroBottomContent: {
    width: "100%",
  },

  emptyButtonText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: "800",

    marginLeft: 6,
  },

  freeSectionContainer: {
    marginTop: 20,
    paddingBottom: 20,
    backgroundColor: COLORS.background,
  },
  
  freeListContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  
  heroDescriptionText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "600",

    marginLeft: 2,
    marginBottom: 10,

    textShadowColor: "rgba(255,255,255,0.72)",

    textShadowOffset: {
      width: 0,
      height: 1,
    },

    textShadowRadius: 3,
  },

  heroSearchContainer: {
    width: "100%",
    height: 52,

    flexDirection: "row",
    alignItems: "center",

    backgroundColor: COLORS.card,

    paddingLeft: 14,
    paddingRight: 8,

    borderRadius: 14,

    shadowColor: COLORS.primaryDark,

    shadowOffset: {
      width: 0,
      height: 3,
    },

    shadowOpacity: 0.1,
    shadowRadius: 7,

    elevation: 4,
  },

  searchInput: {
    flex: 1,
    height: 50,

    color: COLORS.text,
    fontSize: 13,

    paddingHorizontal: 10,
    paddingVertical: 0,
  },

  searchActionButton: {
    width: 34,
    height: 34,
    borderRadius: 10,

    alignItems: "center",
    justifyContent: "center",
  },

  bannerSection: {
    paddingTop: 12,
    paddingBottom: 6,

    backgroundColor: COLORS.background,
  },

  bannerWrapper: {
    position: "relative",
  },

  bannerPage: {
    alignItems: "center",
  },

  bannerCard: {
    height: 120,

    borderRadius: 17,

    overflow: "hidden",
  },

  bannerImageBackground: {
    flex: 1,
  },

  bannerImageStyle: {
    borderRadius: 17,
  },

  bannerOverlay: {
    flex: 1,

    justifyContent: "center",

    backgroundColor: "rgba(38,31,82,0.42)",

    paddingHorizontal: 16,
    paddingVertical: 13,
  },

  bannerTextContent: {
    maxWidth: "73%",
  },

  bannerTitle: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "800",
  },

  bannerSubtitle: {
    color: "rgba(255,255,255,0.91)",
    fontSize: 11,
    lineHeight: 16,

    marginTop: 5,
    marginBottom: 9,
  },

  bannerActionButton: {
    alignSelf: "flex-start",

    backgroundColor: COLORS.white,

    paddingHorizontal: 13,
    paddingVertical: 7,

    borderRadius: 14,
  },

  bannerActionText: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: "800",
  },

  bannerDotsContainer: {
    position: "absolute",
    bottom: 9,
    left: 0,
    right: 0,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  bannerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,

    backgroundColor: "rgba(255,255,255,0.65)",

    marginHorizontal: 3,
  },

  bannerDotActive: {
    width: 17,

    backgroundColor: COLORS.primary,
  },

  shortcutGrid: {
    flexDirection: "row",
    justifyContent: "space-between",

    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,

    backgroundColor: COLORS.background,
  },

  shortcutItem: {
    flex: 1,
    alignItems: "center",
  },

  shortcutIconWrapper: {
    width: 46,
    height: 46,
    borderRadius: 23,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: COLORS.primaryLight,

    marginBottom: 7,
  },

  activeShortcutIconWrapper: {
    backgroundColor: COLORS.primary,
  },

  shortcutLabel: {
    color: COLORS.textSecondary,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "600",

    textAlign: "center",
  },

  activeShortcutLabel: {
    color: COLORS.primary,
    fontWeight: "800",
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,

    backgroundColor: COLORS.background,
  },

  sectionTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "800",
  },

  seeAllText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "700",
  },

  productRow: {
    justifyContent: "space-between",

    paddingHorizontal: 16,

    marginBottom: 14,
  },

  productCard: {
    width: "48.3%",

    backgroundColor: COLORS.card,

    borderRadius: 16,

    overflow: "hidden",

    borderWidth: 1,
    borderColor: COLORS.border,

    shadowColor: COLORS.primaryDark,

    shadowOffset: {
      width: 0,
      height: 3,
    },

    shadowOpacity: 0.05,
    shadowRadius: 10,

    elevation: 2,
  },

  productImageWrap: {
    width: "100%",
    aspectRatio: 1.05,

    position: "relative",

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
    top: 9,
    right: 9,

    width: 28,
    height: 28,
    borderRadius: 14,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "rgba(255,255,255,0.95)",
  },

  productInfo: {
    paddingHorizontal: 11,
    paddingTop: 10,
    paddingBottom: 12,
  },

  productCategory: {
    color: COLORS.textLight,
    fontSize: 8,
    fontWeight: "800",
    textTransform: "uppercase",

    marginBottom: 4,
  },

  productTitle: {
    minHeight: 38,

    color: COLORS.text,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
  },

  productPrice: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: "800",

    marginTop: 7,
    marginBottom: 10,
  },

  productMetaRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  sellerMiniAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: COLORS.primaryLight,

    overflow: "hidden",

    marginRight: 7,
  },

  sellerMiniAvatarImage: {
    width: "100%",
    height: "100%",
  },

  sellerMiniAvatarText: {
    color: COLORS.primaryDark,
    fontSize: 8,
    fontWeight: "800",
  },

  sellerMetaTextWrap: {
    flex: 1,
  },

  sellerName: {
    color: COLORS.textSecondary,
    fontSize: 9,
    fontWeight: "700",
  },

  productTime: {
    color: COLORS.textMuted,
    fontSize: 8,

    marginTop: 2,
  },

  emptyContainer: {
    minHeight: 260,

    alignItems: "center",
    justifyContent: "center",

    paddingHorizontal: 30,
  },

  emptyIconWrap: {
    width: 78,
    height: 78,
    borderRadius: 22,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: COLORS.primaryLight,

    marginBottom: 14,
  },

  emptyTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "800",
  },

  emptyText: {
    color: COLORS.textMuted,
    fontSize: 12,
    lineHeight: 18,

    textAlign: "center",

    marginTop: 6,
  },

  loadingContainer: {
    flex: 1,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: COLORS.background,
  },

  loadingText: {
    color: COLORS.textMuted,
    fontSize: 13,

    marginTop: 12,
  },
});
