import { COLORS } from "../constants/colors";
import React, { useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";

import { useAuth } from "../context/AuthContext";

import { categories, productConditions } from "../utils/categories";

import { updateItem, validateItem } from "../utils/itemUtils";

export default function EditScreen({ route, navigation }) {
  const { user } = useAuth();
  const { item } = route.params;

  const [formData, setFormData] = useState({
    imageUri: item.imageUri || "",
    title: item.title || "",
    price: String(item.price || ""),
    condition: item.condition || "Tốt",
    category: item.category || "books",
    description: item.description || "",
    location: item.location || "",
    sellerPhone: item.sellerPhone || user?.phone || "",
  });

  const [errors, setErrors] = useState({});

  const [submitting, setSubmitting] = useState(false);

  const updateField = (field, value) => {
    setFormData((previousData) => ({
      ...previousData,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors((previousErrors) => ({
        ...previousErrors,
        [field]: null,
      }));
    }
  };

  const pickImage = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Không có quyền truy cập",
          "Bạn cần cấp quyền truy cập thư viện ảnh.",
        );

        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets?.length > 0) {
        updateField("imageUri", result.assets[0].uri);
      }
    } catch (error) {
      console.error("Lỗi khi chọn ảnh sản phẩm:", error);

      Alert.alert("Có lỗi xảy ra", "Không thể mở thư viện ảnh.");
    }
  };

  const resetForm = () => {
    setFormData(createInitialFormData(user));

    setErrors({});
  };

  const handleSubmit = async (status = "selling") => {
    const validation = validateItem(formData);

    if (!validation.isValid) {
      setErrors(validation.errors);

      Alert.alert(
        "Thông tin chưa đầy đủ",
        "Vui lòng kiểm tra lại các trường được báo lỗi.",
      );

      return;
    }

    if (!user?.id) {
      Alert.alert(
        "Không thể đăng tin",
        "Không tìm thấy thông tin tài khoản đăng nhập.",
      );

      return;
    }

    try {
      setSubmitting(true);

      const success = await updateItem(item.id, {
        ...formData,
        status,
      });

      if (!success) {
        Alert.alert("Cập nhật thất bại", "Không thể lưu thay đổi.");
        return;
      }

      Alert.alert(
        "Cập nhật thành công",
        "Sản phẩm đã được cập nhật.",
        [
          {
            text: "Quay lại",
            onPress: () => navigation.goBack(),
          },
        ],
      );
    } catch (error) {
      console.error("Lỗi khi đăng sản phẩm:", error);

      Alert.alert("Có lỗi xảy ra", "Không thể đăng sản phẩm.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.headingContainer}>
            <View>
              <Text style={styles.screenTitle}>Sửa tin đăng</Text>

              <Text style={styles.screenSubtitle}>
                Chỉnh sửa thông tin sản phẩm
              </Text>
            </View>

            <View style={styles.headingIcon}>
              <Ionicons
                name="pencil-outline"
                size={25}
                color={COLORS.primary}
              />
            </View>
          </View>

          <View style={styles.sellerPreview}>
            <View style={styles.sellerAvatar}>
              {user?.avatarUri ? (
                <Image
                  source={{
                    uri: user.avatarUri,
                  }}
                  style={styles.sellerAvatarImage}
                  resizeMode="cover"
                />
              ) : (
                <Ionicons
                  name="person-outline"
                  size={23}
                  color={COLORS.primaryDark}
                />
              )}
            </View>

            <View style={styles.sellerPreviewInfo}>
              <Text style={styles.sellerPreviewLabel}>Tin đăng bởi</Text>

              <Text style={styles.sellerPreviewName}>
                {user?.name || "Người bán"}
              </Text>

              <Text numberOfLines={1} style={styles.sellerPreviewEmail}>
                {user?.email || ""}
              </Text>
            </View>

            <Ionicons
              name="checkmark-circle"
              size={22}
              color={COLORS.success}
            />
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            style={[
              styles.imageUpload,

              errors.imageUri && styles.inputErrorBorder,
            ]}
            onPress={pickImage}
          >
            {formData.imageUri ? (
              <>
                <Image
                  source={{
                    uri: formData.imageUri,
                  }}
                  style={styles.selectedImage}
                  resizeMode="cover"
                />

                <View style={styles.imageOverlay}>
                  <View style={styles.changeImageBadge}>
                    <Ionicons name="camera" size={18} color={COLORS.white} />

                    <Text style={styles.changeImageText}>Đổi ảnh</Text>
                  </View>
                </View>
              </>
            ) : (
              <View style={styles.uploadContent}>
                <View style={styles.cameraIcon}>
                  <Ionicons
                    name="camera-outline"
                    size={34}
                    color={COLORS.primary}
                  />
                </View>

                <Text style={styles.uploadTitle}>Thêm ảnh sản phẩm</Text>

                <Text style={styles.uploadDescription}>
                  Nhấn để chọn ảnh từ thư viện
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <ErrorText message={errors.imageUri} />

          <FormLabel title="Tiêu đề" />

          <TextInput
            value={formData.title}
            onChangeText={(value) => updateField("title", value)}
            placeholder="VD: Giáo trình Giải tích 1"
            placeholderTextColor={COLORS.textMuted}
            maxLength={100}
            style={[styles.input, errors.title && styles.inputErrorBorder]}
          />

          <ErrorText message={errors.title} />

          <FormLabel title="Giá bán (VNĐ)" />

          <View
            style={[
              styles.inputWithIcon,

              errors.price && styles.inputErrorBorder,
            ]}
          >
            <Ionicons name="cash-outline" size={20} color={COLORS.textMuted} />

            <TextInput
              value={formData.price}
              onChangeText={(value) =>
                updateField("price", value.replace(/[^0-9]/g, ""))
              }
              placeholder="0"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="number-pad"
              style={styles.iconInput}
            />

            <Text style={styles.currencyText}>đ</Text>
          </View>

          <ErrorText message={errors.price} />

          <FormLabel title="Tình trạng" />

          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.condition}
              onValueChange={(value) => updateField("condition", value)}
              style={styles.picker}
              dropdownIconColor={COLORS.primary}
            >
              {productConditions.map((condition) => (
                <Picker.Item
                  key={condition}
                  label={condition}
                  value={condition}
                />
              ))}
            </Picker>
          </View>

          <FormLabel title="Danh mục" />

          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.category}
              onValueChange={(value) => updateField("category", value)}
              style={styles.picker}
              dropdownIconColor={COLORS.primary}
            >
              {categories
                .filter((category) => category.id !== "all")
                .map((category) => (
                  <Picker.Item
                    key={category.id}
                    label={category.name}
                    value={category.id}
                  />
                ))}
            </Picker>
          </View>

          <FormLabel title="Địa điểm giao dịch" />

          <View
            style={[
              styles.inputWithIcon,

              errors.location && styles.inputErrorBorder,
            ]}
          >
            <Ionicons
              name="location-outline"
              size={20}
              color={COLORS.textMuted}
            />

            <TextInput
              value={formData.location}
              onChangeText={(value) => updateField("location", value)}
              placeholder="VD: Ký túc xá khu A"
              placeholderTextColor={COLORS.textMuted}
              maxLength={100}
              style={styles.iconInput}
            />
          </View>

          <ErrorText message={errors.location} />

          <FormLabel title="Số điện thoại người bán" />

          <View
            style={[
              styles.inputWithIcon,

              errors.sellerPhone && styles.inputErrorBorder,
            ]}
          >
            <Ionicons name="call-outline" size={20} color={COLORS.textMuted} />

            <TextInput
              value={formData.sellerPhone}
              onChangeText={(value) =>
                updateField("sellerPhone", value.replace(/[^0-9]/g, ""))
              }
              placeholder="VD: 0912345678"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="phone-pad"
              maxLength={10}
              style={styles.iconInput}
            />
          </View>

          <ErrorText message={errors.sellerPhone} />

          <FormLabel title="Mô tả chi tiết" />

          <TextInput
            value={formData.description}
            onChangeText={(value) => updateField("description", value)}
            placeholder="Mô tả tình trạng sản phẩm, lý do bán..."
            placeholderTextColor={COLORS.textMuted}
            multiline
            maxLength={1000}
            textAlignVertical="top"
            style={[
              styles.input,
              styles.descriptionInput,

              errors.description && styles.inputErrorBorder,
            ]}
          />

          <View style={styles.descriptionFooter}>
            <ErrorText message={errors.description} />

            <Text style={styles.characterCount}>
              {formData.description.length}
              /1000
            </Text>
          </View>

          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity
              activeOpacity={0.85}
              disabled={submitting}
              style={[styles.draftButton, submitting && styles.disabledButton]}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.draftText}>HỦY</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              disabled={submitting}
              style={[styles.submitButton, submitting && styles.disabledButton]}
              onPress={() => handleSubmit(item.status)}
            >
              {submitting ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <>
                  <Ionicons
                    name="save-outline"
                    size={21}
                    color={COLORS.white}
                  />

                  <Text style={styles.submitText}>LƯU THAY ĐỔI</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function FormLabel({ title }) {
  return <Text style={styles.label}>{title}</Text>;
}

function ErrorText({ message }) {
  if (!message) {
    return null;
  }

  return <Text style={styles.errorText}>{message}</Text>;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  keyboardContainer: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 120,
  },

  headingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    marginBottom: 18,
  },

  screenTitle: {
    color: COLORS.text,
    fontSize: 25,
    fontWeight: "800",
  },

  screenSubtitle: {
    color: COLORS.textMuted,
    fontSize: 12,

    marginTop: 4,
  },

  headingIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: COLORS.primaryLight,
  },

  sellerPreview: {
    minHeight: 72,

    flexDirection: "row",
    alignItems: "center",

    backgroundColor: COLORS.card,

    paddingHorizontal: 14,
    paddingVertical: 10,

    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,

    marginBottom: 18,
  },

  sellerAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: COLORS.primaryLight,

    overflow: "hidden",

    marginRight: 11,
  },

  sellerAvatarImage: {
    width: "100%",
    height: "100%",
  },

  sellerPreviewInfo: {
    flex: 1,
  },

  sellerPreviewLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
  },

  sellerPreviewName: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "800",

    marginTop: 2,
  },

  sellerPreviewEmail: {
    color: COLORS.textMuted,
    fontSize: 9,

    marginTop: 2,
  },

  imageUpload: {
    width: "100%",
    height: 190,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: COLORS.primarySoft,

    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: COLORS.border,
    borderRadius: 24,

    overflow: "hidden",
  },

  uploadContent: {
    alignItems: "center",
  },

  cameraIcon: {
    width: 62,
    height: 62,
    borderRadius: 31,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: COLORS.card,
  },

  uploadTitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: "800",

    marginTop: 11,
  },

  uploadDescription: {
    color: COLORS.textMuted,
    fontSize: 11,

    marginTop: 4,
  },

  selectedImage: {
    width: "100%",
    height: "100%",
  },

  imageOverlay: {
    ...StyleSheet.absoluteFillObject,

    alignItems: "flex-end",
    justifyContent: "flex-end",

    padding: 12,
  },

  changeImageBadge: {
    flexDirection: "row",
    alignItems: "center",

    backgroundColor: "rgba(48,43,73,0.85)",

    paddingHorizontal: 12,
    paddingVertical: 8,

    borderRadius: 18,
  },

  changeImageText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: "800",

    marginLeft: 6,
  },

  label: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: "800",

    letterSpacing: 0.7,
    textTransform: "uppercase",

    marginTop: 18,
    marginBottom: 8,
  },

  input: {
    minHeight: 50,

    color: COLORS.text,
    fontSize: 14,
    fontWeight: "500",

    backgroundColor: COLORS.card,

    paddingHorizontal: 15,
    paddingVertical: 12,

    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
  },

  inputWithIcon: {
    minHeight: 50,

    flexDirection: "row",
    alignItems: "center",

    backgroundColor: COLORS.card,

    paddingHorizontal: 14,

    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
  },

  iconInput: {
    flex: 1,
    height: 50,

    color: COLORS.text,
    fontSize: 14,
    fontWeight: "500",

    paddingHorizontal: 10,
  },

  currencyText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "800",
  },

  pickerContainer: {
    height: 54,

    justifyContent: "center",

    backgroundColor: COLORS.card,

    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,

    overflow: "hidden",
  },

  picker: {
    color: COLORS.text,
  },

  descriptionInput: {
    minHeight: 125,
  },

  descriptionFooter: {
    minHeight: 20,

    flexDirection: "row",
    justifyContent: "space-between",
  },

  characterCount: {
    color: COLORS.textMuted,
    fontSize: 10,

    marginTop: 5,
    marginLeft: "auto",
  },

  inputErrorBorder: {
    borderColor: COLORS.danger,
  },

  errorText: {
    color: COLORS.danger,
    fontSize: 11,
    fontWeight: "600",

    marginTop: 5,
  },

  actionButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 28,
  },

  draftButton: {
    height: 55,
    flex: 1,
    marginRight: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 17,
  },

  draftText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "800",
  },

  submitButton: {
    height: 55,
    flex: 1,
    marginLeft: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    borderRadius: 17,
    elevation: 4,
  },

  disabledButton: {
    opacity: 0.65,
  },

  submitText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "800",

    marginLeft: 8,
  },
});
