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
import * as ImagePicker from "expo-image-picker";
import BackButton from "../components/BackButton";
import { useAuth } from "../context/AuthContext";
import { formatBirthDateInput } from "../utils/authUtils";

const initialFormData = {
  avatarUri: "",
  name: "",
  birthDate: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
};

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

  const pickAvatar = async () => {
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

  const removeAvatar = () => {
    updateField("avatarUri", "");
  };

  const handleRegister = async () => {
    try {
      setSubmitting(true);
      setErrors({});

      const result = await register(formData);

      if (!result.success) {
        if (result.errors) {
          setErrors(result.errors);
        }

        Alert.alert("Đăng ký thất bại", result.message);

        return;
      }

      Alert.alert("Đăng ký thành công", "Tài khoản của bạn đã được tạo.");
    } catch (error) {
      console.error("Lỗi khi đăng ký:", error);

      Alert.alert("Có lỗi xảy ra", "Không thể tạo tài khoản.");
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
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.topBar}>
            <BackButton onPress={() => navigation.goBack()} />

            <Text style={styles.topBarTitle}>Tạo tài khoản</Text>

            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.logoBox}>
            <Ionicons name="moon" size={36} color="#FFFFFF" />
          </View>

          <Text style={styles.title}>Đăng ký Night Sweet</Text>

          <Text style={styles.subtitle}>
            Tham gia cộng đồng mua bán đồ cũ dành cho sinh viên
          </Text>

          <Text style={styles.avatarLabel}>ẢNH ĐẠI DIỆN</Text>

          <View style={styles.avatarSection}>
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.avatarButton}
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
                <Ionicons name="person-outline" size={42} color="#8A8A75" />
              )}

              <View style={styles.cameraBadge}>
                <Ionicons name="camera" size={17} color="#FFFFFF" />
              </View>
            </TouchableOpacity>

            <View style={styles.avatarActions}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.chooseAvatarButton}
                onPress={pickAvatar}
              >
                <Ionicons name="image-outline" size={18} color="#7A8450" />

                <Text style={styles.chooseAvatarText}>Chọn ảnh</Text>
              </TouchableOpacity>

              {formData.avatarUri ? (
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.removeAvatarButton}
                  onPress={removeAvatar}
                >
                  <Ionicons name="trash-outline" size={18} color="#B44A4A" />

                  <Text style={styles.removeAvatarText}>Xóa ảnh</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          <FormLabel title="Họ và tên" />

          <InputContainer
            iconName="person-outline"
            hasError={Boolean(errors.name)}
          >
            <TextInput
              value={formData.name}
              onChangeText={(value) => updateField("name", value)}
              placeholder="VD: Nguyễn Minh Anh"
              placeholderTextColor="#A1A18E"
              autoCapitalize="words"
              style={styles.input}
            />
          </InputContainer>

          <ErrorText message={errors.name} />

          <FormLabel title="Ngày tháng năm sinh" />

          <InputContainer
            iconName="calendar-outline"
            hasError={Boolean(errors.birthDate)}
          >
            <TextInput
              value={formData.birthDate}
              onChangeText={(value) =>
                updateField("birthDate", formatBirthDateInput(value))
              }
              placeholder="VD: 15/08/2003"
              placeholderTextColor="#A1A18E"
              keyboardType="number-pad"
              maxLength={10}
              style={styles.input}
            />
          </InputContainer>

          <ErrorText message={errors.birthDate} />

          <FormLabel title="Email" />

          <InputContainer
            iconName="mail-outline"
            hasError={Boolean(errors.email)}
          >
            <TextInput
              value={formData.email}
              onChangeText={(value) => updateField("email", value)}
              placeholder="example@gmail.com"
              placeholderTextColor="#A1A18E"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
            />
          </InputContainer>

          <ErrorText message={errors.email} />

          <FormLabel title="Số điện thoại" />

          <InputContainer
            iconName="call-outline"
            hasError={Boolean(errors.phone)}
          >
            <TextInput
              value={formData.phone}
              onChangeText={(value) =>
                updateField("phone", value.replace(/[^0-9]/g, ""))
              }
              placeholder="VD: 0912345678"
              placeholderTextColor="#A1A18E"
              keyboardType="phone-pad"
              maxLength={10}
              style={styles.input}
            />
          </InputContainer>

          <ErrorText message={errors.phone} />

          <FormLabel title="Mật khẩu" />

          <InputContainer
            iconName="lock-closed-outline"
            hasError={Boolean(errors.password)}
          >
            <TextInput
              value={formData.password}
              onChangeText={(value) => updateField("password", value)}
              placeholder="Tối thiểu 6 ký tự"
              placeholderTextColor="#A1A18E"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
            />

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setShowPassword((previousValue) => !previousValue)}
            >
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={21}
                color="#A1A18E"
              />
            </TouchableOpacity>
          </InputContainer>

          <ErrorText message={errors.password} />

          <FormLabel title="Xác nhận mật khẩu" />

          <InputContainer
            iconName="shield-checkmark-outline"
            hasError={Boolean(errors.confirmPassword)}
          >
            <TextInput
              value={formData.confirmPassword}
              onChangeText={(value) => updateField("confirmPassword", value)}
              placeholder="Nhập lại mật khẩu"
              placeholderTextColor="#A1A18E"
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
            />

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() =>
                setShowConfirmPassword((previousValue) => !previousValue)
              }
            >
              <Ionicons
                name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                size={21}
                color="#A1A18E"
              />
            </TouchableOpacity>
          </InputContainer>

          <ErrorText message={errors.confirmPassword} />

          <TouchableOpacity
            activeOpacity={0.85}
            disabled={submitting}
            style={[styles.registerButton, submitting && styles.disabledButton]}
            onPress={handleRegister}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="person-add-outline" size={20} color="#FFFFFF" />

                <Text style={styles.registerButtonText}>TẠO TÀI KHOẢN</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.loginRow}>
            <Text style={styles.loginDescription}>Đã có tài khoản?</Text>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.loginLink}>Đăng nhập</Text>
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

