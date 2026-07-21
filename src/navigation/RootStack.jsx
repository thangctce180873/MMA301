import { COLORS } from "../constants/colors";
import React from "react";

import { ActivityIndicator, StyleSheet, View } from "react-native";

import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { useAuth } from "../context/AuthContext";

import MainTabs from "./MainTabs";

import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import DetailScreen from "../screens/DetailScreen";
import MessagesScreen from "../screens/MessagesScreen";
import NotificationsScreen from "../screens/NotificationsScreen";
import PersonalInfoScreen from "../screens/PersonalInfoScreen";
import ChangePasswordScreen from "../screens/ChangePasswordScreen";
import ManageFavoritesScreen from "../screens/ManageFavoritesScreen";
import ManageListingsScreen from "../screens/ManageListingsScreen";
import SettingsScreen from "../screens/SettingsScreen";

const Stack = createNativeStackNavigator();

export default function RootStack() {
  const auth = useAuth();

  const user = auth?.user;

  const authLoading = auth?.loading ?? auth?.initializing ?? false;

  if (authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        contentStyle: {
          backgroundColor: COLORS.background,
        },
      }}
    >
      {user ? (
        <>
          <Stack.Screen name="MainTabs" component={MainTabs} />

          <Stack.Screen name="Detail" component={DetailScreen} />

          <Stack.Screen name="Messages" component={MessagesScreen} />

          <Stack.Screen name="Notifications" component={NotificationsScreen} />

          <Stack.Screen name="PersonalInfo" component={PersonalInfoScreen} />

          <Stack.Screen
            name="ChangePassword"
            component={ChangePasswordScreen}
          />

          <Stack.Screen
            name="ManageFavorites"
            component={ManageFavoritesScreen}
          />

          <Stack.Screen
            name="ManageListings"
            component={ManageListingsScreen}
          />

          <Stack.Screen name="Settings" component={SettingsScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />

          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: COLORS.background,
  },
});
