import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { OCRScreen } from '../screens/OCRScreen';
import { FlashcardsScreen } from '../screens/FlashcardsScreen';
import { SummaryScreen } from '../screens/SummaryScreen';
import { PresentationScreen } from '../screens/PresentationScreen';
import { ThesisScreen } from '../screens/ThesisScreen';
import { LectureRecorderScreen } from '../screens/LectureRecorderScreen';
import { WelcomeScreen } from '../screens/onboarding/WelcomeScreen';
import { ApiKeySetupScreen } from '../screens/onboarding/ApiKeySetupScreen';
import { FeatureTourScreen } from '../screens/onboarding/FeatureTourScreen';
import { colors } from '../theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          switch (route.name) {
            case 'Chat':
              iconName = focused ? 'robot' : 'robot-outline';
              break;
            case 'OCR':
              iconName = focused ? 'camera' : 'camera-outline';
              break;
            case 'Flashcards':
              iconName = focused ? 'flashcard' : 'flashcard-outline';
              break;
            case 'Summary':
              iconName = focused ? 'format-list-bulleted' : 'format-list-bulleted';
              break;
            case 'Presentation':
              iconName = focused ? 'format-presentation' : 'format-presentation';
              break;
            case 'Thesis':
              iconName = focused ? 'book-open-page-variant' : 'book-open-page-variant-outline';
              break;
            case 'Lecture':
              iconName = focused ? 'microphone' : 'microphone-outline';
              break;
            default:
              iconName = 'circle';
          }

          return <MaterialCommunityIcons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary[500],
        tabBarInactiveTintColor: colors.textTertiary,
        headerStyle: {
          backgroundColor: colors.surface,
        },
        headerTitleStyle: {
          fontWeight: '600',
          color: colors.textPrimary,
        },
        headerShadowVisible: false,
      })}
    >
      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          title: 'AI Assistant',
          tabBarLabel: 'Chat',
        }}
      />
      <Tab.Screen
        name="OCR"
        component={OCRScreen}
        options={{
          title: 'Scanner',
          tabBarLabel: 'Photo',
        }}
      />
      <Tab.Screen
        name="Flashcards"
        component={FlashcardsScreen}
        options={{
          title: 'Flashcards',
          tabBarLabel: 'Cards',
        }}
      />
      <Tab.Screen
        name="Summary"
        component={SummaryScreen}
        options={{
          title: 'Summary',
          tabBarLabel: 'Summary',
        }}
      />
      <Tab.Screen
        name="Presentation"
        component={PresentationScreen}
        options={{
          title: 'Presentation',
          tabBarLabel: 'Slides',
        }}
      />
      <Tab.Screen
        name="Thesis"
        component={ThesisScreen}
        options={{
          title: 'Thesis',
          tabBarLabel: 'Thesis',
        }}
      />
      <Tab.Screen
        name="Lecture"
        component={LectureRecorderScreen}
        options={{
          title: 'Lecture',
          tabBarLabel: 'Lecture',
        }}
      />
    </Tab.Navigator>
  );
};

export const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Welcome"
        screenOptions={{
          headerShown: false,
        }}
      >
        {/* Onboarding Flow */}
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="ApiKeySetup" component={ApiKeySetupScreen} />
        <Stack.Screen name="FeatureTour" component={FeatureTourScreen} />
        
        {/* Auth Screens */}
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        
        {/* Main App */}
        <Stack.Screen name="Main" component={MainTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};