import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet } from 'react-native';
import { Audio } from 'expo-av';

// Pantallas
import HomeScreen from './src/screens/HomeScreen';
import SearchScreen from './src/screens/SearchScreen';
import PlaylistDetailScreen from './src/screens/PlaylistDetailScreen';
import CreatePlaylistScreen from './src/screens/CreatePlaylistScreen';

// Componentes
import { MiniPlayer, cleanupPlayer } from './src/components/Player';

// Servicios
import PlayerService from './src/services/PlayerService';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Navegación para las playlists
const HomeStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: '#121212',
      },
      headerTintColor: '#fff',
      contentStyle: {
        backgroundColor: '#121212',
      }
    }}
  >
    <Stack.Screen 
      name="Home" 
      component={HomeScreen} 
      options={{ headerShown: false }}
    />
    <Stack.Screen 
      name="PlaylistDetail" 
      component={PlaylistDetailScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen 
      name="CreatePlaylist" 
      component={CreatePlaylistScreen}
      options={{ title: "Crear Playlist" }}
    />
  </Stack.Navigator>
);

export default function App() {
  // Inicializar servicio de audio para permitir reproducción en segundo plano
  useEffect(() => {
    // Inicializar el servicio de audio
    const initAudio = async () => {
      try {
        // Configuración de audio para reproducción en segundo plano
        await PlayerService.initializeAudio();
        console.log('Audio configurado para reproducción en segundo plano');
      } catch (error) {
        console.error('Error al configurar audio:', error);
      }
    };
    
    initAudio();
    
    // Limpiar recursos de audio al cerrar la app
    return () => {
      const cleanupAudio = async () => {
        try {
          await cleanupPlayer();
          console.log('Recursos de audio liberados correctamente');
        } catch (error) {
          console.error('Error al limpiar recursos de audio:', error);
        }
      };
      
      cleanupAudio();
    };
  }, []);

  return (
    <NavigationContainer
      theme={{
        dark: true,
        colors: {
          primary: '#1DB954',
          background: '#121212',
          card: '#121212',
          text: '#FFFFFF',
          border: '#222222',
          notification: '#1DB954',
        },
        fonts: {
          regular: {
            fontFamily: 'System',
            fontWeight: 'normal',
          },
          medium: {
            fontFamily: 'System',
            fontWeight: '500',
          },
          bold: {
            fontFamily: 'System',
            fontWeight: 'bold',
          },
          heavy: {
            fontFamily: 'System',
            fontWeight: '900',
          },
        }
      }}
    >
      <StatusBar style="light" />
      <View style={styles.container}>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
              let iconName: keyof typeof Ionicons.glyphMap = focused ? 'home' : 'home-outline';

              if (route.name === 'HomeTab') {
                iconName = focused ? 'home' : 'home-outline';
              } else if (route.name === 'Search') {
                iconName = focused ? 'search' : 'search-outline';
              }

              return <Ionicons name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: '#1DB954',
            tabBarInactiveTintColor: '#b3b3b3',
            headerShown: false,
            tabBarStyle: {
              backgroundColor: '#282828',
              borderTopWidth: 0,
              elevation: 0,
              height: 60,
              paddingBottom: 10,
              paddingTop: 10,
              zIndex: 1,
            },
          })}
        >
          <Tab.Screen 
            name="HomeTab" 
            component={HomeStack} 
            options={{ 
              title: 'Biblioteca'
            }}
          />
          <Tab.Screen 
            name="Search" 
            component={SearchScreen} 
            options={{ 
              title: 'Buscar'
            }}
          />
        </Tab.Navigator>
        <MiniPlayer />
      </View>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  }
});
