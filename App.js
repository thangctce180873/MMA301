import React from "react";

import { StatusBar } from "expo-status-bar";

import { DefaultTheme, NavigationContainer } from "@react-navigation/native";

import { SafeAreaProvider } from "react-native-safe-area-context";

import RootStack from "./src/navigation/RootStack";
import { AuthProvider } from "./src/context/AuthContext";

const navigationTheme = {
  ...DefaultTheme,

  colors: {
    ...DefaultTheme.colors,

    primary: "#7A8450",
    background: "#FDFCF8",
    card: "#FFFFFF",
    text: "#4A4A3A",
    border: "#E8E4D9",
    notification: "#8B5E3C",
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer theme={navigationTheme}>
          <StatusBar style="dark" backgroundColor="#FFFFFF" />

          <RootStack />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
