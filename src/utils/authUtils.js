import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";

const USERS_KEY = "@night_sweet_users";
const SESSION_KEY = "@night_sweet_session";
const ITEMS_KEY = "@unitrade_items";

export const normalizeEmail = (email) => {
  return String(email || "")
    .trim()
    .toLowerCase();
};

export const normalizePhoneNumber = (phoneNumber) => {
  return String(phoneNumber || "").replace(/\D/g, "");
};

export const formatBirthDateInput = (value) => {
  const digits = String(value || "")
    .replace(/\D/g, "")
    .slice(0, 8);

  if (digits.length <= 2) {
    return digits;
  }

  if (digits.length <= 4) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }

  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
};

export const isValidBirthDate = (birthDate) => {
  const normalizedBirthDate = String(birthDate || "").trim();

  const match = normalizedBirthDate.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

  if (!match) {
    return false;
  }

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);

  const date = new Date(year, month - 1, day);

  const isRealDate =
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day;

  if (!isRealDate) {
    return false;
  }

  const today = new Date();
  today.setHours(23, 59, 59, 999);

  return date.getTime() <= today.getTime();
};

export const getUserInitials = (name) => {
  const normalizedName = String(name || "").trim();

  if (!normalizedName) {
    return "?";
  }

  const nameParts = normalizedName.split(/\s+/).filter(Boolean);

  if (nameParts.length === 1) {
    return nameParts[0].slice(0, 2).toUpperCase();
  }

  return `${nameParts[0].charAt(0)}${nameParts[nameParts.length - 1].charAt(
    0,
  )}`.toUpperCase();
};

const hashPassword = async (password) => {
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    String(password || ""),
  );
};

const createPublicUser = (user) => {
  return {
    id: user.id,
    name: user.name,
    birthDate: user.birthDate || "",
    email: user.email,
    phone: user.phone,
    avatarUri: user.avatarUri || "",
    createdAt: user.createdAt,
    updatedAt: user.updatedAt || user.createdAt,
  };
};

