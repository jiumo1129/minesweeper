import { describe, it, expect } from "vitest";
import { SONGS, PLAYLIST_SONG_COUNT, PLAYLIST_ID, PLAYLIST_NAME } from "../constants/playlist";

describe("Playlist Data", () => {
  it("should have correct playlist metadata", () => {
    expect(PLAYLIST_ID).toBe("2116638139");
    expect(PLAYLIST_NAME).toBe("等墨久喜欢的音乐");
    expect(PLAYLIST_SONG_COUNT).toBeGreaterThan(280);
  });

  it("should have all songs loaded", () => {
    expect(SONGS.length).toBe(PLAYLIST_SONG_COUNT);
    expect(SONGS.length).toBeGreaterThan(280);
  });

  it("every song should have required fields", () => {
    for (const song of SONGS) {
      expect(typeof song.id).toBe("number");
      expect(song.id).toBeGreaterThan(0);
      expect(typeof song.title).toBe("string");
      expect(song.title.length).toBeGreaterThan(0);
      expect(typeof song.artist).toBe("string");
      expect(song.artist.length).toBeGreaterThan(0);
      expect(typeof song.duration).toBe("number");
      expect(song.duration).toBeGreaterThan(0);
    }
  });

  it("first song should be 相思遥 by 张含韵", () => {
    expect(SONGS[0].title).toBe("相思遥");
    expect(SONGS[0].artist).toBe("张含韵");
    expect(SONGS[0].id).toBe(2681323659);
  });

  it("last song should be 斑马，斑马 by 宋冬野", () => {
    const last = SONGS[SONGS.length - 1];
    expect(last.title).toBe("斑马，斑马");
    expect(last.artist).toBe("宋冬野");
  });

  it("all song IDs should be unique", () => {
    const ids = SONGS.map((s) => s.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("duration format helper should work correctly", () => {
    const fmt = (sec: number) => {
      const m = Math.floor(sec / 60);
      const s = sec % 60;
      return `${m}:${String(s).padStart(2, "0")}`;
    };
    expect(fmt(193)).toBe("3:13");
    expect(fmt(307)).toBe("5:07");
    expect(fmt(60)).toBe("1:00");
    expect(fmt(0)).toBe("0:00");
  });

  it("search filter should work correctly", () => {
    const query = "赵雷";
    const results = SONGS.filter(
      (s) =>
        s.title.toLowerCase().includes(query.toLowerCase()) ||
        s.artist.toLowerCase().includes(query.toLowerCase())
    );
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((s) => s.artist.includes("赵雷") || s.title.includes("赵雷"))).toBe(true);
  });
});
