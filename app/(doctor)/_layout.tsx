import { Tabs } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../global.js';

export default function DoctorTabsLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        // --- HEADER STYLES ---
        headerShown: true, // Set to true to show the header
        headerStyle: {
          backgroundColor: colors.background, // Dark background
        },
        headerTintColor: colors.text, // Light text
        headerTitleStyle: {
          fontFamily: 'Inter_700Bold', // Custom font
        },

        // --- TAB BAR STYLES ---
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.tabIcon,
        tabBarInactiveBackgroundColor: 'rgba(255, 255, 255, 0.05)',
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: {
            fontFamily: 'Inter_400Regular',
        }
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <FontAwesome5 name="tachometer-alt" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="patients"
        options={{
          title: 'All Patients',
          tabBarIcon: ({ color }) => <FontAwesome5 name="users" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="all_readings"
        options={{
          title: 'All Readings',
          tabBarIcon: ({ color }) => <FontAwesome5 name="chart-bar" size={24} color={color} />,
        }}
      />
       <Tabs.Screen
        name="tips"
        options={{
          title: 'Manage Tips',
          tabBarIcon: ({ color }) => <FontAwesome5 name="leaf" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <FontAwesome5 name="user-md" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}