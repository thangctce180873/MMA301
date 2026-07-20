import React from "react";

import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { createNativeStackNavigator } from "@react-navigation/native-stack";

import MainTabs from "./MainTabs";

import ChangePasswordScreen from "../screens/ChangePasswordScreen";
import DetailScreen from "../screens/DetailScreen";
import LoginScreen from "../screens/LoginScreen";
import ManageFavoritesScreen from "../screens/ManageFavoritesScreen";
import ManageListingsScreen from "../screens/ManageListingsScreen";
import PersonalInfoScreen from "../screens/PersonalInfoScreen";
import RegisterScreen from "../screens/RegisterScreen";

import { useAuth } from "../context/AuthContext";

const Stack = createNativeStackNavigator();

export default function RootStack() {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7A8450" />

        <Text style={styles.loadingText}>Đang khởi động ứng dụng...</Text>
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        contentStyle: {
          backgroundColor: "#FDFCF8",
        },
      }}
    >
      {isAuthenticated ? (
        <>
          <Stack.Screen name="MainTabs" component={MainTabs} />

          <Stack.Screen name="Detail" component={DetailScreen} />

          <Stack.Screen
            name="ManageListings"
            component={ManageListingsScreen}
          />

          <Stack.Screen
            name="ManageFavorites"
            component={ManageFavoritesScreen}
          />

          <Stack.Screen name="PersonalInfo" component={PersonalInfoScreen} />

          <Stack.Screen
            name="ChangePassword"
            component={ChangePasswordScreen}
          />
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

    backgroundColor: "#FDFCF8",
  },

  loadingText: {
    color: "#8A8A75",
    fontSize: 13,

    marginTop: 12,
  },
});
