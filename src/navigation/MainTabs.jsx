import { COLORS } from "../constants/colors";
import React from "react";
import { StyleSheet, View } from "react-native";

import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Ionicons } from "@expo/vector-icons";

import AddScreen from "../screens/AddScreen";
import ConversationsScreen from "../screens/ConversationsScreen";
import HomeScreen from "../screens/HomeScreen";
import ProfileScreen from "../screens/ProfileScreen";

const Tab = createBottomTabNavigator();

const APP_BAR_HEIGHT = 64;

const getTabIcon = (routeName, focused) => {
  switch (routeName) {
    case "Home":
      return focused ? "home" : "home-outline";

    case "Add":
      return focused ? "add-circle" : "add-circle-outline";

    case "MessagesTab":
      return focused ? "chatbubble-ellipses" : "chatbubble-ellipses-outline";

    case "Profile":
      return focused ? "person" : "person-outline";

    default:
      return "ellipse-outline";
  }
};

export default function MainTabs() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        headerShown: false,

        tabBarHideOnKeyboard: true,

        tabBarActiveTintColor: COLORS.primary,

        tabBarInactiveTintColor: COLORS.textMuted,

        tabBarIcon: ({ color, focused }) => (
          <View
            style={[
              styles.tabIconContainer,

              focused && styles.activeTabIconContainer,
            ]}
          >
            <Ionicons
              name={getTabIcon(route.name, focused)}
              size={focused ? 21 : 22}
              color={color}
            />
          </View>
        ),

        tabBarStyle: [
          styles.tabBar,

          {
            height: APP_BAR_HEIGHT + insets.bottom,

            paddingBottom: insets.bottom,
          },
        ],

        tabBarItemStyle: {
          height: APP_BAR_HEIGHT,
        },

        tabBarIconStyle: styles.tabBarIcon,

        tabBarLabelStyle: styles.tabBarLabel,
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: "Khám phá",
        }}
      />

      <Tab.Screen
        name="Add"
        component={AddScreen}
        options={{
          title: "Đăng bán",
        }}
      />

      <Tab.Screen
        name="MessagesTab"
        component={ConversationsScreen}
        options={{
          title: "Tin nhắn",
        }}
      />

      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: "Của tôi",
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: "relative",

    left: 0,
    right: 0,
    bottom: 0,

    backgroundColor: COLORS.card,

    paddingTop: 1,

    marginHorizontal: 0,
    marginBottom: 0,

    borderRadius: 0,

    borderTopWidth: 1,
    borderTopColor: COLORS.border,

    shadowColor: COLORS.primaryDark,
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,

    elevation: 9,
  },

  tabIconContainer: {
    width: 36,
    height: 30,
    borderRadius: 12,

    alignItems: "center",
    justifyContent: "center",
  },

  activeTabIconContainer: {
    backgroundColor: COLORS.primaryLight,
  },

  tabBarIcon: {
    marginTop: 5,
  },

  tabBarLabel: {
    fontSize: 9,
    fontWeight: "700",

    marginTop: 0,
    marginBottom: 5,
  },
});
