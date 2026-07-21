import AsyncStorage from "@react-native-async-storage/async-storage";

const ITEMS_KEY = "@unitrade_items";

// Tạo ID cho sản phẩm
export const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

// Chuẩn hóa số điện thoại
export const normalizePhoneNumber = (phoneNumber) => {
  return String(phoneNumber || "").replace(/\D/g, "");
};

// Chuẩn hóa email
const normalizeOwnerEmail = (email) => {
  return String(email || "")
    .trim()
    .toLowerCase();
};

// Lấy ID tài khoản dùng cho chức năng lưu sản phẩm
const getFavoriteUserId = (currentUser) => {
  if (!currentUser) {
    return "";
  }

  if (currentUser.id) {
    return String(currentUser.id);
  }

  if (currentUser.email) {
    return `email:${normalizeOwnerEmail(currentUser.email)}`;
  }

  return "";
};

// Kiểm tra tài khoản hiện tại có phải chủ tin đăng không
export const isItemOwner = (item, currentUser) => {
  if (!item || !currentUser) {
    return false;
  }

  if (item.sellerId && currentUser.id) {
    return String(item.sellerId) === String(currentUser.id);
  }

  if (item.sellerEmail && currentUser.email) {
    return (
      normalizeOwnerEmail(item.sellerEmail) ===
      normalizeOwnerEmail(currentUser.email)
    );
  }

  return false;
};

// Kiểm tra sản phẩm đã được tài khoản hiện tại lưu chưa
export const isItemFavorite = (item, currentUser) => {
  if (!item || !currentUser) {
    return false;
  }

  const favoriteUserId = getFavoriteUserId(currentUser);

  if (!favoriteUserId) {
    return false;
  }

  const favoriteUserIds = Array.isArray(item.favoriteUserIds)
    ? item.favoriteUserIds.map((id) => String(id))
    : [];

  return favoriteUserIds.includes(favoriteUserId);
};

// Lấy toàn bộ sản phẩm
export const getAllItems = async () => {
  try {
    const storedData = await AsyncStorage.getItem(ITEMS_KEY);

    if (!storedData) {
      return [];
    }

    const parsedItems = JSON.parse(storedData);

    if (!Array.isArray(parsedItems)) {
      return [];
    }

    return parsedItems.sort((firstItem, secondItem) => {
      const firstTime = new Date(firstItem.createdAt || 0).getTime();
      const secondTime = new Date(secondItem.createdAt || 0).getTime();

      return secondTime - firstTime;
    });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách sản phẩm:", error);

    return [];
  }
};

// Lưu danh sách sản phẩm
export const saveItems = async (items) => {
  try {
    await AsyncStorage.setItem(ITEMS_KEY, JSON.stringify(items));

    return true;
  } catch (error) {
    console.error("Lỗi khi lưu danh sách sản phẩm:", error);

    return false;
  }
};

// Thêm sản phẩm mới
export const addItem = async (itemData) => {
  try {
    const items = await getAllItems();
    const currentTime = new Date().toISOString();
    const newItem = {
      id: generateId(),

      title: String(itemData.title || "").trim(),
      price: Number(itemData.price),
      condition: itemData.condition,
      category: itemData.category,
      imageUri: itemData.imageUri || null,
      description: String(itemData.description || "").trim(),
      location: String(itemData.location || "").trim(),
      sellerId: itemData.sellerId ? String(itemData.sellerId) : null,
      sellerEmail: normalizeOwnerEmail(itemData.sellerEmail),
      sellerName: String(itemData.sellerName || "").trim() || "Người bán",
      sellerPhone: normalizePhoneNumber(itemData.sellerPhone),
      sellerAvatar: itemData.sellerAvatar || null,
      status: itemData.status || "selling",
      favoriteUserIds: [], // Mỗi phần tử là ID tài khoản đã lưu sản phẩm
      createdAt: currentTime,
      updatedAt: currentTime,
    };

    const updatedItems = [newItem, ...items];
    const saved = await saveItems(updatedItems);

    if (!saved) {
      return null;
    }

    return newItem;
  } catch (error) {
    console.error("Lỗi khi thêm sản phẩm:", error);

    return null;
  }
};

