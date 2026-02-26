import { SONGS, type Song } from "../constants/playlist";

export interface WebViewPlayStateMessage {
  type: "playState";
  playing: boolean;
  songId?: number;
}

export function resolveCurrentSong(
  message: WebViewPlayStateMessage,
  selectedSong: Song | null
): Song | null {
  if (typeof message.songId === "number") {
    return SONGS.find((song) => song.id === message.songId) ?? selectedSong;
  }

  return selectedSong;
}

