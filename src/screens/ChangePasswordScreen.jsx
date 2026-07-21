import React, { useState } from "react";

import {
  ActivityIndicator,
  Alert,
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

import BackButton from "../components/BackButton";

import { useAuth } from "../context/AuthContext";

export default function ChangePasswordScreen({ navigation }) {
  const { changePassword } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");

  const [newPassword, setNewPassword] = useState("");

  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);

  const [showNewPassword, setShowNewPassword] = useState(false);

  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errors, setErrors] = useState({});

  const [submitting, setSubmitting] = useState(false);

  const updateValue = (field, value) => {
    if (field === "currentPassword") {
      setCurrentPassword(value);
    }

    if (field === "newPassword") {
      setNewPassword(value);
    }

    if (field === "confirmPassword") {
      setConfirmPassword(value);
    }

    if (errors[field]) {
      setErrors((previousErrors) => ({
        ...previousErrors,
        [field]: null,
      }));
    }
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!currentPassword) {
      nextErrors.currentPassword = "Vui lòng nhập mật khẩu hiện tại";
    }

    if (!newPassword) {
      nextErrors.newPassword = "Vui lòng nhập mật khẩu mới";
    } else if (newPassword.length < 6) {
      nextErrors.newPassword = "Mật khẩu mới phải có ít nhất 6 ký tự";
    } else if (newPassword === currentPassword) {
      nextErrors.newPassword = "Mật khẩu mới phải khác mật khẩu hiện tại";
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = "Vui lòng xác nhận mật khẩu mới";
    } else if (confirmPassword !== newPassword) {
      nextErrors.confirmPassword = "Mật khẩu xác nhận không khớp";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const handleChangePassword = async () => {
    if (!validateForm() || submitting) {
      return;
    }

    try {
      setSubmitting(true);

      const result = await changePassword(currentPassword, newPassword);

      if (!result?.success) {
        Alert.alert(
          "Đổi mật khẩu thất bại",
          result?.message || "Không thể đổi mật khẩu.",
        );

        return;
      }

      Alert.alert(
        "Đổi mật khẩu thành công",
        "Mật khẩu tài khoản đã được cập nhật.",
        [
          {
            text: "Hoàn tất",

            onPress: () => navigation.goBack(),
          },
        ],
      );
    } catch (error) {
      console.error("Lỗi đổi mật khẩu:", error);

      Alert.alert("Có lỗi xảy ra", "Không thể đổi mật khẩu vào lúc này.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <BackButton
            disabled={submitting}
            onPress={() => navigation.goBack()}
          />

          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Đổi mật khẩu</Text>

            <Text style={styles.headerSubtitle}>Bảo mật tài khoản</Text>
          </View>

          <View style={styles.headerRight} />
        </View>

        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.securityCard}>
            <View style={styles.securityIcon}>
              <Ionicons
                name="shield-checkmark-outline"
                size={31}
                color="#D96A87"
              />
            </View>

            <Text style={styles.securityTitle}>Bảo vệ tài khoản của bạn</Text>

            <Text style={styles.securityDescription}>
              Sử dụng mật khẩu có ít nhất 6 ký tự và không chia sẻ mật khẩu cho
              người khác.
            </Text>
          </View>

          <Text style={styles.label}>MẬT KHẨU HIỆN TẠI</Text>

          <PasswordInput
            value={currentPassword}
            onChangeText={(value) => updateValue("currentPassword", value)}
            placeholder="Nhập mật khẩu hiện tại"
            visible={showCurrentPassword}
            onToggle={() =>
              setShowCurrentPassword((previousValue) => !previousValue)
            }
            error={errors.currentPassword}
          />

          <Text style={styles.label}>MẬT KHẨU MỚI</Text>

          <PasswordInput
            value={newPassword}
            onChangeText={(value) => updateValue("newPassword", value)}
            placeholder="Nhập mật khẩu mới"
            visible={showNewPassword}
            onToggle={() =>
              setShowNewPassword((previousValue) => !previousValue)
            }
            error={errors.newPassword}
          />

          <Text style={styles.label}>XÁC NHẬN MẬT KHẨU MỚI</Text>

          <PasswordInput
            value={confirmPassword}
            onChangeText={(value) => updateValue("confirmPassword", value)}
            placeholder="Nhập lại mật khẩu mới"
            visible={showConfirmPassword}
            onToggle={() =>
              setShowConfirmPassword((previousValue) => !previousValue)
            }
            error={errors.confirmPassword}
          />

          <View style={styles.tipCard}>
            <Ionicons name="bulb-outline" size={21} color="#D96A87" />

            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Gợi ý mật khẩu</Text>

              <Text style={styles.tipDescription}>
                Nên kết hợp chữ hoa, chữ thường, số và ký tự đặc biệt để tăng độ
                an toàn.
              </Text>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            disabled={submitting}
            style={[styles.submitButton, submitting && styles.disabledButton]}
            onPress={handleChangePassword}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="key-outline" size={21} color="#FFFFFF" />

                <Text style={styles.submitText}>CẬP NHẬT MẬT KHẨU</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function PasswordInput({
  value,
  onChangeText,
  placeholder,
  visible,
  onToggle,
  error,
}) {
  return (
    <>
      <View style={[styles.inputContainer, error && styles.errorBorder]}>
        <Ionicons name="lock-closed-outline" size={20} color="#AAA392" />

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#AAA392"
          secureTextEntry={!visible}
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
        />

        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.passwordButton}
          onPress={onToggle}
        >
          <Ionicons
            name={visible ? "eye-off-outline" : "eye-outline"}
            size={20}
            color="#AAA392"
          />
        </TouchableOpacity>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  keyboardView: {
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
    borderBottomColor: "#F0ECE5",
  },

  headerTextContainer: {
    flex: 1,
    alignItems: "center",
  },

  headerTitle: {
    color: "#28231F",
    fontSize: 17,
    fontWeight: "800",
  },

  headerSubtitle: {
    color: "#AAA392",
    fontSize: 10,

    marginTop: 2,
  },

  headerRight: {
    width: 42,
    height: 42,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 35,
  },

  securityCard: {
    alignItems: "center",

    backgroundColor: "#FFF7F9",

    paddingHorizontal: 22,
    paddingVertical: 25,

    borderRadius: 24,

    marginBottom: 4,
  },

  securityIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#FFFFFF",
  },

  securityTitle: {
    color: "#28231F",
    fontSize: 17,
    fontWeight: "800",

    marginTop: 14,
  },

  securityDescription: {
    maxWidth: 290,

    color: "#81786D",
    fontSize: 11,
    lineHeight: 18,

    textAlign: "center",

    marginTop: 6,
  },

  label: {
    color: "#AAA392",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,

    marginTop: 19,
    marginBottom: 8,
  },

  inputContainer: {
    height: 53,

    flexDirection: "row",
    alignItems: "center",

    backgroundColor: "#FFFFFF",

    paddingLeft: 14,
    paddingRight: 8,

    borderWidth: 1,
    borderColor: "#F0ECE5",
    borderRadius: 16,
  },

  input: {
    flex: 1,
    height: 51,

    color: "#4A443D",
    fontSize: 14,

    paddingHorizontal: 10,
    paddingVertical: 0,
  },

  passwordButton: {
    width: 36,
    height: 36,

    alignItems: "center",
    justifyContent: "center",
  },

  errorBorder: {
    borderColor: "#C94F68",
  },

  errorText: {
    color: "#C94F68",
    fontSize: 11,
    fontWeight: "600",

    marginTop: 5,
  },

  tipCard: {
    flexDirection: "row",
    alignItems: "flex-start",

    backgroundColor: "#FFF7F9",

    padding: 14,

    borderRadius: 17,

    marginTop: 22,
  },

  tipContent: {
    flex: 1,
    marginLeft: 10,
  },

  tipTitle: {
    color: "#4A443D",
    fontSize: 12,
    fontWeight: "800",
  },

  tipDescription: {
    color: "#81786D",
    fontSize: 10,
    lineHeight: 16,

    marginTop: 3,
  },

  submitButton: {
    height: 55,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#A86D3D",

    borderRadius: 17,

    marginTop: 25,
  },

  submitText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",

    marginLeft: 8,
  },

  disabledButton: {
    opacity: 0.65,
  },
});
