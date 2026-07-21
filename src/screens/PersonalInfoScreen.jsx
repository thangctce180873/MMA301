import { COLORS } from "../constants/colors";
import React, { useEffect, useMemo, useState } from "react";

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
import * as ImagePicker from "expo-image-picker";

import BackButton from "../components/BackButton";

import { useAuth } from "../context/AuthContext";
import { getUserInitials } from "../utils/authUtils";

const createFormDataFromUser = (user) => ({
  name: user?.name || "",
  birthDate: user?.birthDate || "",
  email: user?.email || "",
  phone: user?.phone || "",
  avatarUri: user?.avatarUri || "",
});

export default function PersonalInfoScreen({ navigation }) {
  const { user, updateProfile, deleteAccount } = useAuth();

  const [formData, setFormData] = useState(() => createFormDataFromUser(user));

  const [originalFormData, setOriginalFormData] = useState(() =>
    createFormDataFromUser(user),
  );

  const [errors, setErrors] = useState({});

  const [isEditing, setIsEditing] = useState(false);

  const [saving, setSaving] = useState(false);

  const [changingAvatar, setChangingAvatar] = useState(false);

  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const nextFormData = createFormDataFromUser(user);

    setFormData(nextFormData);
    setOriginalFormData(nextFormData);
  }, [user]);

  const initials = getUserInitials(formData.name || user?.name);

  const busy = saving || changingAvatar || deleting;

  const hasChanges = useMemo(() => {
    return JSON.stringify(formData) !== JSON.stringify(originalFormData);
  }, [formData, originalFormData]);

  const updateField = (field, value) => {
    if (!isEditing) {
      return;
    }

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

  const startEditing = () => {
    if (busy) {
      return;
    }

    setOriginalFormData({
      ...formData,
    });

    setErrors({});
    setIsEditing(true);
  };

  const cancelEditing = () => {
    if (busy) {
      return;
    }

    setFormData({
      ...originalFormData,
    });

    setErrors({});
    setIsEditing(false);
  };

  const handleBack = () => {
    if (isEditing && hasChanges) {
      Alert.alert(
        "Hủy chỉnh sửa",
        "Các thay đổi chưa được lưu. Bạn có muốn bỏ các thay đổi này không?",
        [
          {
            text: "Tiếp tục chỉnh sửa",
            style: "cancel",
          },
          {
            text: "Bỏ thay đổi",
            style: "destructive",

            onPress: () => {
              setFormData({
                ...originalFormData,
              });

              setErrors({});
              setIsEditing(false);

              navigation.goBack();
            },
          },
        ],
      );

      return;
    }

    navigation.goBack();
  };

  const formatBirthDate = (value) => {
    const numbers = value.replace(/\D/g, "").slice(0, 8);

    if (numbers.length <= 2) {
      return numbers;
    }

    if (numbers.length <= 4) {
      return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
    }

    return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4)}`;
  };

  const validateBirthDate = (value) => {
    if (!value) {
      return true;
    }

    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
      return false;
    }

    const [day, month, year] = value.split("/").map(Number);

    const date = new Date(year, month - 1, day);

    return (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day &&
      date <= new Date()
    );
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!formData.name.trim()) {
      nextErrors.name = "Vui lòng nhập họ và tên";
    }

    if (!validateBirthDate(formData.birthDate)) {
      nextErrors.birthDate = "Ngày sinh không hợp lệ";
    }

    const normalizedEmail = formData.email.trim().toLowerCase();

    if (!normalizedEmail) {
      nextErrors.email = "Vui lòng nhập email";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      nextErrors.email = "Email không đúng định dạng";
    }

    const phone = formData.phone.replace(/\D/g, "");

    if (phone && !/^0\d{9}$/.test(phone)) {
      nextErrors.phone = "Số điện thoại phải gồm 10 chữ số và bắt đầu bằng 0";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const pickAvatar = async () => {
    if (!isEditing || busy) {
      return;
    }

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

      if (result.canceled || !result.assets?.length) {
        return;
      }

      setChangingAvatar(true);

      const avatarUri = result.assets[0].uri;

      setFormData((previousData) => ({
        ...previousData,
        avatarUri,
      }));
    } catch (error) {
      console.error("Lỗi chọn ảnh đại diện:", error);

      Alert.alert("Có lỗi xảy ra", "Không thể chọn ảnh đại diện.");
    } finally {
      setChangingAvatar(false);
    }
  };

  const removeAvatar = () => {
    if (!isEditing || busy) {
      return;
    }

    Alert.alert(
      "Xóa ảnh đại diện",
      "Bạn có chắc chắn muốn xóa ảnh đại diện không?",
      [
        {
          text: "Hủy",
          style: "cancel",
        },
        {
          text: "Xóa",
          style: "destructive",

          onPress: () => {
            setFormData((previousData) => ({
              ...previousData,
              avatarUri: "",
            }));
          },
        },
      ],
    );
  };

  const handleAvatarPress = () => {
    if (!isEditing || busy) {
      return;
    }

    const options = [
      {
        text: "Chọn ảnh từ thư viện",
        onPress: pickAvatar,
      },
    ];

    if (formData.avatarUri) {
      options.push({
        text: "Xóa ảnh đại diện",
        style: "destructive",
        onPress: removeAvatar,
      });
    }

    options.push({
      text: "Hủy",
      style: "cancel",
    });

    Alert.alert("Ảnh đại diện", "Chọn thao tác", options);
  };

  const handleSave = async () => {
    if (!isEditing || saving || !validateForm()) {
      return;
    }

    try {
      setSaving(true);

      const nextProfile = {
        name: formData.name.trim(),

        birthDate: formData.birthDate,

        email: formData.email.trim().toLowerCase(),

        phone: formData.phone.replace(/\D/g, ""),

        avatarUri: formData.avatarUri || "",
      };

      const result = await updateProfile(nextProfile);

      if (!result?.success) {
        Alert.alert(
          "Cập nhật thất bại",
          result?.message || "Không thể cập nhật thông tin.",
        );

        return;
      }

      setFormData(nextProfile);
      setOriginalFormData(nextProfile);

      setErrors({});
      setIsEditing(false);

      Alert.alert("Cập nhật thành công", "Thông tin cá nhân đã được lưu.");
    } catch (error) {
      console.error("Lỗi cập nhật thông tin:", error);

      Alert.alert("Có lỗi xảy ra", "Không thể cập nhật thông tin cá nhân.");
    } finally {
      setSaving(false);
    }
  };

  const handleHeaderAction = () => {
    if (isEditing) {
      handleSave();
      return;
    }

    startEditing();
  };

  const handleMainAction = () => {
    if (isEditing) {
      handleSave();
      return;
    }

    startEditing();
  };

  const handleDeleteAccount = () => {
    if (busy) {
      return;
    }

    Alert.alert(
      "Xóa tài khoản",
      "Toàn bộ thông tin tài khoản sẽ bị xóa khỏi thiết bị. Hành động này không thể hoàn tác.",
      [
        {
          text: "Hủy",
          style: "cancel",
        },
        {
          text: "Tiếp tục",
          style: "destructive",

          onPress: () => {
            Alert.alert(
              "Xác nhận lần cuối",
              "Bạn có chắc chắn muốn xóa tài khoản Night Sweet không?",
              [
                {
                  text: "Không",
                  style: "cancel",
                },
                {
                  text: "Xóa tài khoản",

                  style: "destructive",

                  onPress: async () => {
                    try {
                      setDeleting(true);

                      const result = await deleteAccount();

                      if (!result?.success) {
                        Alert.alert(
                          "Xóa tài khoản thất bại",
                          result?.message || "Không thể xóa tài khoản.",
                        );
                      }
                    } catch (error) {
                      console.error("Lỗi xóa tài khoản:", error);

                      Alert.alert("Có lỗi xảy ra", "Không thể xóa tài khoản.");
                    } finally {
                      setDeleting(false);
                    }
                  },
                },
              ],
            );
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <BackButton disabled={busy} onPress={handleBack} />

          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Thông tin cá nhân</Text>

            <Text style={styles.headerSubtitle}>
              {isEditing
                ? "Chỉnh sửa hồ sơ tài khoản"
                : "Quản lý hồ sơ tài khoản"}
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.75}
            disabled={busy}
            style={[styles.headerActionButton, busy && styles.disabledButton]}
            onPress={handleHeaderAction}
          >
            {saving ? (
              <ActivityIndicator size="small" color={COLORS.success} />
            ) : (
              <Ionicons
                name={isEditing ? "checkmark" : "create-outline"}
                size={isEditing ? 25 : 21}
                color={isEditing ? COLORS.success : COLORS.primary}
              />
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.profileCard}>
            <TouchableOpacity
              activeOpacity={isEditing ? 0.85 : 1}
              disabled={!isEditing || changingAvatar}
              style={styles.avatarContainer}
              onPress={handleAvatarPress}
            >
              {formData.avatarUri ? (
                <Image
                  source={{
                    uri: formData.avatarUri,
                  }}
                  style={styles.avatarImage}
                  resizeMode="cover"
                />
              ) : (
                <Text style={styles.avatarText}>{initials}</Text>
              )}

              {isEditing ? (
                <View style={styles.cameraBadge}>
                  {changingAvatar ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                  ) : (
                    <Ionicons name="camera" size={16} color={COLORS.white} />
                  )}
                </View>
              ) : null}
            </TouchableOpacity>

            <Text style={styles.profileName}>
              {formData.name || "Người dùng"}
            </Text>

            <Text style={styles.profileEmail}>{formData.email}</Text>

            {isEditing ? (
              <TouchableOpacity
                activeOpacity={0.75}
                disabled={changingAvatar}
                onPress={handleAvatarPress}
              >
                <Text style={styles.changeAvatarText}>
                  Thay đổi ảnh đại diện
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.viewModeBadge}>
                <Ionicons name="eye-outline" size={13} color={COLORS.primary} />

                <Text style={styles.viewModeText}>CHẾ ĐỘ XEM</Text>
              </View>
            )}
          </View>

          <Text style={styles.sectionTitle}>THÔNG TIN TÀI KHOẢN</Text>

          <View style={styles.formCard}>
            <FormField
              label="Họ và tên"
              icon="person-outline"
              value={formData.name}
              editable={isEditing}
              onChangeText={(value) => updateField("name", value)}
              placeholder="Nhập họ và tên"
              error={errors.name}
            />

            <FormField
              label="Ngày sinh"
              icon="calendar-outline"
              value={formData.birthDate}
              editable={isEditing}
              onChangeText={(value) =>
                updateField("birthDate", formatBirthDate(value))
              }
              placeholder="DD/MM/YYYY"
              keyboardType="number-pad"
              maxLength={10}
              error={errors.birthDate}
            />

            <FormField
              label="Email"
              icon="mail-outline"
              value={formData.email}
              editable={isEditing}
              onChangeText={(value) => updateField("email", value)}
              placeholder="example@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
            />

            <FormField
              label="Số điện thoại"
              icon="call-outline"
              value={formData.phone}
              editable={isEditing}
              onChangeText={(value) =>
                updateField("phone", value.replace(/\D/g, ""))
              }
              placeholder="0912345678"
              keyboardType="phone-pad"
              maxLength={10}
              error={errors.phone}
              showBorder={false}
            />
          </View>

          <Text style={styles.sectionTitle}>BẢO MẬT</Text>

          <View style={styles.menuCard}>
            <TouchableOpacity
              activeOpacity={0.75}
              style={styles.menuItem}
              onPress={() => navigation.navigate("ChangePassword")}
            >
              <View style={styles.menuIcon}>
                <Ionicons name="key-outline" size={21} color={COLORS.primary} />
              </View>

              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>Đổi mật khẩu</Text>

                <Text style={styles.menuDescription}>
                  Cập nhật mật khẩu đăng nhập tài khoản
                </Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={19}
                color={COLORS.textMuted}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            disabled={busy}
            style={[styles.mainActionButton, busy && styles.disabledButton]}
            onPress={handleMainAction}
          >
            {saving ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Ionicons
                  name={isEditing ? "save-outline" : "create-outline"}
                  size={20}
                  color={COLORS.white}
                />

                <Text style={styles.mainActionButtonText}>
                  {isEditing ? "LƯU THAY ĐỔI" : "CHỈNH SỬA THÔNG TIN"}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {isEditing ? (
            <TouchableOpacity
              activeOpacity={0.8}
              disabled={busy}
              style={styles.cancelEditButton}
              onPress={cancelEditing}
            >
              <Ionicons
                name="close-outline"
                size={20}
                color={COLORS.textSecondary}
              />

              <Text style={styles.cancelEditText}>HỦY CHỈNH SỬA</Text>
            </TouchableOpacity>
          ) : null}

          <Text style={[styles.sectionTitle, styles.dangerSectionTitle]}>
            KHU VỰC NGUY HIỂM
          </Text>

          <View style={styles.dangerCard}>
            <View style={styles.dangerTextContainer}>
              <Text style={styles.dangerTitle}>Xóa tài khoản</Text>

              <Text style={styles.dangerDescription}>
                Xóa tài khoản và thông tin cá nhân đã lưu trên thiết bị.
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              disabled={deleting}
              style={[styles.deleteButton, deleting && styles.disabledButton]}
              onPress={handleDeleteAccount}
            >
              {deleting ? (
                <ActivityIndicator size="small" color={COLORS.danger} />
              ) : (
                <Ionicons
                  name="trash-outline"
                  size={21}
                  color={COLORS.danger}
                />
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function FormField({
  label,
  icon,
  value,
  editable,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize,
  maxLength,
  error,
  showBorder = true,
}) {
  return (
    <View style={[styles.formField, showBorder && styles.formFieldBorder]}>
      <View style={styles.formFieldHeader}>
        <View style={styles.formFieldIcon}>
          <Ionicons name={icon} size={19} color={COLORS.primary} />
        </View>

        <View style={styles.formFieldContent}>
          <Text style={styles.formLabel}>{label}</Text>

          <TextInput
            value={value}
            editable={editable}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={COLORS.textMuted}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize || "sentences"}
            autoCorrect={false}
            maxLength={maxLength}
            selectTextOnFocus={editable}
            style={[styles.formInput, !editable && styles.readOnlyInput]}
          />
        </View>

        {editable ? (
          <Ionicons name="create-outline" size={16} color={COLORS.primary} />
        ) : null}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  keyboardView: {
    flex: 1,
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

  headerActionButton: {
    width: 42,
    height: 42,
    borderRadius: 14,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: COLORS.primaryLight,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 38,
  },

  profileCard: {
    alignItems: "center",

    backgroundColor: COLORS.primarySoft,

    paddingHorizontal: 20,
    paddingVertical: 23,

    borderRadius: 24,
  },

  avatarContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,

    position: "relative",

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: COLORS.primaryLight,

    borderWidth: 4,
    borderColor: COLORS.white,
  },

  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 48,
  },

  avatarText: {
    color: COLORS.primaryDark,
    fontSize: 23,
    fontWeight: "800",
  },

  cameraBadge: {
    position: "absolute",
    right: -2,
    bottom: 2,

    width: 33,
    height: 33,
    borderRadius: 17,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: COLORS.primary,

    borderWidth: 3,
    borderColor: COLORS.white,
  },

  profileName: {
    color: COLORS.text,
    fontSize: 19,
    fontWeight: "800",

    marginTop: 13,
  },

  profileEmail: {
    color: COLORS.textSecondary,

    fontSize: 11,

    marginTop: 3,
  },

  changeAvatarText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: "800",

    marginTop: 9,
  },

  viewModeBadge: {
    flexDirection: "row",
    alignItems: "center",

    backgroundColor: COLORS.card,

    paddingHorizontal: 10,
    paddingVertical: 6,

    borderRadius: 13,

    marginTop: 10,
  },

  viewModeText: {
    color: COLORS.primary,
    fontSize: 8,
    fontWeight: "800",

    marginLeft: 5,
  },

  sectionTitle: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,

    marginTop: 22,
    marginBottom: 8,
    marginLeft: 4,
  },

  formCard: {
    backgroundColor: COLORS.card,

    paddingHorizontal: 15,

    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 21,
  },

  formField: {
    paddingVertical: 12,
  },

  formFieldBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  formFieldHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  formFieldIcon: {
    width: 39,
    height: 39,
    borderRadius: 13,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: COLORS.primaryLight,

    marginRight: 11,
  },

  formFieldContent: {
    flex: 1,
  },

  formLabel: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: "700",
  },

  formInput: {
    minHeight: 31,

    color: COLORS.text,
    fontSize: 13,
    fontWeight: "600",

    paddingHorizontal: 0,
    paddingVertical: 4,
  },

  readOnlyInput: {
    color: COLORS.text,
    opacity: 1,
  },

  errorText: {
    color: COLORS.danger,
    fontSize: 10,
    fontWeight: "600",

    marginTop: 4,
    marginLeft: 50,
  },

  menuCard: {
    backgroundColor: COLORS.card,

    paddingHorizontal: 15,

    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 21,
  },

  menuItem: {
    minHeight: 68,

    flexDirection: "row",
    alignItems: "center",
  },

  menuIcon: {
    width: 39,
    height: 39,
    borderRadius: 13,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: COLORS.primaryLight,

    marginRight: 11,
  },

  menuContent: {
    flex: 1,
  },

  menuTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "800",
  },

  menuDescription: {
    color: COLORS.textMuted,
    fontSize: 9,

    marginTop: 3,
  },

  mainActionButton: {
    height: 54,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    backgroundColor: COLORS.primary,

    borderRadius: 17,

    marginTop: 24,
  },

  mainActionButtonText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "800",

    marginLeft: 8,
  },

  cancelEditButton: {
    height: 48,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    backgroundColor: COLORS.card,

    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,

    marginTop: 10,
  },

  cancelEditText: {
    color: COLORS.textSecondary,

    fontSize: 11,
    fontWeight: "800",

    marginLeft: 6,
  },

  disabledButton: {
    opacity: 0.6,
  },

  dangerSectionTitle: {
    color: COLORS.danger,
  },

  dangerCard: {
    minHeight: 82,

    flexDirection: "row",
    alignItems: "center",

    backgroundColor: COLORS.dangerLight,

    paddingHorizontal: 15,

    borderWidth: 1,
    borderColor: COLORS.dangerBorder,

    borderRadius: 20,
  },

  dangerTextContainer: {
    flex: 1,
  },

  dangerTitle: {
    color: COLORS.danger,
    fontSize: 13,
    fontWeight: "800",
  },

  dangerDescription: {
    color: COLORS.dangerText,
    fontSize: 9,
    lineHeight: 14,

    marginTop: 3,
  },

  deleteButton: {
    width: 42,
    height: 42,
    borderRadius: 14,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: COLORS.card,
  },
});