// Lấy sản phẩm theo ID
export const getItemById = async (id) => {
  try {
    const items = await getAllItems();

    return items.find((item) => String(item.id) === String(id)) || null;
  } catch (error) {
    console.error("Lỗi khi lấy chi tiết sản phẩm:", error);

    return null;
  }
};

// Cập nhật sản phẩm
export const updateItem = async (id, updates) => {
  try {
    const items = await getAllItems();
    const itemExists = items.some((item) => String(item.id) === String(id));

    if (!itemExists) {
      return false;
    }

    const updatedItems = items.map((item) => {
      if (String(item.id) !== String(id)) {
        return item;
      }

      const updatedData = {
        ...item,
        ...updates,

        price: updates.price !== undefined ? Number(updates.price) : item.price,

        updatedAt: new Date().toISOString(),
      };

      if (updates.sellerPhone !== undefined) {
        updatedData.sellerPhone = normalizePhoneNumber(updates.sellerPhone);
      }

      if (updates.sellerEmail !== undefined) {
        updatedData.sellerEmail = normalizeOwnerEmail(updates.sellerEmail);
      }

      if (updates.sellerId !== undefined) {
        updatedData.sellerId = updates.sellerId
          ? String(updates.sellerId)
          : null;
      }

      if (updates.favoriteUserIds !== undefined) {
        updatedData.favoriteUserIds = Array.isArray(updates.favoriteUserIds)
          ? updates.favoriteUserIds.map((userId) => String(userId))
          : [];
      }

      return updatedData;
    });

    return await saveItems(updatedItems);
  } catch (error) {
    console.error("Lỗi khi cập nhật sản phẩm:", error);

    return false;
  }
};

// Xóa sản phẩm
export const deleteItem = async (id, currentUser) => {
  try {
    const items = await getAllItems();
    const item = items.find(
      (currentItem) => String(currentItem.id) === String(id),
    );

    if (!item) {
      return {
        success: false,
        message: "Không tìm thấy sản phẩm",
      };
    }

    if (!isItemOwner(item, currentUser)) {
      return {
        success: false,
        message: "Bạn không có quyền xóa tin đăng này",
      };
    }

    const filteredItems = items.filter(
      (currentItem) => String(currentItem.id) !== String(id),
    );

    const saved = await saveItems(filteredItems);

    if (!saved) {
      return {
        success: false,
        message: "Không thể xóa sản phẩm",
      };
    }

    return {
      success: true,
      message: "Xóa sản phẩm thành công",
    };
  } catch (error) {
    console.error("Lỗi khi xóa sản phẩm:", error);

    return {
      success: false,
      message: "Có lỗi xảy ra khi xóa sản phẩm",
    };
  }
};

// Lưu hoặc bỏ lưu sản phẩm theo tài khoản
export const toggleFavorite = async (id, currentUser) => {
  try {
    const favoriteUserId = getFavoriteUserId(currentUser);

    if (!favoriteUserId) {
      return {
        success: false,
        message: "Không tìm thấy thông tin tài khoản",
      };
    }

    const items = await getAllItems();

    const itemIndex = items.findIndex((item) => String(item.id) === String(id));

    if (itemIndex === -1) {
      return {
        success: false,
        message: "Không tìm thấy sản phẩm",
      };
    }

    const currentItem = items[itemIndex];
    const favoriteUserIds = Array.isArray(currentItem.favoriteUserIds)
      ? currentItem.favoriteUserIds.map((userId) => String(userId))
      : [];
    const alreadyFavorite = favoriteUserIds.includes(favoriteUserId);
    const updatedFavoriteUserIds = alreadyFavorite
      ? favoriteUserIds.filter((userId) => userId !== favoriteUserId)
      : [...favoriteUserIds, favoriteUserId];
    const updatedItem = {
      ...currentItem,

      favoriteUserIds: updatedFavoriteUserIds,

      updatedAt: new Date().toISOString(),
    };
    const updatedItems = [...items];
    updatedItems[itemIndex] = updatedItem;
    const saved = await saveItems(updatedItems);

    if (!saved) {
      return {
        success: false,
        message: "Không thể cập nhật sản phẩm đã lưu",
      };
    }

    return {
      success: true,

      isFavorite: !alreadyFavorite,

      message: alreadyFavorite ? "Đã bỏ lưu sản phẩm" : "Đã lưu sản phẩm",
    };
  } catch (error) {
    console.error("Lỗi khi cập nhật sản phẩm đã lưu:", error);

    return {
      success: false,
      message: "Có lỗi xảy ra khi cập nhật sản phẩm đã lưu",
    };
  }
};

