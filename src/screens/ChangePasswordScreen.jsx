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

const initialFormData = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

export default function ChangePasswordScreen({ navigation }) {
  const { changePassword } = useAuth();

  const [formData, setFormData] = useState(initialFormData);

  const [errors, setErrors] = useState({});

  const [submitting, setSubmitting] = useState(false);

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);

  const [showNewPassword, setShowNewPassword] = useState(false);

  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  const handleSubmit = async () => {
    if (submitting) {
      return;
    }

    try {
      setSubmitting(true);
      setErrors({});

      const result = await changePassword(formData);

      if (!result.success) {
        if (result.errors) {
          setErrors(result.errors);
        }

        Alert.alert("Đổi mật khẩu thất bại", result.message);

        return;
      }

      setFormData(initialFormData);

      Alert.alert(
        "Đổi mật khẩu thành công",
        "Mật khẩu của bạn đã được cập nhật.",
        [
          {
            text: "OK",
            onPress: () => navigation.goBack(),
          },
        ],
        {
          cancelable: false,
        },
      );
    } catch (error) {
      console.error("Lỗi khi đổi mật khẩu:", error);

      Alert.alert("Có lỗi xảy ra", "Không thể đổi mật khẩu. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <BackButton
            disabled={submitting}
            onPress={() => navigation.goBack()}
          />

          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Đổi mật khẩu</Text>

            <Text style={styles.headerSubtitle}>
              Cập nhật mật khẩu tài khoản
            </Text>
          </View>

          <View style={styles.headerSpacer} />
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
                size={36}
                color="#7A8450"
              />
            </View>

            <Text style={styles.securityTitle}>Bảo mật tài khoản</Text>

            <Text style={styles.securityDescription}>
              Nhập mật khẩu hiện tại trước khi tạo mật khẩu mới.
            </Text>
          </View>

          <Text style={styles.sectionLabel}>THÔNG TIN MẬT KHẨU</Text>

          <View style={styles.formCard}>
            <PasswordField
              label="Mật khẩu hiện tại"
              value={formData.currentPassword}
              placeholder="Nhập mật khẩu hiện tại"
              error={errors.currentPassword}
              visible={showCurrentPassword}
              onToggleVisible={() =>
                setShowCurrentPassword((previousValue) => !previousValue)
              }
              onChangeText={(value) => updateField("currentPassword", value)}
            />

            <PasswordField
              label="Mật khẩu mới"
              value={formData.newPassword}
              placeholder="Tối thiểu 6 ký tự"
              error={errors.newPassword}
              visible={showNewPassword}
              onToggleVisible={() =>
                setShowNewPassword((previousValue) => !previousValue)
              }
              onChangeText={(value) => updateField("newPassword", value)}
            />

            <PasswordField
              label="Xác nhận mật khẩu mới"
              value={formData.confirmPassword}
              placeholder="Nhập lại mật khẩu mới"
              error={errors.confirmPassword}
              visible={showConfirmPassword}
              showBorder={false}
              onToggleVisible={() =>
                setShowConfirmPassword((previousValue) => !previousValue)
              }
              onChangeText={(value) => updateField("confirmPassword", value)}
            />
          </View>

          <View style={styles.noticeCard}>
            <Ionicons
              name="information-circle-outline"
              size={22}
              color="#7A8450"
            />

            <View style={styles.noticeContent}>
              <Text style={styles.noticeTitle}>Lưu ý</Text>

              <Text style={styles.noticeText}>
                Mật khẩu mới phải có ít nhất 6 ký tự và phải khác mật khẩu hiện
                tại.
              </Text>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            disabled={submitting}
            style={[styles.submitButton, submitting && styles.disabledButton]}
            onPress={handleSubmit}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="key-outline" size={21} color="#FFFFFF" />

                <Text style={styles.submitButtonText}>ĐỔI MẬT KHẨU</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function PasswordField({
  label,
  value,
  placeholder,
  error,
  visible,
  onToggleVisible,
  onChangeText,
  showBorder = true,
}) {
  return (
    <View
      style={[styles.fieldContainer, showBorder && styles.fieldContainerBorder]}
    >
      <Text style={styles.fieldLabel}>{label}</Text>

      <View
        style={[styles.inputContainer, error && styles.inputContainerError]}
      >
        <Ionicons name="lock-closed-outline" size={20} color="#7A8450" />

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#AAA797"
          secureTextEntry={!visible}
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="password"
          style={styles.input}
        />

        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.eyeButton}
          onPress={onToggleVisible}
        >
          <Ionicons
            name={visible ? "eye-off-outline" : "eye-outline"}
            size={21}
            color="#A1A18E"
          />
        </TouchableOpacity>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
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

  headerSpacer: {
    width: 42,
    height: 42,
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 35,
  },

  securityCard: {
    alignItems: "center",

    backgroundColor: "#FFFFFF",

    paddingHorizontal: 20,
    paddingVertical: 24,

    borderWidth: 1,
    borderColor: "#E8E4D9",
    borderRadius: 24,

    elevation: 2,
  },

  securityIcon: {
    width: 78,
    height: 78,
    borderRadius: 25,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#F3F1E9",
  },

  securityTitle: {
    color: "#4A4A3A",
    fontSize: 19,
    fontWeight: "800",

    marginTop: 14,
  },

  securityDescription: {
    color: "#8A8A75",
    fontSize: 12,
    lineHeight: 19,

    textAlign: "center",

    marginTop: 5,
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

  formCard: {
    backgroundColor: "#FFFFFF",

    paddingHorizontal: 15,

    borderWidth: 1,
    borderColor: "#E8E4D9",
    borderRadius: 22,

    elevation: 2,
  },

  fieldContainer: {
    paddingVertical: 15,
  },

  fieldContainerBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#E8E4D9",
  },

  fieldLabel: {
    color: "#6D6D5D",
    fontSize: 11,
    fontWeight: "700",

    marginBottom: 8,
  },

  inputContainer: {
    height: 52,

    flexDirection: "row",
    alignItems: "center",

    backgroundColor: "#F9F8F3",

    borderWidth: 1,
    borderColor: "#E8E4D9",
    borderRadius: 15,

    paddingLeft: 13,
  },

  inputContainerError: {
    borderColor: "#C75C5C",
    backgroundColor: "#FFF9F9",
  },

  input: {
    flex: 1,
    height: 50,

    color: "#4A4A3A",
    fontSize: 13,
    fontWeight: "600",

    paddingHorizontal: 10,
  },

  eyeButton: {
    width: 46,
    height: 50,

    alignItems: "center",
    justifyContent: "center",
  },

  errorText: {
    color: "#C75C5C",
    fontSize: 10,
    fontWeight: "600",

    marginTop: 6,
  },

  noticeCard: {
    flexDirection: "row",

    backgroundColor: "#F3F1E9",

    padding: 14,

    borderRadius: 17,
    marginTop: 17,
  },

  noticeContent: {
    flex: 1,
    marginLeft: 10,
  },

  noticeTitle: {
    color: "#4A4A3A",
    fontSize: 12,
    fontWeight: "800",
  },

  noticeText: {
    color: "#8A8A75",
    fontSize: 10,
    lineHeight: 16,

    marginTop: 3,
  },

  submitButton: {
    height: 54,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#7A8450",

    borderRadius: 17,
    marginTop: 24,

    elevation: 3,
  },

  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",

    marginLeft: 8,
  },

  disabledButton: {
    opacity: 0.6,
  },
});