export const validateRegisterData = (data) => {
  const errors = {};

  const name = String(data.name || "").trim();
  const birthDate = String(data.birthDate || "").trim();
  const email = normalizeEmail(data.email);
  const phone = normalizePhoneNumber(data.phone);
  const password = String(data.password || "");
  const confirmPassword = String(data.confirmPassword || "");

  if (!name) {
    errors.name = "Vui lòng nhập họ và tên";
  } else if (name.length < 2) {
    errors.name = "Họ và tên phải có ít nhất 2 ký tự";
  }

  if (!birthDate) {
    errors.birthDate = "Vui lòng nhập ngày tháng năm sinh";
  } else if (!isValidBirthDate(birthDate)) {
    errors.birthDate =
      "Ngày sinh không hợp lệ. Hãy nhập theo định dạng DD/MM/YYYY";
  }

  if (!email) {
    errors.email = "Vui lòng nhập email";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Email không hợp lệ";
  }

  if (!phone) {
    errors.phone = "Vui lòng nhập số điện thoại";
  } else if (!/^0\d{9}$/.test(phone)) {
    errors.phone = "Số điện thoại phải gồm 10 chữ số và bắt đầu bằng 0";
  }

  if (!password) {
    errors.password = "Vui lòng nhập mật khẩu";
  } else if (password.length < 6) {
    errors.password = "Mật khẩu phải có ít nhất 6 ký tự";
  }

  if (!confirmPassword) {
    errors.confirmPassword = "Vui lòng xác nhận mật khẩu";
  } else if (confirmPassword !== password) {
    errors.confirmPassword = "Mật khẩu xác nhận không khớp";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const validateLoginData = (data) => {
  const errors = {};

  const email = normalizeEmail(data.email);
  const password = String(data.password || "");

  if (!email) {
    errors.email = "Vui lòng nhập email";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Email không hợp lệ";
  }

  if (!password) {
    errors.password = "Vui lòng nhập mật khẩu";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const validateProfileData = (data) => {
  const errors = {};

  const name = String(data.name || "").trim();
  const birthDate = String(data.birthDate || "").trim();
  const email = normalizeEmail(data.email);
  const phone = normalizePhoneNumber(data.phone);

  if (!name) {
    errors.name = "Vui lòng nhập họ và tên";
  } else if (name.length < 2) {
    errors.name = "Họ và tên phải có ít nhất 2 ký tự";
  }

  if (birthDate && !isValidBirthDate(birthDate)) {
    errors.birthDate =
      "Ngày sinh không hợp lệ. Hãy nhập theo định dạng DD/MM/YYYY";
  }

  if (!email) {
    errors.email = "Vui lòng nhập email";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Email không hợp lệ";
  }

  if (!phone) {
    errors.phone = "Vui lòng nhập số điện thoại";
  } else if (!/^0\d{9}$/.test(phone)) {
    errors.phone = "Số điện thoại phải gồm 10 chữ số và bắt đầu bằng 0";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const validateChangePasswordData = (data) => {
  const errors = {};

  const currentPassword = String(data.currentPassword || "");

  const newPassword = String(data.newPassword || "");

  const confirmPassword = String(data.confirmPassword || "");

  if (!currentPassword) {
    errors.currentPassword = "Vui lòng nhập mật khẩu hiện tại";
  }

  if (!newPassword) {
    errors.newPassword = "Vui lòng nhập mật khẩu mới";
  } else if (newPassword.length < 6) {
    errors.newPassword = "Mật khẩu mới phải có ít nhất 6 ký tự";
  } else if (newPassword === currentPassword) {
    errors.newPassword = "Mật khẩu mới phải khác mật khẩu hiện tại";
  }

  if (!confirmPassword) {
    errors.confirmPassword = "Vui lòng xác nhận mật khẩu mới";
  } else if (newPassword && confirmPassword !== newPassword) {
    errors.confirmPassword = "Mật khẩu xác nhận không khớp";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const getAllUsers = async () => {
  try {
    const storedUsers = await AsyncStorage.getItem(USERS_KEY);

    if (!storedUsers) {
      return [];
    }

    const parsedUsers = JSON.parse(storedUsers);

    return Array.isArray(parsedUsers) ? parsedUsers : [];
  } catch (error) {
    console.error("Lỗi khi lấy danh sách người dùng:", error);

    return [];
  }
};

const saveUsers = async (users) => {
  try {
    await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));

    return true;
  } catch (error) {
    console.error("Lỗi khi lưu danh sách người dùng:", error);

    return false;
  }
};

const saveSession = async (user) => {
  try {
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(user));

    return true;
  } catch (error) {
    console.error("Lỗi khi lưu phiên đăng nhập:", error);

    return false;
  }
};

const syncUserListings = async (previousUser, updatedUser) => {
  try {
    const storedItems = await AsyncStorage.getItem(ITEMS_KEY);

    if (!storedItems) {
      return;
    }

    const parsedItems = JSON.parse(storedItems);

    if (!Array.isArray(parsedItems)) {
      return;
    }

    const previousEmail = normalizeEmail(previousUser?.email);

    const updatedItems = parsedItems.map((item) => {
      const matchesById =
        item.sellerId &&
        updatedUser.id &&
        String(item.sellerId) === String(updatedUser.id);

      const matchesLegacyEmail =
        !item.sellerId &&
        item.sellerEmail &&
        previousEmail &&
        normalizeEmail(item.sellerEmail) === previousEmail;

      if (!matchesById && !matchesLegacyEmail) {
        return item;
      }

      return {
        ...item,
        sellerId: String(updatedUser.id),
        sellerEmail: normalizeEmail(updatedUser.email),
        sellerName: updatedUser.name || "Người bán",
        sellerPhone: normalizePhoneNumber(updatedUser.phone),
        sellerAvatar: updatedUser.avatarUri || null,
        updatedAt: new Date().toISOString(),
      };
    });

    await AsyncStorage.setItem(ITEMS_KEY, JSON.stringify(updatedItems));
  } catch (error) {
    console.error("Lỗi khi đồng bộ thông tin người bán:", error);
  }
};

export const registerUser = async (data) => {
  try {
    const validation = validateRegisterData(data);

    if (!validation.isValid) {
      return {
        success: false,
        message: "Thông tin đăng ký chưa hợp lệ",
        errors: validation.errors,
      };
    }

    const users = await getAllUsers();
    const email = normalizeEmail(data.email);

    const existingUser = users.find(
      (user) => normalizeEmail(user.email) === email,
    );

    if (existingUser) {
      return {
        success: false,
        message: "Email này đã được sử dụng để đăng ký",
        errors: {
          email: "Email này đã được sử dụng",
        },
      };
    }

    const passwordHash = await hashPassword(data.password);

    const currentTime = new Date().toISOString();

    const newUser = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name: String(data.name).trim(),
      birthDate: String(data.birthDate).trim(),
      email,
      phone: normalizePhoneNumber(data.phone),
      avatarUri: data.avatarUri || "",
      passwordHash,
      createdAt: currentTime,
      updatedAt: currentTime,
    };

    const saved = await saveUsers([newUser, ...users]);

    if (!saved) {
      return {
        success: false,
        message: "Không thể lưu tài khoản. Vui lòng thử lại.",
      };
    }

    const publicUser = createPublicUser(newUser);

    const sessionSaved = await saveSession(publicUser);

    if (!sessionSaved) {
      return {
        success: false,
        message: "Đăng ký thành công nhưng không thể đăng nhập tự động.",
      };
    }

    return {
      success: true,
      message: "Đăng ký thành công",
      user: publicUser,
    };
  } catch (error) {
    console.error("Lỗi khi đăng ký:", error);

    return {
      success: false,
      message: "Có lỗi xảy ra khi đăng ký tài khoản",
    };
  }
};

export const loginUser = async (data) => {
  try {
    const validation = validateLoginData(data);

    if (!validation.isValid) {
      return {
        success: false,
        message: "Thông tin đăng nhập chưa hợp lệ",
        errors: validation.errors,
      };
    }

    const users = await getAllUsers();
    const email = normalizeEmail(data.email);

    const user = users.find(
      (currentUser) => normalizeEmail(currentUser.email) === email,
    );

    if (!user) {
      return {
        success: false,
        message: "Email hoặc mật khẩu không chính xác",
      };
    }

    const passwordHash = await hashPassword(data.password);

    if (user.passwordHash !== passwordHash) {
      return {
        success: false,
        message: "Email hoặc mật khẩu không chính xác",
      };
    }

    const publicUser = createPublicUser(user);

    const sessionSaved = await saveSession(publicUser);

    if (!sessionSaved) {
      return {
        success: false,
        message: "Không thể lưu phiên đăng nhập",
      };
    }

    return {
      success: true,
      message: "Đăng nhập thành công",
      user: publicUser,
    };
  } catch (error) {
    console.error("Lỗi khi đăng nhập:", error);

    return {
      success: false,
      message: "Có lỗi xảy ra khi đăng nhập",
    };
  }
};

export const getCurrentUser = async () => {
  try {
    const storedSession = await AsyncStorage.getItem(SESSION_KEY);

    if (!storedSession) {
      return null;
    }

    return JSON.parse(storedSession);
  } catch (error) {
    console.error("Lỗi khi lấy phiên đăng nhập:", error);

    return null;
  }
};

export const updateCurrentUser = async (updates) => {
  try {
    const currentSessionUser = await getCurrentUser();

    if (!currentSessionUser) {
      return {
        success: false,
        message: "Không tìm thấy phiên đăng nhập",
      };
    }

    const users = await getAllUsers();

    const userIndex = users.findIndex(
      (user) => String(user.id) === String(currentSessionUser.id),
    );

    if (userIndex === -1) {
      return {
        success: false,
        message: "Không tìm thấy tài khoản",
      };
    }

    const previousUser = users[userIndex];

    const profileData = {
      name:
        updates.name !== undefined
          ? String(updates.name).trim()
          : previousUser.name,

      birthDate:
        updates.birthDate !== undefined
          ? String(updates.birthDate).trim()
          : previousUser.birthDate || "",

      email:
        updates.email !== undefined
          ? normalizeEmail(updates.email)
          : normalizeEmail(previousUser.email),

      phone:
        updates.phone !== undefined
          ? normalizePhoneNumber(updates.phone)
          : previousUser.phone,

      avatarUri:
        updates.avatarUri !== undefined
          ? updates.avatarUri
          : previousUser.avatarUri || "",
    };

    const validation = validateProfileData(profileData);

    if (!validation.isValid) {
      return {
        success: false,
        message: "Thông tin cá nhân chưa hợp lệ",
        errors: validation.errors,
      };
    }

    const emailExists = users.some(
      (user, index) =>
        index !== userIndex && normalizeEmail(user.email) === profileData.email,
    );

    if (emailExists) {
      return {
        success: false,
        message: "Email này đã được tài khoản khác sử dụng",
        errors: {
          email: "Email này đã được tài khoản khác sử dụng",
        },
      };
    }

    const updatedUser = {
      ...previousUser,
      ...profileData,
      updatedAt: new Date().toISOString(),
    };

    const updatedUsers = [...users];
    updatedUsers[userIndex] = updatedUser;

    const usersSaved = await saveUsers(updatedUsers);

    if (!usersSaved) {
      return {
        success: false,
        message: "Không thể cập nhật tài khoản",
      };
    }

    const publicUser = createPublicUser(updatedUser);

    const sessionSaved = await saveSession(publicUser);

    if (!sessionSaved) {
      return {
        success: false,
        message: "Không thể cập nhật phiên đăng nhập",
      };
    }

    await syncUserListings(previousUser, publicUser);

    return {
      success: true,
      message: "Cập nhật thông tin thành công",
      user: publicUser,
    };
  } catch (error) {
    console.error("Lỗi khi cập nhật tài khoản:", error);

    return {
      success: false,
      message: "Có lỗi xảy ra khi cập nhật tài khoản",
    };
  }
};

export const changeCurrentUserPassword = async (data) => {
  try {
    const validation = validateChangePasswordData(data);

    if (!validation.isValid) {
      return {
        success: false,
        message: "Thông tin đổi mật khẩu chưa hợp lệ",
        errors: validation.errors,
      };
    }

    const currentSessionUser = await getCurrentUser();

    if (!currentSessionUser) {
      return {
        success: false,
        message: "Phiên đăng nhập đã hết hạn",
      };
    }

    const users = await getAllUsers();

    const userIndex = users.findIndex(
      (user) => String(user.id) === String(currentSessionUser.id),
    );

    if (userIndex === -1) {
      return {
        success: false,
        message: "Không tìm thấy tài khoản",
      };
    }

    const currentUser = users[userIndex];

    const currentPasswordHash = await hashPassword(data.currentPassword);

    if (currentUser.passwordHash !== currentPasswordHash) {
      return {
        success: false,
        message: "Mật khẩu hiện tại không chính xác",
        errors: {
          currentPassword: "Mật khẩu hiện tại không chính xác",
        },
      };
    }

    const newPasswordHash = await hashPassword(data.newPassword);

    if (newPasswordHash === currentUser.passwordHash) {
      return {
        success: false,
        message: "Mật khẩu mới phải khác mật khẩu hiện tại",
        errors: {
          newPassword: "Mật khẩu mới phải khác mật khẩu hiện tại",
        },
      };
    }

    const updatedUser = {
      ...currentUser,
      passwordHash: newPasswordHash,
      updatedAt: new Date().toISOString(),
    };

    const updatedUsers = [...users];
    updatedUsers[userIndex] = updatedUser;

    const usersSaved = await saveUsers(updatedUsers);

    if (!usersSaved) {
      return {
        success: false,
        message: "Không thể cập nhật mật khẩu",
      };
    }

    const publicUser = createPublicUser(updatedUser);

    const sessionSaved = await saveSession(publicUser);

    if (!sessionSaved) {
      return {
        success: false,
        message: "Mật khẩu đã đổi nhưng không thể cập nhật phiên đăng nhập",
      };
    }

    return {
      success: true,
      message: "Đổi mật khẩu thành công",
      user: publicUser,
    };
  } catch (error) {
    console.error("Lỗi khi đổi mật khẩu:", error);

    return {
      success: false,
      message: "Có lỗi xảy ra khi đổi mật khẩu",
    };
  }
};

export const deleteCurrentUser = async () => {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return {
        success: false,
        message: "Không tìm thấy phiên đăng nhập",
      };
    }

    const users = await getAllUsers();

    const remainingUsers = users.filter(
      (user) => String(user.id) !== String(currentUser.id),
    );

    const storedItems = await AsyncStorage.getItem(ITEMS_KEY);

    let items = [];

    if (storedItems) {
      const parsedItems = JSON.parse(storedItems);

      if (Array.isArray(parsedItems)) {
        items = parsedItems;
      }
    }

    const currentUserId = String(currentUser.id);

    const currentUserEmail = normalizeEmail(currentUser.email);

    const emailFavoriteKey = `email:${currentUserEmail}`;

    const remainingItems = items
      .filter((item) => {
        const matchesById =
          item.sellerId && String(item.sellerId) === currentUserId;

        const matchesLegacyEmail =
          !item.sellerId &&
          item.sellerEmail &&
          normalizeEmail(item.sellerEmail) === currentUserEmail;

        return !matchesById && !matchesLegacyEmail;
      })
      .map((item) => {
        const favoriteUserIds = Array.isArray(item.favoriteUserIds)
          ? item.favoriteUserIds.map((userId) => String(userId))
          : [];

        return {
          ...item,
          favoriteUserIds: favoriteUserIds.filter(
            (favoriteUserId) =>
              favoriteUserId !== currentUserId &&
              favoriteUserId !== emailFavoriteKey,
          ),
        };
      });

    await AsyncStorage.multiSet([
      [USERS_KEY, JSON.stringify(remainingUsers)],
      [ITEMS_KEY, JSON.stringify(remainingItems)],
    ]);

    await AsyncStorage.removeItem(SESSION_KEY);

    return {
      success: true,
      message: "Tài khoản đã được xóa thành công",
    };
  } catch (error) {
    console.error("Lỗi khi xóa tài khoản:", error);

    return {
      success: false,
      message: "Không thể xóa tài khoản. Vui lòng thử lại.",
    };
  }
};

export const logoutUser = async () => {
  try {
    await AsyncStorage.removeItem(SESSION_KEY);

    return {
      success: true,
      message: "Đăng xuất thành công",
    };
  } catch (error) {
    console.error("Lỗi khi đăng xuất:", error);

    return {
      success: false,
      message: "Không thể đăng xuất. Vui lòng thử lại.",
    };
  }
};