// Đổi trạng thái đang bán hoặc đã bán
export const toggleSoldStatus = async (id, currentUser) => {
  try {
    const item = await getItemById(id);

    if (!item) {
      return {
        success: false,
        message: "Không tìm thấy sản phẩm",
      };
    }

    if (!isItemOwner(item, currentUser)) {
      return {
        success: false,
        message: "Bạn không có quyền thay đổi trạng thái tin đăng này",
      };
    }

    const newStatus = item.status === "sold" ? "selling" : "sold";

    const updated = await updateItem(id, {
      status: newStatus,
    });

    if (!updated) {
      return {
        success: false,
        message: "Không thể cập nhật trạng thái sản phẩm",
      };
    }

    return {
      success: true,

      message: "Cập nhật trạng thái thành công",

      status: newStatus,
    };
  } catch (error) {
    console.error("Lỗi khi thay đổi trạng thái sản phẩm:", error);

    return {
      success: false,
      message: "Có lỗi xảy ra khi cập nhật trạng thái",
    };
  }
};

// Lấy toàn bộ tin đăng của tài khoản hiện tại
export const getUserItems = async (currentUser) => {
  try {
    if (!currentUser) {
      return [];
    }

    const items = await getAllItems();

    return items.filter((item) => isItemOwner(item, currentUser));
  } catch (error) {
    console.error("Lỗi khi lấy tin đăng của tài khoản:", error);

    return [];
  }
};

// Lấy sản phẩm đang bán của tài khoản hiện tại
export const getSellingItems = async (currentUser) => {
  try {
    const userItems = await getUserItems(currentUser);

    return userItems.filter((item) => item.status === "selling");
  } catch (error) {
    console.error("Lỗi khi lấy sản phẩm đang bán:", error);

    return [];
  }
};

// Lấy sản phẩm đã bán của tài khoản hiện tại
export const getSoldItems = async (currentUser) => {
  try {
    const userItems = await getUserItems(currentUser);

    return userItems.filter((item) => item.status === "sold");
  } catch (error) {
    console.error("Lỗi khi lấy sản phẩm đã bán:", error);

    return [];
  }
};

// Lấy sản phẩm tài khoản hiện tại đã lưu
export const getFavoriteItems = async (currentUser) => {
  try {
    if (!currentUser) {
      return [];
    }

    const items = await getAllItems();

    return items.filter((item) => isItemFavorite(item, currentUser));
  } catch (error) {
    console.error("Lỗi khi lấy sản phẩm đã lưu:", error);

    return [];
  }
};

// Đếm sản phẩm đang bán
export const getSellingCount = async (currentUser) => {
  try {
    const items = await getSellingItems(currentUser);

    return items.length;
  } catch (error) {
    console.error("Lỗi khi đếm sản phẩm đang bán:", error);

    return 0;
  }
};

// Đếm toàn bộ tin đăng
export const getUserListingCount = async (currentUser) => {
  try {
    const items = await getUserItems(currentUser);

    return items.length;
  } catch (error) {
    console.error("Lỗi khi đếm tin đăng của tài khoản:", error);

    return 0;
  }
};

// Đếm sản phẩm tài khoản hiện tại đã lưu
export const getFavoriteCount = async (currentUser) => {
  try {
    const items = await getFavoriteItems(currentUser);

    return items.length;
  } catch (error) {
    console.error("Lỗi khi đếm sản phẩm đã lưu:", error);

    return 0;
  }
};

