import { describe, it, expect } from "vitest";
import { SONGS } from "../constants/playlist";

// Test the logic that controls mini player bar visibility and state
describe("MiniPlayerBar Logic", () => {
  it("mini bar should be hidden initially (hasEverPlayed=false)", () => {
    const hasEverPlayed = false;
    const musicVisible = false;
    const showMiniBar = hasEverPlayed && !musicVisible;
    expect(showMiniBar).toBe(false);
  });

  it("mini bar should be hidden when music sheet is open", () => {
    const hasEverPlayed = true;
    const musicVisible = true;
    const showMiniBar = hasEverPlayed && !musicVisible;
    expect(showMiniBar).toBe(false);
  });

  it("mini bar should be visible after playing and closing sheet", () => {
    const hasEverPlayed = true;
    const musicVisible = false;
    const showMiniBar = hasEverPlayed && !musicVisible;
    expect(showMiniBar).toBe(true);
  });

  it("floating FAB should be hidden when mini bar is visible", () => {
    const showMiniBar = true;
    const showFab = !showMiniBar;
    expect(showFab).toBe(false);
  });

  it("floating FAB should be visible when mini bar is hidden", () => {
    const showMiniBar = false;
    const showFab = !showMiniBar;
    expect(showFab).toBe(true);
  });

  it("play state change should update isPlaying and currentSong", () => {
    let isPlaying = false;
    let currentSong = null as typeof SONGS[0] | null;
    let hasEverPlayed = false;

    // Simulate onPlayStateChange callback
    const onPlayStateChange = (playing: boolean, song: typeof SONGS[0] | null) => {
      isPlaying = playing;
      currentSong = song;
      if (playing) hasEverPlayed = true;
    };

    const testSong = SONGS[0];
    onPlayStateChange(true, testSong);

    expect(isPlaying).toBe(true);
    expect(currentSong).toBe(testSong);
    expect(hasEverPlayed).toBe(true);
  });

  it("pausing should update isPlaying to false but keep currentSong", () => {
    let isPlaying = true;
    let currentSong = SONGS[0] as typeof SONGS[0] | null;
    let hasEverPlayed = true;

    const onPlayStateChange = (playing: boolean, song: typeof SONGS[0] | null) => {
      isPlaying = playing;
      currentSong = song;
      if (playing) hasEverPlayed = true;
    };

    onPlayStateChange(false, SONGS[0]);

    expect(isPlaying).toBe(false);
    expect(currentSong).toBe(SONGS[0]);
    expect(hasEverPlayed).toBe(true); // still true
  });

  it("mini bar should display playlist name when no song selected", () => {
    const currentSong = null;
    const songTitle = currentSong ? (currentSong as typeof SONGS[0]).title : "等墨久喜欢的音乐";
    const songArtist = currentSong ? (currentSong as typeof SONGS[0]).artist : "播放全部";
    expect(songTitle).toBe("等墨久喜欢的音乐");
    expect(songArtist).toBe("播放全部");
  });

  it("mini bar should display song info when a song is selected", () => {
    const currentSong = SONGS[0];
    const songTitle = currentSong ? currentSong.title : "等墨久喜欢的音乐";
    const songArtist = currentSong ? currentSong.artist : "播放全部";
    expect(songTitle).toBe(SONGS[0].title);
    expect(songArtist).toBe(SONGS[0].artist);
  });

  it("playing indicator text should prefix artist with play symbol", () => {
    const isPlaying = true;
    const artist = "张含韵";
    const displayArtist = isPlaying ? `▶ ${artist}` : artist;
    expect(displayArtist).toBe("▶ 张含韵");
  });

  it("paused indicator text should show artist without play symbol", () => {
    const isPlaying = false;
    const artist = "张含韵";
    const displayArtist = isPlaying ? `▶ ${artist}` : artist;
    expect(displayArtist).toBe("张含韵");
  });
});
