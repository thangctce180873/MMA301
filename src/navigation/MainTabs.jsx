import React from "react";
import { StyleSheet } from "react-native";

import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Ionicons } from "@expo/vector-icons";

import HomeScreen from "../screens/HomeScreen";
import AddScreen from "../screens/AddScreen";
import ProfileScreen from "../screens/ProfileScreen";

const Tab = createBottomTabNavigator();

const APP_BAR_HEIGHT = 64;

const getTabIcon = (routeName, focused) => {
  switch (routeName) {
    case "Home":
      return focused ? "home" : "home-outline";

    case "Add":
      return focused ? "add-circle" : "add-circle-outline";

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

        tabBarActiveTintColor: "#7A8450",

        tabBarInactiveTintColor: "#A1A18E",

        tabBarIcon: ({ color, focused }) => (
          <Ionicons
            name={getTabIcon(route.name, focused)}
            size={focused ? 23 : 22}
            color={color}
          />
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

    backgroundColor: "#FFFFFF",

    paddingTop: 0,

    marginHorizontal: 0,
    marginBottom: 0,

    borderRadius: 0,

    borderTopWidth: 1,
    borderTopColor: "#E8E4D9",

    shadowColor: "#000000",

    shadowOffset: {
      width: 0,
      height: -2,
    },

    shadowOpacity: 0.05,

    shadowRadius: 5,

    elevation: 8,
  },

  tabBarIcon: {
    marginTop: 7,
  },

  tabBarLabel: {
    fontSize: 9,

    fontWeight: "700",

    marginTop: 1,
    marginBottom: 6,
  },
});