// Tìm kiếm và lọc sản phẩm
export const filterItems = (items, searchQuery, activeCategory) => {
  const normalizedQuery = String(searchQuery || "")
    .trim()
    .toLowerCase();

  return items.filter((item) => {
    const matchesCategory =
      activeCategory === "all" || item.category === activeCategory;

    const itemTitle = String(item.title || "").toLowerCase();

    const itemDescription = String(item.description || "").toLowerCase();

    const itemLocation = String(item.location || "").toLowerCase();

    const matchesSearch =
      normalizedQuery.length === 0 ||
      itemTitle.includes(normalizedQuery) ||
      itemDescription.includes(normalizedQuery) ||
      itemLocation.includes(normalizedQuery);

    return matchesCategory && matchesSearch;
  });
};

// Kiểm tra dữ liệu đăng sản phẩm
export const validateItem = (data) => {
  const errors = {};

  if (!data.imageUri) {
    errors.imageUri = "Vui lòng thêm ảnh sản phẩm";
  }

  if (!data.title || data.title.trim().length === 0) {
    errors.title = "Vui lòng nhập tiêu đề";
  } else if (data.title.trim().length < 5) {
    errors.title = "Tiêu đề phải có ít nhất 5 ký tự";
  }

  if (
    data.price === undefined ||
    data.price === null ||
    String(data.price).trim() === ""
  ) {
    errors.price = "Vui lòng nhập giá sản phẩm";
  } else if (Number.isNaN(Number(data.price)) || Number(data.price) < 0) {
    errors.price = "Giá sản phẩm không hợp lệ";
  }

  if (!data.condition) {
    errors.condition = "Vui lòng chọn tình trạng";
  }

  if (!data.category) {
    errors.category = "Vui lòng chọn danh mục";
  }

  if (!data.location || data.location.trim().length === 0) {
    errors.location = "Vui lòng nhập địa điểm";
  }

  const normalizedPhone = normalizePhoneNumber(data.sellerPhone);

  if (!normalizedPhone) {
    errors.sellerPhone = "Vui lòng nhập số điện thoại người bán";
  } else if (!/^0\d{9}$/.test(normalizedPhone)) {
    errors.sellerPhone = "Số điện thoại phải gồm 10 chữ số và bắt đầu bằng 0";
  }

  if (!data.description || data.description.trim().length === 0) {
    errors.description = "Vui lòng nhập mô tả sản phẩm";
  } else if (data.description.trim().length < 10) {
    errors.description = "Mô tả phải có ít nhất 10 ký tự";
  }

  return {
    isValid: Object.keys(errors).length === 0,

    errors,
  };
};

// Định dạng giá
export const formatPrice = (price) => {
  const numericPrice = Number(price);

  if (Number.isNaN(numericPrice)) {
    return "0 đ";
  }

  return `${numericPrice.toLocaleString("vi-VN")} đ`;
};

// Định dạng thời gian
export const formatTimeAgo = (dateString) => {
  if (!dateString) {
    return "Vừa đăng";
  }

  const createdTime = new Date(dateString).getTime();

  if (Number.isNaN(createdTime)) {
    return "Vừa đăng";
  }

  const difference = Date.now() - createdTime;

  const minutes = Math.floor(difference / 60000);

  const hours = Math.floor(difference / 3600000);

  const days = Math.floor(difference / 86400000);

  if (minutes < 1) {
    return "Vừa đăng";
  }

  if (minutes < 60) {
    return `${minutes} phút trước`;
  }

  if (hours < 24) {
    return `${hours} giờ trước`;
  }

  if (days < 30) {
    return `${days} ngày trước`;
  }

  return new Date(dateString).toLocaleDateString("vi-VN");
};

// Xóa toàn bộ dữ liệu sản phẩm
export const clearAllItems = async () => {
  try {
    await AsyncStorage.removeItem(ITEMS_KEY);

    return true;
  } catch (error) {
    console.error("Lỗi khi xóa toàn bộ dữ liệu:", error);

    return false;
  }
};
