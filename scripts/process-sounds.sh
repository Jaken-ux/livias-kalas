#!/usr/bin/env bash
# Klipper och normaliserar ljuden i assets/sound/ till public/sounds/.
# Max 1 s (fanfare 3 s), mono, 96 kbps, topp normaliserad till -1 dBFS.
# Mono-nedmixningen görs i filterkedjan FÖRE toppmätningen; med -ac 1 vid utskrift
# mättes stereo men mono skrevs (~+3 dB), vilket gav klippning vid 0 dB.
# Kör från projektroten: bash scripts/process-sounds.sh  (kräver ffmpeg)
set -euo pipefail

SRC=assets/sound
OUT=public/sounds
mkdir -p "$OUT"

# namn  källfil  start(s)  längd(s)
# Startpunkterna hoppar över tystnad i början (uppmätt med silencedetect).
# pop = ett enskilt pop ur popcorn.mp3 (200–300 ms); de första 150 ms är brus.
CLIPS=(
  "bite     bite.mp3     0.000  1.0"
  "sparkle  sparkle.mp3  0.200  1.0"
  "blow     blow.mp3     0.115  0.46"
  "fanfare  fanfare.mp3  0.055  3.0"
  "popcorn  popcorn.mp3  0.190  1.0"
  "pop      popcorn.mp3  0.200  0.10"
)

for row in "${CLIPS[@]}"; do
  read -r name file start len <<<"$row"
  # Faktisk längd = min(önskad, kvar av filen)
  total=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$SRC/$file")
  len=$(awk -v l="$len" -v t="$total" -v s="$start" 'BEGIN{r=t-s; printf "%.3f", (l<r?l:r)}')
  fade=$(awk -v l="$len" 'BEGIN{f=(l<0.3?0.03:0.1); printf "%.3f %.3f", l-f, f}')
  read -r fst fd <<<"$fade"
  # atrim + asetpts så att afade räknar från klippets början
  trim="pan=mono|c0=0.5*c0+0.5*c1,atrim=$start:$(awk -v s="$start" -v l="$len" 'BEGIN{print s+l}'),asetpts=PTS-STARTPTS,afade=t=out:st=$fst:d=$fd"
  peak=$(ffmpeg -hide_banner -i "$SRC/$file" -af "$trim,volumedetect" -f null - 2>&1 \
    | grep -oE "max_volume: -?[0-9.]+" | awk '{print $2}')
  gain=$(awk -v p="$peak" 'BEGIN{printf "%.1f", -1 - p}')
  ffmpeg -v error -y -i "$SRC/$file" -af "$trim,volume=${gain}dB" -b:a 96k "$OUT/$name.mp3"
  echo "$name: ${len}s, topp ${peak} dB -> -1 dB (${gain} dB), $(wc -c <"$OUT/$name.mp3" | tr -d ' ') byte"
done