function InputContainer({ iconName, hasError, children }) {
  return (
    <View style={[styles.inputContainer, hasError && styles.inputError]}>
      <Ionicons name={iconName} size={20} color="#A1A18E" />

      {children}
    </View>
  );
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
    backgroundColor: "#FDFCF8",
  },

  keyboardContainer: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 35,
  },

  topBar: {
    height: 66,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerSpacer: {
    width: 42,
    height: 42,
  },

  topBarTitle: {
    color: "#4A4A3A",
    fontSize: 16,
    fontWeight: "800",
  },

  logoBox: {
    width: 62,
    height: 62,
    borderRadius: 19,

    alignSelf: "center",

    backgroundColor: "#7A8450",

    alignItems: "center",
    justifyContent: "center",

    marginTop: 6,

    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.13,
    shadowRadius: 6,

    elevation: 4,
  },

  title: {
    color: "#4A4A3A",
    fontSize: 24,
    fontWeight: "800",

    textAlign: "center",

    marginTop: 14,
  },

  subtitle: {
    color: "#8A8A75",
    fontSize: 12,
    lineHeight: 19,

    textAlign: "center",

    paddingHorizontal: 25,
    marginTop: 5,
    marginBottom: 8,
  },

  avatarLabel: {
    color: "#A1A18E",
    fontSize: 10,
    fontWeight: "800",

    letterSpacing: 0.7,
    textAlign: "center",

    marginTop: 18,
    marginBottom: 10,
  },

  avatarSection: {
    alignItems: "center",
  },

  avatarButton: {
    width: 104,
    height: 104,
    borderRadius: 52,

    position: "relative",

    backgroundColor: "#E8E4D9",

    alignItems: "center",
    justifyContent: "center",

    borderWidth: 4,
    borderColor: "#FFFFFF",

    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.12,
    shadowRadius: 5,

    elevation: 4,
  },

  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 52,
  },

  cameraBadge: {
    position: "absolute",
    right: 0,
    bottom: 2,

    width: 34,
    height: 34,
    borderRadius: 17,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#7A8450",

    borderWidth: 3,
    borderColor: "#FFFFFF",
  },

  avatarActions: {
    flexDirection: "row",
    alignItems: "center",

    marginTop: 12,
  },

  chooseAvatarButton: {
    flexDirection: "row",
    alignItems: "center",

    backgroundColor: "#F3F1E9",

    paddingHorizontal: 14,
    paddingVertical: 9,

    borderRadius: 14,
  },

  chooseAvatarText: {
    color: "#7A8450",
    fontSize: 12,
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
    marginLeft: 8,
  },

  removeAvatarText: {
    color: "#B44A4A",
    fontSize: 12,
    fontWeight: "800",

    marginLeft: 6,
  },

  label: {
    color: "#A1A18E",
    fontSize: 10,
    fontWeight: "800",

    letterSpacing: 0.7,

    marginTop: 17,
    marginBottom: 8,
  },

  inputContainer: {
    minHeight: 52,

    flexDirection: "row",
    alignItems: "center",

    backgroundColor: "#FFFFFF",

    borderWidth: 1,
    borderColor: "#E8E4D9",
    borderRadius: 16,

    paddingHorizontal: 14,
  },

  input: {
    flex: 1,
    height: 50,

    color: "#5D5D4D",
    fontSize: 14,
    fontWeight: "500",

    paddingHorizontal: 10,
  },

  inputError: {
    borderColor: "#C75C5C",
  },

  errorText: {
    color: "#C75C5C",
    fontSize: 11,
    fontWeight: "600",

    marginTop: 5,
  },

  registerButton: {
    height: 55,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#8B5E3C",

    borderRadius: 17,
    marginTop: 27,

    elevation: 4,
  },

  disabledButton: {
    opacity: 0.65,
  },

  registerButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",

    marginLeft: 8,
  },

  loginRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    marginTop: 20,
  },

  loginDescription: {
    color: "#8A8A75",
    fontSize: 13,
  },

  loginLink: {
    color: "#7A8450",
    fontSize: 13,
    fontWeight: "800",

    marginLeft: 5,
  },
});
