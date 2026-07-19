import React, { useCallback, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  ScrollView,
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

import { categories } from "../utils/categories";

import {
  deleteItem,
  formatPrice,
  formatTimeAgo,
  getItemById,
  isItemFavorite,
  isItemOwner,
  toggleFavorite,
  toggleSoldStatus,
} from "../utils/itemUtils";

export default function DetailScreen({ route, navigation }) {
  const { user } = useAuth();

  const itemId = route.params?.itemId;

  const [item, setItem] = useState(null);

  const [loading, setLoading] = useState(true);

  const [processing, setProcessing] = useState(false);

  const loadItem = useCallback(async () => {
    try {
      setLoading(true);

      if (!itemId) {
        setItem(null);
        return;
      }

      const storedItem = await getItemById(itemId);

      setItem(storedItem);
    } catch (error) {
      console.error("Lỗi khi tải sản phẩm:", error);

      setItem(null);
    } finally {
      setLoading(false);
    }
  }, [itemId]);

  useFocusEffect(
    useCallback(() => {
      loadItem();
    }, [loadItem]),
  );

  const ownerOfCurrentItem = isItemOwner(item, user);

  const currentItemIsFavorite = isItemFavorite(item, user);

  const categoryName =
    categories.find((category) => category.id === item?.category)?.name ||
    "Khác";

  const sellerInitial = getUserInitials(item?.sellerName);

  const handleToggleFavorite = async () => {
    if (!item || processing) {
      return;
    }

    try {
      setProcessing(true);

      const result = await toggleFavorite(item.id, user);

      if (!result.success) {
        Alert.alert("Không thể cập nhật", result.message);

        return;
      }

      await loadItem();
    } catch (error) {
      console.error("Lỗi khi cập nhật sản phẩm đã lưu:", error);

      Alert.alert("Có lỗi xảy ra", "Không thể cập nhật sản phẩm đã lưu.");
    } finally {
      setProcessing(false);
    }
  };

  const handleToggleSold = async () => {
    if (!item || !ownerOfCurrentItem || processing) {
      return;
    }

    try {
      setProcessing(true);

      const result = await toggleSoldStatus(item.id, user);

      if (!result.success) {
        Alert.alert("Không thể cập nhật", result.message);

        return;
      }

      await loadItem();
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái:", error);

      Alert.alert("Có lỗi xảy ra", "Không thể cập nhật trạng thái sản phẩm.");
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = () => {
    if (!item || !ownerOfCurrentItem) {
      return;
    }

    Alert.alert(
      "Xóa sản phẩm",
      "Bạn có chắc chắn muốn xóa tin đăng này không?",
      [
        {
          text: "Hủy",
          style: "cancel",
        },
        {
          text: "Xóa",
          style: "destructive",

          onPress: async () => {
            try {
              setProcessing(true);

              const result = await deleteItem(item.id, user);

              if (result.success) {
                navigation.goBack();
                return;
              }

              Alert.alert("Xóa thất bại", result.message);
            } catch (error) {
              console.error("Lỗi khi xóa sản phẩm:", error);

              Alert.alert("Xóa thất bại", "Không thể xóa sản phẩm.");
            } finally {
              setProcessing(false);
            }
          },
        },
      ],
    );
  };

  const handleContactSeller = async () => {
    const phoneNumber = String(item?.sellerPhone || "").replace(/\D/g, "");

    if (!phoneNumber) {
      Alert.alert(
        "Không có số điện thoại",
        "Người bán chưa cung cấp số điện thoại.",
      );

      return;
    }

    const phoneUrl = `tel:${phoneNumber}`;

    try {
      const supported = await Linking.canOpenURL(phoneUrl);

      if (!supported) {
        Alert.alert(
          "Không thể mở ứng dụng gọi điện",
          `Số điện thoại người bán: ${phoneNumber}`,
        );

        return;
      }

      await Linking.openURL(phoneUrl);
    } catch (error) {
      console.error("Lỗi khi mở ứng dụng gọi điện:", error);

      Alert.alert(
        "Không thể gọi điện",
        `Số điện thoại người bán: ${phoneNumber}`,
      );
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer} edges={["top", "bottom"]}>
        <ActivityIndicator size="large" color="#7A8450" />

        <Text style={styles.loadingText}>Đang tải sản phẩm...</Text>
      </SafeAreaView>
    );
  }

  if (!item) {
    return (
      <SafeAreaView style={styles.centerContainer} edges={["top", "bottom"]}>
        <Ionicons name="alert-circle-outline" size={55} color="#A1A18E" />

        <Text style={styles.notFoundTitle}>Không tìm thấy sản phẩm</Text>

        <Text style={styles.notFoundDescription}>
          Sản phẩm có thể đã bị xóa hoặc không còn tồn tại.
        </Text>

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.backHomeButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={18} color="#FFFFFF" />

          <Text style={styles.backHomeText}>QUAY LẠI</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <BackButton disabled={processing} onPress={() => navigation.goBack()} />

        <Text style={styles.headerTitle}>Chi tiết sản phẩm</Text>

        <TouchableOpacity
          activeOpacity={0.75}
          style={styles.favoriteButton}
          disabled={processing}
          onPress={handleToggleFavorite}
        >
          {processing ? (
            <ActivityIndicator size="small" color="#7A8450" />
          ) : (
            <Ionicons
              name={currentItemIsFavorite ? "heart" : "heart-outline"}
              size={24}
              color={currentItemIsFavorite ? "#D97706" : "#4A4A3A"}
            />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
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
              <Ionicons name="image-outline" size={60} color="#A1A18E" />
            </View>
          )}

          <View style={styles.conditionBadge}>
            <Text style={styles.conditionText}>
              {item.condition || "Chưa rõ"}
            </Text>
          </View>

          {item.status === "sold" ? (
            <View style={styles.soldBadge}>
              <Text style={styles.soldText}>ĐÃ BÁN</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.content}>
          <View style={styles.categoryRow}>
            <Text style={styles.categoryText}>{categoryName}</Text>

            {ownerOfCurrentItem ? (
              <View style={styles.ownerBadge}>
                <Ionicons
                  name="person-circle-outline"
                  size={14}
                  color="#7A8450"
                />

                <Text style={styles.ownerBadgeText}>TIN CỦA BẠN</Text>
              </View>
            ) : null}
          </View>

          <Text style={styles.productTitle}>{item.title}</Text>

          <Text style={styles.priceText}>{formatPrice(item.price)}</Text>

          <View style={styles.basicInfoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="location-outline" size={19} color="#7A8450" />
              </View>

              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Địa điểm giao dịch</Text>

                <Text style={styles.infoText}>
                  {item.location || "Chưa cập nhật"}
                </Text>
              </View>
            </View>

            <View style={styles.infoDivider} />

            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="time-outline" size={19} color="#7A8450" />
              </View>

              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Thời gian đăng</Text>

                <Text style={styles.infoText}>
                  {formatTimeAgo(item.createdAt)}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.sellerCard}>
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
              <Text style={styles.sellerLabel}>Người bán</Text>

              <Text style={styles.sellerName}>
                {item.sellerName || "Người bán"}
              </Text>

              <View style={styles.phoneRow}>
                <Ionicons name="call-outline" size={14} color="#7A8450" />

                <Text style={styles.sellerPhone}>
                  {item.sellerPhone || "Chưa có số điện thoại"}
                </Text>
              </View>
            </View>

            <View style={styles.verifiedIcon}>
              <Ionicons name="checkmark-circle" size={22} color="#7A8450" />
            </View>
          </View>

          <View style={styles.descriptionSection}>
            <Text style={styles.descriptionTitle}>Mô tả chi tiết</Text>

            <Text style={styles.descriptionText}>
              {item.description || "Chưa có mô tả."}
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.contactButton}
            onPress={handleContactSeller}
          >
            <Ionicons name="call-outline" size={20} color="#FFFFFF" />

            <Text style={styles.contactText}>GỌI CHO NGƯỜI BÁN</Text>
          </TouchableOpacity>

          {ownerOfCurrentItem ? (
            <>
              <TouchableOpacity
                activeOpacity={0.85}
                disabled={processing}
                style={[
                  styles.soldButton,

                  item.status === "sold" && styles.sellingButton,

                  processing && styles.disabledButton,
                ]}
                onPress={handleToggleSold}
              >
                {processing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons
                      name={
                        item.status === "sold"
                          ? "refresh-outline"
                          : "checkmark-circle-outline"
                      }
                      size={20}
                      color="#FFFFFF"
                    />

                    <Text style={styles.soldButtonText}>
                      {item.status === "sold"
                        ? "ĐÁNH DẤU ĐANG BÁN"
                        : "ĐÁNH DẤU ĐÃ BÁN"}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                disabled={processing}
                style={[
                  styles.deleteButton,

                  processing && styles.disabledButton,
                ]}
                onPress={handleDelete}
              >
                <Ionicons name="trash-outline" size={20} color="#B44A4A" />

                <Text style={styles.deleteText}>XÓA TIN ĐĂNG</Text>
              </TouchableOpacity>
            </>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FDFCF8",
  },

  centerContainer: {
    flex: 1,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#FDFCF8",

    paddingHorizontal: 30,
  },

  loadingText: {
    color: "#8A8A75",
    fontSize: 13,
    marginTop: 12,
  },

  notFoundTitle: {
    color: "#4A4A3A",
    fontSize: 18,
    fontWeight: "800",
    marginTop: 14,
  },

  notFoundDescription: {
    color: "#A1A18E",
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 6,
  },

  backHomeButton: {
    flexDirection: "row",
    alignItems: "center",

    backgroundColor: "#7A8450",

    paddingHorizontal: 22,
    paddingVertical: 12,

    borderRadius: 14,
    marginTop: 20,
  },

  backHomeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
    marginLeft: 7,
  },

  header: {
    minHeight: 66,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    backgroundColor: "#FFFFFF",

    paddingHorizontal: 14,
    paddingVertical: 10,

    borderBottomWidth: 1,
    borderBottomColor: "#E8E4D9",
  },

  favoriteButton: {
    width: 42,
    height: 42,
    borderRadius: 14,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#F3F1E9",
  },

  headerTitle: {
    color: "#4A4A3A",
    fontSize: 16,
    fontWeight: "800",
  },

  scrollContent: {
    paddingBottom: 35,
  },

  imageContainer: {
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
    top: 15,
    right: 15,

    backgroundColor: "rgba(255,255,255,0.94)",

    paddingHorizontal: 12,
    paddingVertical: 7,

    borderRadius: 12,
  },

  conditionText: {
    color: "#7A8450",
    fontSize: 11,
    fontWeight: "800",
  },

  soldBadge: {
    position: "absolute",
    left: 15,
    bottom: 15,

    backgroundColor: "#8B5E3C",

    paddingHorizontal: 13,
    paddingVertical: 7,

    borderRadius: 11,
  },

  soldText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 21,
  },

  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  categoryText: {
    color: "#A1A18E",
    fontSize: 10,
    fontWeight: "800",

    letterSpacing: 0.7,
    textTransform: "uppercase",
  },

  ownerBadge: {
    flexDirection: "row",
    alignItems: "center",

    backgroundColor: "#F3F1E9",

    paddingHorizontal: 9,
    paddingVertical: 5,

    borderRadius: 12,
  },

  ownerBadgeText: {
    color: "#7A8450",
    fontSize: 8,
    fontWeight: "800",
    marginLeft: 4,
  },

  productTitle: {
    color: "#4A4A3A",
    fontSize: 23,
    lineHeight: 30,
    fontWeight: "800",
    marginTop: 7,
  },

  priceText: {
    color: "#7A8450",
    fontSize: 22,
    fontWeight: "800",
    marginTop: 10,
    marginBottom: 17,
  },

  basicInfoCard: {
    backgroundColor: "#FFFFFF",

    borderWidth: 1,
    borderColor: "#E8E4D9",
    borderRadius: 19,

    paddingHorizontal: 14,
    paddingVertical: 4,
  },

  infoRow: {
    minHeight: 64,

    flexDirection: "row",
    alignItems: "center",
  },

  infoIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#F3F1E9",

    marginRight: 11,
  },

  infoContent: {
    flex: 1,
  },

  infoLabel: {
    color: "#A1A18E",
    fontSize: 10,
    fontWeight: "600",
  },

  infoText: {
    color: "#5D5D4D",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 2,
  },

  infoDivider: {
    height: 1,
    backgroundColor: "#F3F1E9",
    marginLeft: 49,
  },

  sellerCard: {
    minHeight: 84,

    flexDirection: "row",
    alignItems: "center",

    backgroundColor: "#FFFFFF",

    paddingHorizontal: 15,
    paddingVertical: 12,

    borderWidth: 1,
    borderColor: "#E8E4D9",
    borderRadius: 19,

    marginTop: 15,
  },

  sellerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#D6CEB8",

    overflow: "hidden",
    marginRight: 12,
  },

  sellerAvatarImage: {
    width: "100%",
    height: "100%",
  },

  sellerAvatarText: {
    color: "#8A8A75",
    fontSize: 14,
    fontWeight: "800",
  },

  sellerInfo: {
    flex: 1,
  },

  sellerLabel: {
    color: "#A1A18E",
    fontSize: 10,
    fontWeight: "600",
  },

  sellerName: {
    color: "#4A4A3A",
    fontSize: 15,
    fontWeight: "800",
    marginTop: 2,
  },

  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },

  sellerPhone: {
    color: "#7A8450",
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 5,
  },

  verifiedIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#F3F1E9",
  },

  descriptionSection: {
    backgroundColor: "#FFFFFF",

    borderWidth: 1,
    borderColor: "#E8E4D9",
    borderRadius: 19,

    padding: 16,
    marginTop: 15,
  },

  descriptionTitle: {
    color: "#4A4A3A",
    fontSize: 17,
    fontWeight: "800",
  },

  descriptionText: {
    color: "#6D6D5D",
    fontSize: 14,
    lineHeight: 22,
    marginTop: 9,
  },

  contactButton: {
    height: 53,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#7A8450",

    borderRadius: 16,
    marginTop: 24,

    elevation: 3,
  },

  contactText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
    marginLeft: 8,
  },

  soldButton: {
    height: 52,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#8B5E3C",

    borderRadius: 16,
    marginTop: 12,
  },

  sellingButton: {
    backgroundColor: "#7A8450",
  },

  soldButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
    marginLeft: 8,
  },

  disabledButton: {
    opacity: 0.65,
  },

  deleteButton: {
    height: 50,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#FFF4F4",

    borderWidth: 1,
    borderColor: "#F1CECE",
    borderRadius: 16,

    marginTop: 12,
  },

  deleteText: {
    color: "#B44A4A",
    fontSize: 13,
    fontWeight: "800",
    marginLeft: 8,
  },
});
