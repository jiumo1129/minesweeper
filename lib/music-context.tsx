import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import type { Song } from "@/constants/playlist";
import type { MusicPlayerHandle } from "@/components/music-player";

interface MusicContextValue {
  musicVisible: boolean;
  isPlaying: boolean;
  currentSong: Song | null;
  hasEverPlayed: boolean;
  showMiniBar: boolean;
  musicPlayerRef: React.RefObject<MusicPlayerHandle | null>;
  openMusic: () => void;
  closeMusic: () => void;
  onPlayStateChange: (playing: boolean, song: Song | null) => void;
  togglePlay: () => void;
}

const MusicContext = createContext<MusicContextValue | null>(null);

export function MusicProvider({ children }: { children: ReactNode }) {
  const [musicVisible, setMusicVisible] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [hasEverPlayed, setHasEverPlayed] = useState(false);
  const musicPlayerRef = useRef<MusicPlayerHandle>(null);

  // Show mini bar once user has interacted with the music player (opened it at least once)
  // and the full player sheet is currently closed
  const showMiniBar = hasEverPlayed && !musicVisible;

  const openMusic = useCallback(() => {
    setMusicVisible(true);
    // Mark as ever-opened so mini bar can appear after closing
    setHasEverPlayed(true);
  }, []);

  const closeMusic = useCallback(() => {
    setMusicVisible(false);
  }, []);

  const onPlayStateChange = useCallback((playing: boolean, song: Song | null) => {
    setIsPlaying(playing);
    setCurrentSong(song);
    if (playing) setHasEverPlayed(true);
  }, []);

  const togglePlay = useCallback(() => {
    musicPlayerRef.current?.togglePlay();
  }, []);

  return (
    <MusicContext.Provider
      value={{
        musicVisible,
        isPlaying,
        currentSong,
        hasEverPlayed,
        showMiniBar,
        musicPlayerRef,
        openMusic,
        closeMusic,
        onPlayStateChange,
        togglePlay,
      }}
    >
      {children}
    </MusicContext.Provider>
  );
}

export function useMusicContext() {
  const ctx = useContext(MusicContext);
  if (!ctx) throw new Error("useMusicContext must be used within MusicProvider");
  return ctx;
}
