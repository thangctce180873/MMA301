import { COLORS } from "../constants/colors";
import React, { useCallback, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Platform,
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
  updateItem,
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

  const handleOpenMessages = () => {
    if (!item) {
      return;
    }

    if (ownerOfCurrentItem) {
      navigation.navigate("MainTabs", {
        screen: "MessagesTab",
      });

      return;
    }

    navigation.navigate("Messages", {
      itemId: item.id,
    });
  };

  const handleToggleFavorite = async () => {
    if (!item || processing) {
      return;
    }

    try {
      setProcessing(true);

      const result = await toggleFavorite(item.id, user);

      if (!result?.success) {
        Alert.alert(
          "Không thể cập nhật",
          result?.message || "Không thể cập nhật sản phẩm đã lưu.",
        );

        return;
      }

      await loadItem();
    } catch (error) {
      console.error("Lỗi cập nhật sản phẩm đã lưu:", error);

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

      if (!result?.success) {
        Alert.alert(
          "Không thể cập nhật",
          result?.message || "Không thể cập nhật trạng thái sản phẩm.",
        );

        return;
      }

      await loadItem();
    } catch (error) {
      console.error("Lỗi cập nhật trạng thái:", error);

      Alert.alert("Có lỗi xảy ra", "Không thể cập nhật trạng thái sản phẩm.");
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = () => {
    if (!item || !ownerOfCurrentItem || processing) {
      return;
    }

    Alert.alert(
      "Xóa tin đăng",
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

              if (result?.success) {
                navigation.goBack();
                return;
              }

              Alert.alert(
                "Xóa thất bại",
                result?.message || "Không thể xóa tin đăng.",
              );
            } catch (error) {
              console.error("Lỗi khi xóa tin đăng:", error);

              Alert.alert("Có lỗi xảy ra", "Không thể xóa tin đăng.");
            } finally {
              setProcessing(false);
            }
          },
        },
      ],
    );
  };

  const handlePublishDraft = async () => {
    if (!item || !ownerOfCurrentItem || processing) {
      return;
    }

    try {
      setProcessing(true);

      const success = await updateItem(item.id, { status: "selling" });

      if (!success) {
        Alert.alert(
          "Không thể đăng bán",
          "Có lỗi xảy ra khi cập nhật trạng thái sản phẩm.",
        );
        return;
      }

      await loadItem();
    } catch (error) {
      console.error("Lỗi cập nhật trạng thái:", error);
      Alert.alert("Có lỗi xảy ra", "Không thể cập nhật trạng thái sản phẩm.");
    } finally {
      setProcessing(false);
    }
  };

  const handleOpenMap = useCallback(() => {
    if (!item?.location) return;
    const query = encodeURIComponent(item.location);
    const url = Platform.select({
      ios: `http://maps.apple.com/?q=${query}`,
      android: `geo:0,0?q=${query}`,
      default: `https://www.google.com/maps/search/?api=1&query=${query}`,
    });
    
    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
      }
    }).catch(() => {
        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
    });
  }, [item?.location]);

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
          "Không thể gọi điện",
          `Số điện thoại người bán: ${phoneNumber}`,
        );

        return;
      }

      await Linking.openURL(phoneUrl);
    } catch (error) {
      console.error("Lỗi khi gọi điện:", error);

      Alert.alert(
        "Không thể gọi điện",
        `Số điện thoại người bán: ${phoneNumber}`,
      );
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer} edges={["top", "bottom"]}>
        <ActivityIndicator size="large" color={COLORS.primary} />

        <Text style={styles.loadingText}>Đang tải sản phẩm...</Text>
      </SafeAreaView>
    );
  }

  if (!item) {
    return (
      <SafeAreaView style={styles.centerContainer} edges={["top", "bottom"]}>
        <View style={styles.emptyIcon}>
          <Ionicons name="cube-outline" size={45} color={COLORS.textMuted} />
        </View>

        <Text style={styles.emptyTitle}>Không tìm thấy sản phẩm</Text>

        <Text style={styles.emptyDescription}>
          Sản phẩm có thể đã bị xóa hoặc không còn tồn tại.
        </Text>

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.backActionButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={18} color={COLORS.white} />

          <Text style={styles.backActionText}>QUAY LẠI</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <BackButton disabled={processing} onPress={() => navigation.goBack()} />

        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Chi tiết sản phẩm</Text>

          <Text style={styles.headerSubtitle}>Thông tin tin đăng</Text>
        </View>

        {item.status !== "draft" ? (
          <TouchableOpacity
            activeOpacity={0.75}
            disabled={processing}
            style={styles.saveButton}
            onPress={handleToggleFavorite}
          >
            {processing ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <Ionicons
                name={currentItemIsFavorite ? "bookmark" : "bookmark-outline"}
                size={23}
                color={COLORS.primary}
              />
            )}
          </TouchableOpacity>
        ) : (
          <View style={{ width: 42, height: 42 }} />
        )}
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
              <Ionicons
                name="image-outline"
                size={60}
                color={COLORS.textMuted}
              />
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
                  color={COLORS.primary}
                />

                <Text style={styles.ownerBadgeText}>TIN CỦA BẠN</Text>
              </View>
            ) : null}
          </View>

          <Text style={styles.productTitle}>{item.title}</Text>

          <Text style={styles.priceText}>{formatPrice(item.price)}</Text>

          <View style={styles.infoCard}>
            <InfoRow
              icon="time-outline"
              label="Thời gian đăng"
              value={formatTimeAgo(item.createdAt)}
            />
          </View>

          <View style={styles.mapCard}>
            <View style={styles.mapHeader}>
              <Ionicons name="map" size={16} color={COLORS.primary} />
              <Text style={styles.mapTitle}>Vị trí giao dịch</Text>
            </View>
            
            <View style={styles.mapContentRow}>
              <View style={styles.mapIconWrap}>
                <Ionicons name="location-outline" size={24} color={COLORS.primaryDark} />
              </View>
              <View style={styles.mapTextWrap}>
                <Text style={styles.mapAddress} numberOfLines={2}>{item.location || "Chưa có địa chỉ"}</Text>
                <Text style={styles.mapHint}>Nhấn để mở bản đồ chỉ đường</Text>
              </View>
              <TouchableOpacity activeOpacity={0.8} style={styles.mapButton} onPress={handleOpenMap}>
                <Ionicons name="navigate" size={20} color={COLORS.white} />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.sellerCard}
            onPress={() =>
              navigation.push("SellerProfile", {
                sellerId: item.sellerId,
                sellerEmail: item.sellerEmail,
                sellerName: item.sellerName,
                sellerAvatar: item.sellerAvatar,
              })
            }
          >
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
                <Ionicons
                  name="call-outline"
                  size={14}
                  color={COLORS.primary}
                />

                <Text style={styles.sellerPhone}>
                  {item.sellerPhone || "Chưa có số điện thoại"}
                </Text>
              </View>
            </View>

            <View style={styles.verifiedIcon}>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={COLORS.textMuted}
              />
            </View>
          </TouchableOpacity>

          <View style={styles.descriptionCard}>
            <Text style={styles.descriptionTitle}>Mô tả chi tiết</Text>

            <Text style={styles.descriptionText}>
              {item.description ||
                "Người bán chưa thêm mô tả cho sản phẩm này."}
            </Text>
          </View>

          {ownerOfCurrentItem && item.status === "draft" ? (
            <TouchableOpacity
              activeOpacity={0.85}
              disabled={processing}
              style={[styles.messageButton, processing && styles.disabledButton]}
              onPress={handlePublishDraft}
            >
              <Ionicons
                name="cloud-upload-outline"
                size={20}
                color={COLORS.white}
              />

              <Text style={styles.messageButtonText}>ĐĂNG BÁN</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              activeOpacity={0.85}
              disabled={processing}
              style={[styles.messageButton, processing && styles.disabledButton]}
              onPress={handleOpenMessages}
            >
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={20}
                color={COLORS.white}
              />

              <Text style={styles.messageButtonText}>
                {ownerOfCurrentItem
                  ? "XEM TIN NHẮN NGƯỜI MUA"
                  : "NHẮN TIN VỚI NGƯỜI BÁN"}
              </Text>
            </TouchableOpacity>
          )}

          {!ownerOfCurrentItem ? (
            <TouchableOpacity
              activeOpacity={0.85}
              disabled={processing}
              style={[styles.callButton, processing && styles.disabledButton]}
              onPress={handleContactSeller}
            >
              <Ionicons name="call-outline" size={20} color={COLORS.white} />

              <Text style={styles.callButtonText}>GỌI CHO NGƯỜI BÁN</Text>
            </TouchableOpacity>
          ) : null}

          {ownerOfCurrentItem ? (
            <>
              {item.status !== "draft" ? (
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
                  <Ionicons
                    name={
                      item.status === "sold"
                        ? "refresh-outline"
                        : "checkmark-circle-outline"
                    }
                    size={20}
                    color={item.status === "sold" ? COLORS.white : COLORS.success}
                  />

                  <Text style={styles.soldButtonText}>
                    {item.status === "sold"
                      ? "ĐÁNH DẤU ĐANG BÁN"
                      : "ĐÁNH DẤU ĐÃ BÁN"}
                  </Text>
                </TouchableOpacity>
              ) : null}

              <TouchableOpacity
                activeOpacity={0.85}
                disabled={processing}
                style={[
                  styles.editButton,
                  processing && styles.disabledButton,
                ]}
                onPress={() => navigation.navigate("Edit", { item })}
              >
                <Ionicons name="pencil-outline" size={20} color={COLORS.primary} />
                <Text style={styles.editButtonText}>SỬA TIN</Text>
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
                <Ionicons
                  name="trash-outline"
                  size={20}
                  color={COLORS.danger}
                />

                <Text style={styles.deleteButtonText}>XÓA TIN ĐĂNG</Text>
              </TouchableOpacity>
            </>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={20} color={COLORS.primary} />
      </View>

      <View style={styles.infoContent}>
        <Text style={styles.infoRowLabel}>{label}</Text>

        <Text style={styles.infoRowValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  centerContainer: {
    flex: 1,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: COLORS.background,

    paddingHorizontal: 30,
  },

  loadingText: {
    color: COLORS.textSecondary,
    fontSize: 13,

    marginTop: 12,
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
    fontSize: 18,
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

  backActionButton: {
    height: 48,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    backgroundColor: COLORS.primary,

    paddingHorizontal: 22,

    borderRadius: 16,

    marginTop: 20,
  },

  backActionText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "800",

    marginLeft: 7,
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

  saveButton: {
    width: 42,
    height: 42,
    borderRadius: 14,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: COLORS.primaryLight,
  },

  scrollContent: {
    paddingBottom: 35,
  },

  imageContainer: {
    width: "100%",
    aspectRatio: 1,

    position: "relative",

    backgroundColor: COLORS.imagePlaceholder,
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
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: "800",
  },

  soldBadge: {
    position: "absolute",
    left: 15,
    bottom: 15,

    backgroundColor: COLORS.primaryDark,

    paddingHorizontal: 13,
    paddingVertical: 7,

    borderRadius: 11,
  },

  soldText: {
    color: COLORS.white,
    fontSize: 10,
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
    color: COLORS.primary,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },

  ownerBadge: {
    flexDirection: "row",
    alignItems: "center",

    backgroundColor: COLORS.primaryLight,

    paddingHorizontal: 9,
    paddingVertical: 5,

    borderRadius: 12,
  },

  ownerBadgeText: {
    color: COLORS.primary,
    fontSize: 8,
    fontWeight: "800",

    marginLeft: 4,
  },

  productTitle: {
    color: COLORS.text,
    fontSize: 23,
    lineHeight: 30,
    fontWeight: "800",

    marginTop: 7,
  },

  priceText: {
    color: COLORS.primary,
    fontSize: 22,
    fontWeight: "800",

    marginTop: 10,
    marginBottom: 17,
  },

  infoCard: {
    backgroundColor: COLORS.card,

    paddingHorizontal: 14,

    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
  },

  infoRow: {
    minHeight: 66,

    flexDirection: "row",
    alignItems: "center",
  },

  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: COLORS.primaryLight,

    marginRight: 11,
  },

  infoContent: {
    flex: 1,
  },

  infoRowLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
  },

  infoRowValue: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "700",

    marginTop: 2,
  },

  infoDivider: {
    height: 1,
    backgroundColor: COLORS.border,

    marginVertical: 12,
  },

  mapCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginTop: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  mapHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  mapTitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: "800",
    textTransform: "uppercase",
    marginLeft: 6,
  },
  mapContentRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  mapIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  mapTextWrap: {
    flex: 1,
    marginRight: 10,
  },
  mapAddress: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 2,
  },
  mapHint: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  mapButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },

  sellerCard: {
    minHeight: 86,

    flexDirection: "row",
    alignItems: "center",

    backgroundColor: COLORS.primarySoft,

    paddingHorizontal: 15,
    paddingVertical: 12,

    borderRadius: 20,

    marginTop: 15,
  },

  sellerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: COLORS.primaryLight,

    overflow: "hidden",

    marginRight: 12,
  },

  sellerAvatarImage: {
    width: "100%",
    height: "100%",
  },

  sellerAvatarText: {
    color: COLORS.primaryDark,
    fontSize: 14,
    fontWeight: "800",
  },

  sellerInfo: {
    flex: 1,
  },

  sellerLabel: {
    color: COLORS.textMuted,
    fontSize: 9,
  },

  sellerName: {
    color: COLORS.text,
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
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: "700",

    marginLeft: 5,
  },

  verifiedIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "transparent",
  },

  descriptionCard: {
    backgroundColor: COLORS.card,

    padding: 16,

    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,

    marginTop: 15,
  },

  descriptionTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "800",
  },

  descriptionText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 21,

    marginTop: 9,
  },

  messageButton: {
    height: 53,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    backgroundColor: COLORS.primary,

    borderRadius: 17,

    marginTop: 24,
  },

  messageButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "800",

    marginLeft: 8,
  },

  callButton: {
    height: 53,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    backgroundColor: COLORS.call,

    borderRadius: 17,

    marginTop: 12,
  },

  callButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "800",

    marginLeft: 8,
  },

  soldButton: {
    height: 53,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    backgroundColor: COLORS.success,

    borderRadius: 17,

    marginTop: 12,
  },

  sellingButton: {
    backgroundColor: COLORS.primary,
  },

  soldButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "800",

    marginLeft: 8,
  },

  editButton: {
    height: 53,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primarySoft,
    borderRadius: 17,
    marginTop: 12,
  },
  editButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "800",
    marginLeft: 8,
  },

  deleteButton: {
    height: 53,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    backgroundColor: COLORS.dangerLight,

    borderWidth: 1,
    borderColor: COLORS.dangerBorder,
    borderRadius: 17,

    marginTop: 12,
  },

  deleteButtonText: {
    color: COLORS.danger,
    fontSize: 14,
    fontWeight: "800",

    marginLeft: 8,
  },

  disabledButton: {
    opacity: 0.6,
  },
});
