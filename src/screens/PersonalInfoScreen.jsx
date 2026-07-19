import React, { useEffect, useState } from "react";

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

import {
  deleteCurrentUser,
  formatBirthDateInput,
  getUserInitials,
  validateProfileData,
} from "../utils/authUtils";

const createFormData = (user) => ({
  avatarUri: user?.avatarUri || "",

  name: user?.name || "",

  birthDate: user?.birthDate || "",

  email: user?.email || "",

  phone: user?.phone || "",
});

export default function PersonalInfoScreen({ navigation }) {
  const { user, updateProfile, logout } = useAuth();

  const [formData, setFormData] = useState(() => createFormData(user));

  const [errors, setErrors] = useState({});

  const [isEditing, setIsEditing] = useState(false);

  const [saving, setSaving] = useState(false);

  const [deletingAccount, setDeletingAccount] = useState(false);

  useEffect(() => {
    setFormData(createFormData(user));
  }, [user]);

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

  const handleStartEditing = () => {
    setErrors({});
    setIsEditing(true);
  };

  const handleCancelEditing = () => {
    setFormData(createFormData(user));

    setErrors({});
    setIsEditing(false);
  };

  const handleBack = () => {
    if (!isEditing) {
      navigation.goBack();
      return;
    }

    Alert.alert(
      "Hủy chỉnh sửa",
      "Các thay đổi chưa lưu sẽ bị mất. Bạn có muốn quay lại không?",
      [
        {
          text: "Tiếp tục sửa",
          style: "cancel",
        },
        {
          text: "Quay lại",
          style: "destructive",

          onPress: () => navigation.goBack(),
        },
      ],
    );
  };

  const pickAvatar = async () => {
    if (!isEditing) {
      return;
    }

    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Không có quyền truy cập",
          "Bạn cần cấp quyền truy cập thư viện ảnh để chọn avatar.",
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
        updateField("avatarUri", result.assets[0].uri);
      }
    } catch (error) {
      console.error("Lỗi khi chọn avatar:", error);

      Alert.alert("Có lỗi xảy ra", "Không thể mở thư viện ảnh.");
    }
  };

  const handleRemoveAvatar = () => {
    if (!isEditing) {
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

          onPress: () => updateField("avatarUri", ""),
        },
      ],
    );
  };

  const handleSave = async () => {
    const validation = validateProfileData(formData);

    if (!validation.isValid) {
      setErrors(validation.errors);

      Alert.alert(
        "Thông tin chưa hợp lệ",
        "Vui lòng kiểm tra lại các trường được báo lỗi.",
      );

      return;
    }

    try {
      setSaving(true);
      setErrors({});

      const emailChanged =
        String(user?.email || "")
          .trim()
          .toLowerCase() !==
        String(formData.email || "")
          .trim()
          .toLowerCase();

      const result = await updateProfile(formData);

      if (!result.success) {
        if (result.errors) {
          setErrors(result.errors);
        }

        Alert.alert("Cập nhật thất bại", result.message);

        return;
      }

      setIsEditing(false);

      Alert.alert(
        "Cập nhật thành công",
        emailChanged
          ? "Thông tin đã được cập nhật. Lần đăng nhập sau hãy sử dụng email mới."
          : "Thông tin cá nhân của bạn đã được cập nhật.",
      );
    } catch (error) {
      console.error("Lỗi khi lưu thông tin:", error);

      Alert.alert("Có lỗi xảy ra", "Không thể cập nhật thông tin cá nhân.");
    } finally {
      setSaving(false);
    }
  };

  const performDeleteAccount = async () => {
    try {
      setDeletingAccount(true);

      const result = await deleteCurrentUser();

      if (!result.success) {
        Alert.alert("Xóa tài khoản thất bại", result.message);

        setDeletingAccount(false);
        return;
      }

      Alert.alert(
        "Đã xóa tài khoản",
        "Tài khoản và toàn bộ dữ liệu liên quan đã được xóa.",
        [
          {
            text: "OK",

            onPress: async () => {
              setDeletingAccount(false);

              await logout();
            },
          },
        ],
        {
          cancelable: false,
        },
      );
    } catch (error) {
      console.error("Lỗi khi xóa tài khoản:", error);

      setDeletingAccount(false);

      Alert.alert(
        "Có lỗi xảy ra",
        "Không thể xóa tài khoản. Vui lòng thử lại.",
      );
    }
  };

  const handleDeleteAccount = () => {
    if (isEditing || saving || deletingAccount) {
      return;
    }

    Alert.alert(
      "Xóa tài khoản",
      "Khi xóa tài khoản, toàn bộ tin đăng và dữ liệu đã lưu của bạn cũng sẽ bị xóa. Bạn có muốn tiếp tục không?",
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
              "Hành động này không thể hoàn tác. Bạn chắc chắn muốn xóa vĩnh viễn tài khoản?",
              [
                {
                  text: "Không",
                  style: "cancel",
                },
                {
                  text: "Xóa vĩnh viễn",

                  style: "destructive",

                  onPress: performDeleteAccount,
                },
              ],
            );
          },
        },
      ],
    );
  };

  const initials = getUserInitials(formData.name);

  const joinedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("vi-VN")
    : "Chưa xác định";

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <BackButton
            disabled={saving || deletingAccount}
            onPress={handleBack}
          />

          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Thông tin cá nhân</Text>

            <Text style={styles.headerSubtitle}>Quản lý dữ liệu tài khoản</Text>
          </View>

          {!isEditing ? (
            <TouchableOpacity
              activeOpacity={0.75}
              disabled={deletingAccount}
              style={[
                styles.headerActionButton,

                deletingAccount && styles.disabledButton,
              ]}
              onPress={handleStartEditing}
            >
              <Ionicons name="create-outline" size={22} color="#7A8450" />
            </TouchableOpacity>
          ) : (
            <View style={styles.headerActionSpacer} />
          )}
        </View>

        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.profileCard}>
            <TouchableOpacity
              activeOpacity={isEditing ? 0.85 : 1}
              style={styles.avatarContainer}
              disabled={!isEditing}
              onPress={pickAvatar}
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
                  <Ionicons name="camera" size={17} color="#FFFFFF" />
                </View>
              ) : null}
            </TouchableOpacity>

            <Text style={styles.profileName}>
              {formData.name || "Người dùng"}
            </Text>

            <Text style={styles.profileEmail}>
              {formData.email || "Chưa cập nhật email"}
            </Text>

            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={15} color="#7A8450" />

              <Text style={styles.verifiedText}>TÀI KHOẢN ĐÃ XÁC THỰC</Text>
            </View>

            {isEditing ? (
              <View style={styles.avatarActions}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.avatarActionButton}
                  onPress={pickAvatar}
                >
                  <Ionicons name="image-outline" size={18} color="#7A8450" />

                  <Text style={styles.avatarActionText}>Chọn ảnh</Text>
                </TouchableOpacity>

                {formData.avatarUri ? (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.removeAvatarButton}
                    onPress={handleRemoveAvatar}
                  >
                    <Ionicons name="trash-outline" size={18} color="#B44A4A" />

                    <Text style={styles.removeAvatarText}>Xóa ảnh</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ) : null}
          </View>

          <Text style={styles.sectionLabel}>THÔNG TIN CƠ BẢN</Text>

          <View style={styles.formCard}>
            <FormField
              label="Họ và tên"
              iconName="person-outline"
              value={formData.name}
              placeholder="Nhập họ và tên"
              editable={isEditing}
              error={errors.name}
              autoCapitalize="words"
              onChangeText={(value) => updateField("name", value)}
            />

            <FormField
              label="Ngày tháng năm sinh"
              iconName="calendar-outline"
              value={formData.birthDate}
              placeholder="DD/MM/YYYY"
              editable={isEditing}
              error={errors.birthDate}
              keyboardType="number-pad"
              maxLength={10}
              onChangeText={(value) =>
                updateField("birthDate", formatBirthDateInput(value))
              }
            />

            <FormField
              label="Email"
              iconName="mail-outline"
              value={formData.email}
              placeholder="Nhập email"
              editable={isEditing}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={(value) => updateField("email", value)}
            />

            <FormField
              label="Số điện thoại"
              iconName="call-outline"
              value={formData.phone}
              placeholder="Nhập số điện thoại"
              editable={isEditing}
              error={errors.phone}
              keyboardType="phone-pad"
              maxLength={10}
              showBorder={false}
              onChangeText={(value) =>
                updateField("phone", value.replace(/[^0-9]/g, ""))
              }
            />
          </View>

          <Text style={styles.sectionLabel}>THÔNG TIN TÀI KHOẢN</Text>

          <View style={styles.accountCard}>
            <AccountInfoRow
              iconName="finger-print-outline"
              title="Mã tài khoản"
              value={user?.id ? String(user.id).slice(0, 16) : "Chưa xác định"}
            />

            <AccountInfoRow
              iconName="time-outline"
              title="Ngày tham gia"
              value={joinedDate}
              showBorder={false}
            />
          </View>

          {isEditing ? (
            <View style={styles.actionContainer}>
              <TouchableOpacity
                activeOpacity={0.8}
                disabled={saving}
                style={styles.cancelButton}
                onPress={handleCancelEditing}
              >
                <Text style={styles.cancelText}>HỦY</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                disabled={saving}
                style={[styles.saveButton, saving && styles.disabledButton]}
                onPress={handleSave}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="save-outline" size={20} color="#FFFFFF" />

                    <Text style={styles.saveText}>LƯU THAY ĐỔI</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              activeOpacity={0.85}
              disabled={deletingAccount}
              style={[
                styles.editButton,

                deletingAccount && styles.disabledButton,
              ]}
              onPress={handleStartEditing}
            >
              <Ionicons name="create-outline" size={20} color="#FFFFFF" />

              <Text style={styles.editText}>CHỈNH SỬA THÔNG TIN</Text>
            </TouchableOpacity>
          )}

          <Text style={[styles.sectionLabel, styles.dangerSectionLabel]}>
            KHU VỰC NGUY HIỂM
          </Text>

          <View style={styles.dangerCard}>
            <View style={styles.dangerHeader}>
              <View style={styles.dangerIcon}>
                <Ionicons name="warning-outline" size={22} color="#B44A4A" />
              </View>

              <View style={styles.dangerInfo}>
                <Text style={styles.dangerTitle}>Xóa tài khoản</Text>

                <Text style={styles.dangerDescription}>
                  Xóa vĩnh viễn tài khoản, tin đăng và dữ liệu đã lưu.
                </Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              disabled={isEditing || saving || deletingAccount}
              style={[
                styles.deleteAccountButton,

                (isEditing || saving || deletingAccount) &&
                  styles.disabledButton,
              ]}
              onPress={handleDeleteAccount}
            >
              {deletingAccount ? (
                <ActivityIndicator size="small" color="#B44A4A" />
              ) : (
                <>
                  <Ionicons name="trash-outline" size={20} color="#B44A4A" />

                  <Text style={styles.deleteAccountText}>XÓA TÀI KHOẢN</Text>
                </>
              )}
            </TouchableOpacity>

            {isEditing ? (
              <Text style={styles.deleteDisabledNote}>
                Hãy lưu hoặc hủy chỉnh sửa trước khi xóa tài khoản.
              </Text>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function FormField({
  label,
  iconName,
  value,
  placeholder,
  editable,
  error,
  onChangeText,
  showBorder = true,
  ...textInputProps
}) {
  return (
    <View
      style={[styles.fieldContainer, showBorder && styles.fieldContainerBorder]}
    >
      <Text style={styles.fieldLabel}>{label}</Text>

      <View
        style={[
          styles.inputContainer,

          editable && styles.editableInputContainer,

          error && styles.errorInputContainer,
        ]}
      >
        <Ionicons
          name={iconName}
          size={20}
          color={editable ? "#7A8450" : "#A1A18E"}
        />

        <TextInput
          value={value}
          placeholder={placeholder}
          placeholderTextColor="#B0AD9E"
          editable={editable}
          onChangeText={onChangeText}
          style={[styles.input, !editable && styles.disabledInput]}
          {...textInputProps}
        />

        {!editable ? (
          <Ionicons name="lock-closed-outline" size={15} color="#C4C2B5" />
        ) : null}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

function AccountInfoRow({ iconName, title, value, showBorder = true }) {
  return (
    <View
      style={[styles.accountInfoRow, showBorder && styles.accountInfoBorder]}
    >
      <View style={styles.accountIcon}>
        <Ionicons name={iconName} size={20} color="#7A8450" />
      </View>

      <View style={styles.accountInfoText}>
        <Text style={styles.accountTitle}>{title}</Text>

        <Text style={styles.accountValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FDFCF8",
  },

  keyboardContainer: {
    flex: 1,
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

  headerActionSpacer: {
    width: 42,
    height: 42,
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

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },

  profileCard: {
    alignItems: "center",

    backgroundColor: "#FFFFFF",

    paddingHorizontal: 20,
    paddingVertical: 22,

    borderWidth: 1,
    borderColor: "#E8E4D9",
    borderRadius: 24,

    elevation: 2,
  },

  avatarContainer: {
    width: 104,
    height: 104,
    borderRadius: 52,

    position: "relative",

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#D6CEB8",

    borderWidth: 4,
    borderColor: "#FFFFFF",

    elevation: 4,
  },

  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 52,
  },

  avatarText: {
    color: "#8A8A75",
    fontSize: 25,
    fontWeight: "800",
  },

  cameraBadge: {
    position: "absolute",
    right: -1,
    bottom: 3,

    width: 34,
    height: 34,
    borderRadius: 17,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#7A8450",

    borderWidth: 3,
    borderColor: "#FFFFFF",
  },

  profileName: {
    color: "#4A4A3A",
    fontSize: 21,
    fontWeight: "800",

    marginTop: 14,
  },

  profileEmail: {
    color: "#8A8A75",
    fontSize: 12,

    marginTop: 4,
  },

  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",

    backgroundColor: "#F3F1E9",

    paddingHorizontal: 11,
    paddingVertical: 6,

    borderRadius: 14,

    marginTop: 10,
  },

  verifiedText: {
    color: "#7A8450",
    fontSize: 9,
    fontWeight: "800",

    marginLeft: 5,
  },

  avatarActions: {
    flexDirection: "row",
    alignItems: "center",

    marginTop: 16,
  },

  avatarActionButton: {
    flexDirection: "row",
    alignItems: "center",

    backgroundColor: "#F3F1E9",

    paddingHorizontal: 14,
    paddingVertical: 9,

    borderRadius: 14,
  },

  avatarActionText: {
    color: "#7A8450",
    fontSize: 11,
    fontWeight: "800",

    marginLeft: 6,
  },

  removeAvatarButton: {
    flexDirection: "row",
    alignItems: "center",

    backgroundColor: "#FFF4F4",

    paddingHorizontal: 14,
    paddingVertical: 9,

    borderRadius: 14,
    marginLeft: 9,
  },

  removeAvatarText: {
    color: "#B44A4A",
    fontSize: 11,
    fontWeight: "800",

    marginLeft: 6,
  },

  sectionLabel: {
    color: "#A1A18E",
    fontSize: 10,
    fontWeight: "800",

    letterSpacing: 0.8,

    marginTop: 23,
    marginLeft: 5,
    marginBottom: 8,
  },

  dangerSectionLabel: {
    color: "#B44A4A",
  },

  formCard: {
    backgroundColor: "#FFFFFF",

    paddingHorizontal: 15,

    borderWidth: 1,
    borderColor: "#E8E4D9",
    borderRadius: 22,

    elevation: 2,
  },

  fieldContainer: {
    paddingVertical: 14,
  },

  fieldContainerBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#E8E4D9",
  },

  fieldLabel: {
    color: "#8A8A75",
    fontSize: 10,
    fontWeight: "700",

    marginBottom: 7,
  },

  inputContainer: {
    minHeight: 49,

    flexDirection: "row",
    alignItems: "center",

    backgroundColor: "#F7F5EE",

    borderWidth: 1,
    borderColor: "transparent",
    borderRadius: 15,

    paddingHorizontal: 13,
  },

  editableInputContainer: {
    backgroundColor: "#FFFFFF",
    borderColor: "#D9D5C8",
  },

  errorInputContainer: {
    borderColor: "#C75C5C",
  },

  input: {
    flex: 1,
    height: 48,

    color: "#4A4A3A",
    fontSize: 13,
    fontWeight: "600",

    paddingHorizontal: 10,
  },

  disabledInput: {
    color: "#6D6D5D",
  },

  errorText: {
    color: "#C75C5C",
    fontSize: 10,
    fontWeight: "600",

    marginTop: 5,
  },

  accountCard: {
    backgroundColor: "#FFFFFF",

    paddingHorizontal: 15,

    borderWidth: 1,
    borderColor: "#E8E4D9",
    borderRadius: 22,

    elevation: 2,
  },

  accountInfoRow: {
    minHeight: 68,

    flexDirection: "row",
    alignItems: "center",
  },

  accountInfoBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#E8E4D9",
  },

  accountIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#F3F1E9",

    marginRight: 12,
  },

  accountInfoText: {
    flex: 1,
  },

  accountTitle: {
    color: "#4A4A3A",
    fontSize: 13,
    fontWeight: "700",
  },

  accountValue: {
    color: "#A1A18E",
    fontSize: 10,

    marginTop: 3,
  },

  actionContainer: {
    flexDirection: "row",

    marginTop: 25,
  },

  cancelButton: {
    flex: 1,
    height: 53,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#F3F1E9",

    borderWidth: 1,
    borderColor: "#E8E4D9",
    borderRadius: 16,

    marginRight: 8,
  },

  cancelText: {
    color: "#6D6D5D",
    fontSize: 12,
    fontWeight: "800",
  },

  saveButton: {
    flex: 2,
    height: 53,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#7A8450",

    borderRadius: 16,
    marginLeft: 8,

    elevation: 3,
  },

  saveText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",

    marginLeft: 7,
  },

  editButton: {
    height: 53,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#7A8450",

    borderRadius: 16,
    marginTop: 25,

    elevation: 3,
  },

  editText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",

    marginLeft: 7,
  },

  dangerCard: {
    backgroundColor: "#FFF7F7",

    padding: 16,

    borderWidth: 1,
    borderColor: "#F1CECE",
    borderRadius: 22,
  },

  dangerHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  dangerIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#FFE8E8",

    marginRight: 12,
  },

  dangerInfo: {
    flex: 1,
  },

  dangerTitle: {
    color: "#B44A4A",
    fontSize: 14,
    fontWeight: "800",
  },

  dangerDescription: {
    color: "#8D6868",
    fontSize: 10,
    lineHeight: 16,

    marginTop: 3,
  },

  deleteAccountButton: {
    height: 50,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#FFFFFF",

    borderWidth: 1,
    borderColor: "#E8AFAF",
    borderRadius: 15,

    marginTop: 15,
  },

  deleteAccountText: {
    color: "#B44A4A",
    fontSize: 12,
    fontWeight: "800",

    marginLeft: 7,
  },

  deleteDisabledNote: {
    color: "#B78888",
    fontSize: 9,
    lineHeight: 14,

    textAlign: "center",

    marginTop: 8,
  },

  disabledButton: {
    opacity: 0.55,
  },
});
