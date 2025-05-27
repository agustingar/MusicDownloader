import AsyncStorage from '@react-native-async-storage/async-storage';
import { DownloadedItem } from './DownloadService';
import DownloadService from './DownloadService';

export type Playlist = {
  id: string;
  name: string;
  description: string;
  coverImage?: string;
  image?: string; // Alias para compatibilidad
  createdAt: string;
  updatedAt: string;
  songIds: string[]; // IDs de las canciones descargadas
};

class PlaylistService {
  private playlists: Playlist[] = [];
  private readonly STORAGE_KEY = '@music_downloader_playlists';

  constructor() {
    this.loadPlaylists();
  }

  // Cargar playlists almacenadas
  private async loadPlaylists(): Promise<void> {
    try {
      const storedPlaylists = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (storedPlaylists) {
        this.playlists = JSON.parse(storedPlaylists);
      } else {
        // Crear playlist por defecto "Favoritos" si no existe ninguna
        this.playlists = [
          {
            id: '1',
            name: 'Favoritos',
            description: 'Mis canciones favoritas',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            songIds: [],
          },
        ];
        await this.savePlaylists();
      }
    } catch (error) {
      console.error('Error al cargar playlists:', error);
    }
  }

  // Guardar playlists en AsyncStorage
  private async savePlaylists(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.playlists));
    } catch (error) {
      console.error('Error al guardar playlists:', error);
    }
  }

  // Obtener todas las playlists
  getPlaylists(): Playlist[] {
    return [...this.playlists];
  }

  // Obtener playlist por ID
  getPlaylistById(id: string): Playlist | undefined {
    return this.playlists.find(playlist => playlist.id === id);
  }

  // Obtener canciones de una playlist
  getPlaylistSongs(playlistId: string): DownloadedItem[] {
    const playlist = this.getPlaylistById(playlistId);
    if (!playlist) return [];

    const allDownloadedSongs = DownloadService.getDownloads();
    return playlist.songIds
      .map(songId => allDownloadedSongs.find((song: DownloadedItem) => song.id === songId))
      .filter((song): song is DownloadedItem => song !== undefined);
  }

  // Crear nueva playlist
  async createPlaylist(name: string, image?: string | null, description: string = ''): Promise<Playlist> {
    const newPlaylist: Playlist = {
      id: Date.now().toString(),
      name,
      description,
      image: image || undefined,
      coverImage: image || undefined, // Para compatibilidad
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      songIds: [],
    };
    
    this.playlists.push(newPlaylist);
    await this.savePlaylists();
    
    return newPlaylist;
  }

  // Actualizar playlist completa
  async updatePlaylist(
    playlistId: string, 
    updates: { name?: string; description?: string; image?: string | null }
  ): Promise<boolean> {
    try {
      const playlistIndex = this.playlists.findIndex(p => p.id === playlistId);
      
      if (playlistIndex === -1) {
        console.error('Playlist no encontrada:', playlistId);
        return false;
      }

      // Actualizar los campos proporcionados
      const playlist = this.playlists[playlistIndex];
      
      if (updates.name !== undefined) {
        playlist.name = updates.name;
      }
      
      if (updates.description !== undefined) {
        playlist.description = updates.description;
      }
      
      if (updates.image !== undefined) {
        playlist.image = updates.image || undefined;
        playlist.coverImage = updates.image || undefined; // Para compatibilidad
      }
      
      playlist.updatedAt = new Date().toISOString();
      
      await this.savePlaylists();
      console.log('Playlist actualizada:', playlist);
      
      return true;
    } catch (error) {
      console.error('Error al actualizar playlist:', error);
      return false;
    }
  }

  // Eliminar playlist
  async deletePlaylist(id: string): Promise<boolean> {
    const initialLength = this.playlists.length;
    this.playlists = this.playlists.filter(playlist => playlist.id !== id);
    
    if (this.playlists.length !== initialLength) {
      await this.savePlaylists();
      return true;
    }
    
    return false;
  }

  // Agregar canción a playlist
  async addSongToPlaylist(playlistId: string, songId: string): Promise<boolean> {
    try {
      const playlistIndex = this.playlists.findIndex(playlist => playlist.id === playlistId);
      
      if (playlistIndex === -1) return false;
      
      const playlist = this.playlists[playlistIndex];
      
      // Evitar duplicados
      if (!playlist.songIds.includes(songId)) {
        playlist.songIds.push(songId);
        playlist.updatedAt = new Date().toISOString();
        
        this.playlists[playlistIndex] = playlist;
        await this.savePlaylists();
        
        console.log(`Canción ${songId} añadida a playlist ${playlistId} correctamente`);
      } else {
        console.log(`La canción ${songId} ya está en la playlist ${playlistId}`);
      }
      
      return true;
    } catch (error) {
      console.error('Error al añadir canción a playlist:', error);
      return false;
    }
  }

  // Eliminar canción de playlist
  async removeSongFromPlaylist(playlistId: string, songId: string): Promise<boolean> {
    const playlistIndex = this.playlists.findIndex(playlist => playlist.id === playlistId);
    
    if (playlistIndex === -1) return false;
    
    const playlist = this.playlists[playlistIndex];
    const initialLength = playlist.songIds.length;
    
    playlist.songIds = playlist.songIds.filter(id => id !== songId);
    
    if (playlist.songIds.length !== initialLength) {
      playlist.updatedAt = new Date().toISOString();
      this.playlists[playlistIndex] = playlist;
      await this.savePlaylists();
      return true;
    }
    
    return false;
  }

  // Reordenar canciones en playlist
  async reorderSongs(playlistId: string, newOrder: string[]): Promise<boolean> {
    const playlistIndex = this.playlists.findIndex(playlist => playlist.id === playlistId);
    
    if (playlistIndex === -1) return false;
    
    const playlist = this.playlists[playlistIndex];
    
    // Verificar que todos los IDs existan
    const allIdsExist = newOrder.every(id => playlist.songIds.includes(id));
    const sameLength = newOrder.length === playlist.songIds.length;
    
    if (!allIdsExist || !sameLength) return false;
    
    playlist.songIds = newOrder;
    playlist.updatedAt = new Date().toISOString();
    
    this.playlists[playlistIndex] = playlist;
    await this.savePlaylists();
    
    return true;
  }
}

export default new PlaylistService(); 