import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { SONGS } from "../constants/playlist";

// ─── MiniPlayerBar visibility logic ──────────────────────────────────────────

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
    expect(hasEverPlayed).toBe(true);
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

// ─── Auto-next timer logic ────────────────────────────────────────────────────

function createAutoNextController(onNext: (idx: number) => void) {
  let currentIndex = -1;
  let timer: ReturnType<typeof setTimeout> | null = null;

  function clear() {
    if (timer) { clearTimeout(timer); timer = null; }
  }

  function selectSong(idx: number) {
    clear();
    currentIndex = idx;
    const song = SONGS[idx];
    if (!song) return;
    const delay = (song.duration + 3) * 1000;
    timer = setTimeout(() => {
      const next = (currentIndex + 1) % SONGS.length;
      currentIndex = next;
      onNext(next);
    }, delay);
  }

  function playNext() {
    clear();
    const next = currentIndex < 0 ? 0 : (currentIndex + 1) % SONGS.length;
    currentIndex = next;
    onNext(next);
  }

  function playPrev() {
    clear();
    const prev = currentIndex <= 0 ? SONGS.length - 1 : currentIndex - 1;
    currentIndex = prev;
    onNext(prev);
  }

  function getCurrentIndex() { return currentIndex; }

  return { selectSong, playNext, playPrev, clear, getCurrentIndex };
}

describe("Auto-next controller", () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it("schedules auto-next after song duration + 3s", () => {
    const onNext = vi.fn();
    const ctrl = createAutoNextController(onNext);
    const song = SONGS[0];
    ctrl.selectSong(0);
    vi.advanceTimersByTime((song.duration + 2) * 1000);
    expect(onNext).not.toHaveBeenCalled();
    vi.advanceTimersByTime(2000);
    expect(onNext).toHaveBeenCalledWith(1);
  });

  it("clears previous timer when selecting a new song", () => {
    const onNext = vi.fn();
    const ctrl = createAutoNextController(onNext);
    ctrl.selectSong(0);
    ctrl.selectSong(1);
    vi.advanceTimersByTime((SONGS[0].duration + 3) * 1000);
    expect(onNext).not.toHaveBeenCalled();
  });

  it("playNext advances to next song immediately", () => {
    const onNext = vi.fn();
    const ctrl = createAutoNextController(onNext);
    ctrl.selectSong(0);
    ctrl.playNext();
    expect(onNext).toHaveBeenCalledWith(1);
    expect(ctrl.getCurrentIndex()).toBe(1);
  });

  it("playPrev goes to previous song", () => {
    const onNext = vi.fn();
    const ctrl = createAutoNextController(onNext);
    ctrl.selectSong(2);
    ctrl.playPrev();
    expect(onNext).toHaveBeenCalledWith(1);
    expect(ctrl.getCurrentIndex()).toBe(1);
  });

  it("playNext wraps around at end of playlist", () => {
    const onNext = vi.fn();
    const ctrl = createAutoNextController(onNext);
    ctrl.selectSong(SONGS.length - 1);
    ctrl.playNext();
    expect(onNext).toHaveBeenCalledWith(0);
  });

  it("playPrev wraps around at start of playlist", () => {
    const onNext = vi.fn();
    const ctrl = createAutoNextController(onNext);
    ctrl.selectSong(0);
    ctrl.playPrev();
    expect(onNext).toHaveBeenCalledWith(SONGS.length - 1);
  });

  it("auto-next wraps around at end of playlist", () => {
    const onNext = vi.fn();
    const ctrl = createAutoNextController(onNext);
    const lastIdx = SONGS.length - 1;
    ctrl.selectSong(lastIdx);
    vi.advanceTimersByTime((SONGS[lastIdx].duration + 3) * 1000 + 100);
    expect(onNext).toHaveBeenCalledWith(0);
  });

  it("clear stops pending auto-next", () => {
    const onNext = vi.fn();
    const ctrl = createAutoNextController(onNext);
    ctrl.selectSong(0);
    ctrl.clear();
    vi.advanceTimersByTime((SONGS[0].duration + 10) * 1000);
    expect(onNext).not.toHaveBeenCalled();
  });

  it("playNext from playlist mode (index -1) starts at index 0", () => {
    const onNext = vi.fn();
    const ctrl = createAutoNextController(onNext);
    ctrl.playNext();
    expect(onNext).toHaveBeenCalledWith(0);
  });
});
