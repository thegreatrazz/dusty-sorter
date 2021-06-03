import { getSpotifyClient, getPlaylistTracksWithFeatures, TrackWithFeatures } from "./spotify"
import { getConfig } from "./config"
import fs from "fs/promises"
import SpotifyApi from "spotify-web-api-node"
import { SortedTrack, sortPlaylist } from "./sorter"
import { Time } from "./time"

const drawBar = (width: number, percent: number, emptyChar = " ", fillChar = "#") => {
    const filledChars = Math.floor(width * percent)
    let bar = ""
    for (let i = 0; i < width; i++)
        bar += i < filledChars ? fillChar : emptyChar;
    return `[${bar}]`
}

const trackPrint = ({ track, time, vibe }: SortedTrack) =>
    time.toString() + ' - ' +
    vibe.padStart(16) + ' - ' +
    `AC${drawBar(20, track.features.acousticness)} ` +
    `DA${drawBar(20, track.features.danceability)} ` +
    `EN${drawBar(20, track.features.energy)} ` +
    `IN${drawBar(20, track.features.instrumentalness)} ` +
    `LV${drawBar(20, track.features.liveness)} ` +
    `LO${drawBar(20, track.features.loudness)} ` +
    `SP${drawBar(20, track.features.speechiness)} ` +
    `- ${track.track.name} ~ ${track.track.artists.map(artist => artist.name).join(", ")}`

async function main() {
    const config = await getConfig()
    const spotify = await getSpotifyClient(config)

    console.log("\n++ Fetching playlist...")
    const tracks = await getPlaylistTracksWithFeatures(spotify, config.playlist);

    console.log("\n++ Sorting playlist...")
    const sorted = sortPlaylist(tracks, config);
    const sortedTitles = sorted
        .map(trackPrint)
        .join("\n");
    await fs.writeFile("playlist.txt", sortedTitles)

    console.log("++ Creating new playlist");
    const playlist = await spotify.createPlaylist(
        `Bender Playlist - ${new Date().toISOString()} - ${Math.random()}`,
        {}
    )

    console.log("\n++ Adding tracks to new playlist");
    let start = 0;
    while (start < sorted.length) {
        const end = Math.min(start + 100, sorted.length);

        await spotify.addTracksToPlaylist(playlist.body.id, sorted
            .slice(start, end)
            .map(({ track }) => track.track.uri),
            {});

        console.log(`Added tracks ${start}..${end}.`)
        start = end;
    }

    console.log("\n!! Playlist ready: " + playlist.body.external_urls.spotify)
    process.exit(0)
}

main()
