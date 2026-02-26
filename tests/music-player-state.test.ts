import { describe, expect, it } from "vitest";
import { SONGS } from "../constants/playlist";
import { resolveCurrentSong, type WebViewPlayStateMessage } from "../lib/music-player-state";

describe("music player state resolver", () => {
  it("resolves song by songId from webview message", () => {
    const fallback = SONGS[0] ?? null;
    const target = SONGS[1];
    if (!target) {
      throw new Error("Expected at least 2 songs in playlist for this test");
    }

    const message: WebViewPlayStateMessage = {
      type: "playState",
      playing: true,
      songId: target.id,
    };

    expect(resolveCurrentSong(message, fallback)).toEqual(target);
  });

  it("falls back to selected song when songId is unknown", () => {
    const fallback = SONGS[0] ?? null;
    const message: WebViewPlayStateMessage = {
      type: "playState",
      playing: true,
      songId: 99999999,
    };

    expect(resolveCurrentSong(message, fallback)).toEqual(fallback);
  });

  it("falls back to selected song when songId is absent", () => {
    const fallback = SONGS[0] ?? null;
    const message: WebViewPlayStateMessage = {
      type: "playState",
      playing: false,
    };

    expect(resolveCurrentSong(message, fallback)).toEqual(fallback);
  });
});
